// src/app/(dashboard)/dashboard/archdiocese/reports/financial/page.tsx
import { Building2, HandCoins, Landmark, TrendingUp } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getArchdioceseFinancialSummary } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function FinancialReportsPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const summary = await getArchdioceseFinancialSummary(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Archdiocese Reports"
      title="Financial overview"
      subtitle="Comprehensive financial summary across the full hierarchy."
      actions={
        <Button href="/dashboard/archdiocese/reports" variant="secondary">
          Reports dashboard
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Financial Reports"
        description="Aggregated financial data by vicariate, deanery, contribution type, and monthly trends."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total contributions"
          value={currencyFormatter.format(summary.totalAmount)}
          helper="Across all records"
          icon={HandCoins}
        />
        <StatCard
          label="Vicariates"
          value={summary.byVicariate.length}
          helper="With contribution data"
          icon={Building2}
        />
        <StatCard
          label="Deaneries"
          value={summary.byDeanery.length}
          helper="With contribution data"
          icon={Landmark}
        />
        <StatCard
          label="Types"
          value={summary.byContributionType.length}
          helper="Distinct contribution categories"
          icon={TrendingUp}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {summary.byVicariate.length > 0 ? (
          <SimpleTable
            title="By vicariate"
            description="Total contributions rolled up by vicariate."
            rows={summary.byVicariate}
            columns={[
              { header: "Vicariate", cell: (item) => <span className="font-medium">{item.name}</span> },
              { header: "Total", cell: (item) => currencyFormatter.format(item.amount) },
            ]}
          />
        ) : (
          <EmptyState title="No vicariate data" description="Contribution data by vicariate will appear here." />
        )}

        {summary.byDeanery.length > 0 ? (
          <SimpleTable
            title="By deanery"
            description="Total contributions rolled up by deanery."
            rows={summary.byDeanery}
            columns={[
              { header: "Deanery", cell: (item) => <span className="font-medium">{item.name}</span> },
              { header: "Total", cell: (item) => currencyFormatter.format(item.amount) },
            ]}
          />
        ) : (
          <EmptyState title="No deanery data" description="Contribution data by deanery will appear here." />
        )}

        {summary.byContributionType.length > 0 ? (
          <SimpleTable
            title="By contribution type"
            description="Total contributions broken down by type."
            rows={summary.byContributionType}
            columns={[
              { header: "Type", cell: (item) => <span className="font-medium capitalize">{item.type.replaceAll("_", " ")}</span> },
              { header: "Total", cell: (item) => currencyFormatter.format(item.amount) },
            ]}
          />
        ) : (
          <EmptyState title="No type data" description="Contribution type breakdown will appear here." />
        )}

        {summary.byMonth.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Monthly trend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {summary.byMonth.slice(-12).map((item) => (
                <div key={item.month} className="flex items-center justify-between rounded-md bg-surface-container p-3">
                  <span className="text-sm text-on-surface">{item.month}</span>
                  <span className="text-sm font-medium text-on-surface">
                    {currencyFormatter.format(item.amount)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState title="No monthly data" description="Monthly contribution trends will appear here." />
        )}
      </section>

      <section>
        {summary.recentContributions.length > 0 ? (
          <SimpleTable
            title="Recent contributions"
            description="The latest contribution records across the archdiocese."
            rows={summary.recentContributions}
            columns={[
              {
                header: "Contributor",
                cell: (item) => (
                  <div className="space-y-1">
                    <div className="font-medium">{item.contributorName}</div>
                    <div className="text-xs text-on-surface-variant">
                      {item.parishName ?? "?"} • {item.deaneryName ?? "?"}
                    </div>
                  </div>
                ),
              },
              { header: "Type", cell: (item) => item.contributionType },
              { header: "Amount", cell: (item) => currencyFormatter.format(item.amount) },
              { header: "Date", cell: (item) => new Date(item.contributedOn).toLocaleDateString() },
            ]}
          />
        ) : (
          <EmptyState title="No contributions" description="Individual contribution records will appear here." />
        )}
      </section>
    </ArchdioceseShell>
  );
}
