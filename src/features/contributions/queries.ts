import { buildHierarchyMaps, getHierarchyCollections, type HierarchyScope } from "@/lib/db/queries/hierarchy";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContributionReportRow,
  ContributionRollupReport,
  ContributionProjectOverview,
  EmitemwaPayment,
  MonthContributionStatus,
  ParishContributionDashboard,
  ParishContributionProject,
  ProjectContributionBreakdown,
} from "./types";

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type GenericRow = Record<string, unknown>;

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function mapPayment(row: GenericRow, parishName: string | null = null): EmitemwaPayment {
  return {
    id: String(row.id),
    parishId: String(row.parish_id),
    parishName,
    paymentKind: row.payment_kind === "good_samaritan_day" ? "good_samaritan_day" : "monthly",
    contributionYear: Number(row.contribution_year),
    contributionMonth: row.contribution_month == null ? null : Number(row.contribution_month),
    amount: numberValue(row.amount),
    currency: String(row.currency ?? "UGX"),
    paidOn: String(row.paid_on),
    paymentMethod: stringValue(row.payment_method),
    referenceNumber: stringValue(row.reference_number),
    notes: stringValue(row.notes),
  };
}

function statusFor(paid: number, due: number): MonthContributionStatus {
  if (paid >= due && due > 0) return "paid";
  if (paid > 0) return "partial";
  return "unpaid";
}

function sumRows(rows: GenericRow[], field: string) {
  return rows.reduce((total, row) => total + numberValue(row[field]), 0);
}

async function getParishContext(parishId: string) {
  const supabase = createAdminClient();
  const { data: parish } = await supabase
    .from("parishes")
    .select("id, name, archdiocese_id, vicariate_id, deanery_id")
    .eq("id", parishId)
    .maybeSingle();

  if (!parish) return null;

  const [vicariateResult, deaneryResult] = await Promise.all([
    supabase
      .from("vicariates")
      .select("id, name, monthly_emitemwa_amount, good_samaritan_day_amount")
      .eq("id", parish.vicariate_id)
      .maybeSingle(),
    supabase.from("deaneries").select("id, name").eq("id", parish.deanery_id).maybeSingle(),
  ]);

  return {
    parish,
    vicariate: vicariateResult.data,
    deanery: deaneryResult.data,
  };
}

function isProjectEligibleForParish(
  project: GenericRow,
  parish: GenericRow,
  explicitProjectIds: Set<string>,
) {
  const scopeLevel = String(project.scope_level);
  if (scopeLevel === "archdiocese") return project.archdiocese_id === parish.archdiocese_id;
  if (scopeLevel === "vicariate") return project.scope_vicariate_id === parish.vicariate_id;
  if (scopeLevel === "deanery") return project.scope_deanery_id === parish.deanery_id;
  return explicitProjectIds.has(String(project.id));
}

async function getEligibleProjectsForParish(parish: GenericRow): Promise<ParishContributionProject[]> {
  const supabase = createAdminClient();
  const { data: projectsData } = await supabase
    .from("contribution_projects")
    .select("*")
    .eq("archdiocese_id", parish.archdiocese_id)
    .in("status", ["planned", "active"])
    .order("start_date", { ascending: false });

  const projects = (projectsData ?? []) as GenericRow[];
  if (projects.length === 0) return [];

  const projectIds = projects.map((project) => String(project.id));
  const [scopeParishesResult, paymentsResult] = await Promise.all([
    supabase
      .from("contribution_project_scope_parishes")
      .select("project_id, parish_id")
      .in("project_id", projectIds),
    supabase
      .from("project_contribution_payments")
      .select("project_id, parish_id, amount")
      .in("project_id", projectIds),
  ]);

  const explicitProjectIds = new Set(
    ((scopeParishesResult.data ?? []) as GenericRow[])
      .filter((row) => row.parish_id === parish.id)
      .map((row) => String(row.project_id)),
  );

  const payments = (paymentsResult.data ?? []) as GenericRow[];
  const totalByProject = new Map<string, number>();
  const parishByProject = new Map<string, number>();
  for (const payment of payments) {
    const projectId = String(payment.project_id);
    const amount = numberValue(payment.amount);
    totalByProject.set(projectId, (totalByProject.get(projectId) ?? 0) + amount);
    if (payment.parish_id === parish.id) {
      parishByProject.set(projectId, (parishByProject.get(projectId) ?? 0) + amount);
    }
  }

  return projects
    .filter((project) => isProjectEligibleForParish(project, parish, explicitProjectIds))
    .map((project) => ({
      id: String(project.id),
      name: String(project.name),
      description: stringValue(project.description),
      targetAmount: project.target_amount == null ? null : numberValue(project.target_amount),
      startDate: stringValue(project.start_date),
      endDate: stringValue(project.end_date),
      status: String(project.status ?? "active"),
      scopeLevel: String(project.scope_level),
      totalRaised: totalByProject.get(String(project.id)) ?? 0,
      parishRaised: parishByProject.get(String(project.id)) ?? 0,
    }));
}

