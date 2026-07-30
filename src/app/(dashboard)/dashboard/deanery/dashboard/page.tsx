import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  FolderKanban,
  HandCoins,
  Landmark,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
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
import {
  getDeaneryAttendanceTrends,
  getDeaneryContext,
  getDeaneryDashboardStats,
  getDeaneryProjectProgress,
  getDeaneryRecentActivity,
} from "@/features/deanery/dashboard/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function iconForModule(module: string) {
  if (module === "reports") return ClipboardCheck;
  if (module === "contributions") return CircleDollarSign;
  if (module === "projects") return FolderKanban;
  return Activity;
}

function badgeVariantForModule(module: string) {
  if (module === "reports") return "info" as const;
  if (module === "contributions") return "success" as const;
  if (module === "projects") return "default" as const;
  return "default" as const;
}

export default async function DeaneryDashboardPage() {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const [deanery, stats, attendanceTrends, projectProgress, recentActivity] = await Promise.all([
    getDeaneryContext(context.deaneryId),
    getDeaneryDashboardStats(context.deaneryId),
    getDeaneryAttendanceTrends(context.deaneryId),
    getDeaneryProjectProgress(context.deaneryId),
    getDeaneryRecentActivity(context.deaneryId),
  ]);

  const reportTotal = Math.max(stats.pendingParishReports + stats.approvedReports + stats.rejectedReports + stats.returnedReports, 1);
  const reviewCompletion = Math.round((stats.approvedReports / reportTotal) * 100);
  const healthScore = Math.max(
    40,
    Math.min(
      98,
      Math.round(
        reviewCompletion * 0.45 +
          (stats.pendingParishReports ? 55 : 95) * 0.25 +
          Math.min(100, stats.activeProjects * 15) * 0.15 +
          (stats.monthlyContributions > 0 ? 95 : 45) * 0.15,
      ),
    ),
  );
  const healthLabel = healthScore >= 85 ? "Parishes are moving well" : healthScore >= 70 ? "Stable with review work" : "Needs parish coordination";
  const displayName = context.fullName?.split(" ")[0] ?? "Deanery lead";

  const projectStatusItems = projectProgress.map((item) => ({
    id: item.label,
    label: item.label,
    helper: "Parish project status",
    value: Math.min(100, item.value * 20),
    accent: item.label === "active" ? "bg-violet-700" : "bg-primary",
  }));

  const notifications = [
    {
      title: `${stats.pendingParishReports} parish report${stats.pendingParishReports === 1 ? "" : "s"} awaiting review`,
      href: "/dashboard/deanery/reports",
      tone: stats.pendingParishReports ? "warning" as const : "success" as const,
    },
    {
      title: `${stats.activeProjects} active project${stats.activeProjects === 1 ? "" : "s"} across parishes`,
      href: "/dashboard/deanery/projects",
      tone: "info" as const,
    },
    {
      title: `${compactCurrency(stats.monthlyContributions)} recorded this month`,
      href: "/dashboard/deanery/contributions",
      tone: stats.monthlyContributions > 0 ? "success" as const : "warning" as const,
    },
  ];

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/dashboard"
      eyebrow="Deanery Command Center"
      title={deanery.deaneryName ?? "Deanery workspace"}
      subtitle="A parish-coordination view for reports, contributions, projects, and field follow-up."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button href="/dashboard/deanery/reports">
            <ClipboardCheck className="h-4 w-4" />
            Review reports
          </Button>
          <Button href="/dashboard/deanery/parishes" variant="secondary">
            <ShieldCheck className="h-4 w-4" />
            Parishes
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
              {deanery.deaneryName ?? "Deanery operations"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">
              {deanery.vicariateName ?? "Vicariate"}{deanery.archdioceseName ? ` | ${deanery.archdioceseName}` : ""}.{" "}
              {stats.pendingParishReports
                ? `${stats.pendingParishReports} reports need deanery review.`
                : "No parish report queue is currently waiting."}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button href="/dashboard/deanery/contributions" variant="secondary">
              <HandCoins className="h-4 w-4" />
              Contributions
            </Button>
            <Button href="/dashboard/deanery/projects" variant="secondary">
              <FolderKanban className="h-4 w-4" />
              Projects
            </Button>
            <Button href="/dashboard/deanery/documents" variant="secondary">
              <FileClock className="h-4 w-4" />
              Documents
            </Button>
            <Button href="/dashboard/deanery/media" variant="secondary">
              <Activity className="h-4 w-4" />
              Media
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-8">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-on-surface-variant">Reports awaiting review</p>
            <p className="mt-4 text-5xl font-semibold text-on-surface">{stats.pendingParishReports}</p>
            <p className="mt-3 text-sm text-on-surface-variant">
              {stats.totalParishes} parishes in scope, with {stats.approvedReports} approved report cycles and {stats.returnedReports} returned for revision.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <p className="text-sm text-on-surface-variant">Parishes</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{stats.totalParishes}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <p className="text-sm text-on-surface-variant">Families</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{stats.totalFamilies}</p>
              </div>
              <div className="rounded-lg border border-outline-variant bg-surface p-4">
                <p className="text-sm text-on-surface-variant">Beneficiaries</p>
                <p className="mt-2 text-2xl font-semibold text-on-surface">{stats.totalRegisteredFollowers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:col-span-4">
          <HealthScore score={healthScore} label={healthLabel} />
          <MetricCard label="Monthly giving" value={compactCurrency(stats.monthlyContributions)} helper="Current month" icon={HandCoins} accent="bg-blue-600" />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Approved" value={stats.approvedReports} helper="Cleared reports" icon={CheckCircle2} accent="bg-emerald-700" />
        <MetricCard label="Returned" value={stats.returnedReports} helper="Needs revision" icon={Activity} accent="bg-amber-600" />
        <MetricCard label="Rejected" value={stats.rejectedReports} helper="Requires follow-up" icon={XCircle} accent="bg-rose-700" />
        <MetricCard label="Projects" value={stats.activeProjects} helper="Active initiatives" icon={FolderKanban} accent="bg-violet-700" />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TrendBars title="Beneficiary reporting trend" items={attendanceTrends} />
        </div>
        <div className="xl:col-span-4">
          <StatusDonut
            title="Report status"
            segments={[
              { label: "Approved", value: stats.approvedReports, color: "#047857" },
              { label: "Pending", value: stats.pendingParishReports, color: "#d97706" },
              { label: "Returned", value: stats.returnedReports, color: "#be123c" },
            ]}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <DashboardTimeline
            title="Recent parish activity"
            items={recentActivity.map((item) => ({
              ...item,
              icon: iconForModule(item.module),
              badgeVariant: badgeVariantForModule(item.module),
            }))}
          />
        </div>
        <div className="xl:col-span-4">
          <NotificationsPanel items={notifications} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-6">
          <CardHeader>
            <CardTitle>Deanery hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-on-surface">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-primary" />
                <span className="font-medium">{deanery.deaneryName ?? "Deanery"}</span>
              </div>
              <div className="ml-3 border-l border-outline-variant pl-6">
                <p>{stats.totalParishes} Parishes</p>
                <p className="mt-3 text-on-surface-variant">{stats.totalFamilies} Families</p>
                <p className="mt-1 text-on-surface-variant">{stats.totalRegisteredFollowers} Beneficiaries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-6">
          <ProgressList title="Project status" items={projectStatusItems} />
        </div>
      </section>
    </DeaneryShell>
  );
}
