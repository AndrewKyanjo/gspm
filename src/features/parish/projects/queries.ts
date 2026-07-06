import { createAdminClient } from "@/lib/supabase/admin";
import type { ParishProject, ParishProjectSummary } from "../types";
import { PARISH_PROJECT_BUCKET } from "./constants";

async function getProjectCoverUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const supabase = createAdminClient();
  const { data } = await supabase.storage.from(PARISH_PROJECT_BUCKET).createSignedUrl(path, 60 * 15);
  return data?.signedUrl ?? null;
}

function mapProject(row: Record<string, unknown>, coverImageUrl: string | null): ParishProject {
  return {
    id: String(row.id),
    title: String(row.title),
    category: typeof row.category === "string" ? row.category : null,
    status: typeof row.status === "string" ? row.status : null,
    location: typeof row.location === "string" ? row.location : null,
    description: typeof row.description === "string" ? row.description : null,
    startDate: typeof row.start_date === "string" ? row.start_date : null,
    targetEndDate: typeof row.target_end_date === "string" ? row.target_end_date : null,
    budgetAmount: row.budget_amount == null ? null : Number(row.budget_amount),
    amountRaised: row.amount_raised == null ? null : Number(row.amount_raised),
    coverImagePath: typeof row.cover_image_path === "string" ? row.cover_image_path : null,
    coverImageUrl,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export async function getParishProjectSummary(): Promise<ParishProjectSummary> {
  return {
    recordsAvailable: false,
    reason: "Project cards are now backed by the live project register page instead of a placeholder summary.",
  };
}

export async function getParishProjects(parishId: string): Promise<ParishProject[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parish_projects")
    .select("*")
    .eq("parish_id", parishId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return Promise.all(
    data.map(async (row) => mapProject(row, await getProjectCoverUrl(row.cover_image_path ?? null)))
  );
}

export async function getParishProjectDetail(parishId: string, projectId: string): Promise<ParishProject | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parish_projects")
    .select("*")
    .eq("parish_id", parishId)
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProject(data, await getProjectCoverUrl(data.cover_image_path ?? null));
}
