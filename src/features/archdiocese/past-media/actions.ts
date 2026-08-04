"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import {
  getPastMediaImportPath,
  publishPastMediaImports,
  scanPastMediaImport,
} from "./service";
import type { PastMediaScopeLevel } from "./types";

const ARCHDIOCESE_IMPORT_ROLES = ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] as const;
const MEDIA_IMPORT_PATH = `${getPastMediaImportPath()}?type=media`;

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScopeLevel(value: string): PastMediaScopeLevel {
  if (value === "archdiocese" || value === "vicariate" || value === "deanery" || value === "parish") {
    return value;
  }
  return "unknown";
}

function normalizeCapturedOn(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

export async function scanPastMediaImportAction(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) return;

  const importId = formString(formData, "importId");
  if (!importId) return;

  const hierarchy = await getHierarchyCollections({ archdioceseId: context.archdioceseId });
  await scanPastMediaImport({ importId, context, hierarchy });
  revalidatePath(getPastMediaImportPath());
  redirect(MEDIA_IMPORT_PATH);
}

export async function updatePastMediaImportReview(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) return;

  const importId = formString(formData, "importId");
  if (!importId) return;

  const scopeLevel = normalizeScopeLevel(formString(formData, "scopeLevel"));
  const title = formString(formData, "title");
  const description = formString(formData, "description");
  const category = formString(formData, "category") || "general";
  const capturedOn = normalizeCapturedOn(formString(formData, "capturedOn"));
  const vicariateId = formString(formData, "vicariateId") || null;
  const deaneryId = formString(formData, "deaneryId") || null;
  const parishId = formString(formData, "parishId") || null;
  const markReady = formString(formData, "markReady") === "true";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("past_media_imports")
    .update({
      title: title || null,
      description: description || null,
      category,
      captured_on: capturedOn,
      scope_level: scopeLevel,
      vicariate_id: scopeLevel === "archdiocese" || scopeLevel === "unknown" ? null : vicariateId,
      deanery_id: scopeLevel === "deanery" || scopeLevel === "parish" ? deaneryId : null,
      parish_id: scopeLevel === "parish" ? parishId : null,
      review_status: markReady ? "ready_for_upload" : "needs_review",
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", importId)
    .eq("archdiocese_id", context.archdioceseId)
    .neq("review_status", "published");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(getPastMediaImportPath());
  redirect(MEDIA_IMPORT_PATH);
}

export async function rejectPastMediaImport(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) return;

  const importId = formString(formData, "importId");
  if (!importId) return;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("past_media_imports")
    .update({
      review_status: "rejected",
      reviewed_by: context.userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", importId)
    .eq("archdiocese_id", context.archdioceseId)
    .neq("review_status", "published");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(getPastMediaImportPath());
  redirect(MEDIA_IMPORT_PATH);
}

export async function publishSelectedPastMediaImports(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) return;

  const importIds = formData
    .getAll("importId")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  const hierarchy = await getHierarchyCollections({ archdioceseId: context.archdioceseId });
  await publishPastMediaImports({ importIds, context, hierarchy });
  revalidatePath(getPastMediaImportPath());
  revalidatePath("/dashboard/archdiocese/media");
  revalidatePath("/dashboard/deanery/media");
  revalidatePath("/dashboard/parish/media");
  redirect(MEDIA_IMPORT_PATH);
}
