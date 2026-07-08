import { FolderKanban, HandCoins, Landmark } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseProjectOverviews } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function statusVariant(status: string | null) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "planned":
      return "info" as const;
    case "delayed":
      return "danger" as const;
    default:
      return "warning" as const;
  }
}

export default async function ArchdioceseProjectsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) {
    return null;
  }

  const projects = await getArchdioceseProjectOverviews(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/projects"
      eyebrow="Archdiocese Projects"
      title="Projects oversight"
      subtitle="Monitor initiatives across the full hierarchy with parish, deanery, and vicariate context."
      actions={<Button href="/dashboard/archdiocese/projects/new">Create project</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Projects"
        description="Project rollups stay attached to their full hierarchy path so the future Vicariate dashboard can take a scoped slice of the same data."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Projects" value={projects.length} helper="Latest tracked initiatives" icon={FolderKanban} />
        <StatCard
          label="Budget tracked"
          value={currencyFormatter.format(projects.reduce((total, item) => total + (item.budgetAmount ?? 0), 0))}
          helper="Visible across recent records"
          icon={HandCoins}
        />
        <StatCard
          label="Deaneries involved"
          value={new Set(projects.map((item) => item.deaneryName).filter(Boolean)).size}
          helper="Operational spread"
          icon={Landmark}
        />
      </section>

      {projects.length ? (
        <SimpleTable
          title="Recent project updates"
          rows={projects}
          columns={[
            {
              header: "Project",
              cell: (item) => (
                <div className="space-y-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-on-surface-variant">
                    {item.parishName ?? "Unknown parish"} • {item.deaneryName ?? "Unknown deanery"} •{" "}
                    {item.vicariateName ?? "Unknown vicariate"}
                  </div>
                </div>
              ),
            },
            {
              header: "Status",
              cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge>,
            },
            {
              header: "Budget",
              cell: (item) => (item.budgetAmount != null ? currencyFormatter.format(item.budgetAmount) : "-"),
            },
            {
              header: "Raised",
              cell: (item) => (item.amountRaised != null ? currencyFormatter.format(item.amountRaised) : "-"),
            },
            {
              header: "Updated",
              cell: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-"),
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No project records yet"
          description="Once parishes start logging projects, Archdiocese leadership will see them here with the full hierarchy path."
        />
      )}
    </ArchdioceseShell>
  );
}
