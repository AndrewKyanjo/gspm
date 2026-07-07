import {
  Activity,
  Building2,
  FolderKanban,
  Landmark,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getArchdioceseContext,
  getArchdioceseExecutiveStats,
  getArchdioceseRecentActivity,
} from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function activityVariant(module: string) {
  switch (module) {
    case "approvals":
      return "warning" as const;
    case "reports":
      return "info" as const;
    case "contributions":
      return "success" as const;
    default:
      return "default" as const;
  }
}

export default async function ArchdioceseDashboardPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) {
    return null;
  }

  const [archdiocese, stats, recentActivity] = await Promise.all([
    getArchdioceseContext(context.archdioceseId),
    getArchdioceseExecutiveStats(context.archdioceseId),
    getArchdioceseRecentActivity(context.archdioceseId),
  ]);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/dashboard"
      eyebrow="Archdiocese Dashboard"
      title={archdiocese.archdioceseName ?? "Executive console"}
      subtitle="Govern the full hierarchy with visibility that already preserves the future Vicariate layer."
      actions={<Button href="/dashboard/archdiocese/users/approvals">Review approvals</Button>}
    >
      <PageHeader
        title="Executive dashboard"
        description="This overview aggregates activity across vicariates, deaneries, parishes, finance, and approvals without flattening the hierarchy."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Vicariates" value={stats.totalVicariates} helper="First child layer under the Archdiocese" icon={Building2} />
        <StatCard label="Deaneries" value={stats.totalDeaneries} helper="Grouped beneath vicariates" icon={Landmark} />
        <StatCard label="Parishes" value={stats.totalParishes} helper="Total operating units in scope" icon={ShieldCheck} />
        <StatCard label="Active assignments" value={stats.activeAssignments} helper="Current user-role bindings" icon={Users} />
        <StatCard label="Pending approvals" value={stats.pendingApprovals} helper="Requires archdiocesan review" icon={UserCheck} />
        <StatCard label="Submitted reports" value={stats.submittedReports} helper="Awaiting review or escalation" icon={Activity} />
        <StatCard label="Approved reports" value={stats.approvedReports} helper="Cleared in the current data set" icon={ShieldCheck} />
        <StatCard label="Reported families" value={stats.reportedFamilies} helper="Summed from submitted report records" icon={Users} />
        <StatCard label="Reported beneficiaries" value={stats.reportedBeneficiaries} helper="Current roll-up from parish reports" icon={Users} />
        <StatCard label="Tracked projects" value={stats.trackedProjects} helper="Projects visible across the hierarchy" icon={FolderKanban} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <SimpleTable
          title="Recent cross-system activity"
          description="The latest approvals, reports, contributions, and project updates from across the Archdiocese."
          rows={recentActivity}
          columns={[
            {
              header: "Item",
              cell: (item) => (
                <div className="space-y-1">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-on-surface-variant">{item.description}</div>
                </div>
              ),
            },
            {
              header: "Module",
              cell: (item) => <Badge variant={activityVariant(item.module)}>{item.module}</Badge>,
            },
            {
              header: "When",
              cell: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"),
            },
            {
              header: "Open",
              cell: (item) => (
                <Button href={item.href} size="sm" variant="secondary">
                  View
                </Button>
              ),
            },
          ]}
        />

        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Financial rollup</p>
          <p className="mt-3 text-3xl font-semibold text-on-surface">
            {currencyFormatter.format(stats.annualContributions)}
          </p>
          <p className="mt-2 text-sm text-on-surface-variant">
            Current-year contributions across all parishes. This lives on the same hierarchy-aware query layer the future Vicariate dashboard can reuse.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Architecture note
              </p>
              <p className="mt-2 text-sm text-on-surface">
                Deaneries are resolved through their vicariates in the query layer rather than treated as direct Archdiocese children.
              </p>
            </div>
            <div className="rounded-md bg-surface-container p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Next control surface
              </p>
              <p className="mt-2 text-sm text-on-surface">
                Once the Vicariate UI is implemented, these same rollups can be narrowed from Archdiocese scope down to Vicariate scope with minimal page changes.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Button href="/dashboard/archdiocese/contributions" variant="secondary">
              Open contributions
            </Button>
          </div>
        </div>
      </section>
    </ArchdioceseShell>
  );
}
