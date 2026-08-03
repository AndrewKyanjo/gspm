import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessContext } from "@/types/auth";
import type { HierarchyCollections } from "@/lib/db/queries/hierarchy";
import {
  ARCHDIOCESE_MEDIA_BUCKET,
  DEANERY_MEDIA_BUCKET,
  IMPORTABLE_MEDIA_EXTENSIONS,
  IMPORTABLE_MEDIA_TYPES,
  PARISH_MEDIA_BUCKET,
  PAST_MEDIA_IMPORT_BUCKET,
  PAST_MEDIA_IMPORT_PATH,
  VICARIATE_MEDIA_BUCKET,
  type PastMediaImportItem,
  type PastMediaImportRow,
  type PastMediaReviewStatus,
  type PastMediaScopeLevel,
} from "./types";

const MAX_MEDIA_IMPORT_FILE_SIZE = 12 * 1024 * 1024;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_TITLE_LENGTH = 160;

type ClassificationResult = {
  title: string;
  description: string;
  category: string;
  scopeLevel: PastMediaScopeLevel;
  vicariateId: string | null;
  deaneryId: string | null;
  parishId: string | null;
  capturedOn: string | null;
  confidence: number;
  reasoning: string;
};

type PublishResult = {
  published: number;
  skipped: number;
  errors: string[];
};

const FINAL_BUCKET_BY_SCOPE: Record<Exclude<PastMediaScopeLevel, "unknown">, string> = {
  archdiocese: ARCHDIOCESE_MEDIA_BUCKET,
  vicariate: VICARIATE_MEDIA_BUCKET,
  deanery: DEANERY_MEDIA_BUCKET,
  parish: PARISH_MEDIA_BUCKET,
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sanitizeText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeFilename(name: string) {
  const leaf = name.split(/[\\/]/).pop() ?? "image";
  const safe = leaf.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return safe.slice(0, 140) || "image";
}

function safeStorageTitle(title: string) {
  return (
    title
      .replace(/[^a-zA-Z0-9 ._-]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/-+/g, "-")
      .trim()
      .slice(0, 80) || "Image"
  );
}

function getExtension(name: string) {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

function titleFromFilename(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  const spaced = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return sanitizeText(spaced || "Historical image", MAX_TITLE_LENGTH);
}

function categoryFromText(source: string) {
  const text = normalizeText(source);
  if (/\b(outreach|visit|mission|prison|hospital|charity)\b/.test(text)) return "outreach";
  if (/\b(meeting|council|workshop|training|conference)\b/.test(text)) return "meeting";
  if (/\b(mass|liturgy|prayer|retreat|celebration)\b/.test(text)) return "event";
  if (/\b(project|construction|renovation|site)\b/.test(text)) return "project";
  if (/\b(team|portrait|staff|group)\b/.test(text)) return "people";
  return "general";
}

function getMimeFromExtension(extension: string) {
  switch (extension) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
}

function hasAllowedMagicBytes(bytes: Uint8Array, extension: string) {
  if (extension === ".jpg" || extension === ".jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (extension === ".png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (extension === ".webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  if (extension === ".avif") {
    const header = new TextDecoder("ascii", { fatal: false }).decode(bytes.slice(4, 16));
    return header.includes("ftyp") && header.includes("avif");
  }

  return false;
}

function readAscii(bytes: Uint8Array, start: number, length: number) {
  return new TextDecoder("ascii", { fatal: false }).decode(bytes.slice(start, start + length));
}

function parseExifDate(dateValue: string) {
  const match = dateValue.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}.000Z`;
}

function extractJpegTakenAt(bytes: Uint8Array) {
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) return null;

  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];

    if (marker === 0xe1 && readAscii(bytes, offset + 4, 6) === "Exif\0\0") {
      const tiffStart = offset + 10;
      const littleEndian = readAscii(bytes, tiffStart, 2) === "II";
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const readUint16 = (position: number) => view.getUint16(position, littleEndian);
      const readUint32 = (position: number) => view.getUint32(position, littleEndian);
      const firstIfdOffset = readUint32(tiffStart + 4);
      const ifdStart = tiffStart + firstIfdOffset;
      const entryCount = readUint16(ifdStart);

      for (let index = 0; index < entryCount; index += 1) {
        const entry = ifdStart + 2 + index * 12;
        const tag = readUint16(entry);
        if (tag !== 0x0132 && tag !== 0x9003) continue;

        const count = readUint32(entry + 4);
        const valueOffset = readUint32(entry + 8);
        if (count < 8) continue;

        const valueStart = tiffStart + valueOffset;
        if (valueStart < 0 || valueStart + count > bytes.length) continue;

        const value = readAscii(bytes, valueStart, count).replace(/\0/g, "").trim();
        return parseExifDate(value);
      }
    }

    offset += 2 + length;
  }

  return null;
}

export async function validateImportMediaFile(file: File) {
  if (file.size <= 0) {
    throw new Error("Choose a non-empty image.");
  }

  if (file.size > MAX_MEDIA_IMPORT_FILE_SIZE) {
    throw new Error(`${file.name} is larger than the 12 MB upload limit.`);
  }

  const extension = getExtension(file.name);
  if (!IMPORTABLE_MEDIA_EXTENSIONS.includes(extension as (typeof IMPORTABLE_MEDIA_EXTENSIONS)[number])) {
    throw new Error(`${file.name} is not a supported image type.`);
  }

  const expectedMime = getMimeFromExtension(extension);
  const normalizedType = file.type || expectedMime;
  if (!IMPORTABLE_MEDIA_TYPES.includes(normalizedType as (typeof IMPORTABLE_MEDIA_TYPES)[number])) {
    throw new Error(`${file.name} has an unsupported content type.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasAllowedMagicBytes(bytes, extension)) {
    throw new Error(`${file.name} does not match its expected image signature.`);
  }

  return {
    bytes,
    safeName: sanitizeFilename(file.name),
    fileType: normalizedType,
    detectedTakenAt: extension === ".jpg" || extension === ".jpeg" ? extractJpegTakenAt(bytes) : null,
  };
}

export async function ensureMediaBucket(bucket: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(bucket);
  if (data) return;

  await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: MAX_MEDIA_IMPORT_FILE_SIZE,
    allowedMimeTypes: [...IMPORTABLE_MEDIA_TYPES],
  });
}

