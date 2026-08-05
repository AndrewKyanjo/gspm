import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function VicariateDocumentUploadPage() {
  await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  return (
    <VicariateShell
      pathname="/dashboard/vicariate/documents"
      eyebrow="Vicariate Documents"
      title="Upload document"
      subtitle="Add controlled vicariate documents with metadata."
      actions={<Button href="/dashboard/vicariate/documents" variant="secondary">Back to documents</Button>}
    >
      <PageHeader title="Upload a vicariate document" description="Upload documents to the vicariate repository. Supported formats include PDF, Word, Excel, and images." />
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-on-surface-variant">Document upload is available through the archdiocese document management workspace. Visit the archdiocese documents section to upload and assign documents to this vicariate.</p>
          <div className="mt-4">
            <Button href="/dashboard/archdiocese/documents/upload" variant="secondary">Go to archdiocese documents</Button>
          </div>
        </CardContent>
      </Card>
    </VicariateShell>
  );
}
