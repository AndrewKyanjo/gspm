import { createAdminClient } from "@/lib/supabase/admin";
import { getContributionRollupReport, getProjectContributionBreakdowns, MONTH_LABELS } from "@/features/contributions/queries";
import { getHierarchyCollections, type HierarchyScope } from "@/lib/db/queries/hierarchy";
import type { MonthlyFinancialData, MonthlyProjectData, MonthlyDocumentData } from "./types";

function numberValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export async function buildFinancialSection(
  scope: HierarchyScope,
  year: number,
  month: number,
): Promise<MonthlyFinancialData> {
  const [currentReport, prevReport] = await Promise.all([
    getContributionRollupReport({ scope, year, month, title: "Monthly financial summary" }),
    month > 1
      ? getContributionRollupReport({ scope, year, month: month - 1, title: "Previous month" })
      : Promise.resolve(null),
  ]);

  const byContributionType = new Map<string, number>();
  for (const row of currentReport.rows) {
    for (const payment of row.payments) {
      const type = payment.paymentKind === "good_samaritan_day" ? "Good Samaritan Day" : "Monthly Emitemwa";
      byContributionType.set(type, (byContributionType.get(type) ?? 0) + payment.amount);
    }
  }

  return {
    monthLabel: MONTH_LABELS[month - 1],
    year,
    month,
    totalEmitemwaPaid: currentReport.totals.monthPaid,
    totalAnnualDue: currentReport.totals.annualDue,
    totalAnnualBalance: currentReport.totals.annualBalance,
    ytdPaid: currentReport.totals.ytdPaid,
    goodSamaritanClearedCount: currentReport.totals.goodSamaritanClearedCount,
    goodSamaritanTotalCount: currentReport.rows.length,
    goodSamaritanDue: currentReport.totals.goodSamaritanDue,
    goodSamaritanPaid: currentReport.totals.goodSamaritanPaid,
    arrearsCount: currentReport.rows.filter((r) => r.annualBalance > 0).length,
    arrearsTotal: currentReport.rows.reduce((sum, r) => sum + r.annualBalance, 0),
    byParish: currentReport.rows.map((r) => ({
      parishId: r.parishId,
      parishName: r.parishName,
      deaneryName: r.deaneryName,
      monthPaid: r.monthPaid,
      ytdPaid: r.ytdPaid,
      annualBalance: r.annualBalance,
      goodSamaritanCleared: r.goodSamaritanCleared,
    })),
    byContributionType: [...byContributionType.entries()]
      .map(([type, amount]) => ({ type, amount }))
      .sort((a, b) => b.amount - a.amount),
    previousMonthComparison: prevReport
      ? {
          prevMonthPaid: prevReport.totals.monthPaid,
          changePercent:
            prevReport.totals.monthPaid > 0
              ? Math.round(
                  ((currentReport.totals.monthPaid - prevReport.totals.monthPaid) /
                    prevReport.totals.monthPaid) *
                    100,
                )
              : 0,
        }
      : null,
  };
}

export async function buildProjectSection(
  scope: HierarchyScope,
  year: number,
  month: number,
): Promise<MonthlyProjectData> {
  const breakdowns = await getProjectContributionBreakdowns(scope);
  const supabase = createAdminClient();

  // Get payments for this specific month across all projects
  const { data: monthPayments } = await supabase
    .from("project_contribution_payments")
    .select("project_id, parish_id, amount, paid_on")
    .eq("archdiocese_id", scope.archdioceseId)
    .gte("paid_on", `${year}-${String(month).padStart(2, "0")}-01`)
    .lte("paid_on", `${year}-${String(month).padStart(2, "0")}-31`)
    .order("paid_on", { ascending: false });

  const monthRaisedByProject = new Map<string, number>();
  for (const payment of monthPayments ?? []) {
    const projectId = String(payment.project_id);
    monthRaisedByProject.set(projectId, (monthRaisedByProject.get(projectId) ?? 0) + numberValue(payment.amount));
  }

  const activeProjects = breakdowns.filter(
    (p) => p.totalRaised > 0 || p.targetAmount != null,
  );

  return {
    activeProjects: activeProjects.length,
    totalRaisedThisMonth: [...monthRaisedByProject.values()].reduce((sum, v) => sum + v, 0),
    totalTarget: activeProjects.reduce((sum, p) => sum + (p.targetAmount ?? 0), 0),
    overallProgressPercent:
      activeProjects.reduce((sum, p) => sum + (p.targetAmount ?? 0), 0) > 0
        ? Math.round(
            (activeProjects.reduce((sum, p) => sum + p.totalRaised, 0) /
              activeProjects.reduce((sum, p) => sum + (p.targetAmount ?? 0), 0)) *
              100,
          )
        : 0,
    byProject: activeProjects.map((p) => ({
      id: p.projectId,
      name: p.name,
      status: "active",
      raisedThisMonth: monthRaisedByProject.get(p.projectId) ?? 0,
      totalRaised: p.totalRaised,
      targetAmount: p.targetAmount,
      parishCount: p.byParish.length,
    })),
  };
}

export async function buildDocumentSection(
  archdioceseId: string,
  year: number,
  month: number,
): Promise<MonthlyDocumentData> {
  const supabase = createAdminClient();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  // Query all document tables for documents created in this month
  const tables = [
    { name: "archdiocese_documents", scope: "archdiocese" },
    { name: "vicariate_documents", scope: "vicariate" },
    { name: "deanery_documents", scope: "deanery" },
    { name: "parish_documents", scope: "parish" },
  ];

  const allDocs: MonthlyDocumentData["documents"] = [];

  for (const table of tables) {
    const { data } = await supabase
      .from(table.name)
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: false })
      .limit(50);

    for (const doc of data ?? []) {
      allDocs.push({
        id: doc.id,
        title: doc.title ?? "Untitled",
        category: doc.category ?? "general",
        scopeLevel: table.scope,
        uploadedAt: doc.created_at ?? "",
        uploadedByName: null,
        fileType: doc.file_type ?? null,
        metadata: (doc.document_metadata as Record<string, unknown>) ?? {},
      });
    }
  }

  // Also check past_document_imports
  const { data: pastDocs } = await supabase
    .from("past_document_imports")
    .select("*")
    .eq("review_status", "published")
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false })
    .limit(50);

  for (const doc of pastDocs ?? []) {
    allDocs.push({
      id: doc.id,
      title: doc.title ?? doc.original_filename ?? "Imported document",
      category: doc.category ?? "imported",
      scopeLevel: doc.scope_level ?? "unknown",
      uploadedAt: doc.created_at ?? "",
      uploadedByName: null,
      fileType: doc.file_type ?? null,
      metadata: (doc.document_metadata as Record<string, unknown>) ?? {},
    });
  }

  return {
    totalDocuments: allDocs.length,
    documents: allDocs,
  };
}
