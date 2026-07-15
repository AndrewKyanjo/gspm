import { CalendarCheck, CircleDollarSign, HandCoins, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { getParishContributionDashboard } from "@/features/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function statusBadge(status: "paid" | "partial" | "unpaid") {
  if (status === "paid") return <Badge variant="success">Paid</Badge>;
  if (status === "partial") return <Badge variant="warning">Partial</Badge>;
  return <Badge variant="danger">Unpaid</Badge>;
}

export default async function ParishContributionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  if (!context.parishId) return null;

  const params = await searchParams;
  const year = Number(params?.year) || new Date().getUTCFullYear();
  const dashboard = await getParishContributionDashboard(context.parishId, year);
  if (!dashboard) return null;

  return (
    <ParishShell
      pathname="/dashboard/parish/contributions"
      eyebrow="Parish Finance"
      title="Emitemwa and project contributions"
      subtitle="Track monthly dues, Good Samaritan Day clearance, and project-based parish contributions."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/parish/contributions/report" variant="secondary">
            Monthly report
          </Button>
          <Button href="/dashboard/parish/contributions/new" variant="warning">
            Record payment
          </Button>
        </div>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`${dashboard.parishName} contribution ledger`}
        description={`${dashboard.vicariateName ?? "Vicariate"} rate: ${currencyFormatter.format(dashboard.monthlyRate)} per month, ${currencyFormatter.format(dashboard.goodSamaritanRate)} for Good Samaritan Day.`}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Emitemwa paid"
          value={currencyFormatter.format(dashboard.monthlyPaidTotal)}
          helper={`${year} monthly total`}
          icon={HandCoins}
        />
        <StatCard
          label="Emitemwa balance"
          value={currencyFormatter.format(dashboard.monthlyAnnualBalance)}
          helper="Annual balance"
          icon={ReceiptText}
        />
        <StatCard
          label="Good Samaritan Day"
          value={dashboard.goodSamaritan.cleared ? "Cleared" : currencyFormatter.format(dashboard.goodSamaritan.balance)}
          helper={dashboard.goodSamaritan.cleared ? "Annual amount paid" : "Still owed"}
          icon={CalendarCheck}
        />
        <StatCard
          label="Active projects"
          value={dashboard.projects.length}
          helper="Available for this parish"
          icon={CircleDollarSign}
        />
      </section>

      {dashboard.legacyOpeningBalance ? (
        <div className="rounded-md border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface">
          Legacy snapshot imported for {dashboard.legacyOpeningBalance.sourceParishName}:{" "}
          <span className="font-semibold">
            {currencyFormatter.format(dashboard.legacyOpeningBalance.paidAmount)} paid
          </span>{" "}
          and{" "}
          <span className="font-semibold">
            {currencyFormatter.format(dashboard.legacyOpeningBalance.balanceAmount)} balance
          </span>
          .
        </div>
      ) : null}

      <SimpleTable
        title="Monthly Emitemwa status"
        description="Each month compares logged payments against the vicariate monthly rate."
        rows={dashboard.months}
        columns={[
          { header: "Month", cell: (item) => <span className="font-medium">{item.label}</span> },
          { header: "Due", cell: (item) => currencyFormatter.format(item.due) },
          { header: "Paid", cell: (item) => currencyFormatter.format(item.paid) },
          { header: "Balance", cell: (item) => currencyFormatter.format(item.balance) },
          { header: "Status", cell: (item) => statusBadge(item.status) },
        ]}
      />

      {dashboard.projects.length ? (
        <SimpleTable
          title="Project contribution targets"
          description="Projects are opened by their scope; this parish can contribute to every project shown here."
          rows={dashboard.projects}
          columns={[
            {
              header: "Project",
              cell: (item) => (
                <div className="space-y-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-on-surface-variant">{item.scopeLevel}</div>
                </div>
              ),
            },
            {
              header: "Parish paid",
              cell: (item) => currencyFormatter.format(item.parishRaised),
            },
            {
              header: "Total raised",
              cell: (item) => currencyFormatter.format(item.totalRaised),
            },
            {
              header: "Target",
              cell: (item) => (item.targetAmount == null ? "-" : currencyFormatter.format(item.targetAmount)),
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No active project contribution targets"
          description="When a scoped project is created for this parish, it will appear here automatically."
        />
      )}
    </ParishShell>
  );
}
