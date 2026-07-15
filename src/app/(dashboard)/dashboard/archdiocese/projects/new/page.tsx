// src/app/(dashboard)/dashboard/archdiocese/projects/new/page.tsx
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { requireAuth } from "@/lib/auth/requireAuth";
import { CreateProjectForm } from "./create-form";

export default async function CreateProjectPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const hierarchy = await getHierarchyCollections({ archdioceseId: context.archdioceseId });

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/projects"
      eyebrow="Archdiocese Projects"
      title="Create project"
      subtitle="Create a scoped contribution project across the archdiocese, a vicariate, a deanery, or selected parishes."
      actions={
        <Button href="/dashboard/archdiocese/projects" variant="secondary">
          All projects
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="New scoped project"
        description="Once created, parishes inside the selected scope can immediately record contributions toward it."
      />
      <CreateProjectForm
        vicariates={hierarchy.vicariates.map((vicariate) => ({ id: vicariate.id, name: vicariate.name }))}
        deaneries={hierarchy.deaneries.map((deanery) => ({ id: deanery.id, name: deanery.name, vicariateId: deanery.vicariate_id }))}
        parishes={hierarchy.parishes.map((parish) => ({
          id: parish.id,
          name: parish.name,
          vicariateId: parish.vicariate_id,
          deaneryId: parish.deanery_id,
        }))}
      />
    </ArchdioceseShell>
  );
}
