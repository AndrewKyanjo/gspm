// src/app/api/archdiocese/media/upload/route.ts
//
// Uploads an image to the parish-project-images bucket and returns the public URL.
// Does NOT create a project — that is done via the projects/create form.
// If the bucket doesn't exist, the 20260710 migration must be run first.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";

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
      .select("id")
      .eq("id", parishId)
      .eq("archdiocese_id", archdioceseId)
      .maybeSingle();

    if (!parish) {
      return NextResponse.json({ error: "The selected parish is not in this archdiocese." }, { status: 400 });
    }

    const fileExt = ALLOWED_IMAGE_TYPES[file.type];
    const safeTitle = safeStorageTitle(title);
    const storagePath = `archdiocese/${archdioceseId}/parish/${parishId}/${safeTitle}__${crypto.randomUUID()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();

    // Attempt upload — if the bucket doesn't exist, this will fail with a
    // clear error telling the operator to run the storage migration.
    const { error: uploadError } = await adminClient.storage
      .from("parish-project-images")
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      const message =
        uploadError.message === "Bucket not found" ||
        uploadError.message.includes("not found")
          ? `Storage bucket "parish-project-images" does not exist. Run migration 20260710_archdiocese_documents_and_storage.sql to create it.`
          : uploadError.message;

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const { data: publicUrlData } = adminClient.storage
      .from("parish-project-images")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      ok: true,
      path: storagePath,
      url: publicUrlData.publicUrl,
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
