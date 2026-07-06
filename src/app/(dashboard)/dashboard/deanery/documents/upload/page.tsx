import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { DeaneryDocumentUploadForm } from "@/components/dashboard/deanery/forms/deanery-document-upload-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function DeaneryDocumentUploadPage() {
  await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  return (
    <DeaneryShell
      pathname="/dashboard/deanery/documents"
      eyebrow="Deanery Documents"
      title="Upload document"
      subtitle="Add controlled deanery documents with versioned metadata."
      actions={<Button href="/dashboard/deanery/documents" variant="secondary">Back to documents</Button>}
    >
      <PageHeader title="Upload a deanery document" description="Repeated document titles in the same category will create a higher version number automatically." />
      <Card>
        <CardContent className="p-5">
          <DeaneryDocumentUploadForm />
        </CardContent>
      </Card>
    </DeaneryShell>
  );
}
