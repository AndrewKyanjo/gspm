import { createAdminClient } from "@/lib/supabase/admin";
import { getParishContributions } from "../contributions/queries";
import { getParishDocuments } from "../documents/queries";
import { getParishMediaGroups } from "../media/queries";
import { getParishProjects } from "../projects/queries";
import type { ParishSearchResult } from "../types";

function matchesQuery(fields: Array<string | null | undefined>, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return false;
  }

  return fields.some((field) => field?.toLowerCase().includes(normalizedQuery));
}

export async function searchParishWorkspace(parishId: string, query: string): Promise<ParishSearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const supabase = createAdminClient();
  const [
    { data: reportRows },
    documents,
    contributions,
    mediaGroups,
    projects,
  ] = await Promise.all([
    supabase
      .from("parish_reports")
      .select("id, status, summary, challenges, recommendations, reporting_period_id")
      .eq("parish_id", parishId)
      .order("updated_at", { ascending: false }),
    getParishDocuments(parishId),
    getParishContributions(parishId),
    getParishMediaGroups(parishId),
    getParishProjects(parishId),
  ]);

  const reportingPeriodIds = [...new Set((reportRows ?? []).map((row) => row.reporting_period_id).filter(Boolean))];
  const { data: periods } = reportingPeriodIds.length
    ? await supabase.from("reporting_periods").select("id, year, month").in("id", reportingPeriodIds)
    : { data: [] as Array<{ id: string; year: number; month: number }> };
  const periodLabelMap = new Map((periods ?? []).map((period) => [period.id, `${period.month}/${period.year}`]));

  const reportResults: ParishSearchResult[] = (reportRows ?? [])
    .filter((report) =>
      matchesQuery(
        [
          report.id,
          report.status,
          report.summary,
          report.challenges,
          report.recommendations,
          report.reporting_period_id ? periodLabelMap.get(report.reporting_period_id) : null,
        ],
        normalizedQuery
      )
    )
    .map((report) => ({
      module: "reports",
      title: `Report ${periodLabelMap.get(report.reporting_period_id ?? "") ?? report.id.slice(0, 8)}`,
      description: report.summary || report.challenges || report.recommendations || "Parish report result",
      href: `/dashboard/parish/reports?report=${report.id}`,
      meta: report.status ?? "unknown",
    }));

  const documentResults: ParishSearchResult[] = documents
    .filter((document) => matchesQuery([document.name, document.category], normalizedQuery))
    .map((document) => ({
      module: "documents",
      title: document.name,
      description: `Document in ${document.category}`,
      href: "/dashboard/parish/documents",
      meta: document.category,
    }));

  const contributionResults: ParishSearchResult[] = contributions
    .filter((contribution) =>
      matchesQuery(
        [contribution.contributorName, contribution.contributionType, contribution.notes],
        normalizedQuery
      )
    )
    .map((contribution) => ({
      module: "contributions",
      title: contribution.contributorName,
      description: contribution.contributionType,
      href: "/dashboard/parish/contributions",
      meta: contribution.contributedOn,
    }));

  const mediaResults: ParishSearchResult[] = mediaGroups
    .flatMap((group) => group.items)
    .filter((item) => matchesQuery([item.name, item.monthLabel], normalizedQuery))
    .map((item) => ({
      module: "media",
      title: item.name,
      description: `Image from ${item.monthLabel}`,
      href: `/dashboard/parish/media?media=${encodeURIComponent(item.path)}`,
      meta: item.monthLabel,
    }));

  const projectResults: ParishSearchResult[] = projects
    .filter((project) =>
      matchesQuery([project.title, project.category, project.description, project.location], normalizedQuery)
    )
    .map((project) => ({
      module: "projects",
      title: project.title,
      description: project.description || project.category || "Parish project",
      href: `/dashboard/parish/projects/${project.id}`,
      meta: project.status ?? "planned",
    }));

  return [
    ...reportResults,
    ...documentResults,
    ...contributionResults,
    ...mediaResults,
    ...projectResults,
  ];
}
