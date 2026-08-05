import { CalendarCheck, HandCoins, ReceiptText, TrendingUp, Users } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { PrintButton } from "@/components/dashboard/shared/print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContributionRollupReport, getProjectContributionBreakdowns, getExcessParishes, MONTH_LABELS } from "@/features/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function ArchdioceseContributionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; month?: string }>;
}) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const params = await searchParams;
  const now = new Date();
  const year = Number(params?.year) || now.getUTCFullYear();
  const month = Number(params?.month) || now.getUTCMonth() + 1;
  const [report, projects, excessParishes] = await Promise.all([
    getContributionRollupReport({
      scope: { archdioceseId: context.archdioceseId },
      year,
      month,
    }),
    getProjectContributionBreakdowns({ archdioceseId: context.archdioceseId }),
    getExcessParishes(context.archdioceseId, year),
  ]);

  // How many parishes cleared the current month (paid >= monthly due)
  const currentMonthCleared = report.rows.filter((r) => r.monthPaid >= r.monthlyDue && r.monthlyDue > 0).length;
  const totalParishes = report.rows.length;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/contributions"
      eyebrow="Archdiocese Contributions"
      title={`${MONTH_LABELS[month - 1]} ${year} contribution rollup`}
      subtitle="System-wide Emitemwa, Good Samaritan Day, and project contribution reporting."
      actions={
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <Button href="/dashboard/archdiocese/contributions/new" variant="secondary">Record payment</Button>
          <Button href="/dashboard/archdiocese/projects/new">Create project</Button>
        </div>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Mandatory contribution oversight"
        description="Balances use each parish's vicariate rates for monthly Emitemwa and Good Samaritan Day."
      />

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard
          label="Current month paid"
          value={currencyFormatter.format(report.totals.monthPaid)}
          helper={`${MONTH_LABELS[month - 1]} payments`}
          icon={HandCoins}
        />
        <StatCard
          label="YTD paid"
          value={currencyFormatter.format(report.totals.ytdPaid)}
          helper={`Total paid in ${year}`}
          icon={CalendarCheck}
        />
        <StatCard
          label="General balance"
          value={currencyFormatter.format(report.totals.annualBalance)}
          helper="Outstanding balance"
          icon={ReceiptText}
        />
        <StatCard
          label="Expected total"
          value={currencyFormatter.format(report.totals.annualDue)}
          helper={`Annual due across ${totalParishes} parishes`}
          icon={TrendingUp}
        />
        <StatCard
          label="Month cleared"
          value={`${currentMonthCleared}/${totalParishes}`}
          helper={`Parishes that paid ${MONTH_LABELS[month - 1]}`}
          icon={Users}
        />
      </section>

      <SimpleTable
        title="Parish mandatory contribution rollup"
        rows={report.rows}
        columns={[
          {
            header: "Parish",
            cell: (row) => (
              <div className="space-y-1">
                <div className="font-medium">{row.parishName}</div>
                <div className="text-xs text-on-surface-variant">
                  {row.deaneryName ?? "-"} - {row.vicariateName ?? "-"}
                </div>
              </div>
            ),
          },
          {
            header: "Rate",
            cell: (row) => (
              <div className="space-y-1 text-sm">
                <div>{currencyFormatter.format(row.monthlyDue)} / month</div>
                <div className="text-xs text-on-surface-variant">
                  Annual: {currencyFormatter.format(row.annualDue)}
                </div>
              </div>
            ),
          },
          { header: "Month paid", cell: (row) => currencyFormatter.format(row.monthPaid) },
          { header: "YTD paid", cell: (row) => currencyFormatter.format(row.ytdPaid) },
          { header: "Balance", cell: (row) => currencyFormatter.format(row.annualBalance) },
          {
            header: "Cleared",
            cell: (row) => {
              const monthsCleared = row.monthlyDue > 0
                ? Math.min(12, Math.floor(row.ytdPaid / row.monthlyDue))
                : 0;
              return (
                <Badge variant={monthsCleared === 12 ? "success" : monthsCleared >= 6 ? "info" : "warning"}>
                  {monthsCleared}/12 months
                </Badge>
              );
            },
          },
          {
            header: "Opening",
            cell: (row) =>
              row.hasLegacyOpeningBalance ? (
                <Badge variant="info">
                  {currencyFormatter.format(row.legacyPaid)} paid / {currencyFormatter.format(row.legacyBalance)} bal
                </Badge>
              ) : (
                <Badge>Live only</Badge>
              ),
          },
          {
            header: "Good Samaritan",
            cell: (row) =>
              row.goodSamaritanCleared ? <Badge variant="success">Cleared</Badge> : <Badge variant="warning">Open</Badge>,
          },
        ]}
      />

      {/* Excess parishes section */}
      {excessParishes.length > 0 && (
        <SimpleTable
          title="Parishes exceeding contributions"
          description={`Parishes that have paid more than their combined Emitemwa + Good Samaritan Day target for ${year}.`}
          rows={excessParishes}
          columns={[
            {
              header: "Parish",
              cell: (row) => (
                <div className="space-y-1">
                  <div className="font-medium">{row.parishName}</div>
                  <div className="text-xs text-on-surface-variant">
                    {row.deaneryName ?? "-"} - {row.vicariateName ?? "-"}
                  </div>
                </div>
              ),
            },
            {
              header: "Combined due",
              cell: (row) => currencyFormatter.format(row.combinedDue),
            },
            {
              header: "Total paid",
              cell: (row) => currencyFormatter.format(row.totalPaid),
            },
            {
              header: "Surplus",
              cell: (row) => (
                <Badge variant="success">
                  +{currencyFormatter.format(row.excess)}
                </Badge>
              ),
            },
          ]}
        />
      )}

      <SimpleTable
        title="Project contribution totals"
        description="Totals from scoped projects across the archdiocese."
        rows={projects}
        columns={[
          { header: "Project", cell: (row) => <span className="font-medium">{row.name}</span> },
          { header: "Raised", cell: (row) => currencyFormatter.format(row.totalRaised) },
          { header: "Target", cell: (row) => (row.targetAmount == null ? "-" : currencyFormatter.format(row.targetAmount)) },
          { header: "Parishes paid", cell: (row) => row.byParish.length },
        ]}
      />
    </ArchdioceseShell>
  );
}
