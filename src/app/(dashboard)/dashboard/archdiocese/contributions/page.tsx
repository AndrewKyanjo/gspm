import { Building2, HandCoins, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { getArchdioceseContributionSummary } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function ArchdioceseContributionsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) {
    return null;
  }

  const summary = await getArchdioceseContributionSummary(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/contributions"
      eyebrow="Archdiocese Contributions"
      title="Contributions management"
      subtitle="Financial visibility across the full hierarchy."
      actions={<Button href="/dashboard/archdiocese/contributions/new">Create contribution</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Contributions"
        description="Financial records are aggregated by hierarchy scope, which means the future Vicariate module can inherit the same query primitives."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total amount" value={currencyFormatter.format(summary.totalAmount)} helper="Across visible contribution records" icon={HandCoins} />
        <StatCard label="Vicariates with giving" value={summary.byVicariate.length} helper="Distinct parent layers represented" icon={Building2} />
        <StatCard label="Recent contributions" value={summary.recentContributions.length} helper="Rows shown in the activity table" icon={ShieldCheck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
        {summary.byVicariate.length ? (
          <SimpleTable
            title="Contribution totals by vicariate"
            rows={summary.byVicariate}
            columns={[
              { header: "Vicariate", cell: (item) => <span className="font-medium">{item.name}</span> },
              { header: "Amount", cell: (item) => currencyFormatter.format(item.amount) },
            ]}
          />
        ) : (
          <EmptyState
            title="No vicariate contribution totals yet"
            description="As contribution rows arrive, this view will roll them up by vicariate automatically."
          />
        )}

        {summary.recentContributions.length ? (
          <SimpleTable
            title="Recent contributions"
            rows={summary.recentContributions}
            columns={[
              {
                header: "Contributor",
                cell: (item) => (
                  <div className="space-y-1">
                    <div className="font-medium">{item.contributorName}</div>
                    <div className="text-xs text-on-surface-variant">{item.parishName ?? "Unknown parish"}</div>
                  </div>
                ),
              },
              { header: "Type", cell: (item) => item.contributionType },
              { header: "Amount", cell: (item) => currencyFormatter.format(item.amount) },
              { header: "Date", cell: (item) => new Date(item.contributedOn).toLocaleDateString() },
            ]}
          />
        ) : (
          <EmptyState
            title="No contribution rows yet"
            description="Once parishes start recording contributions, the executive finance table will populate here."
          />
        )}
      </section>
    </ArchdioceseShell>
  );
}
