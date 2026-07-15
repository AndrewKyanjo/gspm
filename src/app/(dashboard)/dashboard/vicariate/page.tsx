import { AlertTriangle, CalendarCheck, FolderKanban, Landmark, Percent, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { Button } from "@/components/ui/button";
import { getVicariateDashboard } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

export default async function VicariateDashboardPage() {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const dashboard = await getVicariateDashboard({
    archdioceseId: context.archdioceseId,
    vicariateId: context.vicariateId,
  });

  return (
    <VicariateShell
      pathname="/dashboard/vicariate"
      eyebrow="Vicariate Overview"
      title={dashboard.vicariateName ?? "Vicariate dashboard"}
      subtitle="Deanery rollups, Emitemwa compliance, Good Samaritan Day status, and project contribution visibility."
      actions={<Button href="/dashboard/vicariate/contributions">Open contributions</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Vicariate operations"
        description="This view aggregates all parishes under the vicariate through their deaneries."
      />

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Deaneries" value={dashboard.totalDeaneries} helper="Under this vicariate" icon={Landmark} />
        <StatCard label="Parishes" value={dashboard.totalParishes} helper="Active footprint" icon={ShieldCheck} />
        <StatCard label="Compliance" value={`${dashboard.compliancePercent}%`} helper="Annual Emitemwa paid" icon={Percent} />
        <StatCard
          label="Good Samaritan"
          value={`${dashboard.goodSamaritanCleared}/${dashboard.totalParishes}`}
          helper="Parishes cleared"
          icon={CalendarCheck}
        />
        <StatCard
          label="Project giving"
          value={currencyFormatter.format(dashboard.projectContributionsRaised)}
          helper="Raised in scope"
          icon={FolderKanban}
        />
        <StatCard label="In arrears" value={dashboard.arrears.length} helper="Rows shown below" icon={AlertTriangle} />
      </section>

      <SimpleTable
        title="Parishes in arrears"
        description="Highest annual Emitemwa balances among parishes in this vicariate."
        rows={dashboard.arrears}
        columns={[
          { header: "Parish", cell: (row) => <span className="font-medium">{row.parishName}</span> },
          { header: "Deanery", cell: (row) => row.deaneryName ?? "-" },
          { header: "Balance", cell: (row) => currencyFormatter.format(row.balance) },
        ]}
      />
    </VicariateShell>
  );
}
