// src/app/api/archdiocese/media/upload/route.ts
//
// Uploads an image to the parish-project-images bucket and returns the public URL.
// Does NOT create a project — that is done via the projects/create form.
// If the bucket doesn't exist, the 20260710 migration must be run first.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import { PARISH_MEDIA_BUCKET } from "@/features/archdiocese/past-media/types";
import {
  ensureMediaBucket,
  validateImportMediaFile,
} from "@/features/archdiocese/past-media/service";

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

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

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth({
      roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
    });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = String(formData.get("description") ?? "").trim();
    const archdioceseId = formData.get("archdioceseId") as string | null;
    const parishId = formData.get("parishId") as string | null;

    if (!file || !title || !archdioceseId || !parishId) {
      return NextResponse.json(
        { error: "Missing required fields: file, title, archdioceseId, parishId." },
        { status: 400 }
      );
    }

    if (context.archdioceseId !== archdioceseId) {
      return NextResponse.json({ error: "You do not have access to this archdiocese." }, { status: 403 });
    }

    if (!ALLOWED_IMAGE_TYPES[file.type]) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, WebP, AVIF) are supported." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 10 MB." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: parish } = await adminClient
      .from("parishes")
      .select("id, deanery_id, vicariate_id")
      .eq("id", parishId)
      .eq("archdiocese_id", archdioceseId)
      .maybeSingle();

    if (!parish) {
      return NextResponse.json({ error: "The selected parish is not in this archdiocese." }, { status: 400 });
    }

    const validatedFile = await validateImportMediaFile(file);
    const fileExt = ALLOWED_IMAGE_TYPES[file.type];
    const safeTitle = safeStorageTitle(title);
    const monthKey = new Date().toISOString().slice(0, 7);
    const storagePath = `parishes/${parishId}/${monthKey}/${safeTitle}__${crypto.randomUUID()}.${fileExt}`;

    await ensureMediaBucket(PARISH_MEDIA_BUCKET);

    // Attempt upload — if the bucket doesn't exist, this will fail with a
    // clear error telling the operator to run the storage migration.
    const { error: uploadError } = await adminClient.storage
      .from(PARISH_MEDIA_BUCKET)
      .upload(storagePath, validatedFile.bytes, {
        contentType: validatedFile.fileType,
        upsert: false,
      });

    if (uploadError) {
      const message =
        uploadError.message === "Bucket not found" ||
        uploadError.message.includes("not found")
          ? `Storage bucket "${PARISH_MEDIA_BUCKET}" does not exist. Run the media storage migration to create it.`
          : uploadError.message;

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const now = new Date().toISOString();
    const { data: mediaRecord, error: recordError } = await adminClient
      .from("past_media_imports")
      .insert({
        archdiocese_id: archdioceseId,
        uploaded_by: context.userId,
        original_filename: file.name,
        staging_storage_path: storagePath,
        final_storage_path: storagePath,
        file_type: validatedFile.fileType,
        file_size: file.size,
        title: title.trim(),
        description: description || null,
        category: "general",
        scope_level: "parish",
        vicariate_id: parish.vicariate_id,
        deanery_id: parish.deanery_id,
        parish_id: parish.id,
        detected_taken_at: validatedFile.detectedTakenAt,
        captured_on: validatedFile.detectedTakenAt?.slice(0, 10) ?? null,
        image_metadata: {
          source: "archdiocese-media-upload",
          storagePath,
          fileName: file.name,
          fileSize: file.size,
          fileType: validatedFile.fileType,
        },
        review_status: "published",
        reviewed_by: context.userId,
        reviewed_at: now,
        published_by: context.userId,
        published_at: now,
      })
      .select("id")
      .single();

    if (recordError) {
      await adminClient.storage.from(PARISH_MEDIA_BUCKET).remove([storagePath]).catch(() => undefined);
      return NextResponse.json({ error: recordError.message }, { status: 500 });
    }

    const { data: signedUrlData } = await adminClient.storage
      .from(PARISH_MEDIA_BUCKET)
      .createSignedUrl(storagePath, 60 * 15);

    revalidatePath("/dashboard/archdiocese/media");

    return NextResponse.json({
      ok: true,
      id: mediaRecord.id,
      path: storagePath,
      url: signedUrlData?.signedUrl ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Upload failed. Check that the storage bucket exists (run the 20260710 migration).",
      },
      { status: 500 }
    );
  }
}
