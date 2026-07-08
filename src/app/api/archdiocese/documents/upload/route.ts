// src/app/api/archdiocese/documents/upload/route.ts
//
// Uploads a document to the deanery-documents bucket and records its metadata
// in the deanery_documents table.
// If the bucket or table doesn't exist, the 20260710 migration must be run first.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;
    const category = formData.get("category") as string | null;
    const description = formData.get("description") as string | null;
    const archdioceseId = formData.get("archdioceseId") as string | null;
    const vicariateId = formData.get("vicariateId") as string | null;
    const deaneryId = formData.get("deaneryId") as string | null;
    const uploadedBy = formData.get("uploadedBy") as string | null;

    if (!file || !title || !deaneryId || !archdioceseId) {
      return NextResponse.json(
        { error: "Missing required fields: file, title, deaneryId, archdioceseId." },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be under 20 MB." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `archdiocese/${archdioceseId}/deanery/${deaneryId}/${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();

    // Upload to storage bucket
    const { error: uploadError } = await adminClient.storage
      .from("deanery-documents")
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      const message =
        uploadError.message === "Bucket not found" ||
        uploadError.message.includes("not found")
          ? `Storage bucket "deanery-documents" does not exist. Run migration 20260710_archdiocese_documents_and_storage.sql to create it.`
          : uploadError.message;

      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Record metadata in the database
    const { error: insertError } = await adminClient
      .from("deanery_documents")
      .insert({
        archdiocese_id: archdioceseId,
        vicariate_id: vicariateId || null,
        deanery_id: deaneryId,
        uploaded_by: uploadedBy,
        title: title.trim(),
        category: category || "general",
        description: description?.trim() || null,
        storage_path: storagePath,
        version_number: 1,
        replaces_document_id: null,
      });

    if (insertError) {
      // Table likely doesn't exist — the file is already uploaded, but we
      // can't track it.  Tell the operator what to do.
      if (insertError.message.includes("does not exist") || insertError.code === "42P01") {
        return NextResponse.json(
          {
            error:
              'Table "deanery_documents" does not exist. Run migration 20260710_archdiocese_documents_and_storage.sql to create it.',
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, path: storagePath });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Upload failed. Check that the storage bucket and deanery_documents table exist (run the 20260710 migration).",
      },
      { status: 500 }
    );
  }
}
