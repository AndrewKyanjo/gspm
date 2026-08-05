import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function VicariateMediaUploadPage() {
  await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  return (
    <VicariateShell
      pathname="/dashboard/vicariate/media"
      eyebrow="Vicariate Media"
      title="Upload media"
      subtitle="Add images to the vicariate gallery."
      actions={<Button href="/dashboard/vicariate/media" variant="secondary">Back to media</Button>}
    >
      <PageHeader title="Upload vicariate media" description="Media upload is available through the archdiocese media import workspace. Visit the archdiocese past documents section to import and publish media to this vicariate." />
      <Card>
        <CardContent className="p-5">
          <p className="text-sm text-on-surface-variant">The media import system supports bulk upload, AI-assisted classification, and publishing to the appropriate hierarchy scope. Use the archdiocese workspace to manage media for the entire archdiocese including this vicariate.</p>
          <div className="mt-4">
            <Button href="/dashboard/archdiocese/past-documents/import" variant="secondary">Go to media import workspace</Button>
          </div>
        </CardContent>
      </Card>
    </VicariateShell>
  );
}
