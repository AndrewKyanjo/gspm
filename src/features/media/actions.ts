"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessContext } from "@/types/auth";
import type { RowActionResult } from "@/components/dashboard/shared/edit-delete-row-actions";

const MEDIA_MANAGER_ROLES = [
  "super_admin",
  "archdiocese_admin",
  "archdiocese_data_entry",
  "vicariate_head",
  "vicariate_staff",
] as const;

type PublishedMediaRow = {
  id: string;
  archdiocese_id: string;
  vicariate_id: string | null;
  scope_level: string;
  final_storage_path: string | null;
  review_status: string;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function bucketForScope(scopeLevel: string) {
  if (scopeLevel === "archdiocese") return "archdiocese-media";
  if (scopeLevel === "vicariate") return "vicariate-media";
  if (scopeLevel === "deanery") return "deanery-media";
  return "parish-media";
}

function canManageMedia(context: AccessContext, row: PublishedMediaRow) {
  if (row.archdiocese_id !== context.archdioceseId || row.review_status !== "published") return false;
  if (context.level === "archdiocese") return true;
  return context.level === "vicariate" && Boolean(context.vicariateId) && row.vicariate_id === context.vicariateId;
}

async function getManagedMedia(formData: FormData) {
  const context = await requireAuth({ roles: [...MEDIA_MANAGER_ROLES] });
  const recordId = formString(formData, "recordId");
  if (!recordId) return { context, row: null };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("past_media_imports")
    .select("id, archdiocese_id, vicariate_id, scope_level, final_storage_path, review_status")
    .eq("id", recordId)
    .maybeSingle();

  const row = (data ?? null) as PublishedMediaRow | null;
  return { context, row: row && canManageMedia(context, row) ? row : null };
}

function revalidateMediaViews() {
  revalidatePath("/dashboard/archdiocese/media");
  revalidatePath("/dashboard/vicariate/media");
  revalidatePath("/dashboard/deanery/media");
  revalidatePath("/dashboard/parish/media");
}

export async function updatePublishedMediaName(formData: FormData): Promise<RowActionResult> {
  const name = formString(formData, "name");
  if (!name) return { error: "A media name is required." };

  const { row } = await getManagedMedia(formData);
  if (!row) return { error: "Media was not found in your scope." };

  const { error } = await createAdminClient()
    .from("past_media_imports")
    .update({ title: name, updated_at: new Date().toISOString() })
    .eq("id", row.id)
    .eq("review_status", "published");

  if (error) return { error: error.message };
  revalidateMediaViews();
}

export async function deletePublishedMedia(formData: FormData): Promise<RowActionResult> {
  const { row } = await getManagedMedia(formData);
  if (!row) return { error: "Media was not found in your scope." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("past_media_imports")
    .delete()
    .eq("id", row.id)
    .eq("review_status", "published");

  if (error) return { error: error.message };

  if (row.final_storage_path) {
    await supabase.storage.from(bucketForScope(row.scope_level)).remove([row.final_storage_path]);
  }

  revalidateMediaViews();
}
