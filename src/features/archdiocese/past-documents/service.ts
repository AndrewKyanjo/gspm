import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractDocumentPreview } from "@/lib/documents/metadata";
import type { AccessContext } from "@/types/auth";
import type { HierarchyCollections } from "@/lib/db/queries/hierarchy";
import {
  ARCHDIOCESE_DOCUMENT_BUCKET,
  DEANERY_DOCUMENT_BUCKET,
  IMPORTABLE_DOCUMENT_TYPES,
  IMPORTABLE_EXTENSIONS,
  PARISH_DOCUMENT_BUCKET,
  PAST_DOCUMENT_IMPORT_BUCKET,
  PAST_DOCUMENT_IMPORT_PATH,
  VICARIATE_DOCUMENT_BUCKET,
  type PastDocumentImportItem,
  type PastDocumentImportRow,
  type PastDocumentReviewStatus,
  type PastDocumentScopeLevel,
} from "./types";

const MAX_IMPORT_FILE_SIZE = 20 * 1024 * 1024;
const MAX_SCAN_TEXT_LENGTH = 12000;
const MAX_DESCRIPTION_LENGTH = 600;
const MAX_TITLE_LENGTH = 160;

type ClassificationResult = {
  title: string;
  description: string;
  category: string;
  scopeLevel: PastDocumentScopeLevel;
  vicariateId: string | null;
  deaneryId: string | null;
  parishId: string | null;
  confidence: number;
  reasoning: string;
};

type PublishResult = {
  published: number;
  skipped: number;
  errors: string[];
};

const FINAL_BUCKET_BY_SCOPE: Record<Exclude<PastDocumentScopeLevel, "unknown">, string> = {
  archdiocese: ARCHDIOCESE_DOCUMENT_BUCKET,
  vicariate: VICARIATE_DOCUMENT_BUCKET,
  deanery: DEANERY_DOCUMENT_BUCKET,
  parish: PARISH_DOCUMENT_BUCKET,
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
  const leaf = name.split(/[\\/]/).pop() ?? "document";
  const safe = leaf.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return safe.slice(0, 140) || "document";
}

function getExtension(name: string) {
  const lower = name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot) : "";
}

function titleFromFilename(filename: string) {
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  const spaced = withoutExtension.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return sanitizeText(spaced || "Historical document", MAX_TITLE_LENGTH);
}

function categoryFromText(source: string) {
  const text = normalizeText(source);
  if (/\b(minutes|meeting|agenda|resolution)\b/.test(text)) return "minutes";
  if (/\b(policy|procedure|guideline|constitution|bylaw)\b/.test(text)) return "policy";
  if (/\b(budget|finance|financial|contribution|receipt|payment|statement)\b/.test(text)) return "budget";
  if (/\b(report|annual|quarterly|monthly|summary)\b/.test(text)) return "report";
  if (/\b(letter|correspondence|memo|notice)\b/.test(text)) return "correspondence";
  return "general";
}

function getMimeFromExtension(extension: string) {
  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case ".pptx":
      return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
    case ".txt":
      return "text/plain";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

function hasAllowedMagicBytes(bytes: Uint8Array, extension: string) {
  if (extension === ".txt") {
    return true;
  }

  if (extension === ".pdf") {
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }

  if (extension === ".docx" || extension === ".xlsx" || extension === ".pptx") {
    return bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

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

  return false;
}

export async function validateImportFile(file: File) {
  if (file.size <= 0) {
    throw new Error("Choose a non-empty document.");
  }

  if (file.size > MAX_IMPORT_FILE_SIZE) {
    throw new Error(`${file.name} is larger than the 20 MB upload limit.`);
  }

  const extension = getExtension(file.name);
  if (!IMPORTABLE_EXTENSIONS.includes(extension as (typeof IMPORTABLE_EXTENSIONS)[number])) {
    throw new Error(`${file.name} is not a supported document type.`);
  }

  const expectedMime = getMimeFromExtension(extension);
  const normalizedType = file.type || expectedMime;
  if (!IMPORTABLE_DOCUMENT_TYPES.includes(normalizedType as (typeof IMPORTABLE_DOCUMENT_TYPES)[number])) {
    throw new Error(`${file.name} has an unsupported content type.`);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasAllowedMagicBytes(bytes, extension)) {
    throw new Error(`${file.name} does not match its expected file signature.`);
  }

  return {
    bytes,
    safeName: sanitizeFilename(file.name),
    fileType: normalizedType,
  };
}

export async function ensureDocumentBucket(bucket: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(bucket);
  if (data) {
    return;
  }

  await supabase.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: MAX_IMPORT_FILE_SIZE,
    allowedMimeTypes: [...IMPORTABLE_DOCUMENT_TYPES],
  });
}

