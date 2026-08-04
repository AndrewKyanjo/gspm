import { ArchiveRestore, CheckCircle2, FileText, Image } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { getPastDocumentImports } from "@/features/archdiocese/past-documents/service";
import { getPastMediaImports } from "@/features/archdiocese/past-media/service";
import { PastImportWorkspace } from "./past-import-workspace";

const ARCHDIOCESE_IMPORT_ROLES = ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] as const;

type PastDocumentImportPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PastDocumentImportPage({ searchParams }: PastDocumentImportPageProps) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) {
    return null;
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const importType = resolvedSearchParams.type === "media" ? "media" : "documents";

  const [hierarchy, documents, media] = await Promise.all([
    getHierarchyCollections({ archdioceseId: context.archdioceseId }),
    getPastDocumentImports(context.archdioceseId),
    getPastMediaImports(context.archdioceseId),
  ]);

  const readyCount = documents.filter((item) => item.review_status === "ready_for_upload").length;
  const pendingCount = documents.filter((item) =>
    ["uploaded", "scanning", "scanned", "needs_review", "failed"].includes(item.review_status),
  ).length;
  const mediaReadyCount = media.filter((item) => item.review_status === "ready_for_upload").length;
  const mediaPendingCount = media.filter((item) =>
    ["uploaded", "scanning", "scanned", "needs_review", "failed"].includes(item.review_status),
  ).length;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/past-documents/import"
      eyebrow="Historical Records"
      title="Past import"
      subtitle="Stage, scan, review, tag, and publish historical documents and media in controlled batches."
      actions={
        <Button href="/dashboard/archdiocese/documents" variant="secondary">
          <FileText className="h-4 w-4" />
          Document library
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Staged importer"
        description="Choose document or media import, then review AI-generated names, descriptions, dates, and hierarchy tags before publishing."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Documents staged" value={documents.length} helper={`${pendingCount} awaiting review`} icon={FileText} />
        <StatCard label="Media staged" value={media.length} helper={`${mediaPendingCount} awaiting review`} icon={Image} />
        <StatCard label="Ready" value={readyCount + mediaReadyCount} helper="Can be published" icon={CheckCircle2} />
        <StatCard label="Queued total" value={documents.length + media.length} helper="Temporary staging records" icon={ArchiveRestore} />
      </section>

      <PastImportWorkspace
        initialMode={importType}
        documents={documents}
        media={media}
        vicariates={hierarchy.vicariates.map((item) => ({
          id: item.id,
          name: item.name,
          archdioceseId: item.archdiocese_id,
        }))}
        deaneries={hierarchy.deaneries.map((item) => ({
          id: item.id,
          name: item.name,
          archdioceseId: item.archdiocese_id,
          vicariateId: item.vicariate_id,
        }))}
        parishes={hierarchy.parishes.map((item) => ({
          id: item.id,
          name: item.name,
          archdioceseId: item.archdiocese_id,
          vicariateId: item.vicariate_id,
          deaneryId: item.deanery_id,
        }))}
      />
    </ArchdioceseShell>
  );
}
