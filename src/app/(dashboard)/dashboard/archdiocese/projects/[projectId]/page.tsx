import { Calendar, HandCoins, Landmark, MapPin } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectDetail } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ projectId: string }> };

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function statusVariant(status: string | null) {
  switch (status) {
    case "completed": return "success" as const;
    case "planned": return "info" as const;
    case "delayed": return "danger" as const;
    default: return "warning" as const;
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const { projectId } = await params;
  const detail = await getProjectDetail(context.archdioceseId, projectId);
  if (!detail) notFound();

  const progress = detail.budgetAmount && detail.budgetAmount > 0
    ? Math.round(((detail.amountRaised ?? 0) / detail.budgetAmount) * 100)
    : null;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/projects"
      eyebrow="Archdiocese Projects"
      title={detail.title}
      subtitle={`Parish: ${detail.parishName ?? "Unknown"} • Deanery: ${detail.deaneryName ?? "Unknown"}`}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={detail.title}
        description={`Project tracked under ${detail.parishName ?? "Unknown Parish"} (${detail.deaneryName ?? "Unknown Deanery"} • ${detail.vicariateName ?? "Unknown Vicariate"})`}
        actions={<Button href="/dashboard/archdiocese/projects" variant="secondary">All projects</Button>}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Status" value={detail.status ?? "unknown"} helper="Current project phase" icon={Landmark} />
        <StatCard label="Budget" value={detail.budgetAmount != null ? currencyFormatter.format(detail.budgetAmount) : "—"} helper="Total budget" icon={HandCoins} />
        <StatCard label="Raised" value={detail.amountRaised != null ? currencyFormatter.format(detail.amountRaised) : "—"} helper="Funding secured" icon={HandCoins} />
        <StatCard label="Location" value={detail.location ?? "N/A"} helper="Project site" icon={MapPin} />
      </section>

      {progress !== null && (
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-on-surface">Funding progress</span>
            <span className="text-sm text-on-surface-variant">{progress}%</span>
          </div>
          <div className="h-3 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Project details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-md bg-surface-container p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Category</p>
                <p className="mt-1 text-sm text-on-surface">{detail.category ?? "Uncategorized"}</p>
              </div>
              <div className="rounded-md bg-surface-container p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Status</p>
                <Badge variant={statusVariant(detail.status)} className="mt-1">{detail.status ?? "unknown"}</Badge>
              </div>
              <div className="rounded-md bg-surface-container p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Start date</p>
                <p className="mt-1 text-sm text-on-surface">{detail.startDate ? new Date(detail.startDate).toLocaleDateString() : "Not set"}</p>
              </div>
              <div className="rounded-md bg-surface-container p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Target end</p>
                <p className="mt-1 text-sm text-on-surface">{detail.targetEndDate ? new Date(detail.targetEndDate).toLocaleDateString() : "Not set"}</p>
              </div>
            </div>
            {detail.description && (
              <div className="rounded-md bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-2">Description</p>
                <p className="text-sm text-on-surface whitespace-pre-wrap">{detail.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Hierarchy context</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Archdiocese</span>
              <span className="text-sm font-medium text-on-surface">{detail.archdioceseName ?? "N/A"}</span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Vicariate</span>
              <span className="text-sm font-medium text-on-surface">{detail.vicariateName ?? "N/A"}</span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Deanery</span>
              <span className="text-sm font-medium text-on-surface">{detail.deaneryName ?? "N/A"}</span>
            </div>
            <div className="flex justify-between rounded-md bg-surface-container p-3">
              <span className="text-sm text-on-surface-variant">Parish</span>
              <span className="text-sm font-medium text-on-surface">{detail.parishName ?? "N/A"}</span>
            </div>
            {detail.createdAt && (
              <div className="flex justify-between rounded-md bg-surface-container p-3">
                <span className="text-sm text-on-surface-variant">Created</span>
                <span className="text-sm font-medium text-on-surface">{new Date(detail.createdAt).toLocaleDateString()}</span>
              </div>
            )}
            {detail.updatedAt && (
              <div className="flex justify-between rounded-md bg-surface-container p-3">
                <span className="text-sm text-on-surface-variant">Last updated</span>
                <span className="text-sm font-medium text-on-surface">{new Date(detail.updatedAt).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </ArchdioceseShell>
  );
}
