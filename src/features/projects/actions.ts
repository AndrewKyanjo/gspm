"use server";

// src/features/projects/actions.ts
//
// Shared project actions.  The bulk-create action is the primary proxy-entry
// surface for the Archdiocese.

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { canProxyEnterForScope } from "@/lib/permissions/access";
import type { BulkCreateProjectsInput, BulkCreateProjectsResult } from "./types";

const BULK_CREATE_ROLES = [
  "super_admin",
  "archdiocese_admin",
  "archdiocese_data_entry",
  "vicariate_head",
  "vicariate_staff",
  "deanery_head",
  "deanery_staff",
] as const;

/**
 * Bulk-create projects on behalf of multiple parishes.
 *
 * All-or-nothing: if any row fails validation the entire batch is rejected.
 */
export async function bulkCreateProjects(
  input: BulkCreateProjectsInput,
): Promise<BulkCreateProjectsResult> {
  const ctx = await requireAuth({
    roles: [...BULK_CREATE_ROLES],
  });

  const errors: BulkCreateProjectsResult["errors"] = [];

  // Validate every row before touching the database.
  for (let i = 0; i < input.records.length; i++) {
    const record = input.records[i];
    const row = i + 1;

    if (!record.parishId) {
      errors.push({ row, message: "Parish is required." });
      continue;
    }

    if (!canProxyEnterForScope(ctx, {
      parishId: record.parishId,
      vicariateId: record.vicariateId,
      deaneryId: record.deaneryId,
    })) {
      errors.push({
        row,
        message: "You do not have permission to enter data for this parish.",
      });
      continue;
    }

    if (!record.title?.trim()) {
      errors.push({ row, message: "Project title is required." });
    }
  }

  if (errors.length > 0) {
    return { inserted: 0, errors };
  }

  const supabase = createAdminClient();
  const rows = input.records.map((record) => ({
    archdiocese_id: input.archdioceseId,
    vicariate_id: record.vicariateId,
    deanery_id: record.deaneryId,
    parish_id: record.parishId,
    created_by: ctx.userId,
    title: record.title.trim(),
    category: record.category?.trim() || null,
    status: record.status || "planned",
    location: record.location?.trim() || null,
    description: record.description?.trim() || null,
    start_date: record.startDate || null,
    target_end_date: record.targetEndDate || null,
    budget_amount: record.budgetAmount ?? null,
    amount_raised: record.amountRaised ?? null,
    source_channel: record.sourceChannel,
  }));

  const { error } = await supabase.from("parish_projects").insert(rows);

  if (error) {
    return {
      inserted: 0,
      errors: [{ row: 0, message: error.message }],
    };
  }

  revalidatePath("/dashboard/archdiocese/projects");
  revalidatePath("/dashboard/archdiocese/dashboard");

  return { inserted: rows.length, errors: [] };
}

/**
 * Delete a project by id.  Restricted to admins only for v1.
 */
export async function deleteProject(id: string): Promise<{ error: string | null }> {
  const ctx = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });

  const supabase = createAdminClient();
  const { error } = await supabase.from("parish_projects").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/archdiocese/projects");
  return { error: null };
}
