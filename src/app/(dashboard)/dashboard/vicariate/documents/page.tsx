import { Archive, FileText } from "lucide-react";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { getVicariateDocuments } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function VicariateDocumentsPage({ searchParams }: Props) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.vicariateId) return null;

  const resolved = searchParams ? await searchParams : undefined;
  const query = typeof resolved?.q === "string" ? resolved.q : undefined;
  const documents = await getVicariateDocuments(context.vicariateId, query);
  const activeDocuments = documents.filter((d) => !d.isArchived);
  const archivedDocuments = documents.filter((d) => d.isArchived);

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/documents"
      eyebrow="Vicariate Documents"
      title="Document repository"
      subtitle="Centralized vicariate documents with categories and version tracking."
      searchQuery={query}
      actions={<Button href="/dashboard/vicariate/documents/upload">Upload document</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Vicariate documents" description="The vicariate document repository supports categorized uploads for policies, reports, and records." />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Active documents" value={activeDocuments.length} helper="Current repository items" icon={FileText} />
        <StatCard label="Archived documents" value={archivedDocuments.length} helper="Historical or superseded files" icon={Archive} />
      </section>

      {documents.length ? (
        <SimpleTable
          title="Document register"
          rows={documents}
          columns={[
            { header: "Title", cell: (d) => d.title },
            { header: "Category", cell: (d) => d.category },
            { header: "Version", cell: (d) => `v${d.versionNumber}` },
            { header: "Uploaded", cell: (d) => d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "-" },
            { header: "Status", cell: (d) => d.isArchived ? "Archived" : "Active" },
          ]}
        />
      ) : (
        <EmptyState title="No vicariate documents yet" description="Upload policies, reports, and records to start the vicariate repository." action={<Button href="/dashboard/vicariate/documents/upload">Upload first document</Button>} />
      )}
    </VicariateShell>
  );
}
