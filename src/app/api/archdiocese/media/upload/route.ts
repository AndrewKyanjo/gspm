// src/app/api/archdiocese/media/upload/route.ts
//
// Uploads an image to the parish-project-images bucket and returns the public URL.
// Does NOT create a project — that is done via the projects/create form.
// If the bucket doesn't exist, the 20260710 migration must be run first.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const archdioceseId = formData.get("archdioceseId") as string | null;
    const parishId = formData.get("parishId") as string | null;
    const uploadedBy = formData.get("uploadedBy") as string | null;

    if (!file || !title || !archdioceseId || !parishId) {
      return NextResponse.json(
        { error: "Missing required fields: file, title, archdioceseId, parishId." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files (JPEG, PNG, WebP) are supported." },
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
    const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const safeTitle = title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
    const storagePath = `archdiocese/${archdioceseId}/parish/${parishId}/${Date.now()}-${safeTitle}.${fileExt}`;

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
