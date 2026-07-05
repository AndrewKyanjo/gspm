"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PARISH_MEDIA_BUCKET } from "./constants";

export type ParishMediaUploadState = {
  error: string | null;
};

async function ensureMediaBucket() {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(PARISH_MEDIA_BUCKET);
  if (data) {
    return;
  }

  await supabase.storage.createBucket(PARISH_MEDIA_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
}

export async function uploadParishMedia(
  _previousState: ParishMediaUploadState,
  formData: FormData
): Promise<ParishMediaUploadState> {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return { error: "Your account does not have a parish scope." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "Only image uploads are allowed in the media library." };
  }

  const capturedOn = String(formData.get("capturedOn") ?? "").trim();
  if (!capturedOn) {
    return { error: "Choose the image month or capture date." };
  }

  const monthKey = capturedOn.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return { error: "The selected capture date is invalid." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const baseName = title || file.name.replace(/\.[^.]+$/, "");
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").toLowerCase();

  await ensureMediaBucket();

  const supabase = createAdminClient();
  const path = `parishes/${context.parishId}/${monthKey}/${Date.now()}-${safeName || "image"}.webp`;

  const { error } = await supabase.storage.from(PARISH_MEDIA_BUCKET).upload(path, file, {
    contentType: "image/webp",
    upsert: false,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/parish/media");
  redirect(`/dashboard/parish/media?media=${encodeURIComponent(path)}`);
}
