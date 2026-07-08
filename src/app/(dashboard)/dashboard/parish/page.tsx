import { ClipboardList, FileClock, Send, ShieldCheck } from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import {
  getParishDashboardContext,
  getParishDashboardStats,
  getParishDashboardUser,
  getRecentParishReports,
} from "@/features/parish/home/queries";

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "submitted":
      return "info" as const;
    case "draft":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export default async function ParishDashboardPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const [dashboardContext, user, stats, recentReports] = await Promise.all([
    getParishDashboardContext(context.parishId, context.userId, context.role),
    getParishDashboardUser(context.userId),
    getParishDashboardStats(context.parishId),
    getRecentParishReports(context.parishId),
  ]);

  return (
    <ParishShell
      pathname="/dashboard/parish"
      eyebrow="Parish Dashboard"
      title={dashboardContext.parishName ?? "Parish workspace"}
      subtitle="A single operational surface for reports, records, contributions, and local ministry follow-through."
      actions={<Button href="/dashboard/parish/reports">Open reports</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`Welcome back${user?.fullName ? `, ${user.fullName}` : ""}`}
        description={`${dashboardContext.deaneryName ?? "Deanery"}${dashboardContext.vicariateName ? ` • ${dashboardContext.vicariateName}` : ""} • role: ${context.role.replaceAll("_", " ")}`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reports" value={stats.totalReports} helper="All reporting cycles" icon={ClipboardList} />
        <StatCard label="Draft reports" value={stats.draftReports} helper="Needs completion" icon={FileClock} />
        <StatCard label="Submitted" value={stats.submittedReports} helper="Awaiting review" icon={Send} />
        <StatCard label="Approved" value={stats.approvedReports} helper="Cleared cycles" icon={ShieldCheck} />
      </section>

      <SimpleTable
        title="Recent parish reports"
        description="Latest reporting activity for this parish. This uses the live parish_reports table when records exist."
        rows={recentReports}
        columns={[
          {
            header: "Report ID",
            cell: (report) => <span className="font-medium">{report.id.slice(0, 8)}</span>,
          },
          {
            header: "Status",
            cell: (report) => <Badge variant={badgeVariantForStatus(report.status)}>{report.status ?? "unknown"}</Badge>,
          },
          {
            header: "Period",
            cell: (report) => report.reportingPeriodId ? report.reportingPeriodId.slice(0, 8) : "Unlinked",
          },
          {
            header: "Updated",
            cell: (report) => (report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : "-"),
          },
        ]}
      />
    </ParishShell>
  );
}
