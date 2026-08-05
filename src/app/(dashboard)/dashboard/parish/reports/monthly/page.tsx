import { BarChart3, CalendarCheck, FileText } from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
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

export default async function ParishMonthlyReportsPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  if (!context.archdioceseId || !context.parishId) return null;

  const reports = await getMonthlyReports(context.archdioceseId, "parish", context.parishId);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  return (
    <ParishShell
      pathname="/dashboard/parish/reports"
      eyebrow="Monthly Reports"
      title="Generated monthly reports"
      subtitle="Auto-generated composite reports combining finances, projects, and documents."
      actions={
        <GenerateReportButton
          scopeLevel="parish"
          scopeEntityId={context.parishId}
          year={currentYear}
          month={currentMonth}
          label={`Generate ${MONTH_LABELS[currentMonth - 1]} ${currentYear}`}
        />
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Monthly Reports" description="Each report aggregates your parish's Emitemwa contributions, project involvement, and documents saved." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Reports" value={reports.length} helper="Parish monthly reports" icon={BarChart3} />
        <StatCard label="Latest" value={reports[0] ? `${MONTH_LABELS[reports[0].reportMonth - 1]} ${reports[0].reportYear}` : "None"} helper="Most recent" icon={CalendarCheck} />
        <StatCard label="Published" value={reports.filter((r) => r.status === "published").length} helper="Finalized reports" icon={FileText} />
      </section>

      {reports.length ? (
        <SimpleTable title="Report archive" rows={reports} columns={[
          { header: "Period", cell: (r) => <Button href={`/dashboard/parish/reports/monthly/${r.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">{MONTH_LABELS[r.reportMonth - 1]} {r.reportYear}</Button> },
          { header: "Status", cell: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
          { header: "Emitemwa paid", cell: (r) => currencyFormatter.format(r.totalEmitemwaPaid) },
          { header: "Balance", cell: (r) => currencyFormatter.format(r.totalAnnualBalance) },
          { header: "Projects", cell: (r) => r.activeProjects.toLocaleString() },
          { header: "Documents", cell: (r) => r.totalDocuments.toLocaleString() },
          { header: "Generated", cell: (r) => new Date(r.generatedAt).toLocaleDateString() },
        ]} />
      ) : (
        <EmptyState title="No monthly reports yet" description="Generate your first monthly report." action={
          <GenerateReportButton
            scopeLevel="parish"
            scopeEntityId={context.parishId}
            year={currentYear}
            month={currentMonth}
            label={`Generate ${MONTH_LABELS[currentMonth - 1]} ${currentYear} report`}
            variant="secondary"
          />
        } />
      )}
    </ParishShell>
  );
}
