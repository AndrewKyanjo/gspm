export const PAST_DOCUMENT_IMPORT_BUCKET = "past-document-imports";
export const ARCHDIOCESE_DOCUMENT_BUCKET = "archdiocese-documents";
export const VICARIATE_DOCUMENT_BUCKET = "vicariate-documents";
export const DEANERY_DOCUMENT_BUCKET = "deanery-documents";
export const PARISH_DOCUMENT_BUCKET = "parish-documents";

export const PAST_DOCUMENT_IMPORT_PATH = "/dashboard/archdiocese/past-documents/import";

export const IMPORTABLE_DOCUMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
] as const;

export const IMPORTABLE_EXTENSIONS = [".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".jpg", ".jpeg", ".png"] as const;

export type PastDocumentScopeLevel = "archdiocese" | "vicariate" | "deanery" | "parish" | "unknown";

export type PastDocumentReviewStatus =
  | "uploaded"
  | "scanning"
  | "scanned"
  | "needs_review"
  | "ready_for_upload"
  | "published"
  | "failed"
  | "rejected";

export type PastDocumentImportRow = {
  id: string;
  archdiocese_id: string;
  uploaded_by: string;
  original_filename: string;
  staging_storage_path: string;
  final_storage_path: string | null;
  file_type: string;
  file_size: number;
  title: string | null;
  description: string | null;
  category: string | null;
  scope_level: PastDocumentScopeLevel;
  vicariate_id: string | null;
  deanery_id: string | null;
  parish_id: string | null;
  ai_title: string | null;
  ai_description: string | null;
  ai_category: string | null;
  ai_scope_level: PastDocumentScopeLevel | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  extracted_text_preview: string | null;
  document_metadata: Record<string, unknown>;
  detected_created_at: string | null;
  detected_modified_at: string | null;
  review_status: PastDocumentReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_by: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type PastDocumentImportItem = PastDocumentImportRow & {
  downloadUrl: string | null;
  vicariateName: string | null;
  deaneryName: string | null;
  parishName: string | null;
};

export type PastDocumentHierarchyOption = {
  id: string;
  name: string;
  archdioceseId: string;
  vicariateId?: string | null;
  deaneryId?: string | null;
};
