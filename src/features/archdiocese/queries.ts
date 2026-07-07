import { buildHierarchyMaps, getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HierarchyLevel } from "@/types/auth";
import type {
  ArchdioceseContext,
  ArchdioceseContributionSummary,
  ArchdioceseDeaneryOverview,
  ArchdioceseExecutiveStats,
  ArchdioceseParishOverview,
  ArchdiocesePendingRequest,
  ArchdioceseProjectOverview,
  ArchdioceseRecentActivityItem,
  ArchdioceseReportOverview,
  ArchdioceseReportSummaryItem,
  ArchdioceseSettingsSnapshot,
  ArchdioceseUserOverview,
  ArchdioceseVicariateOverview,
} from "./types";

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function parseNumeric(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function sumNumericField(rows: Array<Record<string, unknown>>, field: string) {
  return rows.reduce((total, row) => total + parseNumeric(row[field]), 0);
}

async function getArchdioceseHierarchy(archdioceseId: string) {
  const collections = await getHierarchyCollections({ archdioceseId });
  return {
    collections,
    maps: buildHierarchyMaps(collections),
  };
}

export async function getArchdioceseContext(archdioceseId: string): Promise<ArchdioceseContext> {
  const { collections } = await getArchdioceseHierarchy(archdioceseId);
  const archdiocese = collections.archdioceses[0] ?? null;

  return {
    archdioceseId,
    archdioceseName: archdiocese?.name ?? null,
  };
}

export async function getArchdioceseExecutiveStats(archdioceseId: string): Promise<ArchdioceseExecutiveStats> {
  const supabase = createAdminClient();
  const [hierarchy, assignments, approvals, reports, projects, contributions] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("user_assignments")
      .select("id", { count: "exact", head: true })
      .eq("archdiocese_id", archdioceseId)
      .eq("is_active", true),
    supabase
      .from("registration_requests")
      .select("id", { count: "exact", head: true })
      .eq("requested_archdiocese_id", archdioceseId)
      .eq("approval_status", "pending"),
    supabase
      .from("parish_reports")
      .select("id, status, total_households, total_beneficiaries")
      .eq("archdiocese_id", archdioceseId),
    supabase.from("parish_projects").select("id").eq("archdiocese_id", archdioceseId),
    supabase
      .from("parish_contributions")
      .select("amount, contributed_on")
      .eq("archdiocese_id", archdioceseId),
  ]);

  const currentYear = new Date().getUTCFullYear();
  const contributionsThisYear = (contributions.data ?? []).filter((row) => {
    if (typeof row.contributed_on !== "string") {
      return false;
    }

    return new Date(row.contributed_on).getUTCFullYear() === currentYear;
  });

  return {
    totalVicariates: hierarchy.collections.vicariates.length,
    totalDeaneries: hierarchy.collections.deaneries.length,
    totalParishes: hierarchy.collections.parishes.length,
    activeAssignments: assignments.count ?? 0,
    pendingApprovals: approvals.count ?? 0,
    submittedReports: (reports.data ?? []).filter((row) => row.status === "submitted").length,
    approvedReports: (reports.data ?? []).filter((row) => row.status === "approved").length,
    reportedFamilies: sumNumericField((reports.data ?? []) as Array<Record<string, unknown>>, "total_households"),
    reportedBeneficiaries: sumNumericField(
      (reports.data ?? []) as Array<Record<string, unknown>>,
      "total_beneficiaries"
    ),
    trackedProjects: projects.data?.length ?? 0,
    annualContributions: sumNumericField(
      contributionsThisYear as Array<Record<string, unknown>>,
      "amount"
    ),
  };
}

