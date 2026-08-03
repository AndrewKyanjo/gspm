export const PAST_MEDIA_IMPORT_BUCKET = "past-media-imports";
export const ARCHDIOCESE_MEDIA_BUCKET = "archdiocese-media";
export const VICARIATE_MEDIA_BUCKET = "vicariate-media";
export const DEANERY_MEDIA_BUCKET = "deanery-media";
export const PARISH_MEDIA_BUCKET = "parish-media";

export const PAST_MEDIA_IMPORT_PATH = "/dashboard/archdiocese/past-documents/import";

export const IMPORTABLE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const IMPORTABLE_MEDIA_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"] as const;

export type PastMediaScopeLevel = "archdiocese" | "vicariate" | "deanery" | "parish" | "unknown";

export type PastMediaReviewStatus =
  | "uploaded"
  | "scanning"
  | "scanned"
  | "needs_review"
  | "ready_for_upload"
  | "published"
  | "failed"
  | "rejected";

export type PastMediaImportRow = {
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
  scope_level: PastMediaScopeLevel;
  vicariate_id: string | null;
  deanery_id: string | null;
  parish_id: string | null;
  captured_on: string | null;
  detected_taken_at: string | null;
  image_metadata: Record<string, unknown>;
  ai_title: string | null;
  ai_description: string | null;
  ai_category: string | null;
  ai_scope_level: PastMediaScopeLevel | null;
  ai_confidence: number | null;
  ai_reasoning: string | null;
  review_status: PastMediaReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  published_by: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type PastMediaImportItem = PastMediaImportRow & {
  downloadUrl: string | null;
  vicariateName: string | null;
  deaneryName: string | null;
  parishName: string | null;
};
