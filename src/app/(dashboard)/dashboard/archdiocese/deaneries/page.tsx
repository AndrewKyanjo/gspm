import { Building2, Landmark, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseDeaneryOverviews } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function statusVariant(status: string | null) {
  switch (status) {
    case "active":
      return "success" as const;
    case "inactive":
      return "warning" as const;
    case "archived":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export default async function ArchdioceseDeaneriesPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) {
    return null;
  }

  const deaneries = await getArchdioceseDeaneryOverviews(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/deaneries"
      eyebrow="Archdiocese Deaneries"
      title="Deanery registry"
      subtitle="Deaneries are presented through their Vicariate relationship instead of as direct Archdiocese children."
      searchAction="/dashboard/archdiocese/deaneries"
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Deaneries"
        description="This page intentionally surfaces vicariate context for every deanery so the future Vicariate module can take over naturally."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Deaneries" value={deaneries.length} helper="Administrative clusters in scope" icon={Landmark} />
        <StatCard
          label="Vicariates represented"
          value={new Set(deaneries.map((item) => item.vicariateName).filter(Boolean)).size}
          helper="Parent layer preserved"
          icon={Building2}
        />
        <StatCard
          label="Parishes supervised"
          value={deaneries.reduce((total, item) => total + item.parishCount, 0)}
          helper="Total parish footprint"
          icon={ShieldCheck}
        />
      </section>

      <SimpleTable
        title="Deanery list"
        description="Every deanery row includes its parent vicariate and its downstream parish load."
        rows={deaneries}
        columns={[
          {
            header: "Deanery",
            cell: (item) => (
              <div className="space-y-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-on-surface-variant">{item.code ?? "No code assigned"}</div>
              </div>
            ),
          },
          {
            header: "Vicariate",
            cell: (item) => item.vicariateName ?? "Unassigned",
          },
          {
            header: "Status",
            cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge>,
          },
          {
            header: "Parishes",
            cell: (item) => item.parishCount,
          },
          {
            header: "Latest report",
            cell: (item) => (item.latestReportSubmittedAt ? new Date(item.latestReportSubmittedAt).toLocaleDateString() : "-"),
          },
          {
            header: "Open",
            cell: (item) => (
              <Button href={`/dashboard/archdiocese/deaneries/${item.id}`} size="sm" variant="secondary">
                View
              </Button>
            ),
          },
        ]}
      />
    </ArchdioceseShell>
  );
}
