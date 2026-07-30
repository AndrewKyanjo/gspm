// src/app/(dashboard)/dashboard/archdiocese/documents/page.tsx
import { FileText, FolderOpen, Upload } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { DocumentPreviewButton } from "@/components/dashboard/shared/document-preview-button";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type DocumentRow = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  scope: "Archdiocese" | "Vicariate" | "Deanery" | "Parish";
  deaneryName: string | null;
  vicariateName: string | null;
  parishName: string | null;
  bucket: string;
  storagePath: string;
  versionNumber: number;
  isArchived: boolean;
  createdAt: string;
};

async function getArchdioceseDocuments(archdioceseId: string): Promise<DocumentRow[]> {
  const supabase = createAdminClient();
  const [archdioceseResult, vicariateResult, deaneryResult, parishResult] = await Promise.all([
    supabase
      .from("archdiocese_documents")
      .select("id, title, category, description, storage_path, version_number, is_archived, created_at")
      .eq("archdiocese_id", archdioceseId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("vicariate_documents")
      .select("id, title, category, description, vicariate_id, storage_path, version_number, is_archived, created_at")
      .eq("archdiocese_id", archdioceseId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("deanery_documents")
      .select("id, title, category, description, deanery_id, vicariate_id, storage_path, file_path, version_number, is_archived, created_at")
      .eq("archdiocese_id", archdioceseId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("parish_documents")
      .select("id, title, category, description, parish_id, deanery_id, vicariate_id, storage_path, version_number, is_archived, created_at")
      .eq("archdiocese_id", archdioceseId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const archdioceseRows = archdioceseResult.data ?? [];
  const vicariateRows = vicariateResult.data ?? [];
  const deaneryRows = deaneryResult.data ?? [];
  const parishRows = parishResult.data ?? [];

  const allRows = [...archdioceseRows, ...vicariateRows, ...deaneryRows, ...parishRows];
  if (!allRows.length) return [];

  const deaneryIds = [
    ...new Set([...deaneryRows, ...parishRows].map((d) => d.deanery_id).filter(Boolean)),
  ];
  const vicariateIds = [
    ...new Set([...vicariateRows, ...deaneryRows, ...parishRows].map((d) => d.vicariate_id).filter(Boolean)),
  ];
  const parishIds = [...new Set(parishRows.map((d) => d.parish_id).filter(Boolean))];

  const [{ data: deaneries }, { data: vicariates }, { data: parishes }] = await Promise.all([
    deaneryIds.length
      ? supabase.from("deaneries").select("id, name").in("id", deaneryIds)
      : { data: [] },
    vicariateIds.length
      ? supabase.from("vicariates").select("id, name").in("id", vicariateIds)
      : { data: [] },
    parishIds.length
      ? supabase.from("parishes").select("id, name").in("id", parishIds)
      : { data: [] },
  ]);

  const deaneryMap = new Map((deaneries ?? []).map((d) => [d.id, d.name]));
  const vicariateMap = new Map((vicariates ?? []).map((v) => [v.id, v.name]));
  const parishMap = new Map((parishes ?? []).map((p) => [p.id, p.name]));

  const rows: DocumentRow[] = [
    ...archdioceseRows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category ?? null,
      description: d.description ?? null,
      scope: "Archdiocese" as const,
      deaneryName: null,
      vicariateName: null,
      parishName: null,
      bucket: "archdiocese-documents",
      storagePath: d.storage_path,
      versionNumber: d.version_number,
      isArchived: d.is_archived === true,
      createdAt: d.created_at,
    })),
    ...vicariateRows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category ?? null,
      description: d.description ?? null,
      scope: "Vicariate" as const,
      deaneryName: null,
      vicariateName: d.vicariate_id ? vicariateMap.get(d.vicariate_id) ?? null : null,
      parishName: null,
      bucket: "vicariate-documents",
      storagePath: d.storage_path,
      versionNumber: d.version_number,
      isArchived: d.is_archived === true,
      createdAt: d.created_at,
    })),
    ...deaneryRows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category ?? null,
      description: d.description ?? null,
      scope: "Deanery" as const,
      deaneryName: d.deanery_id ? deaneryMap.get(d.deanery_id) ?? null : null,
      vicariateName: d.vicariate_id ? vicariateMap.get(d.vicariate_id) ?? null : null,
      parishName: null,
      bucket: "deanery-documents",
      storagePath: d.storage_path ?? d.file_path ?? "",
      versionNumber: d.version_number,
      isArchived: d.is_archived === true,
      createdAt: d.created_at,
    })),
    ...parishRows.map((d) => ({
      id: d.id,
      title: d.title,
      category: d.category ?? null,
      description: d.description ?? null,
      scope: "Parish" as const,
      deaneryName: d.deanery_id ? deaneryMap.get(d.deanery_id) ?? null : null,
      vicariateName: d.vicariate_id ? vicariateMap.get(d.vicariate_id) ?? null : null,
      parishName: d.parish_id ? parishMap.get(d.parish_id) ?? null : null,
      bucket: "parish-documents",
      storagePath: d.storage_path,
      versionNumber: d.version_number,
      isArchived: d.is_archived === true,
      createdAt: d.created_at,
    })),
  ];

  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 100);
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
              header: "Scope",
              cell: (item) => item.scope,
            },
            {
              header: "Category",
              cell: (item) => item.category ?? "Uncategorized",
            },
            {
              header: "Parish",
              cell: (item) => item.parishName ?? "N/A",
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
            {
              header: "Preview",
              cell: (item) =>
                item.storagePath ? (
                  <DocumentPreviewButton bucket={item.bucket} path={item.storagePath} title={item.title} />
                ) : "Unavailable",
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
