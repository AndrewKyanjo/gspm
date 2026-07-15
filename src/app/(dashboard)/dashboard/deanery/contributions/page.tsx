import { CalendarCheck, HandCoins, ReceiptText } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { PrintButton } from "@/components/dashboard/shared/print-button";
import { Badge } from "@/components/ui/badge";
import { getContributionRollupReport, getProjectContributionBreakdowns, MONTH_LABELS } from "@/features/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function DeaneryContributionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; month?: string }>;
}) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.archdioceseId || !context.deaneryId) return null;

  const params = await searchParams;
  const now = new Date();
  const year = Number(params?.year) || now.getUTCFullYear();
  const month = Number(params?.month) || now.getUTCMonth() + 1;
  const [report, projects] = await Promise.all([
    getContributionRollupReport({
      scope: { archdioceseId: context.archdioceseId, deaneryId: context.deaneryId },
      year,
      month,
      title: "Deanery monthly contribution report",
    }),
    getProjectContributionBreakdowns({
      archdioceseId: context.archdioceseId,
      deaneryId: context.deaneryId,
    }),
  ]);

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/contributions"
      eyebrow="Deanery Contributions"
      title={`${MONTH_LABELS[month - 1]} ${year} contribution rollup`}
      subtitle="Mandatory and project contribution performance across deanery parishes."
      actions={<PrintButton />}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={report.scopeLabel}
        description="Monthly Emitemwa report with annual balances and Good Samaritan Day clearance."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Month paid" value={currencyFormatter.format(report.totals.monthPaid)} helper="Selected month" icon={HandCoins} />
        <StatCard label="Annual balance" value={currencyFormatter.format(report.totals.annualBalance)} helper="All deanery parishes" icon={ReceiptText} />
        <StatCard
          label="Good Samaritan cleared"
          value={`${report.totals.goodSamaritanClearedCount}/${report.rows.length}`}
          helper="Parish count"
          icon={CalendarCheck}
        />
      </section>

      <SimpleTable
        title="Parish contribution rollup"
        rows={report.rows}
        columns={[
          { header: "Parish", cell: (row) => <span className="font-medium">{row.parishName}</span> },
          { header: "Month paid", cell: (row) => currencyFormatter.format(row.monthPaid) },
          { header: "YTD paid", cell: (row) => currencyFormatter.format(row.ytdPaid) },
          { header: "Balance", cell: (row) => currencyFormatter.format(row.annualBalance) },
          {
            header: "Good Samaritan",
            cell: (row) =>
              row.goodSamaritanCleared ? <Badge variant="success">Cleared</Badge> : <Badge variant="warning">Open</Badge>,
          },
        ]}
      />

      <SimpleTable
        title="Project contribution totals"
        rows={projects}
        columns={[
          { header: "Project", cell: (row) => <span className="font-medium">{row.name}</span> },
          { header: "Raised", cell: (row) => currencyFormatter.format(row.totalRaised) },
          { header: "Target", cell: (row) => (row.targetAmount == null ? "-" : currencyFormatter.format(row.targetAmount)) },
          { header: "Parishes paid", cell: (row) => row.byParish.length },
        ]}
      />
    </DeaneryShell>
  );
}
