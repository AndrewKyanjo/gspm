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

export async function deleteParishDocument(id: string): Promise<{ error: string | null }> {
  const ctx = await requireAuth({
    roles: [
      "super_admin",
      "archdiocese_admin",
      "archdiocese_data_entry",
      "vicariate_head",
      "vicariate_staff",
      "deanery_head",
      "deanery_staff",
      "parish_head",
      "parish_data_entry",
    ],
  });

  const supabase = createAdminClient();

  // Fetch document to check scope and get storage path
  const { data: doc } = await supabase
    .from("parish_documents")
    .select("parish_id, vicariate_id, deanery_id, storage_path")
    .eq("id", id)
    .maybeSingle();

  if (!doc) {
    return { error: "Document not found." };
  }

  // Scope check for non-admin users
  if (ctx.level !== "archdiocese" || !["super_admin", "archdiocese_admin"].includes(ctx.role)) {
    if (
      ctx.parishId !== doc.parish_id &&
      ctx.vicariateId !== doc.vicariate_id &&
      ctx.deaneryId !== doc.deanery_id
    ) {
      return { error: "You do not have permission to delete this document." };
    }
  }

  // Delete storage file
  if (doc.storage_path) {
    await supabase.storage.from(PARISH_DOCUMENT_BUCKET).remove([doc.storage_path]);
  }

  // Delete database record
  const { error } = await supabase.from("parish_documents").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/parish/documents");
  revalidatePath("/dashboard/archdiocese/documents");
  revalidatePath("/dashboard/vicariate/documents");
  revalidatePath("/dashboard/deanery/documents");
  return { error: null };
}
