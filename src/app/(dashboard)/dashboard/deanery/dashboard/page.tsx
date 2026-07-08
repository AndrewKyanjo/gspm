import { Activity, CheckCircle2, FolderKanban, HandCoins, Landmark, Users, XCircle } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { BarListChart } from "@/components/dashboard/deanery/charts/bar-list-chart";
import { TrendBars } from "@/components/dashboard/deanery/charts/trend-bars";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { getDeaneryAttendanceTrends, getDeaneryContext, getDeaneryDashboardStats, getDeaneryProjectProgress, getDeaneryRecentActivity } from "@/features/deanery/dashboard/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

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

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/dashboard"
      eyebrow="Deanery Dashboard"
      title={deanery.deaneryName ?? "Deanery workspace"}
      subtitle="Executive supervision across all parishes within the deanery."
      actions={<Button href="/dashboard/deanery/reports">Review reports</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Executive dashboard"
        description={`${deanery.vicariateName ?? "Vicariate"}${deanery.archdioceseName ? ` • ${deanery.archdioceseName}` : ""} • aggregated parish performance and workflow oversight.`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total parishes" value={stats.totalParishes} helper="Assigned to this deanery" icon={Landmark} />
        <StatCard label="Total registered followers" value={stats.totalRegisteredFollowers} helper="Derived from latest parish reports" icon={Users} />
        <StatCard label="Families" value={stats.totalFamilies} helper="Latest household totals" icon={Users} />
        <StatCard label="Small Christian Communities" value={stats.totalSmallChristianCommunities} helper="Current schema does not capture this yet" icon={Users} />
        <StatCard label="Monthly contributions" value={currencyFormatter.format(stats.monthlyContributions)} helper="Current month aggregate" icon={HandCoins} />
        <StatCard label="Projects in flight" value={stats.activeProjects} helper="Active parish initiatives" icon={FolderKanban} />
        <StatCard label="Pending reports" value={stats.pendingParishReports} helper="Awaiting deanery review" icon={Activity} />
        <StatCard label="Approved reports" value={stats.approvedReports} helper="Cleared by deanery" icon={CheckCircle2} />
        <StatCard label="Rejected reports" value={stats.rejectedReports} helper="Requires follow-up" icon={XCircle} />
        <StatCard label="Returned reports" value={stats.returnedReports} helper="Sent back for revision" icon={Activity} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TrendBars
          title="Attendance trends"
          description="Beneficiary totals reported across the most recent reporting months."
          items={attendanceTrends}
        />
        <BarListChart
          title="Projects progress"
          description="Current project count by status across parish initiatives."
          items={projectProgress}
        />
      </section>

      <SimpleTable
        title="Recent activity"
        description="The latest reporting, contribution, and project activity across the deanery."
        rows={recentActivity}
        columns={[
          { header: "Item", cell: (item) => <span className="font-medium">{item.title}</span> },
          { header: "Module", cell: (item) => item.module },
          { header: "Details", cell: (item) => item.description },
          { header: "When", cell: (item) => (item.createdAt ? new Date(item.createdAt).toLocaleString() : "-") },
          { header: "Open", cell: (item) => <Button href={item.href} size="sm" variant="secondary">View</Button> },
        ]}
      />
    </DeaneryShell>
  );
}
