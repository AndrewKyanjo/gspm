"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
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

  const { error } = await supabase.storage
    .from(PARISH_DOCUMENT_BUCKET)
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/parish/documents");
  redirect("/dashboard/parish/documents");
}
