import {
  getDeaneryContributionRows,
  getDeaneryParishRows,
  getDeaneryProjectRows,
  getDeaneryReportRows,
} from "@/lib/db/queries/deanery";
import type { DeaneryParishOverview } from "../types";

export async function getDeaneryParishOverviews(
  deaneryId: string,
): Promise<DeaneryParishOverview[]> {
  const [parishes, reports, contributions, projects] = await Promise.all([
    getDeaneryParishRows(deaneryId),
    getDeaneryReportRows(deaneryId),
    getDeaneryContributionRows(deaneryId),
    getDeaneryProjectRows(deaneryId),
  ]);

  const latestReportByParish = new Map<string, Record<string, unknown>>();
  for (const report of reports) {
    const parishId = String(report.parish_id);
    if (!latestReportByParish.has(parishId)) {
      latestReportByParish.set(parishId, report);
    }
  }

  const contributionsByParish = new Map<string, number>();
  for (const contribution of contributions) {
    const parishId = String(contribution.parish_id);
    contributionsByParish.set(
      parishId,
      (contributionsByParish.get(parishId) ?? 0) + Number(contribution.amount ?? 0),
    );
  }

  const projectsByParish = new Map<string, number>();
  const projectTimestampsByParish = new Map<string, string>();
  for (const project of projects) {
    const parishId = String(project.parish_id);
    projectsByParish.set(parishId, (projectsByParish.get(parishId) ?? 0) + 1);

    const updatedAt =
      typeof project.updated_at === "string" ? project.updated_at : null;
    if (
      updatedAt &&
      (!projectTimestampsByParish.has(parishId) ||
        updatedAt > (projectTimestampsByParish.get(parishId) ?? ""))
    ) {
      projectTimestampsByParish.set(parishId, updatedAt);
    }
  }

  return parishes.map((parish) => {
    const parishId = String(parish.id);
    const latestReport = latestReportByParish.get(parishId);

    return {
      id: parishId,
      name: String(parish.name ?? ""),
      code: typeof parish.code === "string" ? parish.code : "",
      priestName: typeof parish.priest_name === "string" ? parish.priest_name : null,
      location: typeof parish.location === "string" ? parish.location : null,
      status: typeof parish.status === "string" ? parish.status : null,
      followers: Number(latestReport?.total_beneficiaries ?? 0),
      families: Number(latestReport?.total_households ?? 0),
      totalContributions: contributionsByParish.get(parishId) ?? 0,
      totalProjects: projectsByParish.get(parishId) ?? 0,
      recentActivityAt:
        projectTimestampsByParish.get(parishId) ??
        (latestReport?.updated_at
          ? typeof latestReport.updated_at === "string"
            ? latestReport.updated_at
            : null
          : null),
    };
  });
}

export async function getDeaneryParishDetail(
  deaneryId: string,
  parishId: string,
): Promise<DeaneryParishOverview | null> {
  const overviews = await getDeaneryParishOverviews(deaneryId);
  return overviews.find((parish) => parish.id === parishId) ?? null;
}
