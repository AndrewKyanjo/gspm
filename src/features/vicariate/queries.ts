import { getHierarchyCollections, buildHierarchyMaps } from "@/lib/db/queries/hierarchy";
import { getContributionRollupReport, getProjectContributionBreakdowns } from "@/features/contributions/queries";
import { createAdminClient } from "@/lib/supabase/admin";

// ── Types ───────────────────────────────────────────────────────

export type VicariateDashboard = {
  vicariateName: string | null;
  totalDeaneries: number;
  totalParishes: number;
  compliancePercent: number;
  goodSamaritanCleared: number;
  projectContributionsRaised: number;
  arrears: Array<{
    parishId: string;
    parishName: string;
    deaneryName: string | null;
    balance: number;
  }>;
};

export type VicariateProjectOverview = {
  id: string;
  parishName: string | null;
  deaneryName: string | null;
  title: string;
  category: string | null;
  status: string | null;
  location: string | null;
  budgetAmount: number | null;
  amountRaised: number | null;
  targetEndDate: string | null;
  updatedAt: string | null;
  coverImageUrl: string | null;
};

export type VicariateParishOverview = {
  id: string;
  name: string;
  code: string | null;
  deaneryName: string | null;
  status: string | null;
  latestReportStatus: string | null;
  totalProjects: number;
  totalContributions: number;
};

export type VicariateReportSummary = {
  id: string;
  parishId: string;
  parishName: string | null;
  deaneryName: string | null;
  reportingPeriodLabel: string | null;
  status: string | null;
  summary: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
};

export type VicariateReportDetail = VicariateReportSummary & {
  totalHouseholds: number;
  totalBeneficiaries: number;
  maleBeneficiaries: number;
  femaleBeneficiaries: number;
  youthBeneficiaries: number;
  elderlyBeneficiaries: number;
  totalCasesOpened: number;
  totalCasesClosed: number;
  totalDonationsReceived: number;
  totalAmountDisbursed: number;
  challenges: string | null;
  recommendations: string | null;
};

export type VicariateDocumentItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  versionNumber: number;
  isArchived: boolean;
  createdAt: string;
  uploadedByName: string | null;
  downloadUrl: string | null;
  path: string;
};

export type VicariateMediaItem = {
  path: string;
  name: string;
  parishName: string | null;
  deaneryName: string | null;
  monthLabel: string;
  category: "vicariate" | "parish";
  updatedAt: string | null;
  previewUrl: string | null;
};

export type VicariateMediaMonthGroup = {
  monthKey: string;
  monthLabel: string;
  items: VicariateMediaItem[];
};

export type VicariateSettingsContext = {
  vicariateId: string;
  vicariateName: string | null;
  archdioceseName: string | null;
};

export type VicariateSettingsUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
};

// ── Dashboard ───────────────────────────────────────────────────

