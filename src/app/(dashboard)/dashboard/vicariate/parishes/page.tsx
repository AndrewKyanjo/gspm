import { Building2, HandCoins } from "lucide-react";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVicariateParishOverviews } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "approved": return "success" as const;
    case "submitted": return "info" as const;
    case "draft": return "warning" as const;
    default: return "default" as const;
  }
}

export default async function VicariateParishesPage() {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const parishes = await getVicariateParishOverviews(context.archdioceseId, context.vicariateId);
  const totalContributions = parishes.reduce((sum, p) => sum + p.totalContributions, 0);

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/parishes"
      eyebrow="Vicariate Parishes"
      title="Parish supervision"
      subtitle="Monitor every parish assigned to the vicariate with report status and activity."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Assigned parishes" description="This is the vicariate's supervisory register for parish status, report activity, and contribution performance." />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Parish count" value={parishes.length} helper="Within this vicariate scope" icon={Building2} />
        <StatCard label="Combined contributions" value={currencyFormatter.format(totalContributions)} helper="Visible parish contribution totals" icon={HandCoins} />
      </section>

      {parishes.length ? (
        <SimpleTable
          title="Parish register"
          rows={parishes}
          columns={[
            { header: "Parish", cell: (p) => <Button href={`/dashboard/vicariate/parishes/${p.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">{p.name}</Button> },
            { header: "Deanery", cell: (p) => p.deaneryName ?? "-" },
            { header: "Report status", cell: (p) => p.latestReportStatus ? <Badge variant={badgeVariantForStatus(p.latestReportStatus)}>{p.latestReportStatus}</Badge> : <span className="text-sm text-on-surface-variant">None</span> },
            { header: "Projects", cell: (p) => p.totalProjects.toLocaleString() },
            { header: "Contributions", cell: (p) => p.totalContributions.toLocaleString() },
          ]}
        />
      ) : (
        <EmptyState title="No parishes found" description="No parishes are currently assigned to this vicariate." />
      )}
    </VicariateShell>
  );
}
