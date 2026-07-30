"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import { extractDocumentPreview } from "@/lib/documents/metadata";
import { PARISH_DOCUMENT_BUCKET } from "./constants";

export type ParishDocumentUploadState = {
  error: string | null;
};

async function ensureDocumentBucket() {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(PARISH_DOCUMENT_BUCKET);
  if (data) {
    return;
  }

  await supabase.storage.createBucket(PARISH_DOCUMENT_BUCKET, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
  });
}

export async function uploadParishDocument(
  _previousState: ParishDocumentUploadState,
  formData: FormData
): Promise<ParishDocumentUploadState> {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return { error: "Your account does not have a parish scope." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a document to upload." };
  }

  const category = String(formData.get("category") ?? "general").trim() || "general";
  await ensureDocumentBucket();

  const supabase = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `parishes/${context.parishId}/${category}/${Date.now()}-${safeName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const preview = await extractDocumentPreview({
    bytes,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });

  const { error } = await supabase.storage
    .from(PARISH_DOCUMENT_BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || file.name;
  const { error: insertError } = await supabase.from("parish_documents").insert({
    archdiocese_id: context.archdioceseId,
    vicariate_id: context.vicariateId,
    deanery_id: context.deaneryId,
    parish_id: context.parishId,
    uploaded_by: context.userId,
    title,
    category,
    description: null,
    storage_path: path,
    version_number: 1,
    document_metadata: {
      ...preview.metadata,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
    },
    detected_created_at: preview.metadata.createdAt ?? null,
    detected_modified_at: preview.metadata.modifiedAt ?? null,
    is_archived: false,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/parish/documents");
  redirect("/dashboard/parish/documents");
}
