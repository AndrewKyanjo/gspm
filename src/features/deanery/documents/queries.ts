import { createAdminClient } from "@/lib/supabase/admin";
import { getDeaneryDocumentRows, getProfilesByIds } from "@/lib/db/queries/deanery";
import type { DeaneryDocumentItem } from "../types";

export async function getDeaneryDocuments(
  deaneryId: string,
  query?: string,
): Promise<DeaneryDocumentItem[]> {
  const rows = await getDeaneryDocumentRows(deaneryId);

  const uploadedByIds = rows
    .map((row) => (typeof row.uploaded_by === "string" ? row.uploaded_by : null))
    .filter(Boolean) as string[];

  const profiles = await getProfilesByIds(uploadedByIds);
  const profileNameMap = new Map(
    profiles.map((profile) => [String(profile.id), profile.full_name ?? null]),
  );

  const supabase = createAdminClient();

  const items: DeaneryDocumentItem[] = await Promise.all(
    rows.map(async (row) => {
      const filePath = typeof row.file_path === "string" ? row.file_path : null;

      let downloadUrl: string | null = null;
      if (filePath) {
        const { data } = await supabase.storage
          .from("deanery-documents")
          .createSignedUrl(filePath, 60 * 15);
        downloadUrl = data?.signedUrl ?? null;
      }

      return {
        id: String(row.id),
        title: String(row.title ?? ""),
        category: typeof row.category === "string" ? row.category : "general",
        description: typeof row.description === "string" ? row.description : null,
        versionNumber: Number(row.version_number ?? 1),
        isArchived: Boolean(row.is_archived),
        createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
        uploadedByName: profileNameMap.get(String(row.uploaded_by ?? "")) ?? null,
        downloadUrl,
        path: filePath ?? "",
      };
    }),
  );

  if (!query) {
    return items;
  }

  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) =>
    [item.title, item.category, item.description, item.uploadedByName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
  );
}
