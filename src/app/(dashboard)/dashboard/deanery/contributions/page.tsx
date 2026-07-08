import { HandCoins, TrendingUp } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { BarListChart } from "@/components/dashboard/deanery/charts/bar-list-chart";
import { TrendBars } from "@/components/dashboard/deanery/charts/trend-bars";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { getDeaneryContributionAggregate } from "@/features/deanery/contributions/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

export default async function DeaneryContributionsPage() {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const aggregate = await getDeaneryContributionAggregate(context.deaneryId);

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/contributions"
      eyebrow="Deanery Contributions"
      title="Contribution oversight"
      subtitle="Aggregated contribution performance across all parishes in the deanery."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Contributions"
        description="Monthly, quarterly, yearly, and parish-level contribution analysis from the deanery perspective."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total contributions" value={currencyFormatter.format(aggregate.totalContributions)} helper="All visible parish entries" icon={HandCoins} />
        <StatCard label="Top parish" value={aggregate.topPerformingParish ?? "-"} helper="Highest contribution total" icon={TrendingUp} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <BarListChart title="Contribution by parish" description="Compare total contribution value by parish." items={aggregate.byParish.map((item) => ({ label: item.parishName, value: item.amount }))} formatter={(value) => currencyFormatter.format(value)} />
        <BarListChart title="Contribution breakdown" description="Contribution totals by contribution type." items={aggregate.breakdown} formatter={(value) => currencyFormatter.format(value)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <TrendBars title="Monthly trends" description="Recent monthly contribution values." items={aggregate.monthlyTrends} formatter={(value) => currencyFormatter.format(value)} />
        <TrendBars title="Quarterly trends" description="Quarter-level contribution totals." items={aggregate.quarterlyTrends} formatter={(value) => currencyFormatter.format(value)} />
        <TrendBars title="Yearly trends" description="Annual contribution totals." items={aggregate.yearlyTrends} formatter={(value) => currencyFormatter.format(value)} />
      </section>

      <SimpleTable
        title="Contribution leaders"
        rows={aggregate.byParish}
        columns={[
          { header: "Parish", cell: (item) => item.parishName },
          { header: "Amount", cell: (item) => currencyFormatter.format(item.amount) },
        ]}
      />
    </DeaneryShell>
  );
}
