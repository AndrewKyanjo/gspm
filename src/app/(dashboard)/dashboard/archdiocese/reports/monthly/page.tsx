import { BarChart3, CalendarCheck, FileText, FolderKanban } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMonthlyReports } from "@/features/reports/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { GenerateReportButton } from "@/components/dashboard/shared/generate-report-button";
import { MONTH_LABELS } from "@/features/contributions/queries";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function statusVariant(status: string) {
  switch (status) {
    case "published": return "success" as const;
    case "reviewed": return "info" as const;
    default: return "default" as const;
  }
}

export default async function ArchdioceseMonthlyReportsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const reports = await getMonthlyReports(context.archdioceseId, "archdiocese", context.archdioceseId);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Monthly Reports"
      title="Generated monthly reports"
      subtitle="Auto-generated composite reports combining finances, projects, and documents for each month."
      actions={
        <GenerateReportButton
          scopeLevel="archdiocese"
          scopeEntityId={context.archdioceseId}
          year={currentYear}
          month={currentMonth}
          label={`Generate ${MONTH_LABELS[currentMonth - 1]} ${currentYear}`}
        />
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Monthly Reports"
        description="Each monthly report aggregates finances (Emitemwa contributions, arrears, Good Samaritan Day), project involvement, and documents saved that month."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Reports generated" value={reports.length} helper="Archdiocese monthly reports" icon={BarChart3} />
        <StatCard label="Latest month" value={reports[0] ? `${MONTH_LABELS[reports[0].reportMonth - 1]} ${reports[0].reportYear}` : "None"} helper="Most recent generated report" icon={CalendarCheck} />
        <StatCard label="Published" value={reports.filter((r) => r.status === "published").length} helper="Finalized reports" icon={FileText} />
      </section>

      {reports.length ? (
        <SimpleTable
          title="Report archive"
          rows={reports}
          columns={[
            { header: "Period", cell: (r) => <Button href={`/dashboard/archdiocese/reports/monthly/${r.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">{MONTH_LABELS[r.reportMonth - 1]} {r.reportYear}</Button> },
            { header: "Status", cell: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
            { header: "Emitemwa paid", cell: (r) => currencyFormatter.format(r.totalEmitemwaPaid) },
            { header: "Balance", cell: (r) => currencyFormatter.format(r.totalAnnualBalance) },
            { header: "Projects", cell: (r) => r.activeProjects.toLocaleString() },
            { header: "Documents", cell: (r) => r.totalDocuments.toLocaleString() },
            { header: "Generated", cell: (r) => new Date(r.generatedAt).toLocaleDateString() },
          ]}
        />
      ) : (
        <EmptyState
          title="No monthly reports yet"
          description="Generate the first monthly report to see a composite view of finances, projects, and documents."
          action={
            <GenerateReportButton
              scopeLevel="archdiocese"
              scopeEntityId={context.archdioceseId}
              year={currentYear}
              month={currentMonth}
              label={`Generate ${MONTH_LABELS[currentMonth - 1]} ${currentYear} report`}
              variant="secondary"
            />
          }
        />
      )}
    </ArchdioceseShell>
  );
}
