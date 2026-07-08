import { FileText, FolderOpen } from "lucide-react";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { getParishDocuments } from "@/features/parish/documents/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function formatBytes(value: number | null) {
  if (!value) {
    return "-";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ParishDocumentsPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const documents = await getParishDocuments(context.parishId);
  const categories = new Set(documents.map((document) => document.category));

  return (
    <ParishShell
      pathname="/dashboard/parish/documents"
      eyebrow="Parish Records"
      title="Documentation"
      subtitle="Policies, meeting minutes, bulletins, and working files in one disciplined parish records view."
      actions={<Button href="/dashboard/parish/documents/upload">Upload document</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Parish documentation"
        description="This library now reads from Supabase Storage, grouped by parish folder and ready for upload-driven record keeping."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Documents" value={documents.length} helper="Files in the parish storage bucket" icon={FileText} />
        <StatCard label="Categories" value={categories.size} helper="Active storage folders" icon={FolderOpen} />
      </section>

      {documents.length ? (
        <SimpleTable
          title="Document register"
          description="Uploaded files are signed on demand so parish users can open them directly from this page."
          rows={documents}
          columns={[
            {
              header: "Name",
              cell: (document) => <span className="font-medium">{document.name}</span>,
            },
            {
              header: "Category",
              cell: (document) => document.category,
            },
            {
              header: "Size",
              cell: (document) => formatBytes(document.size),
            },
            {
              header: "Updated",
              cell: (document) => (document.updatedAt ? new Date(document.updatedAt).toLocaleDateString() : "-"),
            },
            {
              header: "Open",
              cell: (document) =>
                document.downloadUrl ? (
                  <Button href={document.downloadUrl} target="_blank" rel="noreferrer" variant="secondary" size="sm">
                    View file
                  </Button>
                ) : (
                  "Unavailable"
                ),
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No parish documents yet"
          description="Upload meeting minutes, policies, bulletins, and other working files to build the parish document library."
          action={<Button href="/dashboard/parish/documents/upload">Upload first document</Button>}
        />
      )}
    </ParishShell>
  );
}
