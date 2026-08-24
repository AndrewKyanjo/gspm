"use server";

import { revalidatePath } from "next/cache";
import type { RowActionResult } from "@/components/dashboard/shared/edit-delete-row-actions";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessContext } from "@/types/auth";

const HIERARCHY_MANAGER_ROLES = [
  "super_admin",
  "archdiocese_admin",
  "vicariate_head",
  "vicariate_staff",
] as const;

const TABLE_BY_TYPE = {
  vicariate: "vicariates",
  deanery: "deaneries",
  parish: "parishes",
} as const;

type EntityType = keyof typeof TABLE_BY_TYPE;
type HierarchyRecord = {
  id: string;
  archdiocese_id: string;
  vicariate_id?: string | null;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getEntityType(formData: FormData): EntityType | null {
  const value = formString(formData, "recordType").toLowerCase();
  return value in TABLE_BY_TYPE ? (value as EntityType) : null;
}

function canManage(context: AccessContext, type: EntityType, row: HierarchyRecord) {
  if (row.archdiocese_id !== context.archdioceseId) return false;
  if (context.level === "archdiocese") return true;
  if (context.level !== "vicariate" || !context.vicariateId || type === "vicariate") return false;
  return row.vicariate_id === context.vicariateId;
}

async function getManagedEntity(formData: FormData) {
  const context = await requireAuth({ roles: [...HIERARCHY_MANAGER_ROLES] });
  const type = getEntityType(formData);
  const recordId = formString(formData, "recordId");
  if (!type || !recordId) return { type, row: null };

  const { data } = await createAdminClient()
    .from(TABLE_BY_TYPE[type])
    .select("id, archdiocese_id, vicariate_id")
    .eq("id", recordId)
    .maybeSingle();
  const row = (data ?? null) as HierarchyRecord | null;
  return { type, row: row && canManage(context, type, row) ? row : null };
}

function revalidateHierarchyViews() {
  revalidatePath("/dashboard/archdiocese/vicariates");
  revalidatePath("/dashboard/archdiocese/deaneries");
  revalidatePath("/dashboard/archdiocese/parishes");
  revalidatePath("/dashboard/archdiocese/settings/hierarchy");
  revalidatePath("/dashboard/vicariate/deaneries");
  revalidatePath("/dashboard/vicariate/parishes");
}

export async function updateHierarchyEntityName(formData: FormData): Promise<RowActionResult> {
  const name = formString(formData, "name");
  if (!name) return { error: "A name is required." };

  const { type, row } = await getManagedEntity(formData);
  if (!type || !row) return { error: "Record was not found in your scope." };

  const { error } = await createAdminClient()
    .from(TABLE_BY_TYPE[type])
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  if (error) return { error: error.message };
  revalidateHierarchyViews();
}

export async function deleteHierarchyEntity(formData: FormData): Promise<RowActionResult> {
  const { type, row } = await getManagedEntity(formData);
  if (!type || !row) return { error: "Record was not found in your scope." };

  const { error } = await createAdminClient().from(TABLE_BY_TYPE[type]).delete().eq("id", row.id);
  if (error) {
    if (error.code === "23503") {
      return { error: "This record still has related records. Remove or reassign them before deleting it." };
    }
    return { error: error.message };
  }

  revalidateHierarchyViews();
}
