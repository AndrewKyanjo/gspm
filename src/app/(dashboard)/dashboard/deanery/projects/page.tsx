import { FolderKanban, Landmark } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { BarListChart } from "@/components/dashboard/deanery/charts/bar-list-chart";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeaneryProjects } from "@/features/deanery/projects/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

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

export default async function DeaneryProjectsPage() {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const projects = await getDeaneryProjects(context.deaneryId);
  const totalBudget = projects.reduce((sum, project) => sum + (project.budgetAmount ?? 0), 0);

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/projects"
      eyebrow="Deanery Projects"
      title="Projects overview"
      subtitle="Aggregate parish project progress, funding, deadlines, and responsibility."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Projects" description="Deanery-wide visibility into parish project status, budgets, and upcoming deadlines." />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Projects tracked" value={projects.length} helper="Across all parishes in scope" icon={FolderKanban} />
        <StatCard label="Budget total" value={currencyFormatter.format(totalBudget)} helper="Visible planned budget" icon={Landmark} />
      </section>

      <BarListChart title="Project funding by parish" description="Compare amount raised across parish projects." items={projects.map((project) => ({ label: `${project.parishName ?? "Parish"} • ${project.title}`, value: project.amountRaised ?? 0 })).slice(0, 8)} formatter={(value) => currencyFormatter.format(value)} />

      {projects.length ? (
        <SimpleTable
          title="Project register"
          rows={projects}
          columns={[
            { header: "Project", cell: (project) => <Button href={`/dashboard/deanery/projects/${project.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">{project.title}</Button> },
            { header: "Parish", cell: (project) => project.parishName ?? "-" },
            { header: "Status", cell: (project) => <Badge variant={badgeVariantForStatus(project.status)}>{project.status ?? "planned"}</Badge> },
            { header: "Budget", cell: (project) => (project.budgetAmount != null ? currencyFormatter.format(project.budgetAmount) : "-") },
            { header: "Raised", cell: (project) => (project.amountRaised != null ? currencyFormatter.format(project.amountRaised) : "-") },
          ]}
        />
      ) : (
        <EmptyState title="No parish projects yet" description="Once parishes create project records, the deanery view will aggregate them here." />
      )}
    </DeaneryShell>
  );
}
