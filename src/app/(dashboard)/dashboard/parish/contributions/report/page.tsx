import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/dashboard/shared/print-button";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { getContributionRollupReport, MONTH_LABELS } from "@/features/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function ParishContributionReportPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string; month?: string }>;
}) {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  if (!context.parishId) return null;

  const params = await searchParams;
  const now = new Date();
  const year = Number(params?.year) || now.getUTCFullYear();
  const month = Number(params?.month) || now.getUTCMonth() + 1;
  const report = await getContributionRollupReport({
    scope: {
      archdioceseId: context.archdioceseId,
      parishId: context.parishId,
    },
    year,
    month,
  });

  return (
    <ParishShell
      pathname="/dashboard/parish/contributions"
      eyebrow="Printable Report"
      title={`${MONTH_LABELS[month - 1]} ${year} contribution report`}
      subtitle="Monthly payments, year-to-date totals, balances, and Good Samaritan Day clearance."
      actions={
        <div className="flex flex-wrap gap-2 print:hidden">
          <PrintButton />
          <Button href="/dashboard/parish/contributions" variant="secondary">
            Back
          </Button>
        </div>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={report.scopeLabel}
        description={`${report.title} for ${MONTH_LABELS[month - 1]} ${year}.`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm text-on-surface-variant">Month paid</p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{currencyFormatter.format(report.totals.monthPaid)}</p>
        </div>
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm text-on-surface-variant">YTD paid</p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{currencyFormatter.format(report.totals.ytdPaid)}</p>
        </div>
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm text-on-surface-variant">Annual balance</p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">{currencyFormatter.format(report.totals.annualBalance)}</p>
        </div>
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-sm text-on-surface-variant">Good Samaritan cleared</p>
          <p className="mt-2 text-2xl font-semibold text-on-surface">
            {report.totals.goodSamaritanClearedCount}/{report.rows.length}
          </p>
        </div>
      </section>

      <SimpleTable
        title="Report rows"
        rows={report.rows}
        columns={[
          { header: "Parish", cell: (row) => <span className="font-medium">{row.parishName}</span> },
          { header: "Month paid", cell: (row) => currencyFormatter.format(row.monthPaid) },
          { header: "YTD paid", cell: (row) => currencyFormatter.format(row.ytdPaid) },
          { header: "Balance", cell: (row) => currencyFormatter.format(row.annualBalance) },
          {
            header: "Good Samaritan Day",
            cell: (row) =>
              row.goodSamaritanCleared ? (
                <Badge variant="success">Cleared</Badge>
              ) : (
                <Badge variant="warning">
                  {currencyFormatter.format(Math.max(row.goodSamaritanDue - row.goodSamaritanPaid, 0))} due
                </Badge>
              ),
          },
        ]}
      />

      <style>{`
        @media print {
          aside, header, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </ParishShell>
  );
}
