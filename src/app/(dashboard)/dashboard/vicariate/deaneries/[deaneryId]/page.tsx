import { notFound } from "next/navigation";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeaneryDetail } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { Building2, FolderKanban, ShieldCheck } from "lucide-react";

type Props = { params: Promise<{ deaneryId: string }> };

export default async function VicariateDeaneryDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId) return null;

  const { deaneryId } = await params;
  const deanery = await getDeaneryDetail(context.archdioceseId, deaneryId);
  if (!deanery) notFound();

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/deaneries"
      eyebrow="Vicariate Deaneries"
      title={deanery.name}
      subtitle="A vicariate-level detail view of the deanery and its parishes."
      actions={<Button href="/dashboard/vicariate/deaneries" variant="secondary">Back to deaneries</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title={deanery.name} description={`${deanery.code ?? ""}${deanery.vicariateName ? ` • ${deanery.vicariateName} Vicariate` : ""}`} actions={<Badge>{deanery.status ?? "active"}</Badge>} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Parishes" value={deanery.totalParishes} helper="Assigned to this deanery" icon={Building2} />
        <StatCard label="Reports" value={deanery.totalReports} helper="Total parish reports" icon={ShieldCheck} />
        <StatCard label="Projects" value={deanery.totalProjects} helper="Tracked projects" icon={FolderKanban} />
      </section>

      {deanery.parishes.length > 0 && (
        <SimpleTable
          title="Parishes in this deanery"
          rows={deanery.parishes}
          columns={[
            { header: "Name", cell: (p) => p.name },
            { header: "Code", cell: (p) => p.code ?? "-" },
            { header: "Status", cell: (p) => <Badge>{p.status ?? "active"}</Badge> },
          ]}
        />
      )}

      {deanery.recentReports.length > 0 && (
        <SimpleTable
          title="Recent parish reports"
          rows={deanery.recentReports}
          columns={[
            { header: "Parish", cell: (r) => r.parishName ?? "-" },
            { header: "Status", cell: (r) => <Badge>{r.status ?? "unknown"}</Badge> },
            { header: "Updated", cell: (r) => r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "-" },
          ]}
        />
      )}

      {deanery.recentProjects.length > 0 && (
        <SimpleTable
          title="Recent projects"
          rows={deanery.recentProjects}
          columns={[
            { header: "Project", cell: (p) => p.title },
            { header: "Parish", cell: (p) => p.parishName ?? "-" },
            { header: "Status", cell: (p) => p.status ?? "-" },
          ]}
        />
      )}
    </VicariateShell>
  );
}