export async function getParishContributionDashboard(
  parishId: string,
  year = new Date().getUTCFullYear(),
): Promise<ParishContributionDashboard | null> {
  const context = await getParishContext(parishId);
  if (!context) return null;

  const { parish, vicariate, deanery } = context;
  const monthlyRate = numberValue(vicariate?.monthly_emitemwa_amount ?? 50000);
  const goodSamaritanRate = numberValue(vicariate?.good_samaritan_day_amount ?? 250000);

  const supabase = createAdminClient();
  const [paymentsResult, legacyResult, projects] = await Promise.all([
    supabase
      .from("emitemwa_payments")
      .select("*")
      .eq("parish_id", parishId)
      .eq("contribution_year", year)
      .order("paid_on", { ascending: false }),
    supabase
      .from("contribution_legacy_opening_balances")
      .select("source_parish_name, paid_amount, balance_amount")
      .eq("parish_id", parishId)
      .eq("snapshot_year", year)
      .order("imported_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getEligibleProjectsForParish(parish as GenericRow),
  ]);

  const paymentRows = (paymentsResult.data ?? []) as GenericRow[];
  const payments = paymentRows.map((row) => mapPayment(row, String(parish.name)));
  const monthlyRows = paymentRows.filter((row) => row.payment_kind === "monthly");
  const gsdRows = paymentRows.filter((row) => row.payment_kind === "good_samaritan_day");

  const months = MONTH_LABELS.map((label, index) => {
    const month = index + 1;
    const paid = monthlyRows
      .filter((row) => Number(row.contribution_month) === month)
      .reduce((total, row) => total + numberValue(row.amount), 0);
    return {
      month,
      label,
      due: monthlyRate,
      paid,
      balance: Math.max(monthlyRate - paid, 0),
      status: statusFor(paid, monthlyRate),
    };
  });

  const monthlyPaidTotal = months.reduce((total, month) => total + month.paid, 0);
  const monthlyAnnualDue = monthlyRate * 12;
  const goodSamaritanPaid = sumRows(gsdRows, "amount");
  const legacyPaid = legacyResult.data ? numberValue(legacyResult.data.paid_amount) : 0;
  const legacyBalance = legacyResult.data ? numberValue(legacyResult.data.balance_amount) : 0;
  const effectiveAnnualDue = legacyResult.data ? legacyPaid + legacyBalance : monthlyAnnualDue;
  const effectivePaidTotal = legacyPaid + monthlyPaidTotal;

  return {
    parishId,
    parishName: String(parish.name),
    deaneryName: deanery?.name ?? null,
    vicariateName: vicariate?.name ?? null,
    year,
    monthlyRate,
    goodSamaritanRate,
    months,
    monthlyPaidTotal: effectivePaidTotal,
    monthlyAnnualDue: effectiveAnnualDue,
    monthlyAnnualBalance: Math.max(effectiveAnnualDue - effectivePaidTotal, 0),
    goodSamaritan: {
      due: goodSamaritanRate,
      paid: goodSamaritanPaid,
      balance: Math.max(goodSamaritanRate - goodSamaritanPaid, 0),
      cleared: goodSamaritanPaid >= goodSamaritanRate,
    },
    payments,
    projects,
    legacyOpeningBalance: legacyResult.data
      ? {
          sourceParishName: legacyResult.data.source_parish_name,
          paidAmount: numberValue(legacyResult.data.paid_amount),
          balanceAmount: numberValue(legacyResult.data.balance_amount),
        }
      : null,
  };
}

function scopeTitle(scope: HierarchyScope, fallback: string) {
  if (scope.parishId) return "Parish monthly contribution report";
  if (scope.deaneryId) return "Deanery monthly contribution report";
  if (scope.vicariateId) return "Vicariate monthly contribution report";
  return fallback;
}

export async function getContributionRollupReport({
  scope,
  year,
  month,
  title = "Archdiocese monthly contribution report",
}: {
  scope: HierarchyScope;
  year: number;
  month: number;
  title?: string;
}): Promise<ContributionRollupReport> {
  const collections = await getHierarchyCollections(scope);
  const maps = buildHierarchyMaps(collections);
  const parishes = collections.parishes;

  if (parishes.length === 0) {
    return {
      title: scopeTitle(scope, title),
      scopeLabel: "No parishes",
      year,
      month,
      rows: [],
      totals: {
        monthPaid: 0,
        ytdPaid: 0,
        annualDue: 0,
        annualBalance: 0,
        goodSamaritanDue: 0,
        goodSamaritanPaid: 0,
        goodSamaritanClearedCount: 0,
      },
    };
  }

  const parishIds = parishes.map((parish) => parish.id);
  const supabase = createAdminClient();
  const [paymentsResult, legacyResult] = await Promise.all([
    supabase
      .from("emitemwa_payments")
      .select("*")
      .in("parish_id", parishIds)
      .eq("contribution_year", year)
      .order("paid_on", { ascending: false }),
    supabase
      .from("contribution_legacy_opening_balances")
      .select("parish_id, paid_amount, balance_amount, snapshot_year")
      .in("parish_id", parishIds)
      .eq("snapshot_year", year),
  ]);

  const paymentRows = (paymentsResult.data ?? []) as GenericRow[];
  const legacyByParish = new Map(
    ((legacyResult.data ?? []) as GenericRow[]).map((row) => [
      String(row.parish_id),
      {
        paid: numberValue(row.paid_amount),
        balance: numberValue(row.balance_amount),
      },
    ]),
  );
  const rows: ContributionReportRow[] = parishes.map((parish) => {
    const vicariate = maps.vicariatesById.get(parish.vicariate_id);
    const deanery = maps.deaneriesById.get(parish.deanery_id);
    const monthlyDue = numberValue(vicariate?.monthly_emitemwa_amount ?? 50000);
    const goodSamaritanDue = numberValue(vicariate?.good_samaritan_day_amount ?? 250000);
    const parishPayments = paymentRows.filter((payment) => payment.parish_id === parish.id);
    const monthlyPayments = parishPayments.filter((payment) => payment.payment_kind === "monthly");
    const monthPayments = monthlyPayments.filter((payment) => Number(payment.contribution_month) === month);
    const gsdPayments = parishPayments.filter((payment) => payment.payment_kind === "good_samaritan_day");
    const currentYearMonthlyPaid = monthlyPayments.reduce((total, payment) => total + numberValue(payment.amount), 0);
    const legacy = legacyByParish.get(parish.id);
    const legacyPaid = legacy?.paid ?? 0;
    const legacyBalance = legacy?.balance ?? 0;
    const ytdPaid = legacyPaid + currentYearMonthlyPaid;
    const annualDue = legacy ? legacyPaid + legacyBalance : monthlyDue * 12;
    const goodSamaritanPaid = gsdPayments.reduce((total, payment) => total + numberValue(payment.amount), 0);

    return {
      parishId: parish.id,
      parishName: parish.name,
      deaneryName: deanery?.name ?? null,
      vicariateName: vicariate?.name ? String(vicariate.name) : null,
      legacyPaid,
      legacyBalance,
      hasLegacyOpeningBalance: Boolean(legacy),
      monthlyDue,
      monthPaid: monthPayments.reduce((total, payment) => total + numberValue(payment.amount), 0),
      ytdPaid,
      annualDue,
      annualBalance: Math.max(annualDue - ytdPaid, 0),
      goodSamaritanDue,
      goodSamaritanPaid,
      goodSamaritanCleared: goodSamaritanPaid >= goodSamaritanDue,
      payments: parishPayments
        .filter((payment) => {
          if (payment.payment_kind === "monthly") {
            return Number(payment.contribution_month) === month;
          }
          const paidOn = stringValue(payment.paid_on);
          return paidOn ? new Date(paidOn).getUTCMonth() + 1 === month : false;
        })
        .map((payment) => mapPayment(payment, parish.name)),
    };
  });

  const totals = rows.reduce(
    (acc, row) => ({
      monthPaid: acc.monthPaid + row.monthPaid,
      ytdPaid: acc.ytdPaid + row.ytdPaid,
      annualDue: acc.annualDue + row.annualDue,
      annualBalance: acc.annualBalance + row.annualBalance,
      goodSamaritanDue: acc.goodSamaritanDue + row.goodSamaritanDue,
      goodSamaritanPaid: acc.goodSamaritanPaid + row.goodSamaritanPaid,
      goodSamaritanClearedCount:
        acc.goodSamaritanClearedCount + (row.goodSamaritanCleared ? 1 : 0),
    }),
    {
      monthPaid: 0,
      ytdPaid: 0,
      annualDue: 0,
      annualBalance: 0,
      goodSamaritanDue: 0,
      goodSamaritanPaid: 0,
      goodSamaritanClearedCount: 0,
    },
  );

  const scopeLabel = scope.parishId
    ? rows[0]?.parishName ?? "Parish"
    : scope.deaneryId
      ? collections.deaneries[0]?.name ?? "Deanery"
      : scope.vicariateId
        ? collections.vicariates[0]?.name ?? "Vicariate"
        : collections.archdioceses[0]?.name ?? "Archdiocese";

  return {
    title: scopeTitle(scope, title),
    scopeLabel,
    year,
    month,
    rows,
    totals,
  };
}

export async function getProjectContributionBreakdowns(
  scope: HierarchyScope,
): Promise<ProjectContributionBreakdown[]> {
  const collections = await getHierarchyCollections(scope);
  const maps = buildHierarchyMaps(collections);
  const parishIds = new Set(collections.parishes.map((parish) => parish.id));
  if (!scope.archdioceseId || parishIds.size === 0) return [];

  const supabase = createAdminClient();
  const [projectsResult, paymentsResult] = await Promise.all([
    supabase
      .from("contribution_projects")
      .select("*")
      .eq("archdiocese_id", scope.archdioceseId)
      .order("start_date", { ascending: false }),
    supabase
      .from("project_contribution_payments")
      .select("project_id, parish_id, amount")
      .in("parish_id", [...parishIds]),
  ]);

  const payments = (paymentsResult.data ?? []) as GenericRow[];
  return ((projectsResult.data ?? []) as GenericRow[])
    .map((project) => {
      const projectPayments = payments.filter((payment) => payment.project_id === project.id);
      const byParishMap = new Map<string, number>();
      for (const payment of projectPayments) {
        const parishId = String(payment.parish_id);
        byParishMap.set(parishId, (byParishMap.get(parishId) ?? 0) + numberValue(payment.amount));
      }

      return {
        projectId: String(project.id),
        name: String(project.name),
        description: stringValue(project.description),
        targetAmount: project.target_amount == null ? null : numberValue(project.target_amount),
        totalRaised: projectPayments.reduce((total, payment) => total + numberValue(payment.amount), 0),
        byParish: [...byParishMap.entries()]
          .map(([parishId, amount]) => ({
            parishId,
            parishName: maps.parishesById.get(parishId)?.name ?? "Unknown parish",
            amount,
          }))
          .sort((a, b) => b.amount - a.amount),
      };
    })
    .filter((project) => project.totalRaised > 0 || project.targetAmount != null);
}

export async function getContributionProjectOverviews(
  scope: HierarchyScope,
): Promise<ContributionProjectOverview[]> {
  if (!scope.archdioceseId) return [];
  const supabase = createAdminClient();
  const [projectsResult, paymentsResult] = await Promise.all([
    supabase
      .from("contribution_projects")
      .select("*")
      .eq("archdiocese_id", scope.archdioceseId)
      .order("start_date", { ascending: false }),
    supabase
      .from("project_contribution_payments")
      .select("project_id, amount")
      .eq("archdiocese_id", scope.archdioceseId),
  ]);

  const totalByProject = new Map<string, number>();
  for (const payment of (paymentsResult.data ?? []) as GenericRow[]) {
    const projectId = String(payment.project_id);
    totalByProject.set(projectId, (totalByProject.get(projectId) ?? 0) + numberValue(payment.amount));
  }

  return ((projectsResult.data ?? []) as GenericRow[]).map((project) => ({
    id: String(project.id),
    name: String(project.name),
    status: String(project.status ?? "active"),
    scopeLevel: String(project.scope_level),
    targetAmount: project.target_amount == null ? null : numberValue(project.target_amount),
    totalRaised: totalByProject.get(String(project.id)) ?? 0,
    startDate: stringValue(project.start_date),
    endDate: stringValue(project.end_date),
  }));
}

export type ExcessParishRow = {
  parishId: string;
  parishName: string;
  deaneryName: string | null;
  vicariateName: string | null;
  annualEmitemwaDue: number;
  goodSamaritanDue: number;
  combinedDue: number;
  totalPaid: number;
  excess: number;
};

export async function getExcessParishes(
  archdioceseId: string,
  year: number,
): Promise<ExcessParishRow[]> {
  const collections = await getHierarchyCollections({ archdioceseId });
  const maps = buildHierarchyMaps(collections);
  const parishes = collections.parishes;

  if (parishes.length === 0) return [];

  const parishIds = parishes.map((p) => p.id);
  const supabase = createAdminClient();

  const [paymentsResult, legacyResult] = await Promise.all([
    supabase
      .from("emitemwa_payments")
      .select("parish_id, payment_kind, amount")
      .in("parish_id", parishIds)
      .eq("contribution_year", year),
    supabase
      .from("contribution_legacy_opening_balances")
      .select("parish_id, paid_amount, balance_amount")
      .in("parish_id", parishIds)
      .eq("snapshot_year", year),
  ]);

  const paymentRows = (paymentsResult.data ?? []) as GenericRow[];
  const legacyByParish = new Map(
    ((legacyResult.data ?? []) as GenericRow[]).map((row) => [
      String(row.parish_id),
      { paid: numberValue(row.paid_amount), balance: numberValue(row.balance_amount) },
    ]),
  );

  const results: ExcessParishRow[] = [];

  for (const parish of parishes) {
    const vicariate = maps.vicariatesById.get(parish.vicariate_id);
    const deanery = maps.deaneriesById.get(parish.deanery_id);
    const monthlyDue = numberValue(vicariate?.monthly_emitemwa_amount ?? 50000);
    const goodSamaritanDue = numberValue(vicariate?.good_samaritan_day_amount ?? 250000);
    const annualEmitemwaDue = monthlyDue * 12;
    const legacy = legacyByParish.get(parish.id);
    const effectiveAnnualDue = legacy ? legacy.paid + legacy.balance : annualEmitemwaDue;
    const combinedDue = effectiveAnnualDue + goodSamaritanDue;

    const parishPayments = paymentRows.filter((p) => p.parish_id === parish.id);
    const totalPaid = parishPayments.reduce((sum, p) => sum + numberValue(p.amount), 0);

    const excess = totalPaid - combinedDue;
    if (excess > 0) {
      results.push({
        parishId: parish.id,
        parishName: parish.name,
        deaneryName: deanery?.name ?? null,
        vicariateName: vicariate?.name ?? null,
        annualEmitemwaDue: effectiveAnnualDue,
        goodSamaritanDue,
        combinedDue,
        totalPaid,
        excess,
      });
    }
  }

  return results.sort((a, b) => b.excess - a.excess);
}

export { MONTH_LABELS };
