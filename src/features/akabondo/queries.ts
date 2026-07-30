import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AkabondoEvaluationItem,
  AkabondoOption,
  AkabondoSummary,
  AssistanceType,
  ChallengeType,
  ParishNeedItem,
  ParishNeedSuggestion,
  SubParishOption,
} from "./types";

const CHALLENGE_LABELS: Record<ChallengeType, string> = {
  sick: "Sick",
  aged: "Aged",
  unemployed: "Unemployed",
  disabled: "Disabled",
  other: "Other",
};

const ASSISTANCE_LABELS: Record<AssistanceType, string> = {
  food: "Food",
  shelter: "Shelter",
  bedding: "Bedding",
  clothing: "Clothing",
  medical: "Medical",
  education: "Education",
  financial: "Financial",
  other: "Other",
};

type GenericRow = Record<string, unknown>;

function bool(row: GenericRow, key: string) {
  return row[key] === true;
}

function mapEvaluation(row: GenericRow): AkabondoEvaluationItem {
  const challenges: ChallengeType[] = [];
  if (bool(row, "challenge_sick")) challenges.push("sick");
  if (bool(row, "challenge_aged")) challenges.push("aged");
  if (bool(row, "challenge_unemployed")) challenges.push("unemployed");
  if (bool(row, "challenge_disabled")) challenges.push("disabled");
  if (typeof row.challenge_other === "string" && row.challenge_other.trim()) challenges.push("other");

  const assistance: AssistanceType[] = [];
  if (bool(row, "assistance_food")) assistance.push("food");
  if (bool(row, "assistance_shelter")) assistance.push("shelter");
  if (bool(row, "assistance_bedding")) assistance.push("bedding");
  if (bool(row, "assistance_clothing")) assistance.push("clothing");
  if (bool(row, "assistance_medical")) assistance.push("medical");
  if (bool(row, "assistance_education")) assistance.push("education");
  if (bool(row, "assistance_financial")) assistance.push("financial");
  if (typeof row.assistance_other === "string" && row.assistance_other.trim()) assistance.push("other");

  const subParish = row.sub_parishes as { name?: string | null } | null;
  const akabondo = row.akabondos as { name?: string | null } | null;

  return {
    id: String(row.id),
    personName: String(row.person_name ?? ""),
    age: row.age == null ? null : Number(row.age),
    gender: typeof row.gender === "string" ? row.gender : null,
    contactNumber: typeof row.contact_number === "string" ? row.contact_number : null,
    village: typeof row.village === "string" ? row.village : null,
    subParishName: subParish?.name ?? null,
    akabondoName: akabondo?.name ?? null,
    challenges,
    assistance,
    additionalInformation: typeof row.additional_information === "string" ? row.additional_information : null,
    evaluatedOn: String(row.evaluated_on),
    createdAt: String(row.created_at),
  };
}

export async function getParishLowerLevelOptions(parishId: string): Promise<{
  subParishes: SubParishOption[];
  akabondos: AkabondoOption[];
}> {
  const supabase = createAdminClient();
  const [subParishesResult, akabondosResult] = await Promise.all([
    supabase.from("sub_parishes").select("id, name").eq("parish_id", parishId).order("name"),
    supabase
      .from("akabondos")
      .select("id, name, village_name, sub_parish_id, sub_parishes(name)")
      .eq("parish_id", parishId)
      .order("name"),
  ]);

  return {
    subParishes: (subParishesResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
    })),
    akabondos: ((akabondosResult.data ?? []) as GenericRow[]).map((row) => {
      const subParish = row.sub_parishes as { name?: string | null } | null;
      return {
        id: String(row.id),
        name: String(row.name),
        subParishId: String(row.sub_parish_id),
        subParishName: subParish?.name ?? "Sub Parish",
        villageName: typeof row.village_name === "string" ? row.village_name : null,
      };
    }),
  };
}