export async function createStagedImport({
  context,
  file,
}: {
  context: AccessContext;
  file: File;
}) {
  if (!context.archdioceseId) {
    throw new Error("Your account does not have an archdiocese scope.");
  }

  const { bytes, safeName, fileType } = await validateImportFile(file);
  await ensureDocumentBucket(PAST_DOCUMENT_IMPORT_BUCKET);

  const supabase = createAdminClient();
  const importId = randomUUID();
  const stagingPath = `archdioceses/${context.archdioceseId}/past-imports/${importId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(PAST_DOCUMENT_IMPORT_BUCKET)
    .upload(stagingPath, bytes, {
      contentType: fileType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const title = titleFromFilename(file.name);
  const category = categoryFromText(file.name);

  const { data, error } = await supabase
    .from("past_document_imports")
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
      review_status: "uploaded",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PastDocumentImportRow;
}

export function extractTextFromDocument(bytes: Uint8Array, filename: string, fileType: string) {
  const extension = getExtension(filename);

  if (fileType === "text/plain" || extension === ".txt") {
    return sanitizeText(new TextDecoder("utf-8", { fatal: false }).decode(bytes), MAX_SCAN_TEXT_LENGTH);
  }

  if (fileType === "application/pdf" || extension === ".pdf") {
    const raw = new TextDecoder("latin1", { fatal: false }).decode(bytes);
    const segments = raw.match(/[\x20-\x7e]{5,}/g) ?? [];
    return sanitizeText(
      segments
        .filter((segment) => !/^(obj|endobj|stream|endstream|xref|trailer)$/i.test(segment))
        .slice(0, 300)
        .join(" "),
      MAX_SCAN_TEXT_LENGTH,
    );
  }

  if (extension === ".docx") {
    return "";
  }

  return "";
}

function chooseHierarchyMatch(text: string, hierarchy: HierarchyCollections): ClassificationResult {
  const searchable = normalizeText(text);

  const parish = hierarchy.parishes.find((item) => searchable.includes(normalizeText(item.name)));
  if (parish) {
    return {
      title: "Historical document",
      description: `Historical document associated with ${parish.name}.`,
      category: categoryFromText(text),
      scopeLevel: "parish",
      vicariateId: parish.vicariate_id,
      deaneryId: parish.deanery_id,
      parishId: parish.id,
      confidence: 0.78,
      reasoning: `Matched parish name "${parish.name}" in the document text or filename.`,
    };
  }

  const deanery = hierarchy.deaneries.find((item) => searchable.includes(normalizeText(item.name)));
  if (deanery) {
    return {
      title: "Historical document",
      description: `Historical document associated with ${deanery.name}.`,
      category: categoryFromText(text),
      scopeLevel: "deanery",
      vicariateId: deanery.vicariate_id,
      deaneryId: deanery.id,
      parishId: null,
      confidence: 0.72,
      reasoning: `Matched deanery name "${deanery.name}" in the document text or filename.`,
    };
  }

  const vicariate = hierarchy.vicariates.find((item) => searchable.includes(normalizeText(item.name)));
  if (vicariate) {
    return {
      title: "Historical document",
      description: `Historical document associated with ${vicariate.name}.`,
      category: categoryFromText(text),
      scopeLevel: "vicariate",
      vicariateId: vicariate.id,
      deaneryId: null,
      parishId: null,
      confidence: 0.68,
      reasoning: `Matched vicariate name "${vicariate.name}" in the document text or filename.`,
    };
  }

  return {
    title: "Historical document",
    description: "Historical document for archdiocese review.",
    category: categoryFromText(text),
    scopeLevel: "archdiocese",
    vicariateId: null,
    deaneryId: null,
    parishId: null,
    confidence: 0.45,
    reasoning: "No exact hierarchy match was found, so the document was staged as a general archdiocese record.",
  };
}

function normalizeClassification(
  value: Partial<ClassificationResult>,
  hierarchy: HierarchyCollections,
  fallback: ClassificationResult,
): ClassificationResult {
  const scopeLevel: PastDocumentScopeLevel =
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
  const parish = value.parishId
    ? hierarchy.parishes.find((item) => item.id === value.parishId) ?? null
    : null;

  return {
    title: sanitizeText(value.title || fallback.title, MAX_TITLE_LENGTH),
    description: sanitizeText(value.description || fallback.description, MAX_DESCRIPTION_LENGTH),
    category: sanitizeText(value.category || fallback.category || "general", 60).toLowerCase() || "general",
    scopeLevel,
    vicariateId: vicariate?.id ?? fallback.vicariateId,
    deaneryId: deanery?.id ?? fallback.deaneryId,
    parishId: parish?.id ?? fallback.parishId,
    confidence: Math.max(0, Math.min(1, Number(value.confidence ?? fallback.confidence))),
    reasoning: sanitizeText(value.reasoning || fallback.reasoning, 500),
  };
}

async function classifyWithDeepSeek({
  filename,
  extractedText,
  hierarchy,
  fallback,
}: {
  filename: string;
  extractedText: string;
  hierarchy: HierarchyCollections;
  fallback: ClassificationResult;
}) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return fallback;
  }

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
              "Classify historical Catholic archdiocese documents. Return only JSON with title, description, category, scopeLevel, vicariateId, deaneryId, parishId, confidence, and reasoning. Use only IDs supplied by the user. If unsure, use archdiocese or unknown with low confidence.",
          },
          {
            role: "user",
            content: JSON.stringify({
              filename,
              extractedText: extractedText.slice(0, MAX_SCAN_TEXT_LENGTH),
              allowedScopeLevels: ["archdiocese", "vicariate", "deanery", "parish", "unknown"],
              hierarchy: hierarchyForPrompt,
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const body = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      return fallback;
    }

    return normalizeClassification(JSON.parse(content) as Partial<ClassificationResult>, hierarchy, fallback);
  } catch {
    return fallback;
  }
}

async function classifyDocument({
  filename,
  extractedText,
  hierarchy,
}: {
  filename: string;
  extractedText: string;
  hierarchy: HierarchyCollections;
}) {
  const source = `${filename}\n${extractedText}`;
  const fallback = chooseHierarchyMatch(source, hierarchy);
  fallback.title = titleFromFilename(filename);
  fallback.category = categoryFromText(source);
  fallback.description =
    extractedText.length > 80
      ? sanitizeText(`Historical document covering ${extractedText.slice(0, 220)}`, MAX_DESCRIPTION_LENGTH)
      : fallback.description;

  return classifyWithDeepSeek({ filename, extractedText, hierarchy, fallback });
}

export async function scanPastDocumentImport({
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
    .from("past_document_imports")
    .select("*")
    .eq("id", importId)
    .eq("archdiocese_id", context.archdioceseId)
    .maybeSingle();

  if (readError || !row) {
    throw new Error("Import record was not found.");
  }

  await supabase
    .from("past_document_imports")
    .update({ review_status: "scanning", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", importId)
    .eq("archdiocese_id", context.archdioceseId);

  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from(PAST_DOCUMENT_IMPORT_BUCKET)
      .download(String(row.staging_storage_path));

    if (downloadError || !blob) {
      throw new Error(downloadError?.message ?? "Could not read staged document.");
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());
    const preview = await extractDocumentPreview({
      bytes,
      fileName: String(row.original_filename),
      mimeType: String(row.file_type),
    });
    const extractedText =
      preview.plainText || extractTextFromDocument(bytes, String(row.original_filename), String(row.file_type));
    const classification = await classifyDocument({
      filename: String(row.original_filename),
      extractedText,
      hierarchy,
    });
    const status: PastDocumentReviewStatus =
      classification.confidence >= 0.65 && classification.scopeLevel !== "unknown" ? "scanned" : "needs_review";

    const { data: updated, error: updateError } = await supabase
      .from("past_document_imports")
      .update({
        title: classification.title,
        description: classification.description,
        category: classification.category,
        scope_level: classification.scopeLevel,
        vicariate_id: classification.vicariateId,
        deanery_id: classification.deaneryId,
        parish_id: classification.parishId,
        ai_title: classification.title,
        ai_description: classification.description,
        ai_category: classification.category,
        ai_scope_level: classification.scopeLevel,
        ai_confidence: classification.confidence,
        ai_reasoning: classification.reasoning,
        extracted_text_preview: extractedText.slice(0, 1000) || null,
        document_metadata: {
          ...preview.metadata,
          fileName: row.original_filename,
          fileSize: row.file_size,
          fileType: row.file_type,
        },
        detected_created_at: preview.metadata.createdAt ?? null,
        detected_modified_at: preview.metadata.modifiedAt ?? null,
        review_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", importId)
      .eq("archdiocese_id", context.archdioceseId)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return updated as PastDocumentImportRow;
  } catch (error) {
    await supabase
      .from("past_document_imports")
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

export async function getPastDocumentImports(archdioceseId: string): Promise<PastDocumentImportItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("past_document_imports")
    .select("*")
    .eq("archdiocese_id", archdioceseId)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as PastDocumentImportRow[];
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
        .from(PAST_DOCUMENT_IMPORT_BUCKET)
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

function validateHierarchyForPublish(row: PastDocumentImportRow, hierarchy: HierarchyCollections) {
  if (row.scope_level === "unknown") {
    return "Choose archdiocese, vicariate, deanery, or parish before publishing.";
  }

  if (!row.title?.trim()) {
    return "Provide a title before publishing.";
  }

  if (row.scope_level === "archdiocese") {
    return null;
  }

  const vicariate = row.vicariate_id
    ? hierarchy.vicariates.find((item) => item.id === row.vicariate_id)
    : null;
  if (!vicariate || vicariate.archdiocese_id !== row.archdiocese_id) {
    return "Choose a valid vicariate for this archdiocese.";
  }

  if (row.scope_level === "vicariate") {
    return null;
  }

  const deanery = row.deanery_id ? hierarchy.deaneries.find((item) => item.id === row.deanery_id) : null;
  if (!deanery || deanery.vicariate_id !== vicariate.id || deanery.archdiocese_id !== row.archdiocese_id) {
    return "Choose a valid deanery for the selected vicariate.";
  }

  if (row.scope_level === "deanery") {
    return null;
  }

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

function finalPathForImport(row: PastDocumentImportRow) {
  const safeName = sanitizeFilename(row.original_filename);
  const category = sanitizeText(row.category || "general", 60).toLowerCase() || "general";
  const suffix = `${Date.now()}-${randomUUID()}-${safeName}`;

  if (row.scope_level === "archdiocese") {
    return `archdioceses/${row.archdiocese_id}/${category}/${suffix}`;
  }

  if (row.scope_level === "vicariate" && row.vicariate_id) {
    return `vicariates/${row.vicariate_id}/${category}/${suffix}`;
  }

  if (row.scope_level === "deanery" && row.deanery_id) {
    return `deaneries/${row.deanery_id}/${category}/${suffix}`;
  }

  if (row.scope_level === "parish" && row.parish_id) {
    return `parishes/${row.parish_id}/${category}/${suffix}`;
  }

  throw new Error("Document scope is not ready for publishing.");
}

async function insertFinalDocumentRow({
  row,
  context,
  finalPath,
}: {
  row: PastDocumentImportRow;
  context: AccessContext;
  finalPath: string;
}) {
  const supabase = createAdminClient();
  const base = {
    archdiocese_id: row.archdiocese_id,
    uploaded_by: context.userId,
    title: sanitizeText(row.title ?? titleFromFilename(row.original_filename), MAX_TITLE_LENGTH),
    category: sanitizeText(row.category || "general", 60).toLowerCase() || "general",
    description: row.description ? sanitizeText(row.description, MAX_DESCRIPTION_LENGTH) : null,
    storage_path: finalPath,
    version_number: 1,
    is_archived: false,
    document_metadata: row.document_metadata ?? {},
    detected_created_at: row.detected_created_at,
    detected_modified_at: row.detected_modified_at,
  };

  if (row.scope_level === "archdiocese") {
    return supabase.from("archdiocese_documents").insert(base);
  }

  if (row.scope_level === "vicariate") {
    return supabase.from("vicariate_documents").insert({
      ...base,
      vicariate_id: row.vicariate_id,
    });
  }

  if (row.scope_level === "deanery") {
    return supabase.from("deanery_documents").insert({
      ...base,
      vicariate_id: row.vicariate_id,
      deanery_id: row.deanery_id,
      file_path: finalPath,
      replaces_document_id: null,
    });
  }

  return supabase.from("parish_documents").insert({
    ...base,
    vicariate_id: row.vicariate_id,
    deanery_id: row.deanery_id,
    parish_id: row.parish_id,
  });
}

export async function publishPastDocumentImports({
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
  if (ids.length === 0) {
    return { published: 0, skipped: 0, errors: ["Select at least one staged document."] };
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("past_document_imports")
    .select("*")
    .eq("archdiocese_id", context.archdioceseId)
    .in("id", ids);

  const rows = (data ?? []) as PastDocumentImportRow[];
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
        .from("past_document_imports")
        .update({
          review_status: "needs_review",
          error_message: validationError,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("archdiocese_id", context.archdioceseId);
      continue;
    }

    try {
      const scope = row.scope_level as Exclude<PastDocumentScopeLevel, "unknown">;
      const finalBucket = FINAL_BUCKET_BY_SCOPE[scope];
      const finalPath = finalPathForImport(row);
      await ensureDocumentBucket(finalBucket);

      const { data: blob, error: downloadError } = await supabase.storage
        .from(PAST_DOCUMENT_IMPORT_BUCKET)
        .download(row.staging_storage_path);
      if (downloadError || !blob) {
        throw new Error(downloadError?.message ?? "Could not read staged file.");
      }

      const { error: uploadError } = await supabase.storage
        .from(finalBucket)
        .upload(finalPath, new Uint8Array(await blob.arrayBuffer()), {
          contentType: row.file_type,
          upsert: false,
        });
      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { error: insertError } = await insertFinalDocumentRow({ row, context, finalPath });
      if (insertError) {
        throw new Error(insertError.message);
      }

      await supabase
        .from("past_document_imports")
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
        .from("past_document_imports")
        .update({
          review_status: "failed",
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id)
        .eq("archdiocese_id", context.archdioceseId);
    }
  }

  return { published, skipped, errors };
}

export function getPastDocumentImportPath() {
  return PAST_DOCUMENT_IMPORT_PATH;
}
