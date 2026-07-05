import { BarChart3, FileClock, Send } from "lucide-react";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { ReportDetailPanel } from "@/components/dashboard/parish/shared/report-detail-panel";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getParishReportDetail, getParishReports } from "@/features/parish/reports/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "submitted":
      return "info" as const;
    case "draft":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

type ParishReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParishReportsPage({ searchParams }: ParishReportsPageProps) {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedReportId = typeof resolvedSearchParams?.report === "string" ? resolvedSearchParams.report : null;

  const [reports, selectedReport] = await Promise.all([
    getParishReports(context.parishId),
    selectedReportId ? getParishReportDetail(context.parishId, selectedReportId) : Promise.resolve(null),
  ]);

  const draftCount = reports.filter((report) => report.status === "draft").length;
  const submittedCount = reports.filter((report) => report.status === "submitted").length;

  return (
    <ParishShell
      pathname="/dashboard/parish/reports"
      eyebrow="Parish Reports"
      title="Reporting workspace"
      subtitle="Monthly reports, audit-ready status tracking, and reporting-cycle visibility for parish teams."
      actions={<Button href="/dashboard/parish/reports/new">New report</Button>}
    >
      <PageHeader
        title="Parish reports"
        description="Monthly reporting stays in one place here, with live Supabase records and an inline detail panel for quick review."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Report count" value={reports.length} helper="All parish report records" icon={BarChart3} />
        <StatCard label="Draft backlog" value={draftCount} helper="Items needing parish completion" icon={FileClock} />
        <StatCard label="Submitted" value={submittedCount} helper="Awaiting archdiocese review" icon={Send} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          {reports.length ? (
            <SimpleTable
              title="Report register"
              description="Select any report to open its side panel and review the full parish submission."
              rows={reports}
              columns={[
                {
                  header: "Report",
                  cell: (report) => (
                    <Button
                      href={`/dashboard/parish/reports?report=${report.id}`}
                      variant="ghost"
                      className="h-auto px-0 py-0 font-medium"
                    >
                      {report.id.slice(0, 8)}
                    </Button>
                  ),
                },
                {
                  header: "Status",
                  cell: (report) => (
                    <Badge variant={badgeVariantForStatus(report.status)}>{report.status ?? "unknown"}</Badge>
                  ),
                },
                {
                  header: "Period",
                  cell: (report) => report.reportingPeriodLabel ?? "Unlinked",
                },
                {
                  header: "Created",
                  cell: (report) => (report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "-"),
                },
                {
                  header: "Updated",
                  cell: (report) => (report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : "-"),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="No parish reports yet"
              description="Create the first report for this parish and it will appear here immediately."
              action={<Button href="/dashboard/parish/reports/new">Create report</Button>}
            />
          )}
        </div>

        {selectedReport ? (
          <ReportDetailPanel report={selectedReport} />
        ) : (
          <EmptyState
            title="Open a report"
            description="Choose a report from the register to view its totals, notes, and review status in the side panel."
            action={<Button href="/dashboard/parish/reports/new">New report</Button>}
          />
        )}
      </section>
    </ParishShell>
  );
}
