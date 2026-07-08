// src/app/(dashboard)/dashboard/archdiocese/documents/page.tsx
import { FileText, FolderOpen, Upload } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type DocumentRow = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  deaneryName: string | null;
  vicariateName: string | null;
  storagePath: string;
  versionNumber: number;
  isArchived: boolean;
  createdAt: string;
};

async function getArchdioceseDocuments(archdioceseId: string): Promise<DocumentRow[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("deanery_documents")
    .select("id, title, category, description, deanery_id, vicariate_id, storage_path, version_number, is_archived, created_at")
    .eq("archdiocese_id", archdioceseId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data?.length) return [];

  const deaneryIds = [...new Set(data.map((d) => d.deanery_id).filter(Boolean))];
  const vicariateIds = [...new Set(data.map((d) => d.vicariate_id).filter(Boolean))];

  const [{ data: deaneries }, { data: vicariates }] = await Promise.all([
    deaneryIds.length
      ? supabase.from("deaneries").select("id, name").in("id", deaneryIds)
      : { data: [] },
    vicariateIds.length
      ? supabase.from("vicariates").select("id, name").in("id", vicariateIds)
      : { data: [] },
  ]);

  const deaneryMap = new Map((deaneries ?? []).map((d) => [d.id, d.name]));
  const vicariateMap = new Map((vicariates ?? []).map((v) => [v.id, v.name]));

  return data.map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category ?? null,
    description: d.description ?? null,
    deaneryName: d.deanery_id ? deaneryMap.get(d.deanery_id) ?? null : null,
    vicariateName: d.vicariate_id ? vicariateMap.get(d.vicariate_id) ?? null : null,
    storagePath: d.storage_path,
    versionNumber: d.version_number,
    isArchived: d.is_archived === true,
    createdAt: d.created_at,
  }));
}

export default async function ArchdioceseDocumentsPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const documents = await getArchdioceseDocuments(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/documents"
      eyebrow="Archdiocese Documents"
      title="Document library"
      subtitle="Documents uploaded across deaneries in the archdiocese."
      actions={
        <Button href="/dashboard/archdiocese/documents/upload">
          <Upload className="h-4 w-4 mr-2" />
          Upload document
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Documents"
        description="Browse all documents available across the hierarchy. Documents are organized by deanery and vicariate."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Documents"
          value={documents.length}
          helper="Total available documents"
          icon={FileText}
        />
        <StatCard
          label="Deaneries"
          value={new Set(documents.map((d) => d.deaneryName).filter(Boolean)).size}
          helper="Deaneries with documents"
          icon={FolderOpen}
        />
        <StatCard
          label="Categories"
          value={new Set(documents.map((d) => d.category).filter(Boolean)).size}
          helper="Distinct document categories"
          icon={FileText}
        />
      </section>

      {documents.length > 0 ? (
        <SimpleTable
          title="Document library"
          description="Documents uploaded at the deanery level and visible to the executive console."
          rows={documents}
          columns={[
            {
              header: "Document",
              cell: (item) => (
                <div className="space-y-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-on-surface-variant">
                    {item.description?.slice(0, 80) ?? "No description"}
                  </div>
                </div>
              ),
            },
            {
              header: "Category",
              cell: (item) => item.category ?? "Uncategorized",
            },
            {
              header: "Deanery",
              cell: (item) => item.deaneryName ?? "N/A",
            },
            {
              header: "Vicariate",
              cell: (item) => item.vicariateName ?? "N/A",
            },
            {
              header: "Version",
              cell: (item) => `v${item.versionNumber}`,
            },
            {
              header: "Uploaded",
              cell: (item) =>
                item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString()
                  : "-",
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No documents yet"
          description="Uploaded deanery documents will appear here for executive review."
          action={
            <Button href="/dashboard/archdiocese/documents/upload" variant="secondary">
              Upload your first document
            </Button>
          }
        />
      )}
    </ArchdioceseShell>
  );
}
