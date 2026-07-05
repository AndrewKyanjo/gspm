import type { ParishMediaSummary } from "../types";

export async function getParishMediaSummary(): Promise<ParishMediaSummary> {
  // TODO: replace with real Supabase media queries once the parish media
  // library schema and storage metadata are finalized.
  return {
    recordsAvailable: false,
    reason: "Media library records are not yet connected to a parish-facing Supabase table.",
  };
}
