"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import { extractDocumentPreview } from "@/lib/documents/metadata";

export type DeaneryDocumentUploadState = {
  error: string | null;
};

const DEANERY_DOCUMENT_BUCKET = "deanery-documents";

async function ensureDocumentBucket() {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(DEANERY_DOCUMENT_BUCKET);
  if (data) {
    return;
  }

  await supabase.storage.createBucket(DEANERY_DOCUMENT_BUCKET, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
  });
}

export async function uploadDeaneryDocument(
  _previousState: DeaneryDocumentUploadState,
  formData: FormData,
): Promise<DeaneryDocumentUploadState> {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });

  if (!context.deaneryId) {
    return { error: "Your account does not have a deanery scope." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "general").trim() || "general";
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("file");

  if (!title) {
    return { error: "Provide a document title." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a document to upload." };
  }

  await ensureDocumentBucket();

  const supabase = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `deaneries/${context.deaneryId}/${category}/${Date.now()}-${safeName}`;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const preview = await extractDocumentPreview({
    bytes,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
  });

  const { error: uploadError } = await supabase.storage
    .from(DEANERY_DOCUMENT_BUCKET)
    .upload(path, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  // Determine the next version number for this title + category
  const { data: existingDocs } = await supabase
    .from("deanery_documents")
    .select("version_number")
    .eq("deanery_id", context.deaneryId)
    .eq("title", title)
    .eq("category", category)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = existingDocs && existingDocs.length > 0
    ? Number(existingDocs[0].version_number ?? 0) + 1
    : 1;

  const { error: insertError } = await supabase.from("deanery_documents").insert({
    archdiocese_id: context.archdioceseId,
    vicariate_id: context.vicariateId,
    deanery_id: context.deaneryId,
    title,
    category,
    description,
    version_number: nextVersion,
    file_path: path,
    storage_path: path,
    document_metadata: {
      ...preview.metadata,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
    },
    detected_created_at: preview.metadata.createdAt ?? null,
    detected_modified_at: preview.metadata.modifiedAt ?? null,
    uploaded_by: context.userId,
    is_archived: false,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath("/dashboard/deanery/documents");
  redirect("/dashboard/deanery/documents");
}

export async function setDeaneryDocumentArchived(formData: FormData) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) {
    return;
  }

  const documentId = formData.get("documentId");
  const archived = formData.get("archived");

  if (typeof documentId !== "string" || !documentId) {
    return;
  }

  const isArchived = archived === "true";

  const supabase = createAdminClient();
  await supabase
    .from("deanery_documents")
    .update({ is_archived: isArchived })
    .eq("id", documentId)
    .eq("deanery_id", context.deaneryId);

  revalidatePath("/dashboard/deanery/documents");
}
