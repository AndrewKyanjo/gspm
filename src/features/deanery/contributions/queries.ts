import {
  getDeaneryContributionRows,
  getDeaneryParishRows,
} from "@/lib/db/queries/deanery";
import type { DeaneryContributionAggregate, DeaneryTrendPoint } from "../types";

function formatMonthLabel(month: number, year: number) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

export async function getDeaneryContributionAggregate(
  deaneryId: string,
): Promise<DeaneryContributionAggregate> {
  const [contributions, parishes] = await Promise.all([
    getDeaneryContributionRows(deaneryId),
    getDeaneryParishRows(deaneryId),
  ]);

  const parishNameMap = new Map(
    parishes.map((parish) => [String(parish.id), String(parish.name ?? "Unknown")]),
  );

  const totalContributions = contributions.reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0,
  );

  // By parish
  const byParishMap = new Map<string, number>();
  for (const contribution of contributions) {
    const parishId = String(contribution.parish_id ?? "");
    const amount = Number(contribution.amount ?? 0);
    byParishMap.set(parishId, (byParishMap.get(parishId) ?? 0) + amount);
  }

  const byParish = [...byParishMap.entries()]
    .map(([parishId, amount]) => ({
      parishName: parishNameMap.get(parishId) ?? "Unknown",
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topPerformingParish = byParish.length > 0 ? byParish[0].parishName : null;

  // By contribution type
  const breakdownMap = new Map<string, number>();
  for (const contribution of contributions) {
    const type = String(contribution.contribution_type ?? "Other");
    breakdownMap.set(type, (breakdownMap.get(type) ?? 0) + Number(contribution.amount ?? 0));
  }

  const breakdown = [...breakdownMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Monthly trends (last 12 months)
  const monthlyMap = new Map<string, number>();
  const now = new Date();
  for (const contribution of contributions) {
    const date = contribution.contributed_on
      ? new Date(String(contribution.contributed_on))
      : null;
    if (!date || isNaN(date.getTime())) {
      continue;
    }

    const monthsAgo =
      (now.getUTCFullYear() - date.getUTCFullYear()) * 12 +
      (now.getUTCMonth() - date.getUTCMonth());
    if (monthsAgo < 0 || monthsAgo > 11) {
      continue;
    }

    const label = formatMonthLabel(date.getUTCMonth() + 1, date.getUTCFullYear());
    monthlyMap.set(label, (monthlyMap.get(label) ?? 0) + Number(contribution.amount ?? 0));
  }

  const monthlyTrends: DeaneryTrendPoint[] = [...monthlyMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .slice(-12);

  // Quarterly trends
  const quarterlyMap = new Map<string, number>();
  for (const contribution of contributions) {
    const date = contribution.contributed_on
      ? new Date(String(contribution.contributed_on))
      : null;
    if (!date || isNaN(date.getTime())) {
      continue;
    }

    const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
    const label = `Q${quarter} ${date.getUTCFullYear()}`;
    quarterlyMap.set(label, (quarterlyMap.get(label) ?? 0) + Number(contribution.amount ?? 0));
  }

  const quarterlyTrends: DeaneryTrendPoint[] = [...quarterlyMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-8);

  // Yearly trends
  const yearlyMap = new Map<string, number>();
  for (const contribution of contributions) {
    const date = contribution.contributed_on
      ? new Date(String(contribution.contributed_on))
      : null;
    if (!date || isNaN(date.getTime())) {
      continue;
    }

    const label = String(date.getUTCFullYear());
    yearlyMap.set(label, (yearlyMap.get(label) ?? 0) + Number(contribution.amount ?? 0));
  }

  const yearlyTrends: DeaneryTrendPoint[] = [...yearlyMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    totalContributions,
    topPerformingParish,
    byParish,
    monthlyTrends,
    quarterlyTrends,
    yearlyTrends,
    breakdown,
  };
}
