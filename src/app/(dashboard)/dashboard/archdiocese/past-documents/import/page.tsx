import { ArchiveRestore, CheckCircle2, Clock3, FileText } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { getPastDocumentImports } from "@/features/archdiocese/past-documents/service";
import { PastDocumentImportWorkspace } from "./import-workspace";

const ARCHDIOCESE_IMPORT_ROLES = ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] as const;

export default async function PastDocumentImportPage() {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) {
    return null;
  }

  const [hierarchy, documents] = await Promise.all([
    getHierarchyCollections({ archdioceseId: context.archdioceseId }),
    getPastDocumentImports(context.archdioceseId),
  ]);

  const readyCount = documents.filter((item) => item.review_status === "ready_for_upload").length;
  const pendingCount = documents.filter((item) =>
    ["uploaded", "scanning", "scanned", "needs_review", "failed"].includes(item.review_status),
  ).length;
  const publishedCount = documents.filter((item) => item.review_status === "published").length;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/past-documents/import"
      eyebrow="Historical Records"
      title="Past document import"
      subtitle="Stage, scan, review, tag, and publish historical documents in controlled batches."
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
        description="Review AI-generated names, descriptions, and hierarchy tags before publishing documents into the live library."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Staged" value={documents.length} helper="Total import records" icon={ArchiveRestore} />
        <StatCard label="Pending" value={pendingCount} helper="Awaiting review" icon={Clock3} />
        <StatCard label="Ready" value={readyCount} helper="Can be published" icon={CheckCircle2} />
        <StatCard label="Published" value={publishedCount} helper="Moved to library" icon={FileText} />
      </section>

      <PastDocumentImportWorkspace
        documents={documents}
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
