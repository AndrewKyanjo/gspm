import {
  getDeaneryContributionRows,
  getDeaneryHierarchyContext,
  getDeaneryParishRows,
  getDeaneryProjectRows,
  getDeaneryReportRows,
} from "@/lib/db/queries/deanery";
import type { DeaneryContext, DeaneryDashboardStats, DeaneryRecentActivityItem, DeaneryTrendPoint } from "../types";

function formatMonthLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export async function getDeaneryContext(deaneryId: string): Promise<DeaneryContext> {
  return getDeaneryHierarchyContext(deaneryId);
}

export async function getDeaneryDashboardStats(deaneryId: string): Promise<DeaneryDashboardStats> {
  const [parishes, reports, contributions, projects] = await Promise.all([
    getDeaneryParishRows(deaneryId),
    getDeaneryReportRows(deaneryId),
    getDeaneryContributionRows(deaneryId),
    getDeaneryProjectRows(deaneryId),
  ]);

  const latestReportByParish = new Map<string, Record<string, unknown>>();
  for (const report of reports) {
    if (!latestReportByParish.has(String(report.parish_id))) {
      latestReportByParish.set(String(report.parish_id), report);
    }
  }

  const totalRegisteredFollowers = [...latestReportByParish.values()].reduce(
    (sum, report) => sum + Number(report.total_beneficiaries ?? 0),
    0
  );
  const totalFamilies = [...latestReportByParish.values()].reduce(
    (sum, report) => sum + Number(report.total_households ?? 0),
    0
  );
  const monthlyContributions = contributions
    .filter((row) => {
      const now = new Date();
      const value = new Date(String(row.contributed_on));
      return value.getUTCFullYear() === now.getUTCFullYear() && value.getUTCMonth() === now.getUTCMonth();
    })
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  return {
    totalParishes: parishes.length,
    totalRegisteredFollowers,
    totalFamilies,
    totalSmallChristianCommunities: 0,
    monthlyContributions,
    pendingParishReports: reports.filter((report) => report.status === "submitted").length,
    approvedReports: reports.filter((report) => report.status === "approved").length,
    rejectedReports: reports.filter((report) => report.status === "rejected").length,
    returnedReports: reports.filter((report) => report.status === "returned").length,
    activeProjects: projects.filter((project) => project.status === "active").length,
  };
}

export async function getDeaneryAttendanceTrends(deaneryId: string): Promise<DeaneryTrendPoint[]> {
  const reports = await getDeaneryReportRows(deaneryId);
  const grouped = new Map<string, number>();

  for (const report of reports) {
    const createdAt = report.created_at ? new Date(String(report.created_at)) : null;
    if (!createdAt) {
      continue;
    }

    const label = formatMonthLabel(createdAt.getUTCMonth() + 1, createdAt.getUTCFullYear());
    grouped.set(label, (grouped.get(label) ?? 0) + Number(report.total_beneficiaries ?? 0));
  }

  return [...grouped.entries()].map(([label, value]) => ({ label, value })).slice(-6);
}

export async function getDeaneryProjectProgress(deaneryId: string): Promise<DeaneryTrendPoint[]> {
  const projects = await getDeaneryProjectRows(deaneryId);
  const grouped = new Map<string, number>();

  for (const project of projects) {
    const status = String(project.status ?? "planned");
    grouped.set(status, (grouped.get(status) ?? 0) + 1);
  }

  return [...grouped.entries()].map(([label, value]) => ({ label, value }));
}

export async function getDeaneryRecentActivity(deaneryId: string): Promise<DeaneryRecentActivityItem[]> {
  const [reports, contributions, projects] = await Promise.all([
    getDeaneryReportRows(deaneryId),
    getDeaneryContributionRows(deaneryId),
    getDeaneryProjectRows(deaneryId),
  ]);

  const items: DeaneryRecentActivityItem[] = [
    ...reports.slice(0, 5).map((report) => ({
      id: String(report.id),
      title: `Report ${String(report.id).slice(0, 8)}`,
      description: String(report.summary ?? report.status ?? "Parish report"),
      href: `/dashboard/deanery/reports/${report.id}`,
      createdAt: typeof report.updated_at === "string" ? report.updated_at : null,
      module: "reports" as const,
    })),
    ...contributions.slice(0, 5).map((contribution) => ({
      id: String(contribution.id),
      title: String(contribution.contributor_name),
      description: `${contribution.contribution_type} contribution recorded`,
      href: "/dashboard/deanery/contributions",
      createdAt: typeof contribution.created_at === "string" ? contribution.created_at : null,
      module: "contributions" as const,
    })),
    ...projects.slice(0, 5).map((project) => ({
      id: String(project.id),
      title: String(project.title),
      description: `Project status: ${String(project.status ?? "planned")}`,
      href: `/dashboard/deanery/projects/${project.id}`,
      createdAt: typeof project.updated_at === "string" ? project.updated_at : null,
      module: "projects" as const,
    })),
  ];

  return items
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .slice(0, 8);
}
