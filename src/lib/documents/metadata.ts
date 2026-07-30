import JSZip from "jszip";

export type DocumentPreviewKind = "pdf" | "office" | "image" | "text" | "unsupported";

export type ExtractedDocumentMetadata = {
  title?: string | null;
  subject?: string | null;
  author?: string | null;
  createdAt?: string | null;
  modifiedAt?: string | null;
  pageCount?: number | null;
  wordCount?: number | null;
  slideCount?: number | null;
  sheetCount?: number | null;
  mimeType?: string | null;
  fileExtension?: string | null;
};

export type DocumentPreviewPayload = {
  kind: DocumentPreviewKind;
  previewHtml: string | null;
  plainText: string;
  metadata: ExtractedDocumentMetadata;
};

const XML_TEXT_LIMIT = 18000;

function extensionFromName(name: string) {
  const dot = name.toLowerCase().lastIndexOf(".");
  return dot >= 0 ? name.toLowerCase().slice(dot) : "";
}

export function getDocumentKind(fileNameOrPath: string, mimeType?: string | null): DocumentPreviewKind {
  const extension = extensionFromName(fileNameOrPath);
  if (mimeType === "application/pdf" || extension === ".pdf") return "pdf";
  if (mimeType?.startsWith("image/") || [".jpg", ".jpeg", ".png"].includes(extension)) return "image";
  if (mimeType === "text/plain" || extension === ".txt") return "text";
  if (
    [
      ".docx",
      ".xlsx",
      ".pptx",
    ].includes(extension) ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "office";
  }
  return "unsupported";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function splitIntoPages(items: string[], perPage: number) {
  const pages: string[][] = [];
  for (let index = 0; index < items.length; index += perPage) {
    pages.push(items.slice(index, index + perPage));
  }
  return pages.length ? pages : [[]];
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function xmlText(value: string) {
  return decodeXmlEntities(
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function tagValue(xml: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)</${escaped}>`, "i"));
  return match ? xmlText(match[1]) : null;
}

function normalizeDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parsePdfDate(raw: string | null) {
  if (!raw) return null;
  const match = raw.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return normalizeDate(raw);
  const [, year, month = "01", day = "01", hour = "00", minute = "00", second = "00"] = match;
  return normalizeDate(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
}

function metadataFromPdf(bytes: Uint8Array, mimeType?: string | null) {
  const raw = new TextDecoder("latin1", { fatal: false }).decode(bytes);
  const creation = raw.match(/\/CreationDate\s*\(([^)]*)\)/)?.[1] ?? null;
  const modified = raw.match(/\/ModDate\s*\(([^)]*)\)/)?.[1] ?? null;
  const title = raw.match(/\/Title\s*\(([^)]*)\)/)?.[1] ?? null;
  const author = raw.match(/\/Author\s*\(([^)]*)\)/)?.[1] ?? null;
  const pageCount = (raw.match(/\/Type\s*\/Page\b/g) ?? []).length || null;

  return {
    title: title ? xmlText(title) : null,
    author: author ? xmlText(author) : null,
    createdAt: parsePdfDate(creation),
    modifiedAt: parsePdfDate(modified),
    pageCount,
    mimeType: mimeType ?? "application/pdf",
    fileExtension: ".pdf",
  };
}

async function metadataFromCoreXml(zip: JSZip, mimeType?: string | null, extension?: string | null) {
  const core = await zip.file("docProps/core.xml")?.async("string");
  const app = await zip.file("docProps/app.xml")?.async("string");

  return {
    title: core ? tagValue(core, "dc:title") : null,
    subject: core ? tagValue(core, "dc:subject") : null,
    author: core ? tagValue(core, "dc:creator") ?? tagValue(core, "cp:lastModifiedBy") : null,
    createdAt: core ? normalizeDate(tagValue(core, "dcterms:created")) : null,
    modifiedAt: core ? normalizeDate(tagValue(core, "dcterms:modified")) : null,
    pageCount: app ? Number(tagValue(app, "Pages")) || null : null,
    wordCount: app ? Number(tagValue(app, "Words")) || null : null,
    slideCount: app ? Number(tagValue(app, "Slides")) || null : null,
    sheetCount: app ? Number(tagValue(app, "Worksheets")) || null : null,
    mimeType: mimeType ?? null,
    fileExtension: extension ?? null,
  };
}

async function previewDocx(zip: JSZip) {
  const documentXml = await zip.file("word/document.xml")?.async("string");
  if (!documentXml) return { html: null, text: "" };

  const paragraphMatches = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) ?? [];
  const paragraphs = paragraphMatches.map(xmlText).filter(Boolean).slice(0, 120);
  const text = paragraphs.join("\n").slice(0, XML_TEXT_LIMIT);
  const pages = splitIntoPages(paragraphs, 18)
    .map((page) => `<section class="print-page word-page">${page.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>`)
    .join("");
  return { html: `<article class="document-preview-body print-preview">${pages}</article>`, text };
}

async function previewXlsx(zip: JSZip) {
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string");
  const sharedStrings = sharedXml
    ? (sharedXml.match(/<si[\s\S]*?<\/si>/g) ?? []).map(xmlText)
    : [];
  const sheetFiles = Object.keys(zip.files)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(name))
    .sort()
    .slice(0, 5);

  const sheets: string[] = [];
  const textParts: string[] = [];

  for (const [sheetIndex, sheetPath] of sheetFiles.entries()) {
    const sheetXml = await zip.file(sheetPath)?.async("string");
    if (!sheetXml) continue;
    const rows = (sheetXml.match(/<row[\s\S]*?<\/row>/g) ?? []).slice(0, 80);
    const htmlRows = rows.map((row) => {
      const cells = (row.match(/<c[\s\S]*?<\/c>/g) ?? []).slice(0, 12);
      const values = cells.map((cell) => {
        const isShared = /t="s"/.test(cell);
        const raw = tagValue(cell, "v") ?? "";
        const value = isShared ? sharedStrings[Number(raw)] ?? raw : raw;
        return escapeHtml(value);
      });
      textParts.push(values.join(" "));
      return `<tr>${values.map((value) => `<td>${value}</td>`).join("")}</tr>`;
    });
    const sheetPages = splitIntoPages(htmlRows, 28)
      .map(
        (page, pageIndex) =>
          `<section class="print-page sheet-page"><div class="sheet-page-header">Sheet ${sheetIndex + 1}${pageIndex ? `, page ${pageIndex + 1}` : ""}</div><table>${page.join("")}</table></section>`,
      )
      .join("");
    sheets.push(sheetPages);
  }

  return {
    html: `<article class="document-preview-body print-preview spreadsheet-preview">${sheets.join("")}</article>`,
    text: textParts.join("\n").slice(0, XML_TEXT_LIMIT),
  };
}

async function previewPptx(zip: JSZip) {
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => Number(a.match(/\d+/)?.[0] ?? 0) - Number(b.match(/\d+/)?.[0] ?? 0))
    .slice(0, 40);

  const slides: string[] = [];
  const textParts: string[] = [];

  for (const [index, slidePath] of slideFiles.entries()) {
    const slideXml = await zip.file(slidePath)?.async("string");
    if (!slideXml) continue;
    const pieces = (slideXml.match(/<a:t>[\s\S]*?<\/a:t>/g) ?? []).map(xmlText).filter(Boolean);
    textParts.push(pieces.join(" "));
    slides.push(
      `<section class="print-page slide-preview"><h3>Slide ${index + 1}</h3>${pieces
        .map((piece) => `<p>${escapeHtml(piece)}</p>`)
        .join("")}</section>`,
    );
  }

  return {
    html: `<article class="document-preview-body print-preview presentation-preview">${slides.join("")}</article>`,
    text: textParts.join("\n").slice(0, XML_TEXT_LIMIT),
  };
}

export async function extractDocumentPreview({
  bytes,
  fileName,
  mimeType,
}: {
  bytes: Uint8Array;
  fileName: string;
  mimeType?: string | null;
}): Promise<DocumentPreviewPayload> {
  const extension = extensionFromName(fileName);
  const kind = getDocumentKind(fileName, mimeType);

  if (kind === "pdf") {
    return {
      kind,
      previewHtml: null,
      plainText: "",
      metadata: metadataFromPdf(bytes, mimeType),
    };
  }

  if (kind === "text") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes).slice(0, XML_TEXT_LIMIT);
    return {
      kind,
      previewHtml: `<article class="document-preview-body print-preview"><section class="print-page word-page"><pre>${escapeHtml(text)}</pre></section></article>`,
      plainText: text,
      metadata: { mimeType: mimeType ?? "text/plain", fileExtension: extension },
    };
  }

  if (kind === "office") {
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: false });
    const metadata = await metadataFromCoreXml(zip, mimeType, extension);
    const preview =
      extension === ".docx"
        ? await previewDocx(zip)
        : extension === ".xlsx"
          ? await previewXlsx(zip)
          : await previewPptx(zip);

    return {
      kind,
      previewHtml: preview.html,
      plainText: preview.text,
      metadata,
    };
  }

  return {
    kind,
    previewHtml: null,
    plainText: "",
    metadata: { mimeType: mimeType ?? null, fileExtension: extension },
  };
}
