import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { assertCanAccessDocumentStorage, parseDocumentStorageReference } from "@/lib/documents/access";
import { extractDocumentPreview, getDocumentKind } from "@/lib/documents/metadata";
import { createAdminClient } from "@/lib/supabase/admin";

function filenameFromPath(path: string) {
  return path.split("/").pop() || "document";
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth();
    const reference = parseDocumentStorageReference(request.nextUrl.searchParams);
    await assertCanAccessDocumentStorage(context, reference);

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from(reference.bucket).download(reference.path);
    if (error || !data) {
      return NextResponse.json({ error: "Document was not found." }, { status: 404 });
    }

    const bytes = new Uint8Array(await data.arrayBuffer());
    const fileName = filenameFromPath(reference.path);
    const payload = await extractDocumentPreview({
      bytes,
      fileName,
      mimeType: data.type,
    });
    const params = new URLSearchParams({ bucket: reference.bucket, path: reference.path });
    const downloadParams = new URLSearchParams({ bucket: reference.bucket, path: reference.path, download: "true" });

    return NextResponse.json({
      ...payload,
      fileName,
      inlineUrl:
        getDocumentKind(fileName, data.type) === "pdf" || getDocumentKind(fileName, data.type) === "image"
          ? `/api/documents/file?${params.toString()}`
          : null,
      downloadUrl: `/api/documents/file?${downloadParams.toString()}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview failed." },
      { status: 403 },
    );
  }
}
