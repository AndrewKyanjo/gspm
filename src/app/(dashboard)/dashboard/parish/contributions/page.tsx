import { HandCoins, ReceiptText } from "lucide-react";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { getParishContributions } from "@/features/parish/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function ParishContributionsPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const contributions = await getParishContributions(context.parishId);
  const totalAmount = contributions.reduce((sum, contribution) => sum + contribution.amount, 0);

  return (
    <ParishShell
      pathname="/dashboard/parish/contributions"
      eyebrow="Parish Finance"
      title="Contribution tracking"
      subtitle="Finance visibility, donor recording, and campaign follow-through for local parish stewardship."
      actions={
        <Button href="/dashboard/parish/contributions/new" variant="warning">
          Record contribution
        </Button>
      }
    >
      <PageHeader
        title="Parish contributions"
        description="Contributions are recorded at parish level and listed here for quick finance follow-up and local accountability."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Recorded contributions"
          value={contributions.length}
          helper="Entries for this parish"
          icon={HandCoins}
        />
        <StatCard
          label="Total value"
          value={currencyFormatter.format(totalAmount)}
          helper="Current visible ledger sum"
          icon={ReceiptText}
        />
      </section>

      {contributions.length ? (
        <SimpleTable
          title="Contribution register"
          description="Every saved contribution is written to Supabase and reflected back in this ledger."
          rows={contributions}
          columns={[
            {
              header: "Contributor",
              cell: (contribution) => <span className="font-medium">{contribution.contributorName}</span>,
            },
            {
              header: "Type",
              cell: (contribution) => contribution.contributionType,
            },
            {
              header: "Amount",
              cell: (contribution) => currencyFormatter.format(contribution.amount),
            },
            {
              header: "Date",
              cell: (contribution) => new Date(contribution.contributedOn).toLocaleDateString(),
            },
            {
              header: "Method",
              cell: (contribution) => contribution.paymentMethod ?? "-",
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No contributions recorded yet"
          description="Create the first parish contribution entry to start building a live ledger in Supabase."
          action={<Button href="/dashboard/parish/contributions/new">Record first contribution</Button>}
        />
      )}
    </ParishShell>
  );
}
