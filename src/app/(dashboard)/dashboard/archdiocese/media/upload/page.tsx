// src/app/(dashboard)/dashboard/archdiocese/media/upload/page.tsx
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MediaUploadForm } from "./upload-form";

async function getParishesForMedia(archdioceseId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("parishes")
    .select("id, name, deanery_id, vicariate_id")
    .eq("archdiocese_id", archdioceseId)
    .eq("status", "active")
    .order("name");
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    deaneryId: p.deanery_id,
    vicariateId: p.vicariate_id,
  }));
}

export default async function MediaUploadPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const parishes = await getParishesForMedia(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/media"
      eyebrow="Archdiocese Media"
      title="Upload media"
      subtitle="Upload project images and media for any parish in the archdiocese."
      actions={
        <Button href="/dashboard/archdiocese/media" variant="secondary">
          Media library
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Upload Media"
        description="Upload an image for a parish project. This will appear in the media library and on the project detail page."
      />
      <MediaUploadForm
        archdioceseId={context.archdioceseId}
        parishes={parishes}
        userId={context.userId}
      />
    </ArchdioceseShell>
  );
}
