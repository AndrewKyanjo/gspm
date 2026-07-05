import { DocumentUploadForm } from "@/components/dashboard/parish/forms/document-upload-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function UploadParishDocumentPage() {
  await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  return (
    <ParishShell
      pathname="/dashboard/parish/documents"
      eyebrow="Parish Records"
      title="Upload document"
      subtitle="Store parish records in Supabase Storage so they can be opened directly from the documents register."
      actions={
        <Button href="/dashboard/parish/documents" variant="secondary">
          Back to documents
        </Button>
      }
    >
      <PageHeader
        title="Upload a parish document"
        description="Each upload is filed into a parish category folder and becomes visible in the document register immediately."
      />

      <Card>
        <CardContent className="p-5">
          <DocumentUploadForm />
        </CardContent>
      </Card>
    </ParishShell>
  );
}
