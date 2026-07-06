import { notFound } from "next/navigation";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeaneryParishDetail } from "@/features/deanery/parishes/queries";
import { getDeaneryReports } from "@/features/deanery/reports/queries";
import { getDeaneryProjects } from "@/features/deanery/projects/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { Building2, FolderKanban, Users } from "lucide-react";

type DeaneryParishDetailPageProps = {
  params: Promise<{ parishId: string }>;
};

export default async function DeaneryParishDetailPage({ params }: DeaneryParishDetailPageProps) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const { parishId } = await params;
  const [parish, reports, projects] = await Promise.all([
    getDeaneryParishDetail(context.deaneryId, parishId),
    getDeaneryReports(context.deaneryId),
    getDeaneryProjects(context.deaneryId),
  ]);

  if (!parish) {
    notFound();
  }

  const parishReports = reports.filter((report) => report.parishId === parishId).slice(0, 6);
  const parishProjects = projects.filter((project) => project.parishName === parish.name).slice(0, 6);

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/parishes"
      eyebrow="Deanery Parishes"
      title={parish.name}
      subtitle="A deanery-level summary of the parish’s reported performance and activity."
      actions={
        <Button href="/dashboard/deanery/parishes" variant="secondary">
          Back to parishes
        </Button>
      }
    >
      <PageHeader
        title={parish.name}
        description={`${parish.code}${parish.location ? ` • ${parish.location}` : ""}${parish.priestName ? ` • Priest: ${parish.priestName}` : ""}`}
        actions={<Badge>{parish.status ?? "active"}</Badge>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Reported followers" value={parish.followers} helper="From latest parish report" icon={Users} />
        <StatCard label="Families" value={parish.families} helper="Latest household total" icon={Building2} />
        <StatCard label="Projects" value={parish.totalProjects} helper="Current tracked projects" icon={FolderKanban} />
      </section>

      <SimpleTable
        title="Recent parish reports"
        rows={parishReports}
        columns={[
          { header: "Period", cell: (report) => report.reportingPeriodLabel ?? "-" },
          { header: "Status", cell: (report) => report.status ?? "-" },
          { header: "Summary", cell: (report) => report.summary ?? "-" },
          { header: "Open", cell: (report) => <Button href={`/dashboard/deanery/reports/${report.id}`} size="sm" variant="secondary">Review</Button> },
        ]}
      />

      <SimpleTable
        title="Recent parish projects"
        rows={parishProjects}
        columns={[
          { header: "Project", cell: (project) => project.title },
          { header: "Status", cell: (project) => project.status ?? "-" },
          { header: "Budget", cell: (project) => (project.budgetAmount != null ? project.budgetAmount.toLocaleString() : "-") },
          { header: "Open", cell: (project) => <Button href={`/dashboard/deanery/projects/${project.id}`} size="sm" variant="secondary">View</Button> },
        ]}
      />
    </DeaneryShell>
  );
}
