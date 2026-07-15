import { CalendarCheck, HandCoins, ReceiptText } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { PrintButton } from "@/components/dashboard/shared/print-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContributionRollupReport, getProjectContributionBreakdowns, MONTH_LABELS } from "@/features/contributions/queries";
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
  const [report, projects] = await Promise.all([
    getContributionRollupReport({
      scope: { archdioceseId: context.archdioceseId },
      year,
      month,
    }),
    getProjectContributionBreakdowns({ archdioceseId: context.archdioceseId }),
  ]);

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

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Current month paid"
          value={currencyFormatter.format(report.totals.monthPaid)}
          helper={`${MONTH_LABELS[month - 1]} payments from all parishes`}
          icon={HandCoins}
        />
        <StatCard
          label="YTD paid"
          value={currencyFormatter.format(report.totals.ytdPaid)}
          helper={`Total paid in ${year} by all parishes`}
          icon={CalendarCheck}
        />
        <StatCard
          label="General balance"
          value={currencyFormatter.format(report.totals.annualBalance)}
          helper="Outstanding balance for all parishes"
          icon={ReceiptText}
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
