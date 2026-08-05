import { notFound } from "next/navigation";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getParishDetail } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { Building2, FolderKanban, HandCoins } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

type Props = { params: Promise<{ parishId: string }> };

export default async function VicariateParishDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId) return null;

  const { parishId } = await params;
  const parish = await getParishDetail(context.archdioceseId, parishId);
  if (!parish) notFound();

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/parishes"
      eyebrow="Vicariate Parishes"
      title={parish.name}
      subtitle="A vicariate-level summary of the parish's reported performance and activity."
      actions={<Button href="/dashboard/vicariate/parishes" variant="secondary">Back to parishes</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title={parish.name} description={`${parish.code ?? ""}${parish.deaneryName ? ` • ${parish.deaneryName} Deanery` : ""}`} actions={<Badge>{parish.status ?? "active"}</Badge>} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total reports" value={parish.totalReports} helper="Submitted parish reports" icon={Building2} />
        <StatCard label="Projects" value={parish.totalProjects} helper="Current tracked projects" icon={FolderKanban} />
        <StatCard label="Contributions" value={currencyFormatter.format(parish.contributionTotal)} helper="Combined contribution total" icon={HandCoins} />
      </section>

      {parish.recentReports.length > 0 && (
        <SimpleTable
          title="Recent parish reports"
          rows={parish.recentReports}
          columns={[
            { header: "Status", cell: (r) => <Badge>{r.status ?? "unknown"}</Badge> },
            { header: "Summary", cell: (r) => r.summary ?? "-" },
            { header: "Updated", cell: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "-" },
          ]}
        />
      )}

      {parish.recentProjects.length > 0 && (
        <SimpleTable
          title="Recent projects"
          rows={parish.recentProjects}
          columns={[
            { header: "Project", cell: (p) => p.title },
            { header: "Status", cell: (p) => p.status ?? "-" },
            { header: "Budget", cell: (p) => p.budgetAmount != null ? currencyFormatter.format(p.budgetAmount) : "-" },
            { header: "Raised", cell: (p) => p.amountRaised != null ? currencyFormatter.format(p.amountRaised) : "-" },
          ]}
        />
      )}
    </VicariateShell>
  );
}
