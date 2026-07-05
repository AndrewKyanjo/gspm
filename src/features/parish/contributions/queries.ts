import { createAdminClient } from "@/lib/supabase/admin";
import type { ParishContribution, ParishContributionSummary } from "../types";

export async function getParishContributionSummary(): Promise<ParishContributionSummary> {
  // TODO: replace with real Supabase queries once the contributions table
  // schema is finalized for parish-level finance tracking.
  return {
    recordsAvailable: false,
    reason: "Contribution storage has not yet been connected to a parish-specific Supabase table.",
  };
}

export async function getParishContributions(parishId: string): Promise<ParishContribution[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parish_contributions")
    .select("id, contributor_name, contribution_type, amount, currency, contributed_on, payment_method, notes, created_at")
    .eq("parish_id", parishId)
    .order("contributed_on", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    contributorName: row.contributor_name,
    contributionType: row.contribution_type,
    amount: Number(row.amount),
    currency: row.currency,
    contributedOn: row.contributed_on,
    paymentMethod: row.payment_method ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  }));
}
