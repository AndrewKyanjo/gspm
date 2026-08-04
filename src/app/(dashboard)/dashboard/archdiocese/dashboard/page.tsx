import type { CSSProperties } from "react";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getArchdioceseContext,
  getArchdioceseExecutiveStats,
  getArchdioceseFinancialSummary,
  getArchdioceseProjectOverviews,
  getArchdioceseRecentActivity,
  getArchdioceseReportOverview,
} from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { cn } from "@/lib/utils";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function compactCurrency(value: number) {
  if (value >= 1_000_000_000) return `UGX ${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `UGX ${(value / 1_000_000).toFixed(1)}M`;
  return currencyFormatter.format(value);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function activityVariant(module: string) {
  switch (module) {
    case "approvals":
      return "warning" as const;
    case "reports":
      return "info" as const;
    case "contributions":
      return "success" as const;
    case "projects":
      return "default" as const;
    default:
      return "default" as const;
  }
}

function activityIcon(module: string) {
  switch (module) {
    case "approvals":
      return CheckCircle2;
    case "reports":
      return ClipboardCheck;
    case "contributions":
      return CircleDollarSign;
    case "projects":
      return FolderKanban;
    default:
      return Activity;
  }
}

function relativeDate(value: string | null) {
  if (!value) return "Recently";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof Activity;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1", accent)} />
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-on-surface-variant">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-on-surface">{value}</p>
            <p className="mt-1 text-xs text-on-surface-variant">{helper}</p>
          </div>
          <div className="rounded-md bg-surface-container p-1.5 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendBars({ data }: { data: Array<{ month: string; amount: number }> }) {
  const recent = data.slice(-9);
  const max = Math.max(...recent.map((item) => item.amount), 1);
  return (
    <div className="flex h-28 items-end gap-2">
      {recent.length ? (
        recent.map((item) => (
          <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div
              className="w-full rounded-t-md bg-primary"
              style={{ height: `${Math.max(12, (item.amount / max) * 100)}%` }}
              title={`${item.month}: ${currencyFormatter.format(item.amount)}`}
            />
            <span className="truncate text-[11px] text-on-surface-variant">{item.month.slice(5)}</span>
          </div>
        ))
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-on-surface-variant">
          No contribution trend yet
        </div>
      )}
    </div>
  );
}

function ApprovalDonut({ approved, pending, returned }: { approved: number; pending: number; returned: number }) {
  const total = Math.max(approved + pending + returned, 1);
  const approvedPct = Math.round((approved / total) * 100);
  const pendingPct = Math.round((pending / total) * 100);
  const returnedPct = Math.max(0, 100 - approvedPct - pendingPct);
  const style = {
    "--approved": `${approvedPct}%`,
    "--pending": `${approvedPct + pendingPct}%`,
  } as CSSProperties;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div
        className="grid h-36 w-36 place-items-center rounded-full"
        style={{
          ...style,
          background:
            "conic-gradient(#047857 0 var(--approved), #d97706 var(--approved) var(--pending), #be123c var(--pending) 100%)",
        }}
      >
        <div className="grid h-24 w-24 place-items-center rounded-full bg-surface-container-lowest">
          <div className="text-center">
            <p className="text-2xl font-semibold text-on-surface">{approvedPct}%</p>
            <p className="text-xs text-on-surface-variant">approved</p>
          </div>
        </div>
      </div>
      <div className="grid gap-3 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-on-surface-variant">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" /> Approved
          </span>
          <span className="font-medium text-on-surface">{approvedPct}%</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-on-surface-variant">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Pending
          </span>
          <span className="font-medium text-on-surface">{pendingPct}%</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-2 text-on-surface-variant">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-700" /> Returned
          </span>
          <span className="font-medium text-on-surface">{returnedPct}%</span>
        </div>
      </div>
    </div>
  );
}

function HealthScore({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-on-surface-variant">Archdiocese health</p>
            <p className="mt-1 text-2xl font-semibold text-on-surface">{score}%</p>
            <p className="mt-1 text-xs text-on-surface-variant">{label}</p>
          </div>
          <div className="h-2 w-24 rounded-full bg-surface-container">
            <div className="h-2 rounded-full bg-emerald-700" style={{ width: `${score}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ArchdioceseDashboardPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) {
    return null;
  }

  const [archdiocese, stats, recentActivity, reportOverview, financialSummary, projects] = await Promise.all([
    getArchdioceseContext(context.archdioceseId),
    getArchdioceseExecutiveStats(context.archdioceseId),
    getArchdioceseRecentActivity(context.archdioceseId),
    getArchdioceseReportOverview(context.archdioceseId),
    getArchdioceseFinancialSummary(context.archdioceseId),
    getArchdioceseProjectOverviews(context.archdioceseId),
  ]);

  const totalReports = Math.max(reportOverview.approved + reportOverview.submitted + reportOverview.returned, 1);
  const approvalCompletion = Math.round((reportOverview.approved / totalReports) * 100);
  const pendingPressure = Math.min(100, stats.pendingApprovals * 8 + stats.submittedReports * 5);
  const projectActivity = Math.min(100, stats.trackedProjects * 4);
  const contributionSignal = stats.annualContributions > 0 ? 100 : 45;
  const healthScore = Math.max(
    45,
    Math.min(98, Math.round((approvalCompletion + (100 - pendingPressure) + projectActivity + contributionSignal) / 4)),
  );
  const healthLabel = healthScore >= 85 ? "Excellent operating posture" : healthScore >= 70 ? "Stable with review items" : "Needs attention";
  const displayName = context.fullName?.split(" ")[0] ?? "Administrator";

  const notifications = [
    {
      title: `${stats.pendingApprovals} access request${stats.pendingApprovals === 1 ? "" : "s"} need review`,
      tone: stats.pendingApprovals ? "warning" : "success",
      href: "/dashboard/archdiocese/users/approvals",
    },
    {
      title: `${stats.submittedReports} parish report${stats.submittedReports === 1 ? "" : "s"} awaiting review`,
      tone: stats.submittedReports ? "warning" : "success",
      href: "/dashboard/archdiocese/reports/parish-reports",
    },
    {
      title: `${stats.trackedProjects} project${stats.trackedProjects === 1 ? "" : "s"} currently tracked`,
      tone: "info",
      href: "/dashboard/archdiocese/projects",
    },
    {
      title: `${financialSummary.byVicariate.length} vicariate${financialSummary.byVicariate.length === 1 ? "" : "s"} reporting contributions`,
      tone: financialSummary.byVicariate.length ? "success" : "warning",
      href: "/dashboard/archdiocese/contributions",
    },
  ];

  const topProjects = projects.slice(0, 4);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/dashboard"
      eyebrow="Executive Dashboard"
      title={archdiocese.archdioceseName ?? "Archdiocese command center"}
      subtitle="A focused operating view for approvals, finance, reporting, projects, and hierarchy health."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/archdiocese/users/approvals">
            <CheckCircle2 className="h-4 w-4" />
            Review approvals
          </Button>
          <Button href="/dashboard/archdiocese/reports" variant="secondary">
            <ClipboardCheck className="h-4 w-4" />
            View reports
          </Button>
        </div>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <p className="text-sm font-medium text-primary">
              {greeting()}, {displayName}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-on-surface">
              {archdiocese.archdioceseName ?? "Archdiocese Executive Dashboard"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              {stats.pendingApprovals + stats.submittedReports > 0
                ? `${stats.pendingApprovals + stats.submittedReports} items need leadership attention today.`
                : "No urgent approval or report queues are currently visible."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button href="/dashboard/archdiocese/projects/new" variant="secondary">
              <FolderKanban className="h-4 w-4" />
              Add project
            </Button>
            <Button href="/dashboard/archdiocese/contributions" variant="secondary">
              <CircleDollarSign className="h-4 w-4" />
              Contributions
            </Button>
            <Button href="/dashboard/archdiocese/users" variant="secondary">
              <Users className="h-4 w-4" />
              User management
            </Button>
            <Button href="/dashboard/archdiocese/past-documents/import" variant="secondary">
              <ClipboardCheck className="h-4 w-4" />
              Import records
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-on-surface-variant">Annual contributions</p>
                <p className="mt-2 text-3xl font-semibold text-on-surface">
                  {compactCurrency(stats.annualContributions)}
                </p>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {financialSummary.annualByVicariate[0]
                    ? `${financialSummary.annualByVicariate[0].name} leads current-year contributions.`
                    : "Contribution totals will appear as parish reports are recorded."}
                </p>
              </div>
              <Badge variant="info">Finance</Badge>
            </div>
            <div className="mt-4">
              <TrendBars data={financialSummary.byMonth} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 xl:col-span-4">
          <HealthScore score={healthScore} label={healthLabel} />
          <MetricCard
            label="Pending approvals"
            value={stats.pendingApprovals}
            helper="Requires executive action"
            icon={Clock3}
            accent="bg-amber-500"
          />
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Reports" value={stats.submittedReports} helper="Awaiting review" icon={ClipboardCheck} accent="bg-blue-600" />
        <MetricCard label="Projects" value={stats.trackedProjects} helper="Visible across parishes" icon={FolderKanban} accent="bg-violet-600" />
        <MetricCard label="Parishes" value={stats.totalParishes} helper="Operating parish units" icon={ShieldCheck} accent="bg-cyan-600" />
        <MetricCard label="Beneficiaries" value={stats.reportedBeneficiaries} helper="Latest report rollup" icon={Users} accent="bg-emerald-700" />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Monthly contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendBars data={financialSummary.byMonth} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Report status</CardTitle>
          </CardHeader>
          <CardContent>
            <ApprovalDonut
              approved={reportOverview.approved}
              pending={reportOverview.submitted}
              returned={reportOverview.returned}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentActivity.length ? (
                recentActivity.map((item) => {
                  const Icon = activityIcon(item.module);
                  return (
                    <div key={`${item.module}-${item.id}`} className="flex gap-4 border-b border-outline-variant pb-4 last:border-b-0 last:pb-0">
                      <div className="mt-1 rounded-md bg-surface-container p-2 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-on-surface">{item.title}</p>
                          <Badge variant={activityVariant(item.module)}>{item.module}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-on-surface-variant">{item.description}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{relativeDate(item.createdAt)}</p>
                      </div>
                      <Button href={item.href} size="sm" variant="ghost" aria-label={`Open ${item.title}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-on-surface-variant">No recent cross-system activity yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Button
                  key={notification.title}
                  href={notification.href}
                  variant="secondary"
                  className="h-auto w-full justify-start whitespace-normal px-3 py-3 text-left"
                >
                  <Bell
                    className={cn(
                      "h-4 w-4 shrink-0",
                      notification.tone === "warning" && "text-amber-600",
                      notification.tone === "success" && "text-emerald-700",
                      notification.tone === "info" && "text-blue-700",
                    )}
                  />
                  <span>{notification.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Hierarchy overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-on-surface">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">{archdiocese.archdioceseName ?? "Archdiocese"}</span>
              </div>
              <div className="ml-3 border-l border-outline-variant pl-6">
                <p>{stats.totalVicariates} Vicariates</p>
                <div className="mt-3 border-l border-outline-variant pl-6">
                  <p>{stats.totalDeaneries} Deaneries</p>
                  <div className="mt-3 border-l border-outline-variant pl-6">
                    <p>{stats.totalParishes} Parishes</p>
                    <p className="mt-3 text-on-surface-variant">{stats.reportedFamilies} Families</p>
                    <p className="mt-1 text-on-surface-variant">{stats.reportedBeneficiaries} Beneficiaries</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Project progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProjects.length ? (
                topProjects.map((project) => {
                  const budget = project.budgetAmount ?? 0;
                  const raised = project.amountRaised ?? 0;
                  const percent = budget > 0 ? Math.min(100, Math.round((raised / budget) * 100)) : 0;
                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-on-surface">{project.title}</p>
                          <p className="truncate text-xs text-on-surface-variant">{project.parishName ?? "Unassigned parish"}</p>
                        </div>
                        <span className="text-sm font-medium text-on-surface">{percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-container">
                        <div className="h-2 rounded-full bg-violet-700" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-on-surface-variant">No tracked projects yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </ArchdioceseShell>
  );
}
