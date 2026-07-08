import { Archive, FileText } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { getDeaneryDocuments } from "@/features/deanery/documents/queries";
import { setDeaneryDocumentArchived } from "@/features/deanery/documents/actions";
import { requireAuth } from "@/lib/auth/requireAuth";

type DeaneryDocumentsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DeaneryDocumentsPage({ searchParams }: DeaneryDocumentsPageProps) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;
  const documents = await getDeaneryDocuments(context.deaneryId, query);
  const activeDocuments = documents.filter((document) => !document.isArchived);
  const archivedDocuments = documents.filter((document) => document.isArchived);

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/documents"
      eyebrow="Deanery Documents"
      title="Document repository"
      subtitle="Centralized deanery documents with versions, categories, archiving, and secure downloads."
      searchQuery={query}
      actions={<Button href="/dashboard/deanery/documents/upload">Upload document</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Deanery documents"
        description="The deanery document repository supports categorized uploads, version history through repeated titles, and archive toggles."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Active documents" value={activeDocuments.length} helper="Current repository items" icon={FileText} />
        <StatCard label="Archived documents" value={archivedDocuments.length} helper="Historical or superseded files" icon={Archive} />
      </section>

      {documents.length ? (
        <SimpleTable
          title="Document register"
          rows={documents}
          columns={[
            { header: "Title", cell: (document) => document.title },
            { header: "Category", cell: (document) => document.category },
            { header: "Version", cell: (document) => `v${document.versionNumber}` },
            { header: "Uploaded by", cell: (document) => document.uploadedByName ?? "-" },
            { header: "Archive", cell: (document) => (document.isArchived ? "Archived" : "Active") },
            {
              header: "Actions",
              cell: (document) => (
                <div className="flex flex-wrap gap-2">
                  {document.downloadUrl ? (
                    <Button href={document.downloadUrl} size="sm" variant="secondary" target="_blank" rel="noreferrer">
                      Download
                    </Button>
                  ) : null}
                  <form action={setDeaneryDocumentArchived}>
                    <input type="hidden" name="documentId" value={document.id} />
                    <input type="hidden" name="archived" value={document.isArchived ? "false" : "true"} />
                    <Button type="submit" size="sm" variant="secondary">
                      {document.isArchived ? "Restore" : "Archive"}
                    </Button>
                  </form>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState title="No deanery documents yet" description="Upload meeting minutes, policies, finance documents, and approval records to start the repository." action={<Button href="/dashboard/deanery/documents/upload">Upload first document</Button>} />
      )}
    </DeaneryShell>
  );
}
