import { notFound } from "next/navigation";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getVicariateProjectDetail } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

type Props = { params: Promise<{ projectId: string }> };

export default async function VicariateProjectDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const { projectId } = await params;
  const project = await getVicariateProjectDetail(context.archdioceseId, context.vicariateId, projectId);
  if (!project) notFound();

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/projects"
      eyebrow="Vicariate Projects"
      title={project.title}
      subtitle="Project detail from the vicariate supervision layer."
      actions={<Button href="/dashboard/vicariate/projects" variant="secondary">Back to projects</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title={project.title} description={project.parishName ?? "Parish project"} actions={<Badge>{project.status ?? "planned"}</Badge>} />
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Parish</p><p className="mt-1 text-sm text-on-surface">{project.parishName ?? "-"}</p></div>
              <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Deanery</p><p className="mt-1 text-sm text-on-surface">{project.deaneryName ?? "-"}</p></div>
              <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Category</p><p className="mt-1 text-sm text-on-surface">{project.category ?? "-"}</p></div>
              <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Location</p><p className="mt-1 text-sm text-on-surface">{project.location ?? "-"}</p></div>
              <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Target end</p><p className="mt-1 text-sm text-on-surface">{project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : "-"}</p></div>
              <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Updated</p><p className="mt-1 text-sm text-on-surface">{project.updatedAt ? new Date(project.updatedAt).toLocaleString() : "-"}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Funding snapshot</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Budget</p><p className="mt-1 text-lg font-semibold text-on-surface">{project.budgetAmount != null ? currencyFormatter.format(project.budgetAmount) : "-"}</p></div>
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Raised</p><p className="mt-1 text-lg font-semibold text-on-surface">{project.amountRaised != null ? currencyFormatter.format(project.amountRaised) : "-"}</p></div>
          </CardContent>
        </Card>
      </section>
    </VicariateShell>
  );
}
