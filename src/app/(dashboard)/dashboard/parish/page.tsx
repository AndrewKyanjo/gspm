import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileClock,
  FolderKanban,
  HandCoins,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  compactCurrency,
  greeting,
  DashboardTimeline,
  HealthScore,
  MetricCard,
  NotificationsPanel,
  ProgressList,
  StatusDonut,
  TrendBars,
} from "@/components/dashboard/shared/command-dashboard";
import { requireAuth } from "@/lib/auth/requireAuth";
import {
  getParishDashboardContext,
  getParishDashboardStats,
  getParishDashboardUser,
  getRecentParishReports,
} from "@/features/parish/home/queries";
import { getParishContributions } from "@/features/parish/contributions/queries";
import { getParishProjects } from "@/features/parish/projects/queries";

function statusIcon(status: string | null) {
  if (status === "approved") return CheckCircle2;
  if (status === "submitted") return Send;
  if (status === "draft") return FileClock;
  return ClipboardList;
}

function badgeVariantForStatus(status: string | null) {
  if (status === "approved") return "success" as const;
  if (status === "submitted") return "info" as const;
  if (status === "draft") return "warning" as const;
  return "default" as const;
}

function monthLabel(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
}

export default async function ParishDashboardPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const [dashboardContext, user, stats, recentReports, contributions, projects] = await Promise.all([
    getParishDashboardContext(context.parishId, context.userId, context.role),
    getParishDashboardUser(context.userId),
    getParishDashboardStats(context.parishId),
    getRecentParishReports(context.parishId),
    getParishContributions(context.parishId),
    getParishProjects(context.parishId),
  ]);

  const contributionTotal = contributions.reduce((total, item) => total + item.amount, 0);
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const reportTotal = Math.max(stats.totalReports, 1);
  const approvedPercent = Math.round((stats.approvedReports / reportTotal) * 100);
  const healthScore = Math.max(
    40,
    Math.min(
      98,
      Math.round(
        approvedPercent * 0.45 +
          (stats.draftReports ? 50 : 90) * 0.2 +
          (stats.submittedReports ? 80 : 70) * 0.15 +
          (contributionTotal > 0 ? 95 : 45) * 0.1 +
          (projects.length ? 85 : 60) * 0.1,
      ),
    ),
  );
  const healthLabel = healthScore >= 85 ? "Parish operations are current" : healthScore >= 70 ? "Stable with open work" : "Needs reporting follow-up";
  const displayName = user?.fullName?.split(" ")[0] ?? context.fullName?.split(" ")[0] ?? "Parish team";

  const contributionTrend = contributions
    .slice(0, 12)
    .reverse()
    .reduce((items, contribution) => {
      const label = monthLabel(contribution.contributedOn);
      const existing = items.find((item) => item.label === label);
      if (existing) {
        existing.value += contribution.amount;
      } else {
        items.push({ label, value: contribution.amount });
      }
      return items;
    }, [] as Array<{ label: string; value: number }>);

  const projectProgress = projects.slice(0, 5).map((project) => {
    const budget = project.budgetAmount ?? 0;
    const raised = project.amountRaised ?? 0;
    return {
      id: project.id,
      label: project.title,
      helper: project.status ?? project.category,
      value: budget > 0 ? Math.min(100, Math.round((raised / budget) * 100)) : project.status === "active" ? 35 : 10,
      accent: "bg-violet-700",
    };
  });

  const reportTimeline = recentReports.map((report) => ({
    id: report.id,
    title: `Report ${report.reportingPeriodLabel ?? report.id.slice(0, 8)}`,
    description: `Status: ${report.status ?? "unknown"}`,
    href: `/dashboard/parish/reports/${report.id}`,
    createdAt: report.updatedAt,
    module: "reports",
    icon: statusIcon(report.status),
    badgeVariant: badgeVariantForStatus(report.status),
  }));

  const notifications = [
    {
      title: `${stats.draftReports} draft report${stats.draftReports === 1 ? "" : "s"} need completion`,
      href: "/dashboard/parish/reports",
      tone: stats.draftReports ? "warning" as const : "success" as const,
    },
    {
      title: `${stats.submittedReports} submitted report${stats.submittedReports === 1 ? "" : "s"} awaiting review`,
      href: "/dashboard/parish/reports",
      tone: stats.submittedReports ? "info" as const : "success" as const,
    },
    {
      title: `${activeProjects} active project${activeProjects === 1 ? "" : "s"} in the parish register`,
      href: "/dashboard/parish/projects",
      tone: activeProjects ? "info" as const : "warning" as const,
    },
  ];

  return (
    <ParishShell
      pathname="/dashboard/parish"
      eyebrow="Parish Command Center"
      title={dashboardContext.parishName ?? "Parish workspace"}
      subtitle="A local operations view for reports, contributions, projects, documents, and ministry follow-through."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/parish/reports/new">
            <ClipboardList className="h-4 w-4" />
            New report
          </Button>
          <Button href="/dashboard/parish/contributions/new" variant="secondary">
            <HandCoins className="h-4 w-4" />
            Add contribution
          </Button>
        </div>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <section className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <p className="text-sm font-medium text-primary">
              {greeting()}, {displayName}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-on-surface">
              {dashboardContext.parishName ?? "Parish dashboard"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">
              {dashboardContext.deaneryName ?? "Deanery"}{dashboardContext.vicariateName ? ` | ${dashboardContext.vicariateName}` : ""}.{" "}
              {stats.draftReports
                ? `${stats.draftReports} reports are still in draft.`
                : "No draft report queue is currently visible."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button href="/dashboard/parish/reports" variant="secondary">
              <Send className="h-4 w-4" />
              Reports
            </Button>
            <Button href="/dashboard/parish/projects" variant="secondary">
              <FolderKanban className="h-4 w-4" />
              Projects
            </Button>
            <Button href="/dashboard/parish/documents" variant="secondary">
              <FileClock className="h-4 w-4" />
              Documents
            </Button>
            <Button href="/dashboard/parish/media" variant="secondary">
              <Activity className="h-4 w-4" />
              Media
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-on-surface-variant">Parish contributions</p>
            <p className="mt-4 text-5xl font-semibold text-on-surface">{compactCurrency(contributionTotal)}</p>
            <p className="mt-3 text-sm text-on-surface-variant">
              {stats.totalReports} report cycles recorded, with {stats.approvedReports} approved and {stats.submittedReports} awaiting review.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <p className="text-sm text-on-surface-variant">Reports</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{stats.totalReports}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <p className="text-sm text-on-surface-variant">Projects</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{projects.length}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <p className="text-sm text-on-surface-variant">Contributions</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{contributions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-4">
          <HealthScore score={healthScore} label={healthLabel} />
          <MetricCard label="Draft reports" value={stats.draftReports} helper="Needs completion" icon={FileClock} accent="bg-amber-600" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Submitted" value={stats.submittedReports} helper="Awaiting review" icon={Send} accent="bg-blue-600" />
        <MetricCard label="Approved" value={stats.approvedReports} helper="Cleared cycles" icon={ShieldCheck} accent="bg-emerald-700" />
        <MetricCard label="Projects" value={projects.length} helper={`${activeProjects} active`} icon={FolderKanban} accent="bg-violet-700" />
        <MetricCard label="Contributions" value={contributions.length} helper="Recorded entries" icon={CircleDollarSign} accent="bg-cyan-600" />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TrendBars title="Contribution trend" items={contributionTrend} formatter={(value) => compactCurrency(value)} />
        </div>
        <div className="xl:col-span-4">
          <StatusDonut
            title="Report status"
            segments={[
              { label: "Approved", value: stats.approvedReports, color: "#047857" },
              { label: "Submitted", value: stats.submittedReports, color: "#2563eb" },
              { label: "Draft", value: stats.draftReports, color: "#d97706" },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardTimeline title="Recent reports" items={reportTimeline} />
        </div>
        <div className="xl:col-span-4">
          <NotificationsPanel items={notifications} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Parish context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-on-surface">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">{dashboardContext.parishName ?? "Parish"}</span>
              </div>
              <div className="ml-3 border-l border-outline-variant pl-6">
                <p>{dashboardContext.deaneryName ?? "Deanery"}</p>
                <div className="mt-3 border-l border-outline-variant pl-6">
                  <p>{dashboardContext.vicariateName ?? "Vicariate"}</p>
                  <p className="mt-3 text-on-surface-variant">Role: {context.role.replaceAll("_", " ")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-6">
          <ProgressList title="Project progress" items={projectProgress} />
        </div>
      </section>
    </ParishShell>
  );
}
