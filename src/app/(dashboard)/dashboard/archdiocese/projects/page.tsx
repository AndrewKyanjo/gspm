import { FolderKanban, HandCoins, Target } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContributionProjectOverviews } from "@/features/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function statusVariant(status: string) {
  if (status === "completed") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "planned") return "info" as const;
  return "warning" as const;
}

export default async function ArchdioceseProjectsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const projects = await getContributionProjectOverviews({ archdioceseId: context.archdioceseId });

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/projects"
      eyebrow="Archdiocese Projects"
      title="Scoped project contributions"
      subtitle="Create fundraising, event, and support projects that parishes can contribute toward by scope."
      actions={<Button href="/dashboard/archdiocese/projects/new">Create project</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Contribution projects"
        description="Projects can be archdiocese-wide, vicariate-scoped, deanery-scoped, or limited to selected parishes."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Projects" value={projects.length} helper="Scoped contribution targets" icon={FolderKanban} />
        <StatCard
          label="Raised"
          value={currencyFormatter.format(projects.reduce((total, item) => total + item.totalRaised, 0))}
          helper="All project contributions"
          icon={HandCoins}
        />
        <StatCard
          label="Targets"
          value={currencyFormatter.format(projects.reduce((total, item) => total + (item.targetAmount ?? 0), 0))}
          helper="Declared fundraising goals"
          icon={Target}
        />
      </section>

      {projects.length ? (
        <SimpleTable
          title="Project registry"
          rows={projects}
          columns={[
            {
              header: "Project",
              cell: (item) => (
                <div className="space-y-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-on-surface-variant">{item.scopeLevel}</div>
                </div>
              ),
            },
            { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status}</Badge> },
            { header: "Raised", cell: (item) => currencyFormatter.format(item.totalRaised) },
            { header: "Target", cell: (item) => (item.targetAmount == null ? "-" : currencyFormatter.format(item.targetAmount)) },
            { header: "Start", cell: (item) => (item.startDate ? new Date(item.startDate).toLocaleDateString() : "-") },
          ]}
        />
      ) : (
        <EmptyState
          title="No contribution projects yet"
          description="Create the first scoped project to open project contribution tracking for parishes automatically."
          action={<Button href="/dashboard/archdiocese/projects/new">Create project</Button>}
        />
      )}
    </ArchdioceseShell>
  );
}
