// src/app/(dashboard)/dashboard/archdiocese/documents/upload/page.tsx
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DocumentUploadForm } from "./upload-form";

async function getHierarchyForUpload(archdioceseId: string) {
  const supabase = createAdminClient();
  const [vicariatesResult, deaneriesResult] = await Promise.all([
    supabase.from("vicariates").select("id, name").eq("archdiocese_id", archdioceseId).eq("status", "active").order("name"),
    supabase.from("deaneries").select("id, name, vicariate_id").eq("archdiocese_id", archdioceseId).eq("status", "active").order("name"),
  ]);

  return {
    vicariates: (vicariatesResult.data ?? []).map((v) => ({ id: v.id, name: v.name })),
    deaneries: (deaneriesResult.data ?? []).map((d) => ({ id: d.id, name: d.name, vicariateId: d.vicariate_id })),
  };
}

export default async function DocumentUploadPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const hierarchy = await getHierarchyForUpload(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/documents"
      eyebrow="Archdiocese Documents"
      title="Upload document"
      subtitle="Upload documents scoped to a deanery for archdiocese-wide visibility."
      actions={
        <Button href="/dashboard/archdiocese/documents" variant="secondary">
          Document library
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Upload Document"
        description="Upload a document to the archdiocese document library. Documents are associated with a deanery for proper hierarchy scoping."
      />
      <DocumentUploadForm
        archdioceseId={context.archdioceseId}
        vicariates={hierarchy.vicariates}
        deaneries={hierarchy.deaneries}
        userId={context.userId}
      />
    </ArchdioceseShell>
  );
}
