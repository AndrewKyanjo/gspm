import type { ParishProjectSummary } from "../types";

export async function getParishProjectSummary(): Promise<ParishProjectSummary> {
  // TODO: replace with real Supabase project queries once the parish project
  // tracking schema is finalized.
  return {
    recordsAvailable: false,
    reason: "Project tracking is not yet connected to a parish-specific Supabase table.",
  };
}
