import { CalendarCheck, CircleDollarSign, HandCoins, ReceiptText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { PrintButton } from "@/components/dashboard/shared/print-button";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { Badge } from "@/components/ui/badge";
import { getContributionRollupReport, getProjectContributionBreakdowns, MONTH_LABELS } from "@/features/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function VicariateContributionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; month?: string }>;
}) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const params = await searchParams;
  const now = new Date();
  const year = Number(params?.year) || now.getUTCFullYear();
  const month = Number(params?.month) || now.getUTCMonth() + 1;
  const [report, projects] = await Promise.all([
    getContributionRollupReport({
      scope: { archdioceseId: context.archdioceseId, vicariateId: context.vicariateId },
      year,
      month,
      title: "Vicariate monthly contribution report",
    }),
    getProjectContributionBreakdowns({
      archdioceseId: context.archdioceseId,
      vicariateId: context.vicariateId,
    }),
  ]);

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/contributions"
      eyebrow="Vicariate Contributions"
      title={`${MONTH_LABELS[month - 1]} ${year} contribution rollup`}
      subtitle="Emitemwa, Good Samaritan Day, and project contribution performance across vicariate parishes."
      actions={<PrintButton />}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={report.scopeLabel}
        description="Roll-up report across every parish assigned to this vicariate."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Month paid" value={currencyFormatter.format(report.totals.monthPaid)} helper="Selected month" icon={HandCoins} />
        <StatCard label="Emitemwa applied" value={currencyFormatter.format(report.totals.ytdPaid)} helper="Capped at annual obligations" icon={ReceiptText} />
        <StatCard
          label="Good Samaritan cleared"
          value={`${report.totals.goodSamaritanClearedCount}/${report.rows.length}`}
          helper="Parish count"
          icon={CalendarCheck}
        />
        <StatCard label="Parish surplus" value={currencyFormatter.format(report.totals.surplus)} helper="After both obligations" icon={CircleDollarSign} />
      </section>

      <SimpleTable
        title="Parish contribution rollup"
        rows={report.rows}
        columns={[
          {
            header: "Parish",
            cell: (row) => (
              <div className="space-y-1">
                <div className="font-medium">{row.parishName}</div>
                <div className="text-xs text-on-surface-variant">{row.deaneryName ?? "-"}</div>
              </div>
            ),
          },
          { header: "Month paid", cell: (row) => currencyFormatter.format(row.monthPaid) },
          { header: "Total recorded", cell: (row) => currencyFormatter.format(row.totalRecorded) },
          { header: "Emitemwa applied", cell: (row) => currencyFormatter.format(row.ytdPaid) },
          { header: "Balance", cell: (row) => currencyFormatter.format(row.annualBalance) },
          {
            header: "Good Samaritan",
            cell: (row) =>
              <div className="space-y-1">
                <Badge variant={row.goodSamaritanCleared ? "success" : "warning"}>
                  {row.goodSamaritanCleared ? "Cleared" : "Open"}
                </Badge>
                <div className="text-xs text-on-surface-variant">
                  {currencyFormatter.format(row.goodSamaritanPaid)} / {currencyFormatter.format(row.goodSamaritanDue)}
                </div>
              </div>,
          },
          { header: "Surplus", cell: (row) => row.surplus > 0 ? <Badge variant="success">+{currencyFormatter.format(row.surplus)}</Badge> : "-" },
          { header: "Overall", cell: (row) => row.annualBalance === 0 && row.goodSamaritanCleared ? <Badge variant="success">Cleared</Badge> : <Badge variant="warning">Outstanding</Badge> },
        ]}
      />

      <SimpleTable
        title="Project contribution totals"
        description="Project payments recorded by parishes in this vicariate."
        rows={projects}
        columns={[
          { header: "Project", cell: (row) => <span className="font-medium">{row.name}</span> },
          { header: "Raised", cell: (row) => currencyFormatter.format(row.totalRaised) },
          { header: "Target", cell: (row) => (row.targetAmount == null ? "-" : currencyFormatter.format(row.targetAmount)) },
          { header: "Parishes", cell: (row) => row.byParish.length },
        ]}
      />
    </VicariateShell>
  );
}
