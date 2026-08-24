"use server";

import { revalidatePath } from "next/cache";
import type { RowActionResult } from "@/components/dashboard/shared/edit-delete-row-actions";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessContext } from "@/types/auth";

const DOCUMENT_MANAGER_ROLES = [
  "super_admin",
  "archdiocese_admin",
  "archdiocese_data_entry",
  "vicariate_head",
  "vicariate_staff",
] as const;

const DOCUMENT_CONFIG = {
  archdiocese: { table: "archdiocese_documents", bucket: "archdiocese-documents" },
  vicariate: { table: "vicariate_documents", bucket: "vicariate-documents" },
  deanery: { table: "deanery_documents", bucket: "deanery-documents" },
  parish: { table: "parish_documents", bucket: "parish-documents" },
} as const;

type DocumentType = keyof typeof DOCUMENT_CONFIG;
type ManagedDocument = {
  id: string;
  archdiocese_id: string;
  vicariate_id?: string | null;
  storage_path?: string | null;
  file_path?: string | null;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function documentType(formData: FormData): DocumentType | null {
  const value = formString(formData, "recordType").toLowerCase();
  return value in DOCUMENT_CONFIG ? (value as DocumentType) : null;
}

function canManageDocument(context: AccessContext, row: ManagedDocument, type: DocumentType) {
  if (row.archdiocese_id !== context.archdioceseId) return false;
  if (context.level === "archdiocese") return true;
  if (context.level !== "vicariate" || !context.vicariateId || type === "archdiocese") return false;
  return row.vicariate_id === context.vicariateId;
}

async function getManagedDocument(formData: FormData) {
  const context = await requireAuth({ roles: [...DOCUMENT_MANAGER_ROLES] });
  const type = documentType(formData);
  const recordId = formString(formData, "recordId");
  if (!type || !recordId) return { type, row: null };

  const config = DOCUMENT_CONFIG[type];
  const { data } = await createAdminClient().from(config.table).select("*").eq("id", recordId).maybeSingle();
  const row = (data ?? null) as ManagedDocument | null;
  return { type, row: row && canManageDocument(context, row, type) ? row : null };
}

function revalidateDocumentViews() {
  revalidatePath("/dashboard/archdiocese/documents");
  revalidatePath("/dashboard/vicariate/documents");
  revalidatePath("/dashboard/deanery/documents");
  revalidatePath("/dashboard/parish/documents");
}

export async function updateDocumentName(formData: FormData): Promise<RowActionResult> {
  const name = formString(formData, "name");
  if (!name) return { error: "A document title is required." };

  const { type, row } = await getManagedDocument(formData);
  if (!type || !row) return { error: "Document was not found in your scope." };

  const { error } = await createAdminClient()
    .from(DOCUMENT_CONFIG[type].table)
    .update({ title: name, updated_at: new Date().toISOString() })
    .eq("id", row.id);

  if (error) return { error: error.message };
  revalidateDocumentViews();
}

export async function deleteDocument(formData: FormData): Promise<RowActionResult> {
  const { type, row } = await getManagedDocument(formData);
  if (!type || !row) return { error: "Document was not found in your scope." };

  const config = DOCUMENT_CONFIG[type];
  const supabase = createAdminClient();
  const { error } = await supabase.from(config.table).delete().eq("id", row.id);
  if (error) return { error: error.message };

  const path = row.storage_path || row.file_path;
  if (path) await supabase.storage.from(config.bucket).remove([path]);
  revalidateDocumentViews();
}
