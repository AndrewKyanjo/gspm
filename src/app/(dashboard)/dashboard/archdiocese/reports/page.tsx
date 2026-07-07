import { Activity, CheckCircle2, RotateCcw } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { getArchdioceseReportOverview } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function statusVariant(status: string | null) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "submitted":
      return "warning" as const;
    case "returned":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export default async function ArchdioceseReportsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) {
    return null;
  }

  const overview = await getArchdioceseReportOverview(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Archdiocese Reports"
      title="Reports command center"
      subtitle="Track submissions and approvals across vicariates, deaneries, and parishes."
    >
      <PageHeader
        title="Reports"
        description="Final oversight for reporting workflows across the full administrative hierarchy."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Submitted" value={overview.submitted} helper="Waiting in the pipeline" icon={Activity} />
        <StatCard label="Approved" value={overview.approved} helper="Completed review cycles" icon={CheckCircle2} />
        <StatCard label="Returned" value={overview.returned} helper="Needs correction upstream" icon={RotateCcw} />
      </section>

      <SimpleTable
        title="Recent parish reports"
        description="The latest report records now surfaced with both deanery and vicariate context."
        rows={overview.recentReports}
        columns={[
          {
            header: "Parish",
            cell: (item) => (
              <div className="space-y-1">
                <div className="font-medium">{item.parishName ?? "Unknown parish"}</div>
                <div className="text-xs text-on-surface-variant">
                  {item.deaneryName ?? "Deanery unavailable"} • {item.vicariateName ?? "Vicariate unavailable"}
                </div>
              </div>
            ),
          },
          {
            header: "Status",
            cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge>,
          },
          {
            header: "Summary",
            cell: (item) => item.summary ?? "No summary added",
          },
          {
            header: "Updated",
            cell: (item) => (item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-"),
          },
        ]}
      />
    </ArchdioceseShell>
  );
}
