import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { getContributionRollupReport, getProjectContributionBreakdowns } from "@/features/contributions/queries";

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
