import { createAdminClient } from "@/lib/supabase/admin";
import type { ParishDocumentItem, ParishDocumentSummary } from "../types";
import { PARISH_DOCUMENT_BUCKET } from "./constants";

export async function getParishDocumentSummary(): Promise<ParishDocumentSummary> {
  // TODO: replace with real Supabase document queries once the canonical
  // document metadata table is available for parish users.
  return {
    recordsAvailable: false,
    reason: "Document metadata is not yet connected to a parish-facing Supabase table.",
  };
}

export async function getParishDocuments(parishId: string): Promise<ParishDocumentItem[]> {
  const supabase = createAdminClient();
  const basePrefix = `parishes/${parishId}`;
  const categories = ["general", "minutes", "bulletins", "policies", "reports"];

  const allFiles = await Promise.all(
    categories.map(async (category) => {
      const prefix = `${basePrefix}/${category}`;
      const { data, error } = await supabase.storage.from(PARISH_DOCUMENT_BUCKET).list(prefix, {
        limit: 100,
        sortBy: { column: "updated_at", order: "desc" },
      });

      if (error || !data) {
        return [];
      }

      const items = data.filter((item) => item.id && !item.name.endsWith("/"));
      return Promise.all(
        items.map(async (item) => {
          const fullPath = `${prefix}/${item.name}`;
          const { data: signedUrl } = await supabase.storage
            .from(PARISH_DOCUMENT_BUCKET)
            .createSignedUrl(fullPath, 60 * 15);

          return {
            name: item.name,
            path: fullPath,
            category,
            size: item.metadata?.size ? Number(item.metadata.size) : null,
            updatedAt: item.updated_at ?? null,
            downloadUrl: signedUrl?.signedUrl ?? null,
          };
        })
      );
    })
  );

  return allFiles.flat().sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
}
