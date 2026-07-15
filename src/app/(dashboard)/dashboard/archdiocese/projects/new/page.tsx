// src/app/(dashboard)/dashboard/archdiocese/projects/new/page.tsx
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Button } from "@/components/ui/button";
import { getArchdioceseParishOverviews } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { CreateProjectForm } from "./create-form";

export default async function CreateProjectPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const parishes = await getArchdioceseParishOverviews(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/projects"
      eyebrow="Archdiocese Projects"
      title="Create project"
      subtitle="Create a project on behalf of any parish in the archdiocese."
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
        title="New Project"
        description="Create a project for any parish. This entry will be marked as proxy-entered by the Archdiocese."
      />
      <CreateProjectForm
        archdioceseId={context.archdioceseId}
        parishes={parishes}
      />
    </ArchdioceseShell>
  );
}