export async function createStagedMediaImport({
  context,
  file,
}: {
  context: AccessContext;
  file: File;
}) {
  if (!context.archdioceseId) {
    throw new Error("Your account does not have an archdiocese scope.");
  }

  const { bytes, safeName, fileType, detectedTakenAt } = await validateImportMediaFile(file);
  await ensureMediaBucket(PAST_MEDIA_IMPORT_BUCKET);

  const supabase = createAdminClient();
  const importId = randomUUID();
  const stagingPath = `archdioceses/${context.archdioceseId}/past-media-imports/${importId}/${Date.now()}-${safeName}`;
  const lastModified = file.lastModified ? new Date(file.lastModified).toISOString() : null;

  const { error: uploadError } = await supabase.storage.from(PAST_MEDIA_IMPORT_BUCKET).upload(stagingPath, bytes, {
    contentType: fileType,
    upsert: false,
  });

  if (uploadError) throw new Error(uploadError.message);

  const title = titleFromFilename(file.name);
  const category = categoryFromText(file.name);

  const { data, error } = await supabase
    .from("past_media_imports")
    .insert({
      id: importId,
      archdiocese_id: context.archdioceseId,
      uploaded_by: context.userId,
      original_filename: file.name,
      staging_storage_path: stagingPath,
      file_type: fileType,
      file_size: file.size,
      title,
      category,
      scope_level: "unknown",
      detected_taken_at: detectedTakenAt,
      captured_on: detectedTakenAt ? detectedTakenAt.slice(0, 10) : lastModified?.slice(0, 10) ?? null,
      image_metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType,
        lastModified,
        detectedTakenAt,
      },
      review_status: "uploaded",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PastMediaImportRow;
}

function chooseHierarchyMatch(text: string, hierarchy: HierarchyCollections): ClassificationResult {
  const searchable = normalizeText(text);

  const parish = hierarchy.parishes.find((item) => searchable.includes(normalizeText(item.name)));
  if (parish) {
    return {
      title: "Historical image",
      description: `Historical media associated with ${parish.name}.`,
      category: categoryFromText(text),
      scopeLevel: "parish",
      vicariateId: parish.vicariate_id,
      deaneryId: parish.deanery_id,
      parishId: parish.id,
      capturedOn: null,
      confidence: 0.78,
      reasoning: `Matched parish name "${parish.name}" in the image filename or metadata.`,
    };
  }

  const deanery = hierarchy.deaneries.find((item) => searchable.includes(normalizeText(item.name)));
  if (deanery) {
    return {
      title: "Historical image",
      description: `Historical media associated with ${deanery.name}.`,
      category: categoryFromText(text),
      scopeLevel: "deanery",
      vicariateId: deanery.vicariate_id,
      deaneryId: deanery.id,
      parishId: null,
      capturedOn: null,
      confidence: 0.72,
      reasoning: `Matched deanery name "${deanery.name}" in the image filename or metadata.`,
    };
  }

  const vicariate = hierarchy.vicariates.find((item) => searchable.includes(normalizeText(item.name)));
  if (vicariate) {
    return {
      title: "Historical image",
      description: `Historical media associated with ${vicariate.name}.`,
      category: categoryFromText(text),
      scopeLevel: "vicariate",
      vicariateId: vicariate.id,
      deaneryId: null,
      parishId: null,
      capturedOn: null,
      confidence: 0.68,
      reasoning: `Matched vicariate name "${vicariate.name}" in the image filename or metadata.`,
    };
  }

  return {
    title: "Historical image",
    description: "Historical media for archdiocese review.",
    category: categoryFromText(text),
    scopeLevel: "archdiocese",
    vicariateId: null,
    deaneryId: null,
    parishId: null,
    capturedOn: null,
    confidence: 0.45,
    reasoning: "No exact hierarchy match was found, so the image was staged as a general archdiocese media item.",
  };
}

function normalizeClassification(
  value: Partial<ClassificationResult>,
  hierarchy: HierarchyCollections,
  fallback: ClassificationResult,
) {
  const scopeLevel: PastMediaScopeLevel =
    value.scopeLevel === "archdiocese" ||
    value.scopeLevel === "vicariate" ||
    value.scopeLevel === "deanery" ||
    value.scopeLevel === "parish" ||
    value.scopeLevel === "unknown"
      ? value.scopeLevel
      : fallback.scopeLevel;

  const vicariate = value.vicariateId
    ? hierarchy.vicariates.find((item) => item.id === value.vicariateId) ?? null
    : null;
  const deanery = value.deaneryId
    ? hierarchy.deaneries.find((item) => item.id === value.deaneryId) ?? null
    : null;
  const parish = value.parishId ? hierarchy.parishes.find((item) => item.id === value.parishId) ?? null : null;

  return {
    title: sanitizeText(value.title || fallback.title, MAX_TITLE_LENGTH),
    description: sanitizeText(value.description || fallback.description, MAX_DESCRIPTION_LENGTH),
    category: sanitizeText(value.category || fallback.category || "general", 60).toLowerCase() || "general",
    scopeLevel,
    vicariateId: vicariate?.id ?? fallback.vicariateId,
    deaneryId: deanery?.id ?? fallback.deaneryId,
    parishId: parish?.id ?? fallback.parishId,
    capturedOn: /^\d{4}-\d{2}-\d{2}$/.test(value.capturedOn ?? "") ? value.capturedOn ?? null : fallback.capturedOn,
    confidence: Math.max(0, Math.min(1, Number(value.confidence ?? fallback.confidence))),
    reasoning: sanitizeText(value.reasoning || fallback.reasoning, 500),
  } satisfies ClassificationResult;
}

async function classifyWithDeepSeek({
  filename,
  metadata,
  hierarchy,
  fallback,
}: {
  filename: string;
  metadata: Record<string, unknown>;
  hierarchy: HierarchyCollections;
  fallback: ClassificationResult;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return fallback;

  const hierarchyForPrompt = {
    vicariates: hierarchy.vicariates.map((item) => ({ id: item.id, name: item.name })),
    deaneries: hierarchy.deaneries.map((item) => ({
      id: item.id,
      name: item.name,
      vicariateId: item.vicariate_id,
    })),
    parishes: hierarchy.parishes.map((item) => ({
      id: item.id,
      name: item.name,
      vicariateId: item.vicariate_id,
      deaneryId: item.deanery_id,
    })),
  };

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Classify historical Catholic archdiocese media metadata. Return only JSON with title, description, category, scopeLevel, vicariateId, deaneryId, parishId, capturedOn, confidence, and reasoning. Use only supplied hierarchy IDs.",
          },
          {
            role: "user",
            content: JSON.stringify({
              filename,
              metadata,
              allowedScopeLevels: ["archdiocese", "vicariate", "deanery", "parish", "unknown"],
              hierarchy: hierarchyForPrompt,
            }),
          },
        ],
      }),
    });

    if (!response.ok) return fallback;
    const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return fallback;
    return normalizeClassification(JSON.parse(content) as Partial<ClassificationResult>, hierarchy, fallback);
  } catch {
    return fallback;
  }
}

