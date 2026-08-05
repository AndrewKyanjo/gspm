import { FolderKanban, Landmark } from "lucide-react";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVicariateProjects } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "completed": return "success" as const;
    case "active": return "info" as const;
    case "on_hold": return "warning" as const;
    default: return "default" as const;
  }
}

export default async function VicariateProjectsPage() {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const projects = await getVicariateProjects(context.archdioceseId, context.vicariateId);
  const totalBudget = projects.reduce((sum, p) => sum + (p.budgetAmount ?? 0), 0);

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/projects"
      eyebrow="Vicariate Projects"
      title="Projects overview"
      subtitle="Aggregate parish project progress across the entire vicariate."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Projects" description="Vicariate-wide visibility into parish project status, budgets, and deadlines." />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Projects tracked" value={projects.length} helper="Across all parishes in scope" icon={FolderKanban} />
        <StatCard label="Budget total" value={currencyFormatter.format(totalBudget)} helper="Visible planned budget" icon={Landmark} />
      </section>

      {projects.length ? (
        <SimpleTable
          title="Project register"
          rows={projects}
          columns={[
            { header: "Project", cell: (p) => <Button href={`/dashboard/vicariate/projects/${p.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">{p.title}</Button> },
            { header: "Parish", cell: (p) => p.parishName ?? "-" },
            { header: "Deanery", cell: (p) => p.deaneryName ?? "-" },
            { header: "Status", cell: (p) => <Badge variant={badgeVariantForStatus(p.status)}>{p.status ?? "planned"}</Badge> },
            { header: "Budget", cell: (p) => (p.budgetAmount != null ? currencyFormatter.format(p.budgetAmount) : "-") },
            { header: "Raised", cell: (p) => (p.amountRaised != null ? currencyFormatter.format(p.amountRaised) : "-") },
          ]}
        />
      ) : (
        <EmptyState title="No parish projects yet" description="Once parishes create project records, the vicariate view will aggregate them here." />
      )}
    </VicariateShell>
  );
}
