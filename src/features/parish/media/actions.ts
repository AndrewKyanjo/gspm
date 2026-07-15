"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PARISH_MEDIA_BUCKET } from "./constants";

export type ParishMediaUploadState = {
  error: string | null;
};

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

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

function buildImageTitle(file: File, formTitle: string, index: number, total: number) {
  const baseTitle = formTitle || file.name.replace(/\.[^.]+$/, "") || "Image";
  return total > 1 ? `${baseTitle} - ${index + 1}` : baseTitle;
}

function safeStorageTitle(title: string) {
  return (
    title
      .replace(/[^a-zA-Z0-9 ._-]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/-+/g, "-")
      .trim()
      .slice(0, 80) || "Image"
  );
}

export async function uploadParishMedia(
  _previousState: ParishMediaUploadState,
  formData: FormData
): Promise<ParishMediaUploadState> {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return { error: "Your account does not have a parish scope." };
  }

  const files = formData
    .getAll("file")
    .filter((file): file is File => file instanceof File && file.size > 0);

  const capturedOn = String(formData.get("capturedOn") ?? "").trim();
  if (!capturedOn) {
    return { error: "Choose the image month or capture date." };
  }

  const monthKey = capturedOn.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthKey)) {
    return { error: "The selected capture date is invalid." };
  }

  if (files.length === 0) {
    return { error: "Choose at least one image to upload." };
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES[file.type]) {
      return { error: "Only JPEG, PNG, WebP, and AVIF image uploads are allowed." };
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return { error: "Each image must be under 10 MB." };
    }
  }

  const title = String(formData.get("title") ?? "").trim();

  await ensureMediaBucket();

  const supabase = createAdminClient();
  const uploadedPaths: string[] = [];

  for (const [index, file] of files.entries()) {
    const displayTitle = buildImageTitle(file, title, index, files.length);
    const safeName = safeStorageTitle(displayTitle);
    const path = `parishes/${context.parishId}/${monthKey}/${safeName}__${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES[file.type]}`;

    const { error } = await supabase.storage.from(PARISH_MEDIA_BUCKET).upload(path, file, {
      contentType: file.type || "image/webp",
      upsert: false,
    });

    if (error) {
      return { error: error.message };
    }

    uploadedPaths.push(path);
  }

  revalidatePath("/dashboard/parish/media");
  redirect(`/dashboard/parish/media?media=${encodeURIComponent(uploadedPaths[0])}`);
}