export async function getArchdioceseRecentActivity(
  archdioceseId: string
): Promise<ArchdioceseRecentActivityItem[]> {
  const supabase = createAdminClient();

  const [requestsResult, reportsResult, contributionsResult, projectsResult] = await Promise.all([
    supabase
      .from("registration_requests")
      .select("id, requested_role, requested_level, created_at")
      .eq("requested_archdiocese_id", archdioceseId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("parish_reports")
      .select("id, parish_id, status, updated_at, summary")
      .eq("archdiocese_id", archdioceseId)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("parish_contributions")
      .select("id, parish_id, contributor_name, amount, currency, contributed_on, created_at")
      .eq("archdiocese_id", archdioceseId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("parish_projects")
      .select("id, parish_id, title, status, updated_at")
      .eq("archdiocese_id", archdioceseId)
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const parishIds = unique([
    ...(reportsResult.data ?? []).map((row) => row.parish_id),
    ...(contributionsResult.data ?? []).map((row) => row.parish_id),
    ...(projectsResult.data ?? []).map((row) => row.parish_id),
  ]);

  const { maps } = await getArchdioceseHierarchy(archdioceseId);
  const parishNameMap = new Map(parishIds.map((id) => [id, maps.parishesById.get(id)?.name ?? null]));

  const activity: ArchdioceseRecentActivityItem[] = [
    ...(requestsResult.data ?? []).map((request) => ({
      id: request.id,
      title: "New access request",
      description: `${request.requested_role.replaceAll("_", " ")} for the ${request.requested_level} layer`,
      href: `/dashboard/archdiocese/users/approvals/${request.id}`,
      createdAt: request.created_at,
      module: "approvals" as const,
    })),
    ...(reportsResult.data ?? []).map((report) => ({
      id: report.id,
      title: parishNameMap.get(String(report.parish_id)) ?? "Parish report",
      description: `Report ${report.status ?? "updated"}${report.summary ? ` • ${report.summary.slice(0, 60)}` : ""}`,
      href: `/dashboard/archdiocese/reports`,
      createdAt: report.updated_at ?? null,
      module: "reports" as const,
    })),
    ...(contributionsResult.data ?? []).map((contribution) => ({
      id: contribution.id,
      title: contribution.contributor_name,
      description: `${contribution.currency} ${parseNumeric(contribution.amount).toLocaleString()} • ${parishNameMap.get(String(contribution.parish_id)) ?? "Unknown parish"}`,
      href: "/dashboard/archdiocese/contributions",
      createdAt: contribution.created_at ?? contribution.contributed_on ?? null,
      module: "contributions" as const,
    })),
    ...(projectsResult.data ?? []).map((project) => ({
      id: project.id,
      title: project.title,
      description: `${project.status ?? "Tracked"} • ${parishNameMap.get(String(project.parish_id)) ?? "Unknown parish"}`,
      href: "/dashboard/archdiocese/projects",
      createdAt: project.updated_at ?? null,
      module: "projects" as const,
    })),
  ];

  return activity
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    })
    .slice(0, 10);
}

export async function getArchdioceseVicariateOverviews(
  archdioceseId: string
): Promise<ArchdioceseVicariateOverview[]> {
  const { collections } = await getArchdioceseHierarchy(archdioceseId);

  return collections.vicariates.map((vicariate) => ({
    id: vicariate.id,
    name: vicariate.name,
    code: vicariate.code ?? null,
    status: vicariate.status ?? null,
    deaneryCount: collections.deaneries.filter((deanery) => deanery.vicariate_id === vicariate.id).length,
    parishCount: collections.parishes.filter((parish) => parish.vicariate_id === vicariate.id).length,
  }));
}

export async function getArchdioceseDeaneryOverviews(
  archdioceseId: string
): Promise<ArchdioceseDeaneryOverview[]> {
  const supabase = createAdminClient();
  const [{ collections, maps }, reportsResult] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("parish_reports")
      .select("deanery_id, submitted_at, updated_at")
      .eq("archdiocese_id", archdioceseId),
  ]);

  const latestReportByDeanery = new Map<string, string>();
  for (const row of reportsResult.data ?? []) {
    if (!row.deanery_id) {
      continue;
    }

    const timestamp = row.submitted_at ?? row.updated_at ?? null;
    if (!timestamp) {
      continue;
    }

    const current = latestReportByDeanery.get(row.deanery_id);
    if (!current || new Date(timestamp).getTime() > new Date(current).getTime()) {
      latestReportByDeanery.set(row.deanery_id, timestamp);
    }
  }

  return collections.deaneries.map((deanery) => ({
    id: deanery.id,
    name: deanery.name,
    code: deanery.code ?? null,
    status: deanery.status ?? null,
    vicariateName: maps.vicariatesById.get(deanery.vicariate_id)?.name ?? null,
    parishCount: collections.parishes.filter((parish) => parish.deanery_id === deanery.id).length,
    latestReportSubmittedAt: latestReportByDeanery.get(deanery.id) ?? null,
  }));
}

