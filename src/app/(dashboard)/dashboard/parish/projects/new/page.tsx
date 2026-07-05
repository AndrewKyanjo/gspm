import { ProjectForm } from "@/components/dashboard/parish/forms/project-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function NewParishProjectPage() {
  await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  return (
    <ParishShell
      pathname="/dashboard/parish/projects"
      eyebrow="Parish Projects"
      title="New project"
      subtitle="Capture project scope, timing, budget, and an optional cover image for parish tracking."
      actions={
        <Button href="/dashboard/parish/projects" variant="secondary">
          Back to projects
        </Button>
      }
    >
      <PageHeader
        title="Create parish project"
        description="Use this form to register a new construction effort, outreach initiative, campaign, or other parish project."
      />

      <Card>
        <CardContent className="p-5">
          <ProjectForm />
        </CardContent>
      </Card>
    </ParishShell>
  );
}
