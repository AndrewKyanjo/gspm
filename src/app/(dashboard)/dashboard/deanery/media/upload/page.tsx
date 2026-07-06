import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { DeaneryMediaUploadForm } from "@/components/dashboard/deanery/forms/deanery-media-upload-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function DeaneryMediaUploadPage() {
  await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  return (
    <DeaneryShell pathname="/dashboard/deanery/media" eyebrow="Deanery Media" title="Upload media" subtitle="Add compressed deanery images to the shared supervisory gallery." actions={<Button href="/dashboard/deanery/media" variant="secondary">Back to media</Button>}>
      <PageHeader title="Upload deanery media" description="Images are compressed to WebP before storage and grouped under the selected month." />
      <Card>
        <CardContent className="p-5">
          <DeaneryMediaUploadForm />
        </CardContent>
      </Card>
    </DeaneryShell>
  );
}
