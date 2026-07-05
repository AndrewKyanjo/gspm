/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getParishProjectDetail } from "@/features/parish/projects/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

type ParishProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "active":
      return "info" as const;
    case "on_hold":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export default async function ParishProjectDetailPage({ params }: ParishProjectDetailPageProps) {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const { projectId } = await params;
  const project = await getParishProjectDetail(context.parishId, projectId);

  if (!project) {
    notFound();
  }

  return (
    <ParishShell
      pathname="/dashboard/parish/projects"
      eyebrow="Parish Projects"
      title={project.title}
      subtitle="A full project record for parish review, budgeting, and follow-through."
      actions={
        <Button href="/dashboard/parish/projects" variant="secondary">
          Back to projects
        </Button>
      }
    >
      <PageHeader
        title={project.title}
        description={project.description ?? "No project description has been added yet."}
        actions={<Badge variant={badgeVariantForStatus(project.status)}>{project.status ?? "planned"}</Badge>}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardContent className="space-y-5 p-5">
            {project.coverImageUrl ? (
              <img
                src={project.coverImageUrl}
                alt={project.title}
                className="aspect-[16/9] w-full rounded-md object-cover"
              />
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-md bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Category</p>
                <p className="mt-1 text-sm text-on-surface">{project.category ?? "-"}</p>
              </div>
              <div className="rounded-md bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Location</p>
                <p className="mt-1 text-sm text-on-surface">{project.location ?? "-"}</p>
              </div>
              <div className="rounded-md bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Start date</p>
                <p className="mt-1 text-sm text-on-surface">
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <div className="rounded-md bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Target end</p>
                <p className="mt-1 text-sm text-on-surface">
                  {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString() : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project finance</CardTitle>
            <CardDescription>Current budget and fundraising snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Budget</p>
              <p className="mt-1 text-lg font-semibold text-on-surface">
                {project.budgetAmount != null ? currencyFormatter.format(project.budgetAmount) : "-"}
              </p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount raised</p>
              <p className="mt-1 text-lg font-semibold text-on-surface">
                {project.amountRaised != null ? currencyFormatter.format(project.amountRaised) : "-"}
              </p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Last updated</p>
              <p className="mt-1 text-sm text-on-surface">
                {project.updatedAt ? new Date(project.updatedAt).toLocaleString() : "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </ParishShell>
  );
}
