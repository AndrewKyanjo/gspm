"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import {
  clearPastDocumentImportStaging,
  deletePastDocumentImport,
  getPastDocumentImportPath,
  publishPastDocumentImports,
  scanPastDocumentImport,
} from "./service";
import type { PastDocumentScopeLevel } from "./types";

const ARCHDIOCESE_IMPORT_ROLES = ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] as const;

function formString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeScopeLevel(value: string): PastDocumentScopeLevel {
  if (value === "archdiocese" || value === "vicariate" || value === "deanery" || value === "parish") {
    return value;
  }
  return "unknown";
}

export async function scanPastDocumentImportAction(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) {
    return;
  }

  const importId = formString(formData, "importId");
  if (!importId) {
    return;
  }

  const hierarchy = await getHierarchyCollections({ archdioceseId: context.archdioceseId });
  await scanPastDocumentImport({ importId, context, hierarchy });
  revalidatePath(getPastDocumentImportPath());
}

export async function updatePastDocumentImportReview(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) {
    return;
  }

  const importId = formString(formData, "importId");
  if (!importId) {
    return;
  }

  const scopeLevel = normalizeScopeLevel(formString(formData, "scopeLevel"));
  const title = formString(formData, "title");
  const description = formString(formData, "description");
  const category = formString(formData, "category") || "general";
  const vicariateId = formString(formData, "vicariateId") || null;
  const deaneryId = formString(formData, "deaneryId") || null;
  const parishId = formString(formData, "parishId") || null;
  const markReady = formString(formData, "markReady") === "true";

  const normalized = {
    title: title || null,
    description: description || null,
    category,
    scope_level: scopeLevel,
    vicariate_id: scopeLevel === "archdiocese" || scopeLevel === "unknown" ? null : vicariateId,
    deanery_id: scopeLevel === "deanery" || scopeLevel === "parish" ? deaneryId : null,
    parish_id: scopeLevel === "parish" ? parishId : null,
    review_status: markReady ? "ready_for_upload" : "needs_review",
    reviewed_by: context.userId,
    reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    error_message: null,
  };

  const supabase = createAdminClient();
  await supabase
    .from("past_document_imports")
    .update(normalized)
    .eq("id", importId)
    .eq("archdiocese_id", context.archdioceseId)
    .neq("review_status", "published");

  revalidatePath(getPastDocumentImportPath());
}

export async function rejectPastDocumentImport(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) {
    return;
  }

  const importId = formString(formData, "importId");
  if (!importId) {
    return;
  }

  await deletePastDocumentImport({ importId, context });

  revalidatePath(getPastDocumentImportPath());
}

export async function clearPastDocumentImportStagingAction() {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) {
    return;
  }

  await clearPastDocumentImportStaging({ context });
  revalidatePath(getPastDocumentImportPath());
}

export async function publishSelectedPastDocumentImports(formData: FormData) {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_IMPORT_ROLES] });
  if (!context.archdioceseId) {
    return;
  }

  const importIds = formData
    .getAll("importId")
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);

  const hierarchy = await getHierarchyCollections({ archdioceseId: context.archdioceseId });
  await publishPastDocumentImports({ importIds, context, hierarchy });
  revalidatePath(getPastDocumentImportPath());
  revalidatePath("/dashboard/archdiocese/documents");
}
