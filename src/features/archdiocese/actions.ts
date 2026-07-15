"use server";

// src/features/archdiocese/actions.ts
//
// Server actions for Archdiocese-level mutations.  These allow the Archdiocese
// executive console to manage hierarchy entities, update report/project statuses,
// and toggle user assignments.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { HierarchyLevel } from "@/types/auth";
import type { AppRole } from "@/types/roles";

const ADMIN_ROLES = ["super_admin", "archdiocese_admin"] as const;

export type ArchdioceseActionState = {
  error: string | null;
};

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formNumber(formData: FormData, key: string) {
  const value = Number(formString(formData, key));
  return Number.isFinite(value) ? value : NaN;
}

// ─── Hierarchy CRUD ────────────────────────────────────────────

export async function createVicariate(
  _previousState: ArchdioceseActionState,
  formData: FormData,
): Promise<ArchdioceseActionState> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { error: "No archdiocese context." };

  const name = formString(formData, "name");
  const code = formString(formData, "code");
  const monthlyAmount = formNumber(formData, "monthlyEmitemwaAmount");
  const goodSamaritanAmount = formNumber(formData, "goodSamaritanDayAmount");

  if (!name) return { error: "Vicariate name is required." };
  if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
    return { error: "Monthly rate must be zero or higher." };
  }
  if (!Number.isFinite(goodSamaritanAmount) || goodSamaritanAmount < 0) {
    return { error: "Good Samaritan Day rate must be zero or higher." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("vicariates").insert({
    archdiocese_id: ctx.archdioceseId,
    name,
    code: code || null,
    status: "active",
    monthly_emitemwa_amount: monthlyAmount,
    good_samaritan_day_amount: goodSamaritanAmount,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/archdiocese/vicariates");
  revalidatePath("/dashboard/archdiocese/settings/hierarchy");
  redirect("/dashboard/archdiocese/vicariates");
}

export async function updateEntityStatus(
  entityType: "vicariate" | "deanery" | "parish",
  entityId: string,
  status: "active" | "inactive" | "archived"
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const table = entityType === "vicariate"
    ? "vicariates"
    : entityType === "deanery"
      ? "deaneries"
      : "parishes";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", entityId)
    .eq("archdiocese_id", ctx.archdioceseId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/archdiocese/${entityType}s`);
  revalidatePath(`/dashboard/archdiocese/${entityType}s/${entityId}`);
  return { ok: true };
}

export async function updateEntityName(
  entityType: "vicariate" | "deanery" | "parish",
  entityId: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };
  if (!name.trim()) return { ok: false, error: "Name is required." };

  const table = entityType === "vicariate"
    ? "vicariates"
    : entityType === "deanery"
      ? "deaneries"
      : "parishes";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from(table)
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq("id", entityId)
    .eq("archdiocese_id", ctx.archdioceseId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/dashboard/archdiocese/${entityType}s`);
  revalidatePath(`/dashboard/archdiocese/${entityType}s/${entityId}`);
  return { ok: true };
}

// ─── Report status ─────────────────────────────────────────────

export async function updateReportStatus(
  reportId: string,
  status: "approved" | "returned",
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("parish_reports")
    .update({
      status,
      approved_by: status === "approved" ? ctx.userId : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      review_notes: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId)
    .eq("archdiocese_id", ctx.archdioceseId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/archdiocese/reports");
  revalidatePath(`/dashboard/archdiocese/reports/parish-reports/${reportId}`);
  return { ok: true };
}

// ─── Project status ────────────────────────────────────────────

export async function updateProject(
  projectId: string,
  updates: {
    title?: string;
    status?: string;
    category?: string;
    description?: string;
    budgetAmount?: number;
    amountRaised?: number;
  }
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.category !== undefined) payload.category = updates.category?.trim() ?? null;
  if (updates.description !== undefined) payload.description = updates.description?.trim() ?? null;
  if (updates.budgetAmount !== undefined) payload.budget_amount = updates.budgetAmount;
  if (updates.amountRaised !== undefined) payload.amount_raised = updates.amountRaised;

  const { error } = await supabase
    .from("parish_projects")
    .update(payload)
    .eq("id", projectId)
    .eq("archdiocese_id", ctx.archdioceseId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/archdiocese/projects");
  revalidatePath(`/dashboard/archdiocese/projects/${projectId}`);
  return { ok: true };
}

// ─── Assignment management ─────────────────────────────────────

export async function toggleAssignmentActive(
  assignmentId: string,
  isActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_assignments")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("archdiocese_id", ctx.archdioceseId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/archdiocese/users");
  revalidatePath("/dashboard/archdiocese/users/assignments");
  return { ok: true };
}

export async function setPrimaryAssignment(
  assignmentId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const supabase = createAdminClient();

  // Unset any existing primary for this user
  await supabase
    .from("user_assignments")
    .update({ is_primary: false })
    .eq("user_id", userId)
    .eq("archdiocese_id", ctx.archdioceseId);

  // Set the new primary
  const { error } = await supabase
    .from("user_assignments")
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq("id", assignmentId)
    .eq("archdiocese_id", ctx.archdioceseId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/archdiocese/users");
  revalidatePath("/dashboard/archdiocese/users/assignments");
  return { ok: true };
}

export async function updateAssignmentScope(
  assignmentId: string,
  scope: {
    role?: AppRole;
    level?: HierarchyLevel;
    vicariateId?: string | null;
    deaneryId?: string | null;
    parishId?: string | null;
  }
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireAuth({ roles: [...ADMIN_ROLES] });
  if (!ctx.archdioceseId) return { ok: false, error: "No archdiocese context." };

  const supabase = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (scope.role !== undefined) payload.role = scope.role;
  if (scope.level !== undefined) payload.level = scope.level;
  if (scope.vicariateId !== undefined) payload.vicariate_id = scope.vicariateId;
  if (scope.deaneryId !== undefined) payload.deanery_id = scope.deaneryId;
  if (scope.parishId !== undefined) payload.parish_id = scope.parishId;

  const { error } = await supabase
    .from("user_assignments")
    .update(payload)
    .eq("id", assignmentId)
    .eq("archdiocese_id", ctx.archdioceseId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/archdiocese/users");
  revalidatePath("/dashboard/archdiocese/users/assignments");
  return { ok: true };
}

// ─── Contribution / Project delete ─────────────────────────────
// Note: For delete operations, import directly from:
//   import { deleteContribution } from "@/features/contributions/actions";
//   import { deleteProject } from "@/features/projects/actions";
