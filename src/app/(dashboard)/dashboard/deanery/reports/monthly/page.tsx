import { BarChart3, CalendarCheck, FileText } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
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

export default async function DeaneryMonthlyReportsPage() {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.archdioceseId || !context.deaneryId) return null;

  const reports = await getMonthlyReports(context.archdioceseId, "deanery", context.deaneryId);
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/reports"
      eyebrow="Monthly Reports"
      title="Generated monthly reports"
      subtitle="Auto-generated composite reports for this deanery combining finances, projects, and documents."
      actions={
        <GenerateReportButton
          scopeLevel="deanery"
          scopeEntityId={context.deaneryId}
          year={currentYear}
          month={currentMonth}
          label={`Generate ${MONTH_LABELS[currentMonth - 1]} ${currentYear}`}
        />
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Monthly Reports" description="Each report aggregates Emitemwa contributions, arrears, project involvement, and documents saved this month." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Reports" value={reports.length} helper="Deanery monthly reports" icon={BarChart3} />
        <StatCard label="Latest" value={reports[0] ? `${MONTH_LABELS[reports[0].reportMonth - 1]} ${reports[0].reportYear}` : "None"} helper="Most recent" icon={CalendarCheck} />
        <StatCard label="Published" value={reports.filter((r) => r.status === "published").length} helper="Finalized reports" icon={FileText} />
      </section>

      {reports.length ? (
        <SimpleTable
          title="Report archive"
          rows={reports}
          columns={[
            { header: "Period", cell: (r) => <Button href={`/dashboard/deanery/reports/monthly/${r.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">{MONTH_LABELS[r.reportMonth - 1]} {r.reportYear}</Button> },
            { header: "Status", cell: (r) => <Badge variant={statusVariant(r.status)}>{r.status}</Badge> },
            { header: "Emitemwa paid", cell: (r) => currencyFormatter.format(r.totalEmitemwaPaid) },
            { header: "Balance", cell: (r) => currencyFormatter.format(r.totalAnnualBalance) },
            { header: "Projects", cell: (r) => r.activeProjects.toLocaleString() },
            { header: "Documents", cell: (r) => r.totalDocuments.toLocaleString() },
            { header: "Generated", cell: (r) => new Date(r.generatedAt).toLocaleDateString() },
          ]}
        />
      ) : (
        <EmptyState title="No monthly reports yet" description="Generate the first monthly report for this deanery." action={
          <GenerateReportButton
            scopeLevel="deanery"
            scopeEntityId={context.deaneryId}
            year={currentYear}
            month={currentMonth}
            label={`Generate ${MONTH_LABELS[currentMonth - 1]} ${currentYear} report`}
            variant="secondary"
          />
        } />
      )}
    </DeaneryShell>
  );
}
