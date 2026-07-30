export type AssistanceType =
  | "food"
  | "shelter"
  | "bedding"
  | "clothing"
  | "medical"
  | "education"
  | "financial"
  | "other";

export type ChallengeType = "sick" | "aged" | "unemployed" | "disabled" | "other";

export type AkabondoOption = {
  id: string;
  name: string;
  subParishId: string;
  subParishName: string;
  villageName: string | null;
};

export type SubParishOption = {
  id: string;
  name: string;
};

export type AkabondoEvaluationItem = {
  id: string;
  personName: string;
  age: number | null;
  gender: string | null;
  contactNumber: string | null;
  village: string | null;
  subParishName: string | null;
  akabondoName: string | null;
  challenges: ChallengeType[];
  assistance: AssistanceType[];
  additionalInformation: string | null;
  evaluatedOn: string;
  createdAt: string;
};

export type AkabondoSummary = {
  totalEvaluations: number;
  totalSubParishes: number;
  totalAkabondos: number;
  challenges: Array<{ type: ChallengeType; label: string; count: number }>;
  assistance: Array<{ type: AssistanceType; label: string; count: number }>;
  recentEvaluations: AkabondoEvaluationItem[];
};

export type ParishNeedItem = {
  id: string;
  needType: AssistanceType;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  source: "manual" | "akabondo_analysis";
  estimatedHouseholds: number | null;
  status: "open" | "in_progress" | "met" | "archived";
  createdAt: string;
};

export type ParishNeedSuggestion = {
  needType: AssistanceType;
  title: string;
  count: number;
  priority: "medium" | "high" | "urgent";
};
