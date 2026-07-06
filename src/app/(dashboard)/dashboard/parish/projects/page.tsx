import { FolderKanban, Hammer } from "lucide-react";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getParishProjects } from "@/features/parish/projects/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "active":
      return "info" as const;
    case "on_hold":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export default async function ParishProjectsPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const projects = await getParishProjects(context.parishId);
  const totalBudget = projects.reduce((sum, project) => sum + (project.budgetAmount ?? 0), 0);

  return (
    <ParishShell
      pathname="/dashboard/parish/projects"
      eyebrow="Parish Projects"
      title="Project oversight"
      subtitle="Track construction, campaigns, and ministry initiatives from the parish side with one consistent operating view."
      actions={<Button href="/dashboard/parish/projects/new">New project</Button>}
    >
      <PageHeader
        title="Parish projects"
        description="Projects now have a live register, cover image upload, and detail views instead of the earlier placeholder surface."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Project count" value={projects.length} helper="Live parish project records" icon={FolderKanban} />
        <StatCard label="Budget tracked" value={currencyFormatter.format(totalBudget)} helper="Visible estimated budget" icon={Hammer} />
      </section>

      {projects.length ? (
        <SimpleTable
          title="Project register"
          description="Open any project to view the full scope, timing, and project cover image."
          rows={projects}
          columns={[
            {
              header: "Project",
              cell: (project) => (
                <Button href={`/dashboard/parish/projects/${project.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">
                  {project.title}
                </Button>
              ),
            },
            {
              header: "Status",
              cell: (project) => <Badge variant={badgeVariantForStatus(project.status)}>{project.status ?? "planned"}</Badge>,
            },
            {
              header: "Category",
              cell: (project) => project.category ?? "-",
            },
            {
              header: "Location",
              cell: (project) => project.location ?? "-",
            },
            {
              header: "Budget",
              cell: (project) => project.budgetAmount != null ? currencyFormatter.format(project.budgetAmount) : "-",
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No parish projects yet"
          description="Create the first parish project to start tracking ministry initiatives, construction work, or campaigns."
          action={<Button href="/dashboard/parish/projects/new">Create first project</Button>}
        />
      )}
    </ParishShell>
  );
}
