import { createAdminClient } from "@/lib/supabase/admin";
import { getHierarchyCollections, buildHierarchyMaps } from "@/lib/db/queries/hierarchy";
import { MONTH_LABELS } from "@/features/contributions/queries";
import type { GeneratedMonthlyReport, MonthlyReportListItem } from "./types";

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function getMonthlyReports(
  archdioceseId: string,
  scopeLevel: string,
  scopeEntityId: string,
): Promise<MonthlyReportListItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("generated_monthly_reports")
    .select("*")
    .eq("archdiocese_id", archdioceseId)
    .eq("scope_level", scopeLevel)
    .eq("scope_entity_id", scopeEntityId)
    .order("report_year", { ascending: false })
    .order("report_month", { ascending: false })
    .limit(24);

  const collections = await getHierarchyCollections({ archdioceseId });

  let scopeName: string | null = null;
  if (scopeLevel === "archdiocese") {
    scopeName = collections.archdioceses[0]?.name ?? null;
  } else if (scopeLevel === "vicariate") {
    scopeName = collections.vicariates.find((v: { id: string; name: string }) => v.id === scopeEntityId)?.name ?? null;
  } else if (scopeLevel === "deanery") {
    scopeName = collections.deaneries.find((d: { id: string; name: string }) => d.id === scopeEntityId)?.name ?? null;
  } else if (scopeLevel === "parish") {
    scopeName = collections.parishes.find((p: { id: string; name: string }) => p.id === scopeEntityId)?.name ?? null;
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    scopeLevel: r.scope_level as MonthlyReportListItem["scopeLevel"],
    scopeName,
    reportYear: r.report_year,
    reportMonth: r.report_month,
    monthLabel: MONTH_LABELS[r.report_month - 1],
    status: r.status as MonthlyReportListItem["status"],
    totalEmitemwaPaid: numberValue((r.financial_data as Record<string, unknown>)?.totalEmitemwaPaid),
    totalAnnualBalance: numberValue((r.financial_data as Record<string, unknown>)?.totalAnnualBalance),
    activeProjects: numberValue((r.project_data as Record<string, unknown>)?.activeProjects),
    totalDocuments: numberValue((r.document_data as Record<string, unknown>)?.totalDocuments),
    generatedAt: r.generated_at,
  }));
}

export async function getMonthlyReport(
  reportId: string,
): Promise<GeneratedMonthlyReport | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("generated_monthly_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (!data) return null;

  const collections = await getHierarchyCollections({ archdioceseId: data.archdiocese_id });
  const maps = buildHierarchyMaps(collections);

  let scopeName: string | null = null;
  if (data.scope_level === "archdiocese") {
    scopeName = collections.archdioceses[0]?.name ?? null;
  } else if (data.scope_level === "vicariate") {
    scopeName = maps.vicariatesById.get(data.scope_entity_id)?.name ?? null;
  } else if (data.scope_level === "deanery") {
    scopeName = maps.deaneriesById.get(data.scope_entity_id)?.name ?? null;
  } else if (data.scope_level === "parish") {
    scopeName = maps.parishesById.get(data.scope_entity_id)?.name ?? null;
  }

  return {
    id: data.id,
    archdioceseId: data.archdiocese_id,
    scopeLevel: data.scope_level,
    scopeEntityId: data.scope_entity_id,
    scopeName,
    reportYear: data.report_year,
    reportMonth: data.report_month,
    financialData: data.financial_data as GeneratedMonthlyReport["financialData"],
    projectData: data.project_data as GeneratedMonthlyReport["projectData"],
    documentData: data.document_data as GeneratedMonthlyReport["documentData"],
    status: data.status,
    generatedBy: data.generated_by,
    generatedAt: data.generated_at,
    publishedAt: data.published_at,
  };
}
