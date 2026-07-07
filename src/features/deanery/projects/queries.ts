import { createAdminClient } from "@/lib/supabase/admin";
import { getDeaneryParishRows, getDeaneryProjectRows } from "@/lib/db/queries/deanery";
import type { DeaneryProjectOverview } from "../types";

function buildParishNameMap(parishes: Array<Record<string, unknown>>) {
  return new Map(parishes.map((parish) => [String(parish.id), String(parish.name ?? "Unknown")]));
}

async function getProjectCoverUrl(path: string | null) {
  if (!path) {
    return null;
  }

  const supabase = createAdminClient();
  const { data } = await supabase.storage
    .from("parish-project-images")
    .createSignedUrl(path, 60 * 15);
  return data?.signedUrl ?? null;
}

function mapProject(
  row: Record<string, unknown>,
  parishNameMap: Map<string, string>,
  coverImageUrl: string | null,
): DeaneryProjectOverview {
  return {
    id: String(row.id),
    parishName: parishNameMap.get(String(row.parish_id ?? "")) ?? null,
    title: String(row.title ?? ""),
    category: typeof row.category === "string" ? row.category : null,
    status: typeof row.status === "string" ? row.status : null,
    location: typeof row.location === "string" ? row.location : null,
    budgetAmount: row.budget_amount == null ? null : Number(row.budget_amount),
    amountRaised: row.amount_raised == null ? null : Number(row.amount_raised),
    targetEndDate: typeof row.target_end_date === "string" ? row.target_end_date : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null,
    coverImageUrl,
  };
}

export async function getDeaneryProjects(
  deaneryId: string,
): Promise<DeaneryProjectOverview[]> {
  const [projects, parishes] = await Promise.all([
    getDeaneryProjectRows(deaneryId),
    getDeaneryParishRows(deaneryId),
  ]);

  const parishNameMap = buildParishNameMap(parishes);

  return Promise.all(
    projects.map(async (row) =>
      mapProject(
        row,
        parishNameMap,
        await getProjectCoverUrl(
          typeof row.cover_image_path === "string" ? row.cover_image_path : null,
        ),
      ),
    ),
  );
}

export async function getDeaneryProjectDetail(
  deaneryId: string,
  projectId: string,
): Promise<DeaneryProjectOverview | null> {
  const [projects, parishes] = await Promise.all([
    getDeaneryProjectRows(deaneryId),
    getDeaneryParishRows(deaneryId),
  ]);

  const project = projects.find((row) => String(row.id) === projectId);
  if (!project) {
    return null;
  }

  const parishNameMap = buildParishNameMap(parishes);
  const coverImageUrl = await getProjectCoverUrl(
    typeof project.cover_image_path === "string" ? project.cover_image_path : null,
  );

  return mapProject(project, parishNameMap, coverImageUrl);
}