export async function getArchdioceseParishOverviews(
  archdioceseId: string
): Promise<ArchdioceseParishOverview[]> {
  const supabase = createAdminClient();
  const [{ collections, maps }, reportsResult, projectsResult, contributionsResult] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("parish_reports")
      .select("parish_id, status, updated_at")
      .eq("archdiocese_id", archdioceseId)
      .order("updated_at", { ascending: false }),
    supabase.from("parish_projects").select("parish_id").eq("archdiocese_id", archdioceseId),
    supabase.from("parish_contributions").select("parish_id").eq("archdiocese_id", archdioceseId),
  ]);

  const latestReportStatusByParish = new Map<string, string | null>();
  for (const row of reportsResult.data ?? []) {
    if (!row.parish_id || latestReportStatusByParish.has(row.parish_id)) {
      continue;
    }

    latestReportStatusByParish.set(row.parish_id, row.status ?? null);
  }

  const projectsByParish = new Map<string, number>();
  for (const row of projectsResult.data ?? []) {
    if (!row.parish_id) {
      continue;
    }

    projectsByParish.set(row.parish_id, (projectsByParish.get(row.parish_id) ?? 0) + 1);
  }

  const contributionsByParish = new Map<string, number>();
  for (const row of contributionsResult.data ?? []) {
    if (!row.parish_id) {
      continue;
    }

    contributionsByParish.set(row.parish_id, (contributionsByParish.get(row.parish_id) ?? 0) + 1);
  }

  return collections.parishes.map((parish) => ({
    id: parish.id,
    name: parish.name,
    code: parish.code ?? null,
    status: parish.status ?? null,
    vicariateName: maps.vicariatesById.get(parish.vicariate_id)?.name ?? null,
    deaneryName: maps.deaneriesById.get(parish.deanery_id)?.name ?? null,
    latestReportStatus: latestReportStatusByParish.get(parish.id) ?? null,
    totalProjects: projectsByParish.get(parish.id) ?? 0,
    totalContributions: contributionsByParish.get(parish.id) ?? 0,
  }));
}

export async function getArchdioceseUserOverviews(
  archdioceseId: string
): Promise<ArchdioceseUserOverview[]> {
  const supabase = createAdminClient();
  const [{ maps }, assignmentsResult] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("user_assignments")
      .select("user_id, role, level, vicariate_id, deanery_id, parish_id, is_primary, is_active, assigned_at")
      .eq("archdiocese_id", archdioceseId)
      .order("assigned_at", { ascending: false }),
  ]);

  const userIds = unique((assignmentsResult.data ?? []).map((assignment) => assignment.user_id));
  const profilesResult = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null }> };

  const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

  return (assignmentsResult.data ?? []).map((assignment) => ({
    id: assignment.user_id,
    fullName: profilesById.get(assignment.user_id)?.full_name ?? null,
    email: profilesById.get(assignment.user_id)?.email ?? null,
    role: assignment.role,
    level: assignment.level as HierarchyLevel,
    isPrimary: assignment.is_primary === true,
    isActive: assignment.is_active === true,
    vicariateName: assignment.vicariate_id ? maps.vicariatesById.get(assignment.vicariate_id)?.name ?? null : null,
    deaneryName: assignment.deanery_id ? maps.deaneriesById.get(assignment.deanery_id)?.name ?? null : null,
    parishName: assignment.parish_id ? maps.parishesById.get(assignment.parish_id)?.name ?? null : null,
    assignedAt: assignment.assigned_at ?? null,
  }));
}

export async function getArchdiocesePendingRequests(
  archdioceseId: string
): Promise<ArchdiocesePendingRequest[]> {
  const supabase = createAdminClient();
  const [{ maps }, requestsResult] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("registration_requests")
      .select(
        "id, user_id, requested_role, requested_level, requested_archdiocese_id, requested_vicariate_id, requested_deanery_id, requested_parish_id, created_at"
      )
      .eq("requested_archdiocese_id", archdioceseId)
      .eq("approval_status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const userIds = unique((requestsResult.data ?? []).map((request) => request.user_id));
  const profilesResult = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email, phone").in("id", userIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null; phone: string | null }> };
  const profilesById = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

  return (requestsResult.data ?? []).map((request) => ({
    id: request.id,
    userId: request.user_id,
    requestedRole: request.requested_role,
    requestedLevel: request.requested_level as HierarchyLevel,
    requestedArchdioceseId: request.requested_archdiocese_id,
    requestedVicariateId: request.requested_vicariate_id,
    requestedDeaneryId: request.requested_deanery_id,
    requestedParishId: request.requested_parish_id,
    createdAt: request.created_at,
    profile: profilesById.get(request.user_id)
      ? {
          fullName: profilesById.get(request.user_id)?.full_name ?? null,
          email: profilesById.get(request.user_id)?.email ?? null,
          phone: profilesById.get(request.user_id)?.phone ?? null,
        }
      : null,
    vicariateName: request.requested_vicariate_id
      ? maps.vicariatesById.get(request.requested_vicariate_id)?.name ?? null
      : null,
    deaneryName: request.requested_deanery_id
      ? maps.deaneriesById.get(request.requested_deanery_id)?.name ?? null
      : null,
    parishName: request.requested_parish_id
      ? maps.parishesById.get(request.requested_parish_id)?.name ?? null
      : null,
  }));
}

export async function getArchdioceseReportOverview(
  archdioceseId: string
): Promise<ArchdioceseReportOverview> {
  const supabase = createAdminClient();
  const [{ maps }, reportsResult] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("parish_reports")
      .select("id, parish_id, status, summary, submitted_at, updated_at")
      .eq("archdiocese_id", archdioceseId)
      .order("updated_at", { ascending: false }),
  ]);

  const recentReports: ArchdioceseReportSummaryItem[] = (reportsResult.data ?? []).slice(0, 8).map((report) => {
    const parish = report.parish_id ? maps.parishesById.get(report.parish_id) ?? null : null;
    const deanery = parish ? maps.deaneriesById.get(parish.deanery_id) ?? null : null;
    const vicariate = parish ? maps.vicariatesById.get(parish.vicariate_id) ?? null : null;

    return {
      id: report.id,
      parishId: report.parish_id,
      parishName: parish?.name ?? null,
      deaneryName: deanery?.name ?? null,
      vicariateName: vicariate?.name ?? null,
      status: report.status ?? null,
      summary: report.summary ?? null,
      submittedAt: report.submitted_at ?? null,
      updatedAt: report.updated_at ?? null,
    };
  });

  return {
    submitted: (reportsResult.data ?? []).filter((report) => report.status === "submitted").length,
    approved: (reportsResult.data ?? []).filter((report) => report.status === "approved").length,
    returned: (reportsResult.data ?? []).filter((report) => report.status === "returned").length,
    recentReports,
  };
}

