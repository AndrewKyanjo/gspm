import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ParishDashboardContext,
  ParishDashboardStats,
  ParishDashboardUser,
  ParishReportListItem,
} from "../types";

export async function getParishDashboardUser(userId: string): Promise<ParishDashboardUser | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, title, account_status")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    fullName: data.full_name ?? null,
    email: data.email ?? null,
    title: data.title ?? null,
    accountStatus: data.account_status,
  };
}

export async function getParishDashboardContext(parishId: string, userId: string, role: ParishDashboardContext["role"]): Promise<ParishDashboardContext> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("parishes")
    .select("id, name, deaneries(name), vicariates(name)")
    .eq("id", parishId)
    .maybeSingle();

  return {
    userId,
    role,
    parishId,
    parishName: data?.name ?? null,
    deaneryName:
      data && "deaneries" in data && data.deaneries && typeof data.deaneries === "object" && "name" in data.deaneries
        ? (data.deaneries.name as string | null)
        : null,
    vicariateName:
      data && "vicariates" in data && data.vicariates && typeof data.vicariates === "object" && "name" in data.vicariates
        ? (data.vicariates.name as string | null)
        : null,
  };
}

export async function getParishDashboardStats(parishId: string): Promise<ParishDashboardStats> {
  const supabase = createAdminClient();

  const [total, draft, submitted, approved] = await Promise.all([
    supabase.from("parish_reports").select("id", { count: "exact", head: true }).eq("parish_id", parishId),
    supabase
      .from("parish_reports")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parishId)
      .eq("status", "draft"),
    supabase
      .from("parish_reports")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parishId)
      .eq("status", "submitted"),
    supabase
      .from("parish_reports")
      .select("id", { count: "exact", head: true })
      .eq("parish_id", parishId)
      .eq("status", "approved"),
  ]);

  return {
    totalReports: total.count ?? 0,
    draftReports: draft.count ?? 0,
    submittedReports: submitted.count ?? 0,
    approvedReports: approved.count ?? 0,
  };
}

export async function getRecentParishReports(parishId: string): Promise<ParishReportListItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parish_reports")
    .select("id, status, created_at, updated_at, reporting_period_id")
    .eq("parish_id", parishId)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error || !data) {
    return [];
  }

  const reportingPeriodIds = [...new Set(data.map((row) => row.reporting_period_id).filter(Boolean))];
  const { data: periods } = reportingPeriodIds.length
    ? await supabase.from("reporting_periods").select("id, year, month").in("id", reportingPeriodIds)
    : { data: [] as Array<{ id: string; year: number; month: number }> };
  const periodLabelMap = new Map((periods ?? []).map((period) => [period.id, `${period.month}/${period.year}`]));

  return data.map((row) => ({
    id: row.id,
    status: row.status ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    reportingPeriodId: row.reporting_period_id ?? null,
    reportingPeriodLabel: row.reporting_period_id ? periodLabelMap.get(row.reporting_period_id) ?? null : null,
  }));
}
