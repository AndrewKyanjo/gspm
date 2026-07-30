import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertCanAccessDocumentStorage, parseDocumentStorageReference } from "@/lib/documents/access";

function filenameFromPath(path: string) {
  return path.split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") || "document";
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

    const download = request.nextUrl.searchParams.get("download") === "true";
    const filename = filenameFromPath(reference.path);
    const headers = new Headers();
    headers.set("Content-Type", data.type || "application/octet-stream");
    headers.set("Content-Disposition", `${download ? "attachment" : "inline"}; filename="${filename}"`);
    headers.set("Cache-Control", "no-store");
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(data, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Document access failed." },
      { status: 403 },
    );
  }
}