export async function getArchdioceseProjectOverviews(
  archdioceseId: string
): Promise<ArchdioceseProjectOverview[]> {
  const supabase = createAdminClient();
  const [{ maps }, projectsResult] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("parish_projects")
      .select("id, parish_id, title, status, budget_amount, amount_raised, updated_at")
      .eq("archdiocese_id", archdioceseId)
      .order("updated_at", { ascending: false })
      .limit(12),
  ]);

  return (projectsResult.data ?? []).map((project) => {
    const parish = project.parish_id ? maps.parishesById.get(project.parish_id) ?? null : null;
    const deanery = parish ? maps.deaneriesById.get(parish.deanery_id) ?? null : null;
    const vicariate = parish ? maps.vicariatesById.get(parish.vicariate_id) ?? null : null;

    return {
      id: project.id,
      title: project.title,
      status: project.status ?? null,
      parishName: parish?.name ?? null,
      deaneryName: deanery?.name ?? null,
      vicariateName: vicariate?.name ?? null,
      budgetAmount: project.budget_amount == null ? null : Number(project.budget_amount),
      amountRaised: project.amount_raised == null ? null : Number(project.amount_raised),
      updatedAt: project.updated_at ?? null,
    };
  });
}

export async function getArchdioceseContributionSummary(
  archdioceseId: string
): Promise<ArchdioceseContributionSummary> {
  const supabase = createAdminClient();
  const [{ maps }, contributionsResult] = await Promise.all([
    getArchdioceseHierarchy(archdioceseId),
    supabase
      .from("parish_contributions")
      .select("id, parish_id, vicariate_id, contributor_name, contribution_type, amount, currency, contributed_on")
      .eq("archdiocese_id", archdioceseId)
      .order("contributed_on", { ascending: false }),
  ]);

  const byVicariateMap = new Map<string, number>();
  for (const row of contributionsResult.data ?? []) {
    if (!row.vicariate_id) {
      continue;
    }

    byVicariateMap.set(row.vicariate_id, (byVicariateMap.get(row.vicariate_id) ?? 0) + parseNumeric(row.amount));
  }

  return {
    totalAmount: sumNumericField((contributionsResult.data ?? []) as Array<Record<string, unknown>>, "amount"),
    byVicariate: [...byVicariateMap.entries()]
      .map(([vicariateId, amount]) => ({
        name: maps.vicariatesById.get(vicariateId)?.name ?? "Unknown vicariate",
        amount,
      }))
      .sort((left, right) => right.amount - left.amount),
    recentContributions: (contributionsResult.data ?? []).slice(0, 10).map((row) => ({
      id: row.id,
      contributorName: row.contributor_name,
      contributionType: row.contribution_type,
      amount: parseNumeric(row.amount),
      currency: row.currency,
      parishName: row.parish_id ? maps.parishesById.get(row.parish_id)?.name ?? null : null,
      contributedOn: row.contributed_on,
    })),
  };
}

export async function getArchdioceseSettingsSnapshot(
  archdioceseId: string,
  userId: string
): Promise<ArchdioceseSettingsSnapshot> {
  const supabase = createAdminClient();
  const [context, hierarchy, userResult] = await Promise.all([
    getArchdioceseContext(archdioceseId),
    getArchdioceseHierarchy(archdioceseId),
    supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
  ]);

  return {
    archdioceseName: context.archdioceseName,
    currentUserName: userResult.data?.full_name ?? null,
    currentUserEmail: userResult.data?.email ?? null,
    totalVicariates: hierarchy.collections.vicariates.length,
    totalDeaneries: hierarchy.collections.deaneries.length,
    totalParishes: hierarchy.collections.parishes.length,
    hierarchyDepth: 4,
  };
}