export async function getVicariateDashboard({
  archdioceseId,
  vicariateId,
  year = new Date().getUTCFullYear(),
}: {
  archdioceseId: string;
  vicariateId: string;
  year?: number;
}): Promise<VicariateDashboard> {
  const month = new Date().getUTCMonth() + 1;
  const [hierarchy, report, projectBreakdowns] = await Promise.all([
    getHierarchyCollections({ archdioceseId, vicariateId }),
    getContributionRollupReport({
      scope: { archdioceseId, vicariateId },
      year,
      month,
      title: "Vicariate monthly contribution report",
    }),
    getProjectContributionBreakdowns({ archdioceseId, vicariateId }),
  ]);

  const totalDue = report.totals.annualDue;
  const compliancePercent = totalDue > 0 ? Math.round((report.totals.ytdPaid / totalDue) * 100) : 0;

  return {
    vicariateName: hierarchy.vicariates[0]?.name ?? null,
    totalDeaneries: hierarchy.deaneries.length,
    totalParishes: hierarchy.parishes.length,
    compliancePercent,
    goodSamaritanCleared: report.totals.goodSamaritanClearedCount,
    projectContributionsRaised: projectBreakdowns.reduce((total, project) => total + project.totalRaised, 0),
    arrears: report.rows
      .filter((row) => row.annualBalance > 0)
      .map((row) => ({
        parishId: row.parishId,
        parishName: row.parishName,
        deaneryName: row.deaneryName,
        balance: row.annualBalance,
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 12),
  };
}

// ── Projects ────────────────────────────────────────────────────

export async function getVicariateProjects(
  archdioceseId: string,
  vicariateId: string,
): Promise<VicariateProjectOverview[]> {
  const supabase = createAdminClient();
  const [hierarchy, projectsResult] = await Promise.all([
    getHierarchyCollections({ archdioceseId, vicariateId }),
    supabase
      .from("parish_projects")
      .select("*")
      .eq("vicariate_id", vicariateId)
      .order("updated_at", { ascending: false }),
  ]);

  const maps = buildHierarchyMaps(hierarchy);
  const projects = projectsResult.data ?? [];

  return projects.map((p) => ({
    id: p.id,
    parishName: p.parish_id ? maps.parishesById.get(p.parish_id)?.name ?? null : null,
    deaneryName: p.parish_id
      ? (() => {
          const parish = maps.parishesById.get(p.parish_id);
          return parish ? maps.deaneriesById.get(parish.deanery_id)?.name ?? null : null;
        })()
      : null,
    title: p.title ?? "",
    category: typeof p.category === "string" ? p.category : null,
    status: typeof p.status === "string" ? p.status : null,
    location: typeof p.location === "string" ? p.location : null,
    budgetAmount: p.budget_amount == null ? null : Number(p.budget_amount),
    amountRaised: p.amount_raised == null ? null : Number(p.amount_raised),
    targetEndDate: typeof p.target_end_date === "string" ? p.target_end_date : null,
    updatedAt: typeof p.updated_at === "string" ? p.updated_at : null,
    coverImageUrl: null,
  }));
}

export async function getVicariateProjectDetail(
  archdioceseId: string,
  vicariateId: string,
  projectId: string,
): Promise<VicariateProjectOverview | null> {
  const projects = await getVicariateProjects(archdioceseId, vicariateId);
  return projects.find((p) => p.id === projectId) ?? null;
}

// ── Parishes ────────────────────────────────────────────────────

export async function getVicariateParishOverviews(
  archdioceseId: string,
  vicariateId: string,
): Promise<VicariateParishOverview[]> {
  const supabase = createAdminClient();
  const [hierarchy, reportsResult, projectsResult, contributionsResult] = await Promise.all([
    getHierarchyCollections({ archdioceseId, vicariateId }),
    supabase
      .from("parish_reports")
      .select("parish_id, status, updated_at")
      .eq("vicariate_id", vicariateId)
      .order("updated_at", { ascending: false }),
    supabase.from("parish_projects").select("parish_id").eq("vicariate_id", vicariateId),
    supabase.from("parish_contributions").select("parish_id").eq("vicariate_id", vicariateId),
  ]);

  const maps = buildHierarchyMaps(hierarchy);

  const latestReportStatus = new Map<string, string>();
  for (const row of reportsResult.data ?? []) {
    if (!row.parish_id || latestReportStatus.has(row.parish_id)) continue;
    latestReportStatus.set(row.parish_id, row.status ?? "unknown");
  }

  const projectCounts = new Map<string, number>();
  for (const row of projectsResult.data ?? []) {
    if (!row.parish_id) continue;
    projectCounts.set(row.parish_id, (projectCounts.get(row.parish_id) ?? 0) + 1);
  }

  const contributionCounts = new Map<string, number>();
  for (const row of contributionsResult.data ?? []) {
    if (!row.parish_id) continue;
    contributionCounts.set(row.parish_id, (contributionCounts.get(row.parish_id) ?? 0) + 1);
  }

  return hierarchy.parishes.map((parish) => ({
    id: parish.id,
    name: parish.name,
    code: parish.code ?? null,
    deaneryName: maps.deaneriesById.get(parish.deanery_id)?.name ?? null,
    status: parish.status ?? null,
    latestReportStatus: latestReportStatus.get(parish.id) ?? null,
    totalProjects: projectCounts.get(parish.id) ?? 0,
    totalContributions: contributionCounts.get(parish.id) ?? 0,
  }));
}

// ── Reports ─────────────────────────────────────────────────────

export async function getVicariateReports(
  archdioceseId: string,
  vicariateId: string,
  filters?: { status?: string; query?: string },
): Promise<VicariateReportSummary[]> {
  const supabase = createAdminClient();
  const [hierarchy, reportsResult, periodsResult] = await Promise.all([
    getHierarchyCollections({ archdioceseId, vicariateId }),
    supabase
      .from("parish_reports")
      .select("id, parish_id, deanery_id, reporting_period_id, status, summary, submitted_at, updated_at")
      .eq("vicariate_id", vicariateId)
      .order("updated_at", { ascending: false }),
    supabase.from("reporting_periods").select("id, year, month"),
  ]);

  const maps = buildHierarchyMaps(hierarchy);
  const periodLabels = new Map(
    (periodsResult.data ?? []).map((p) => [p.id, `${p.year}-${String(p.month).padStart(2, "0")}`]),
  );

  let rows = (reportsResult.data ?? []).map((r) => ({
    id: r.id,
    parishId: r.parish_id,
    parishName: r.parish_id ? maps.parishesById.get(r.parish_id)?.name ?? null : null,
    deaneryName: r.deanery_id ? maps.deaneriesById.get(r.deanery_id)?.name ?? null : null,
    reportingPeriodLabel: r.reporting_period_id ? periodLabels.get(r.reporting_period_id) ?? null : null,
    status: r.status ?? null,
    summary: r.summary ?? null,
    submittedAt: r.submitted_at ?? null,
    updatedAt: r.updated_at ?? null,
  }));

  if (filters?.status) {
    rows = rows.filter((r) => r.status === filters.status);
  }
  if (filters?.query) {
    const q = filters.query.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.parishName?.toLowerCase().includes(q) ||
        r.deaneryName?.toLowerCase().includes(q) ||
        r.reportingPeriodLabel?.toLowerCase().includes(q) ||
        r.summary?.toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function getVicariateReportDetail(
  archdioceseId: string,
  vicariateId: string,
  reportId: string,
): Promise<VicariateReportDetail | null> {
  const supabase = createAdminClient();
  const [hierarchy, reportResult] = await Promise.all([
    getHierarchyCollections({ archdioceseId, vicariateId }),
    supabase.from("parish_reports").select("*").eq("id", reportId).eq("vicariate_id", vicariateId).maybeSingle(),
  ]);

  if (!reportResult.data) return null;
  const r = reportResult.data;
  const maps = buildHierarchyMaps(hierarchy);
  const periodLabel = r.reporting_period_id
    ? await supabase
        .from("reporting_periods")
        .select("year, month")
        .eq("id", r.reporting_period_id)
        .maybeSingle()
        .then(({ data }) =>
          data ? `${data.year}-${String(data.month).padStart(2, "0")}` : null,
        )
    : null;

  return {
    id: r.id,
    parishId: r.parish_id,
    parishName: r.parish_id ? maps.parishesById.get(r.parish_id)?.name ?? null : null,
    deaneryName: r.deanery_id ? maps.deaneriesById.get(r.deanery_id)?.name ?? null : null,
    reportingPeriodLabel: periodLabel,
    status: r.status ?? null,
    summary: r.summary ?? null,
    submittedAt: r.submitted_at ?? null,
    updatedAt: r.updated_at ?? null,
    totalHouseholds: Number(r.total_households ?? 0),
    totalBeneficiaries: Number(r.total_beneficiaries ?? 0),
    maleBeneficiaries: Number(r.male_beneficiaries ?? 0),
    femaleBeneficiaries: Number(r.female_beneficiaries ?? 0),
    youthBeneficiaries: Number(r.youth_beneficiaries ?? 0),
    elderlyBeneficiaries: Number(r.elderly_beneficiaries ?? 0),
    totalCasesOpened: Number(r.total_cases_opened ?? 0),
    totalCasesClosed: Number(r.total_cases_closed ?? 0),
    totalDonationsReceived: Number(r.total_donations_received ?? 0),
    totalAmountDisbursed: Number(r.total_amount_disbursed ?? 0),
    challenges: typeof r.challenges === "string" ? r.challenges : null,
    recommendations: typeof r.recommendations === "string" ? r.recommendations : null,
  };
}

// ── Documents ───────────────────────────────────────────────────

export async function getVicariateDocuments(
  vicariateId: string,
  query?: string,
): Promise<VicariateDocumentItem[]> {
  const supabase = createAdminClient();
  let dbQuery = supabase
    .from("vicariate_documents")
    .select("*")
    .eq("vicariate_id", vicariateId)
    .order("created_at", { ascending: false });

  if (query) {
    dbQuery = dbQuery.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
  }

  const { data } = await dbQuery;
  const rows = data ?? [];

  return rows.map((doc) => ({
    id: doc.id,
    title: doc.title ?? "Untitled",
    category: doc.category ?? "general",
    description: typeof doc.description === "string" ? doc.description : null,
    versionNumber: doc.version_number == null ? 1 : Number(doc.version_number),
    isArchived: doc.is_archived === true,
    createdAt: doc.created_at ?? new Date().toISOString(),
    uploadedByName: null,
    downloadUrl: null,
    path: doc.storage_path ?? "",
  }));
}

// ── Media ───────────────────────────────────────────────────────

function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return monthKey;
  return date.toLocaleDateString("en-US", { month: "long", year: "2-digit", timeZone: "UTC" });
}

export async function getVicariateMediaGroups(
  archdioceseId: string,
  vicariateId: string,
): Promise<VicariateMediaMonthGroup[]> {
  const supabase = createAdminClient();
  const [hierarchy, mediaResult] = await Promise.all([
    getHierarchyCollections({ archdioceseId, vicariateId }),
    supabase
      .from("past_media_imports")
      .select("id, title, description, parish_id, deanery_id, final_storage_path, scope_level, captured_on, created_at")
      .eq("review_status", "published")
      .or(`scope_level.eq.vicariate,and(vicariate_id.eq.${vicariateId},scope_level.eq.parish)`)
      .not("final_storage_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(60),
  ]);

  const maps = buildHierarchyMaps(hierarchy);
  const grouped = new Map<string, VicariateMediaItem[]>();

  for (const item of mediaResult.data ?? []) {
    const createdAt = item.created_at ?? new Date().toISOString();
    const monthKey = createdAt.slice(0, 7); // YYYY-MM
    const storagePath = String(item.final_storage_path);
    const bucket = item.scope_level === "vicariate" ? "vicariate-media" : "parish-media";

    let previewUrl: string | null = null;
    try {
      const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 60 * 15);
      previewUrl = signed?.signedUrl ?? null;
    } catch {
      // noop
    }

    const parishName = item.parish_id ? maps.parishesById.get(item.parish_id)?.name ?? null : null;
    const deaneryName = item.deanery_id
      ? maps.deaneriesById.get(item.deanery_id)?.name ?? null
      : item.parish_id
        ? (() => {
            const parish = maps.parishesById.get(item.parish_id);
            return parish ? maps.deaneriesById.get(parish.deanery_id)?.name ?? null : null;
          })()
        : null;

    const mediaItem: VicariateMediaItem = {
      path: storagePath,
      name: item.title ?? "Media",
      parishName,
      deaneryName,
      monthLabel: formatMonthLabel(monthKey),
      category: item.scope_level === "vicariate" ? "vicariate" : "parish",
      updatedAt: createdAt,
      previewUrl,
    };

    grouped.set(monthKey, [...(grouped.get(monthKey) ?? []), mediaItem]);
  }

  return [...grouped.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, items]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      items: items.sort(
        (a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime(),
      ),
    }))
    .filter((group) => group.items.length);
}

// ── Settings ────────────────────────────────────────────────────

export async function getVicariateSettingsOverview(
  archdioceseId: string,
  vicariateId: string,
): Promise<{ context: VicariateSettingsContext; users: VicariateSettingsUser[] }> {
  const supabase = createAdminClient();
  const [hierarchy, assignmentsResult] = await Promise.all([
    getHierarchyCollections({ archdioceseId, vicariateId }),
    supabase
      .from("user_assignments")
      .select("user_id, role_id, is_primary, is_active")
      .eq("vicariate_id", vicariateId)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false }),
  ]);

  const vicariate = hierarchy.vicariates[0] ?? null;
  const archdiocese = vicariate
    ? hierarchy.archdioceses.find((a) => a.id === vicariate.archdiocese_id) ?? null
    : null;

  const assignments = assignmentsResult.data ?? [];
  const userIds = [...new Set(assignments.map((a) => a.user_id).filter(Boolean))] as string[];

  let profileMap = new Map<string, { fullName: string | null; email: string | null }>();
  let roleMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { fullName: p.full_name ?? null, email: p.email ?? null });
    }
  }

  const roleIds = [...new Set(assignments.map((a) => a.role_id).filter(Boolean))] as string[];
  if (roleIds.length > 0) {
    const { data: roles } = await supabase.from("roles").select("id, name").in("id", roleIds);
    for (const r of roles ?? []) {
      roleMap.set(r.id, r.name ?? "unknown");
    }
  }

  return {
    context: {
      vicariateId,
      vicariateName: vicariate?.name ?? null,
      archdioceseName: archdiocese?.name ?? null,
    },
    users: assignments.map((a) => {
      const profile = profileMap.get(a.user_id);
      return {
        id: a.user_id,
        fullName: profile?.fullName ?? null,
        email: profile?.email ?? null,
        role: roleMap.get(a.role_id ?? "") ?? "unknown",
        isPrimary: a.is_primary === true,
        isActive: a.is_active === true,
      };
    }),
  };
}
