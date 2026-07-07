import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDeaneryContributionRows,
  getDeaneryDocumentRows,
  getDeaneryParishRows,
  getDeaneryProjectRows,
  getDeaneryReportRows,
} from "@/lib/db/queries/deanery";
import type { DeanerySearchResult } from "../types";

function matchesQuery(fields: Array<string | null | undefined>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return false;
  }

  return fields.some((field) => field?.toLowerCase().includes(normalizedQuery));
}

export async function searchDeaneryWorkspace(
  deaneryId: string,
  query: string,
): Promise<DeanerySearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const supabase = createAdminClient();

  const [parishRows, reportRows, contributionRows, documentRows, projectRows] =
    await Promise.all([
      getDeaneryParishRows(deaneryId),
      getDeaneryReportRows(deaneryId),
      getDeaneryContributionRows(deaneryId),
      getDeaneryDocumentRows(deaneryId),
      getDeaneryProjectRows(deaneryId),
    ]);

  const parishNameMap = new Map(
    parishRows.map((parish) => [String(parish.id), String(parish.name ?? "Unknown")]),
  );

  const reportingPeriodIds = [
    ...new Set(reportRows.map((row) => row.reporting_period_id).filter(Boolean)),
  ];
  const { data: periods } = reportingPeriodIds.length
    ? await supabase
        .from("reporting_periods")
        .select("id, year, month")
        .in("id", reportingPeriodIds)
    : { data: [] as Array<{ id: string; year: number; month: number }> };
  const periodLabelMap = new Map(
    (periods ?? []).map((period) => [period.id, `${period.month}/${period.year}`]),
  );

  // Parish results
  const parishResults: DeanerySearchResult[] = parishRows
    .filter((parish) =>
      matchesQuery([parish.name, parish.code, parish.location, parish.priest_name], normalizedQuery),
    )
    .map((parish) => ({
      module: "parishes" as const,
      title: String(parish.name ?? ""),
      description: `Parish${parish.code ? ` • ${parish.code}` : ""}${parish.location ? ` • ${parish.location}` : ""}`,
      href: `/dashboard/deanery/parishes/${parish.id}`,
      meta: parish.status ? String(parish.status) : "active",
    }));

  // Report results
  const reportResults: DeanerySearchResult[] = reportRows
    .filter((report) =>
      matchesQuery(
        [
          report.status,
          report.summary,
          report.challenges,
          report.recommendations,
          report.reporting_period_id ? periodLabelMap.get(report.reporting_period_id) : null,
        ],
        normalizedQuery,
      )
    )
    .map((report) => ({
      module: "reports" as const,
      title: `Report ${periodLabelMap.get(report.reporting_period_id ?? "") ?? String(report.id).slice(0, 8)}`,
      description:
        (typeof report.summary === "string" ? report.summary : null) ??
        (typeof report.challenges === "string" ? report.challenges : null) ??
        "Parish report",
      href: `/dashboard/deanery/reports/${report.id}`,
      meta: report.status ? String(report.status) : "unknown",
    }));

  // Contribution results
  const contributionResults: DeanerySearchResult[] = contributionRows
    .filter((contribution) =>
      matchesQuery(
        [contribution.contributor_name, contribution.contribution_type, contribution.notes],
        normalizedQuery,
      )
    )
    .map((contribution) => ({
      module: "contributions" as const,
      title: String(contribution.contributor_name ?? ""),
      description: String(contribution.contribution_type ?? "Contribution"),
      href: "/dashboard/deanery/contributions",
      meta: typeof contribution.contributed_on === "string" ? contribution.contributed_on : "",
    }));

  // Document results
  const documentResults: DeanerySearchResult[] = documentRows
    .filter((document) =>
      matchesQuery([document.title, document.category, document.description], normalizedQuery),
    )
    .map((document) => ({
      module: "documents" as const,
      title: String(document.title ?? ""),
      description: `Document in ${typeof document.category === "string" ? document.category : "general"}`,
      href: "/dashboard/deanery/documents",
      meta: typeof document.category === "string" ? document.category : "general",
    }));

  // Project results
  const projectResults: DeanerySearchResult[] = projectRows
    .filter((project) =>
      matchesQuery(
        [project.title, project.category, project.location],
        normalizedQuery,
      )
    )
    .map((project) => ({
      module: "projects" as const,
      title: String(project.title ?? ""),
      description:
        parishNameMap.get(String(project.parish_id ?? "")) ??
        (typeof project.category === "string" ? project.category : null) ??
        "Parish project",
      href: `/dashboard/deanery/projects/${project.id}`,
      meta: project.status ? String(project.status) : "planned",
    }));

  return [
    ...parishResults,
    ...reportResults,
    ...contributionResults,
    ...documentResults,
    ...projectResults,
  ];
}