export async function getAkabondoSummary(parishId: string): Promise<AkabondoSummary> {
  const supabase = createAdminClient();
  const [options, evaluationsResult] = await Promise.all([
    getParishLowerLevelOptions(parishId),
    supabase
      .from("akabondo_evaluations")
      .select("*, sub_parishes(name), akabondos(name)")
      .eq("parish_id", parishId)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const evaluations = ((evaluationsResult.data ?? []) as GenericRow[]).map(mapEvaluation);
  const challengeCounts = Object.keys(CHALLENGE_LABELS).map((key) => {
    const type = key as ChallengeType;
    return {
      type,
      label: CHALLENGE_LABELS[type],
      count: evaluations.filter((item) => item.challenges.includes(type)).length,
    };
  });
  const assistanceCounts = Object.keys(ASSISTANCE_LABELS).map((key) => {
    const type = key as AssistanceType;
    return {
      type,
      label: ASSISTANCE_LABELS[type],
      count: evaluations.filter((item) => item.assistance.includes(type)).length,
    };
  });

  return {
    totalEvaluations: evaluations.length,
    totalSubParishes: options.subParishes.length,
    totalAkabondos: options.akabondos.length,
    challenges: challengeCounts.sort((a, b) => b.count - a.count),
    assistance: assistanceCounts.sort((a, b) => b.count - a.count),
    recentEvaluations: evaluations.slice(0, 20),
  };
}

export async function getParishNeeds(parishId: string): Promise<ParishNeedItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("parish_needs")
    .select("*")
    .eq("parish_id", parishId)
    .order("created_at", { ascending: false });

  return ((data ?? []) as GenericRow[]).map((row) => ({
    id: String(row.id),
    needType: String(row.need_type) as AssistanceType,
    title: String(row.title),
    description: typeof row.description === "string" ? row.description : null,
    priority: String(row.priority) as ParishNeedItem["priority"],
    source: String(row.source) as ParishNeedItem["source"],
    estimatedHouseholds: row.estimated_households == null ? null : Number(row.estimated_households),
    status: String(row.status) as ParishNeedItem["status"],
    createdAt: String(row.created_at),
  }));
}

export async function getNeedSuggestionsFromAkabondo(parishId: string): Promise<ParishNeedSuggestion[]> {
  const summary = await getAkabondoSummary(parishId);
  return summary.assistance
    .filter((item) => item.count > 0)
    .map((item) => ({
      needType: item.type,
      title: `${item.label} support`,
      count: item.count,
      priority: item.count >= 10 ? "urgent" : item.count >= 5 ? "high" : "medium",
    }));
}

export async function getArchdioceseAkabondoOverview(archdioceseId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("akabondo_evaluations")
    .select("parish_id, assistance_food, assistance_shelter, assistance_bedding, assistance_clothing, assistance_medical, assistance_education, assistance_financial, assistance_other, parishes(name)")
    .eq("archdiocese_id", archdioceseId)
    .limit(1000);

  const rows = (data ?? []) as GenericRow[];
  const byParish = new Map<string, { parishId: string; parishName: string; count: number }>();
  for (const row of rows) {
    const parishId = String(row.parish_id);
    const parish = row.parishes as { name?: string | null } | null;
    const current = byParish.get(parishId) ?? {
      parishId,
      parishName: parish?.name ?? "Parish",
      count: 0,
    };
    current.count += 1;
    byParish.set(parishId, current);
  }

  const assistance = Object.keys(ASSISTANCE_LABELS).map((key) => {
    const type = key as AssistanceType;
    const column = type === "other" ? "assistance_other" : `assistance_${type}`;
    return {
      type,
      label: ASSISTANCE_LABELS[type],
      count: rows.filter((row) =>
        type === "other" ? typeof row[column] === "string" && String(row[column]).trim() : row[column] === true,
      ).length,
    };
  });

  return {
    totalEvaluations: rows.length,
    parishes: [...byParish.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    assistance: assistance.sort((a, b) => b.count - a.count),
  };
}
