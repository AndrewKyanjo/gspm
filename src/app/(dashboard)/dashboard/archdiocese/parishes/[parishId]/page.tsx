import { Building2, FolderKanban, HandCoins, Landmark, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getParishDetail } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ parishId: string }> };

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function statusVariant(status: string | null) {
  switch (status) {
    case "active": case "approved": return "success" as const;
    case "inactive": case "submitted": return "warning" as const;
    case "archived": case "returned": return "danger" as const;
    default: return "default" as const;
  }
}

function projectStatusVariant(status: string | null) {
  switch (status) {
    case "completed": return "success" as const;
    case "planned": return "info" as const;
    case "delayed": return "danger" as const;
    default: return "warning" as const;
  }
}

export default async function ParishDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const { parishId } = await params;
  const detail = await getParishDetail(context.archdioceseId, parishId);
  if (!detail) notFound();

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/parishes"
      eyebrow="Archdiocese Parishes"
      title={detail.name}
      subtitle={`Deanery: ${detail.deaneryName ?? "Unassigned"} • Vicariate: ${detail.vicariateName ?? "Unassigned"}`}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={detail.name}
        description={`Code: ${detail.code ?? "N/A"} • Archdiocese: ${detail.archdioceseName ?? "N/A"}`}
        actions={<Button href="/dashboard/archdiocese/parishes" variant="secondary">All parishes</Button>}
      />

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="Reports" value={detail.totalReports} helper="Submitted reports" icon={Building2} />
        <StatCard label="Projects" value={detail.totalProjects} helper="Tracked projects" icon={FolderKanban} />
        <StatCard label="Contributions" value={detail.totalContributions} helper="Contribution records" icon={HandCoins} />
        <StatCard label="Contribution total" value={currencyFormatter.format(detail.contributionTotal)} helper="Sum of all contributions" icon={HandCoins} />
        <StatCard label="Project budget" value={currencyFormatter.format(detail.projectBudgetTotal)} helper="Total budget across projects" icon={Landmark} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          {detail.recentReports.length > 0 ? (
            <SimpleTable title="Recent reports" rows={detail.recentReports} columns={[
              { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
              { header: "Summary", cell: (item) => item.summary ?? "No summary" },
              { header: "Updated", cell: (item) => item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-" },
            ]} />
          ) : <EmptyState title="No reports" description="No parish reports have been submitted yet." />}

          {detail.recentProjects.length > 0 ? (
            <SimpleTable title="Recent projects" rows={detail.recentProjects} columns={[
              { header: "Project", cell: (item) => <div className="space-y-1"><div className="font-medium">{item.title}</div></div> },
              { header: "Status", cell: (item) => <Badge variant={projectStatusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
              { header: "Budget", cell: (item) => item.budgetAmount != null ? currencyFormatter.format(item.budgetAmount) : "-" },
              { header: "Raised", cell: (item) => item.amountRaised != null ? currencyFormatter.format(item.amountRaised) : "-" },
            ]} />
          ) : <EmptyState title="No projects" description="No projects have been created for this parish yet." />}
        </div>

        <div className="space-y-6">
          {detail.recentContributions.length > 0 ? (
            <SimpleTable title="Recent contributions" rows={detail.recentContributions} columns={[
              { header: "Contributor", cell: (item) => item.contributorName },
              { header: "Type", cell: (item) => item.contributionType },
              { header: "Amount", cell: (item) => currencyFormatter.format(item.amount) },
              { header: "Date", cell: (item) => new Date(item.contributedOn).toLocaleDateString() },
            ]} />
          ) : <EmptyState title="No contributions" description="No contributions have been recorded for this parish yet." />}

          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Hierarchy context</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-on-surface-variant">Archdiocese</span><span className="font-medium text-on-surface">{detail.archdioceseName ?? "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Vicariate</span><span className="font-medium text-on-surface">{detail.vicariateName ?? "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Deanery</span><span className="font-medium text-on-surface">{detail.deaneryName ?? "N/A"}</span></div>
              <div className="flex justify-between"><span className="text-on-surface-variant">Status</span><Badge variant={statusVariant(detail.status)}>{detail.status ?? "unknown"}</Badge></div>
            </div>
          </div>
        </div>
      </section>
    </ArchdioceseShell>
  );
}
