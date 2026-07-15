import { Building2, Landmark, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VicariateRateForm } from "@/components/dashboard/archdiocese/forms/vicariate-rate-form";
import { VicariateCreateForm } from "@/components/dashboard/archdiocese/forms/vicariate-create-form";
import { getArchdioceseVicariateOverviews } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function statusVariant(status: string | null) {
  switch (status) {
    case "active":
      return "success" as const;
    case "inactive":
      return "warning" as const;
    case "archived":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export default async function ArchdioceseVicariatesPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) {
    return null;
  }

  const vicariates = await getArchdioceseVicariateOverviews(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/vicariates"
      eyebrow="Archdiocese Vicariates"
      title="Vicariate oversight"
      subtitle="Manage the layer that will eventually get its own dedicated dashboard without changing the rest of the hierarchy model."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Vicariates"
        description="The executive view keeps vicariates explicit in the data model so deanery and parish rollups remain future-proof."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Vicariates" value={vicariates.length} helper="Units under the archdiocese" icon={Building2} />
        <StatCard
          label="Deaneries covered"
          value={vicariates.reduce((total, item) => total + item.deaneryCount, 0)}
          helper="Aggregated beneath vicariates"
          icon={Landmark}
        />
        <StatCard
          label="Parishes covered"
          value={vicariates.reduce((total, item) => total + item.parishCount, 0)}
          helper="Operational footprint"
          icon={ShieldCheck}
        />
      </section>

      <VicariateCreateForm />

      <SimpleTable
        title="Vicariate registry"
        description="Each row owns its deanery and parish footprint explicitly."
        rows={vicariates}
        columns={[
          {
            header: "Vicariate",
            cell: (item) => (
              <div className="space-y-1">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-on-surface-variant">{item.code ?? "No code assigned"}</div>
              </div>
            ),
          },
          {
            header: "Status",
            cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge>,
          },
          {
            header: "Deaneries",
            cell: (item) => item.deaneryCount,
          },
          {
            header: "Parishes",
            cell: (item) => item.parishCount,
          },
          {
            header: "Rates",
            cell: (item) => (
              <div className="space-y-1 text-sm">
                <div>{currencyFormatter.format(item.monthlyEmitemwaAmount)} / month</div>
                <div className="text-xs text-on-surface-variant">
                  {currencyFormatter.format(item.goodSamaritanDayAmount)} Good Samaritan Day
                </div>
              </div>
            ),
          },
          {
            header: "Edit rates",
            cell: (item) => (
              <VicariateRateForm
                vicariateId={item.id}
                monthlyAmount={item.monthlyEmitemwaAmount}
                goodSamaritanAmount={item.goodSamaritanDayAmount}
                returnTo="/dashboard/archdiocese/vicariates"
              />
            ),
          },
          {
            header: "Open",
            cell: (item) => (
              <Button href={`/dashboard/archdiocese/vicariates/${item.id}`} size="sm" variant="secondary">
                View
              </Button>
            ),
          },
        ]}
      />
    </ArchdioceseShell>
  );
}
