import { Activity, CheckCircle2, Filter, RotateCcw } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseReportOverview } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

function statusVariant(status: string | null) {
  switch (status) {
    case "approved": return "success" as const;
    case "submitted": return "warning" as const;
    case "returned": return "danger" as const;
    default: return "default" as const;
  }
}

export default async function ParishReportsListPage({ searchParams }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const overview = await getArchdioceseReportOverview(context.archdioceseId);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const statusFilter = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "";

  const filtered = statusFilter
    ? overview.recentReports.filter((r) => r.status === statusFilter)
    : overview.recentReports;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/reports/parish-reports"
      eyebrow="Archdiocese Reports"
      title="Parish reports"
      subtitle="Complete listing of parish reports across the full hierarchy."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Parish Reports"
        description="Browse and filter all parish reports with full hierarchy context."
        actions={<Button href="/dashboard/archdiocese/reports" variant="secondary">Reports dashboard</Button>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Submitted" value={overview.submitted} helper="Awaiting review" icon={Activity} />
        <StatCard label="Approved" value={overview.approved} helper="Completed review" icon={CheckCircle2} />
        <StatCard label="Returned" value={overview.returned} helper="Needs revision" icon={RotateCcw} />
      </section>

      {statusFilter && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-on-surface-variant" />
          <span className="text-sm text-on-surface-variant">Filtered by: <Badge variant={statusVariant(statusFilter)}>{statusFilter}</Badge></span>
          <Button href="/dashboard/archdiocese/reports/parish-reports" size="sm" variant="secondary">Clear</Button>
        </div>
      )}

      <SimpleTable
        title={statusFilter ? `Reports — ${statusFilter}` : "All parish reports"}
        description="Click a row to view details, approve, or return the report."
        rows={filtered}
        columns={[
          {
            header: "Parish",
            cell: (item) => (
              <div className="space-y-1">
                <div className="font-medium">{item.parishName ?? "Unknown parish"}</div>
                <div className="text-xs text-on-surface-variant">{item.deaneryName ?? "?"} • {item.vicariateName ?? "?"}</div>
              </div>
            ),
          },
          {
            header: "Status",
            cell: (item) => (
              <a href={`/dashboard/archdiocese/reports/parish-reports?status=${item.status}`}>
                <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge>
              </a>
            ),
          },
          {
            header: "Summary",
            cell: (item) => item.summary ?? "No summary",
          },
          {
            header: "Updated",
            cell: (item) => item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-",
          },
          {
            header: "Open",
            cell: (item) => (
              <Button href={`/dashboard/archdiocese/reports/parish-reports/${item.id}`} size="sm" variant="secondary">
                View
              </Button>
            ),
          },
        ]}
      />
    </ArchdioceseShell>
  );
}
