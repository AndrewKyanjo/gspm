"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEANERY_MEDIA_BUCKET } from "./constants";

export type DeaneryMediaUploadState = {
  error: string | null;
};

async function ensureDeaneryMediaBucket() {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(DEANERY_MEDIA_BUCKET);
  if (data) {
    return;
  }

  await supabase.storage.createBucket(DEANERY_MEDIA_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
}

export async function uploadDeaneryMedia(
  _previousState: DeaneryMediaUploadState,
  formData: FormData
): Promise<DeaneryMediaUploadState> {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) {
    return { error: "Your account does not have a deanery scope." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  const capturedOn = String(formData.get("capturedOn") ?? "").trim();
  const monthKey = capturedOn.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return { error: "Choose a valid capture date." };
  }

  await ensureDeaneryMediaBucket();
  const baseName = String(formData.get("title") ?? "").trim() || file.name.replace(/\.[^.]+$/, "");
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").toLowerCase();
  const path = `deaneries/${context.deaneryId}/${monthKey}/${Date.now()}-${safeName || "image"}.webp`;

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(DEANERY_MEDIA_BUCKET).upload(path, file, {
    contentType: "image/webp",
    upsert: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/deanery/media");
  redirect(`/dashboard/deanery/media?media=${encodeURIComponent(path)}`);
}
