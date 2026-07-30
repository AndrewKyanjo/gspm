import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { createStagedImport, scanPastDocumentImport } from "@/features/archdiocese/past-documents/service";

const ARCHDIOCESE_IMPORT_ROLES = ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] as const;

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
    if (!context.archdioceseId) {
      return NextResponse.json({ error: "Your account does not have an archdiocese scope." }, { status: 403 });
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .concat(formData.getAll("file"))
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "Choose at least one document to import." }, { status: 400 });
    }

    if (files.length > 30) {
      return NextResponse.json({ error: "Import up to 30 documents at a time." }, { status: 400 });
    }

    const hierarchy = await getHierarchyCollections({ archdioceseId: context.archdioceseId });
    const results: Array<{ id?: string; filename: string; status: string; error?: string }> = [];

    for (const file of files) {
      try {
        const staged = await createStagedImport({ context, file });
        results.push({ id: staged.id, filename: file.name, status: "uploaded" });

        try {
          const scanned = await scanPastDocumentImport({ importId: staged.id, context, hierarchy });
          results[results.length - 1].status = scanned.review_status;
        } catch (scanError) {
          results[results.length - 1].status = "failed";
          results[results.length - 1].error =
            scanError instanceof Error ? scanError.message : "Document scan failed.";
        }
      } catch (uploadError) {
        results.push({
          filename: file.name,
          status: "failed",
          error: uploadError instanceof Error ? uploadError.message : "Document upload failed.",
        });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed." },
      { status: 500 },
    );
  }
}
