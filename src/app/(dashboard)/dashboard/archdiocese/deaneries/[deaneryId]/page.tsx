import { Building2, FolderKanban, HandCoins, Landmark, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeaneryDetail } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ deaneryId: string }> };

function statusVariant(status: string | null) {
  switch (status) {
    case "active": return "success" as const;
    case "inactive": return "warning" as const;
    case "archived": return "danger" as const;
    default: return "default" as const;
  }
}

export default async function DeaneryDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const { deaneryId } = await params;
  const detail = await getDeaneryDetail(context.archdioceseId, deaneryId);
  if (!detail) notFound();

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/deaneries"
      eyebrow="Archdiocese Deaneries"
      title={detail.name}
      subtitle={`Vicariate: ${detail.vicariateName ?? "Unassigned"} • Code: ${detail.code ?? "N/A"}`}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={detail.name}
        description={`Deanery under ${detail.vicariateName ?? "Unknown Vicariate"} with ${detail.totalParishes} parishes.`}
        actions={<Button href="/dashboard/archdiocese/deaneries" variant="secondary">All deaneries</Button>}
      />

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="Parishes" value={detail.totalParishes} helper="Child parishes" icon={ShieldCheck} />
        <StatCard label="Reports" value={detail.totalReports} helper="Submitted reports" icon={Building2} />
        <StatCard label="Projects" value={detail.totalProjects} helper="Tracked projects" icon={FolderKanban} />
        <StatCard label="Contributions" value={detail.totalContributions} helper="Contribution records" icon={HandCoins} />
        <StatCard label="Vicariate" value={detail.vicariateName ?? "N/A"} helper="Parent layer" icon={Landmark} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          title="Parishes"
          description="All parishes under this deanery."
          rows={detail.parishes}
          columns={[
            { header: "Parish", cell: (item) => <div className="space-y-1"><div className="font-medium">{item.name}</div><div className="text-xs text-on-surface-variant">{item.code ?? "No code"}</div></div> },
            { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
            { header: "Open", cell: (item) => <Button href={`/dashboard/archdiocese/parishes/${item.id}`} size="sm" variant="secondary">View</Button> },
          ]}
        />

        <div className="space-y-6">
          {detail.recentReports.length > 0 ? (
            <SimpleTable title="Recent reports" rows={detail.recentReports} columns={[
              { header: "Parish", cell: (item) => item.parishName ?? "Unknown" },
              { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
              { header: "Updated", cell: (item) => item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-" },
            ]} />
          ) : (
            <EmptyState title="No reports yet" description="Parish reports for this deanery will appear here." />
          )}

          {detail.recentProjects.length > 0 ? (
            <SimpleTable title="Recent projects" rows={detail.recentProjects} columns={[
              { header: "Project", cell: (item) => item.title },
              { header: "Parish", cell: (item) => item.parishName ?? "Unknown" },
              { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
            ]} />
          ) : (
            <EmptyState title="No projects yet" description="Projects for this deanery will appear here." />
          )}
        </div>
      </section>
    </ArchdioceseShell>
  );
}
