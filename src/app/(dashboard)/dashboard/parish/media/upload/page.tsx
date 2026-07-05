import { MediaUploadForm } from "@/components/dashboard/parish/forms/media-upload-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function UploadParishMediaPage() {
  await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  return (
    <ParishShell
      pathname="/dashboard/parish/media"
      eyebrow="Parish Media"
      title="Upload media"
      subtitle="Compress parish images before they are stored so the gallery stays lightweight and affordable."
      actions={
        <Button href="/dashboard/parish/media" variant="secondary">
          Back to media
        </Button>
      }
    >
      <PageHeader
        title="Upload parish images"
        description="Images are converted to compressed WebP files, then grouped automatically under the month they belong to."
      />

      <Card>
        <CardContent className="p-5">
          <MediaUploadForm />
        </CardContent>
      </Card>
    </ParishShell>
  );
}