async function classifyMedia({
  filename,
  metadata,
  hierarchy,
}: {
  filename: string;
  metadata: Record<string, unknown>;
  hierarchy: HierarchyCollections;
}) {
  const source = `${filename}\n${JSON.stringify(metadata)}`;
  const fallback = chooseHierarchyMatch(source, hierarchy);
  fallback.title = titleFromFilename(filename);
  fallback.category = categoryFromText(source);
  fallback.capturedOn =
    typeof metadata.detectedTakenAt === "string" ? metadata.detectedTakenAt.slice(0, 10) : fallback.capturedOn;

  return classifyWithDeepSeek({ filename, metadata, hierarchy, fallback });
}

export async function scanPastMediaImport({
  importId,
  context,
  hierarchy,
}: {
  importId: string;
  context: AccessContext;
  hierarchy: HierarchyCollections;
}) {
  if (!context.archdioceseId) {
    throw new Error("Your account does not have an archdiocese scope.");
  }

  const supabase = createAdminClient();
  const { data: row, error: readError } = await supabase
    .from("past_media_imports")
    .select("*")
    .eq("id", importId)
    .eq("archdiocese_id", context.archdioceseId)
    .maybeSingle();

  if (readError || !row) throw new Error("Media import record was not found.");

  await supabase
    .from("past_media_imports")
    .update({ review_status: "scanning", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", importId)
    .eq("archdiocese_id", context.archdioceseId);

  try {
    const metadata = (row.image_metadata ?? {}) as Record<string, unknown>;
    const classification = await classifyMedia({
      filename: String(row.original_filename),
      metadata,
      hierarchy,
    });
    const status: PastMediaReviewStatus =
      classification.confidence >= 0.65 && classification.scopeLevel !== "unknown" ? "scanned" : "needs_review";

    const { data: updated, error: updateError } = await supabase
      .from("past_media_imports")
      .update({
        title: classification.title,
        description: classification.description,
        category: classification.category,
        scope_level: classification.scopeLevel,
        vicariate_id: classification.vicariateId,
        deanery_id: classification.deaneryId,
        parish_id: classification.parishId,
        captured_on: classification.capturedOn ?? row.captured_on,
        ai_title: classification.title,
        ai_description: classification.description,
        ai_category: classification.category,
        ai_scope_level: classification.scopeLevel,
        ai_confidence: classification.confidence,
        ai_reasoning: classification.reasoning,
        review_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", importId)
      .eq("archdiocese_id", context.archdioceseId)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);
    return updated as PastMediaImportRow;
  } catch (error) {
    await supabase
      .from("past_media_imports")
      .update({
        review_status: "failed",
        error_message: error instanceof Error ? error.message : "Scan failed.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", importId)
      .eq("archdiocese_id", context.archdioceseId);
    throw error;
  }
}

export async function getPastMediaImports(archdioceseId: string): Promise<PastMediaImportItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("past_media_imports")
    .select("*")
    .eq("archdiocese_id", archdioceseId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as PastMediaImportRow[];
  const vicariateIds = [...new Set(rows.map((row) => row.vicariate_id).filter(Boolean))] as string[];
  const deaneryIds = [...new Set(rows.map((row) => row.deanery_id).filter(Boolean))] as string[];
  const parishIds = [...new Set(rows.map((row) => row.parish_id).filter(Boolean))] as string[];

  const [{ data: vicariates }, { data: deaneries }, { data: parishes }] = await Promise.all([
    vicariateIds.length ? supabase.from("vicariates").select("id, name").in("id", vicariateIds) : { data: [] },
    deaneryIds.length ? supabase.from("deaneries").select("id, name").in("id", deaneryIds) : { data: [] },
    parishIds.length ? supabase.from("parishes").select("id, name").in("id", parishIds) : { data: [] },
  ]);

  const vicariateMap = new Map((vicariates ?? []).map((item) => [String(item.id), String(item.name)]));
  const deaneryMap = new Map((deaneries ?? []).map((item) => [String(item.id), String(item.name)]));
  const parishMap = new Map((parishes ?? []).map((item) => [String(item.id), String(item.name)]));

  return Promise.all(
    rows.map(async (row) => {
      const { data: signedUrl } = await supabase.storage
        .from(PAST_MEDIA_IMPORT_BUCKET)
        .createSignedUrl(row.staging_storage_path, 60 * 15);

      return {
        ...row,
        downloadUrl: signedUrl?.signedUrl ?? null,
        vicariateName: row.vicariate_id ? vicariateMap.get(row.vicariate_id) ?? null : null,
        deaneryName: row.deanery_id ? deaneryMap.get(row.deanery_id) ?? null : null,
        parishName: row.parish_id ? parishMap.get(row.parish_id) ?? null : null,
      };
    }),
  );
}

function validateHierarchyForPublish(row: PastMediaImportRow, hierarchy: HierarchyCollections) {
  if (row.scope_level === "unknown") return "Choose archdiocese, vicariate, deanery, or parish before publishing.";
  if (!row.title?.trim()) return "Provide a title before publishing.";
  if (!row.captured_on) return "Provide the date the image was captured before publishing.";

  if (row.scope_level === "archdiocese") return null;

  const vicariate = row.vicariate_id ? hierarchy.vicariates.find((item) => item.id === row.vicariate_id) : null;
  if (!vicariate || vicariate.archdiocese_id !== row.archdiocese_id) {
    return "Choose a valid vicariate for this archdiocese.";
  }

  if (row.scope_level === "vicariate") return null;

  const deanery = row.deanery_id ? hierarchy.deaneries.find((item) => item.id === row.deanery_id) : null;
  if (!deanery || deanery.vicariate_id !== vicariate.id || deanery.archdiocese_id !== row.archdiocese_id) {
    return "Choose a valid deanery for the selected vicariate.";
  }

  if (row.scope_level === "deanery") return null;

  const parish = row.parish_id ? hierarchy.parishes.find((item) => item.id === row.parish_id) : null;
  if (
    !parish ||
    parish.deanery_id !== deanery.id ||
    parish.vicariate_id !== vicariate.id ||
    parish.archdiocese_id !== row.archdiocese_id
  ) {
    return "Choose a valid parish for the selected deanery.";
  }

  return null;
}

function finalPathForImport(row: PastMediaImportRow) {
  const safeName = sanitizeFilename(row.original_filename);
  const title = safeStorageTitle(row.title ?? titleFromFilename(row.original_filename));
  const category = sanitizeText(row.category || "general", 60).toLowerCase() || "general";
  const monthKey = (row.captured_on ?? row.detected_taken_at ?? row.created_at).slice(0, 7);
  const suffix = `${title}__${randomUUID()}-${safeName}`;

  if (row.scope_level === "archdiocese") {
    return `archdioceses/${row.archdiocese_id}/${monthKey}/${category}/${suffix}`;
  }

  if (row.scope_level === "vicariate" && row.vicariate_id) {
    return `vicariates/${row.vicariate_id}/${monthKey}/${category}/${suffix}`;
  }

  if (row.scope_level === "deanery" && row.deanery_id) {
    return `deaneries/${row.deanery_id}/${monthKey}/${suffix}`;
  }

  if (row.scope_level === "parish" && row.parish_id) {
    return `parishes/${row.parish_id}/${monthKey}/${suffix}`;
  }

  throw new Error("Media scope is not ready for publishing.");
}

export async function publishPastMediaImports({
  importIds,
  context,
  hierarchy,
}: {
  importIds: string[];
  context: AccessContext;
  hierarchy: HierarchyCollections;
}): Promise<PublishResult> {
  if (!context.archdioceseId) {
    throw new Error("Your account does not have an archdiocese scope.");
  }

  const ids = [...new Set(importIds.filter(Boolean))];
  if (ids.length === 0) return { published: 0, skipped: 0, errors: ["Select at least one staged image."] };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("past_media_imports")
    .select("*")
    .eq("archdiocese_id", context.archdioceseId)
    .in("id", ids);

  const rows = (data ?? []) as PastMediaImportRow[];
  let published = 0;
  let skipped = ids.length - rows.length;
  const errors: string[] = [];

  for (const row of rows) {
    if (row.review_status !== "ready_for_upload") {
      skipped += 1;
      errors.push(`${row.original_filename}: mark as ready before publishing.`);
      continue;
    }

    const validationError = validateHierarchyForPublish(row, hierarchy);
    if (validationError) {
      skipped += 1;
      errors.push(`${row.original_filename}: ${validationError}`);
      await supabase
        .from("past_media_imports")
        .update({ review_status: "needs_review", error_message: validationError, updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("archdiocese_id", context.archdioceseId);
      continue;
    }

    try {
      const scope = row.scope_level as Exclude<PastMediaScopeLevel, "unknown">;
      const finalBucket = FINAL_BUCKET_BY_SCOPE[scope];
      const finalPath = finalPathForImport(row);
      await ensureMediaBucket(finalBucket);

      const { data: blob, error: downloadError } = await supabase.storage
        .from(PAST_MEDIA_IMPORT_BUCKET)
        .download(row.staging_storage_path);
      if (downloadError || !blob) throw new Error(downloadError?.message ?? "Could not read staged image.");

      const { error: uploadError } = await supabase.storage
        .from(finalBucket)
        .upload(finalPath, new Uint8Array(await blob.arrayBuffer()), {
          contentType: row.file_type,
          upsert: false,
        });
      if (uploadError) throw new Error(uploadError.message);

      await supabase
        .from("past_media_imports")
        .update({
          final_storage_path: finalPath,
          review_status: "published",
          published_by: context.userId,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", row.id)
        .eq("archdiocese_id", context.archdioceseId);

      published += 1;
    } catch (error) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Publish failed.";
      errors.push(`${row.original_filename}: ${message}`);
      await supabase
        .from("past_media_imports")
        .update({ review_status: "failed", error_message: message, updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("archdiocese_id", context.archdioceseId);
    }
  }

  return { published, skipped, errors };
}

export function getPastMediaImportPath() {
  return PAST_MEDIA_IMPORT_PATH;
}
