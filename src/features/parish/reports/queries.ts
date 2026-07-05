import { createAdminClient } from "@/lib/supabase/admin";
import type { ParishReportDetail, ParishReportListItem, ReportingPeriod } from "../types";

async function getReportingPeriodLabelMap(reportingPeriodIds: string[]) {
  const uniqueIds = [...new Set(reportingPeriodIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reporting_periods")
    .select("id, year, month")
    .in("id", uniqueIds);

  if (error || !data) {
    return new Map<string, string>();
  }

  return new Map(data.map((period) => [period.id, `${period.month}/${period.year}`]));
}

export async function getParishReports(parishId: string): Promise<ParishReportListItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parish_reports")
    .select("id, status, created_at, updated_at, reporting_period_id")
    .eq("parish_id", parishId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const periodLabelMap = await getReportingPeriodLabelMap(
    data.map((row) => row.reporting_period_id).filter((value): value is string => Boolean(value))
  );

  return data.map((row) => ({
    id: row.id,
    status: row.status ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    reportingPeriodId: row.reporting_period_id ?? null,
    reportingPeriodLabel: row.reporting_period_id ? periodLabelMap.get(row.reporting_period_id) ?? null : null,
  }));
}

export async function getOpenReportingPeriods(): Promise<ReportingPeriod[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("reporting_periods")
    .select("id, year, month, start_date, end_date, is_open")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    year: row.year,
    month: row.month,
    startDate: row.start_date,
    endDate: row.end_date,
    isOpen: row.is_open,
  }));
}

export async function getParishReportDetail(
  parishId: string,
  reportId: string
): Promise<ParishReportDetail | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parish_reports")
    .select("*")
    .eq("id", reportId)
    .eq("parish_id", parishId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const { data: period } = await supabase
    .from("reporting_periods")
    .select("year, month")
    .eq("id", data.reporting_period_id)
    .maybeSingle();

  return {
    id: data.id,
    reportingPeriodId: data.reporting_period_id,
    reportingPeriodLabel: period ? `${period.month}/${period.year}` : null,
    status: data.status ?? null,
    totalHouseholds: data.total_households ?? 0,
    totalBeneficiaries: data.total_beneficiaries ?? 0,
    maleBeneficiaries: data.male_beneficiaries ?? 0,
    femaleBeneficiaries: data.female_beneficiaries ?? 0,
    youthBeneficiaries: data.youth_beneficiaries ?? 0,
    elderlyBeneficiaries: data.elderly_beneficiaries ?? 0,
    totalCasesOpened: data.total_cases_opened ?? 0,
    totalCasesClosed: data.total_cases_closed ?? 0,
    totalDonationsReceived: Number(data.total_donations_received ?? 0),
    totalAmountDisbursed: Number(data.total_amount_disbursed ?? 0),
    summary: data.summary ?? null,
    challenges: data.challenges ?? null,
    recommendations: data.recommendations ?? null,
    createdAt: data.created_at ?? null,
    updatedAt: data.updated_at ?? null,
    submittedAt: data.submitted_at ?? null,
    approvedAt: data.approved_at ?? null,
  };
}
