import { Activity, BarChart3, CalendarCheck, CheckCircle2, FileText, HandCoins, RotateCcw } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
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
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Report Center"
        description="Final oversight for reporting workflows across the full administrative hierarchy."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary transition-colors">
          <CardContent className="p-5">
            <CalendarCheck className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold text-on-surface">Monthly Reports</h3>
            <p className="text-sm text-on-surface-variant mt-1">Auto-generated composite reports combining finances, projects, and documents for each month.</p>
            <Button href="/dashboard/archdiocese/reports/monthly" variant="secondary" size="sm" className="mt-3">View monthly reports</Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary transition-colors">
          <CardContent className="p-5">
            <HandCoins className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold text-on-surface">Financial Reports</h3>
            <p className="text-sm text-on-surface-variant mt-1">Comprehensive financial breakdown by vicariate, deanery, contribution type, and monthly trends.</p>
            <Button href="/dashboard/archdiocese/reports/financial" variant="secondary" size="sm" className="mt-3">View financial reports</Button>
          </CardContent>
        </Card>
        <Card className="hover:border-primary transition-colors">
          <CardContent className="p-5">
            <FileText className="h-6 w-6 text-primary mb-3" />
            <h3 className="font-semibold text-on-surface">Parish Reports</h3>
            <p className="text-sm text-on-surface-variant mt-1">Browse, filter, and review all parish-submitted reports across the full hierarchy.</p>
            <Button href="/dashboard/archdiocese/reports/parish-reports" variant="secondary" size="sm" className="mt-3">View parish reports</Button>
          </CardContent>
        </Card>
      </section>

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
