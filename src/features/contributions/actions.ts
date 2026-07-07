"use server";

// src/features/contributions/actions.ts
//
// Shared contribution actions used by all dashboard levels.  The bulk-create
// action is the primary proxy-entry surface for the Archdiocese.

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { canProxyEnterForScope } from "@/lib/permissions/access";
import type { BulkCreateContributionsInput, BulkCreateContributionsResult } from "./types";

/** Roles that are allowed to use the bulk-create endpoint. */
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
 * Bulk-create contributions on behalf of multiple parishes.
 *
 * All-or-nothing: if any row fails validation the entire batch is rejected.
 * The caller receives a per-row error list so the staff member can fix and
 * re-submit.
 */
export async function bulkCreateContributions(
  input: BulkCreateContributionsInput,
): Promise<BulkCreateContributionsResult> {
  const ctx = await requireAuth({
    roles: [...BULK_CREATE_ROLES],
  });

  const errors: BulkCreateContributionsResult["errors"] = [];

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
        message: `You do not have permission to enter data for this parish.`,
      });
      continue;
    }

    if (!record.contributorName?.trim()) {
      errors.push({ row, message: "Contributor name is required." });
    }

    if (!record.contributionType?.trim()) {
      errors.push({ row, message: "Contribution type is required." });
    }

    if (!Number.isFinite(record.amount) || record.amount <= 0) {
      errors.push({ row, message: "Amount must be a positive number." });
    }

    if (!record.contributedOn) {
      errors.push({ row, message: "Contribution date is required." });
    }
  }

  if (errors.length > 0) {
    return { inserted: 0, errors };
  }

  // Insert all rows in a single operation.
  const supabase = createAdminClient();
  const rows = input.records.map((record) => ({
    archdiocese_id: input.archdioceseId,
    vicariate_id: record.vicariateId,
    deanery_id: record.deaneryId,
    parish_id: record.parishId,
    recorded_by: ctx.userId,
    contributor_name: record.contributorName.trim(),
    contribution_type: record.contributionType.trim(),
    amount: record.amount,
    currency: record.currency || "UGX",
    contributed_on: record.contributedOn,
    payment_method: record.paymentMethod?.trim() || null,
    reference_number: record.referenceNumber?.trim() || null,
    notes: record.notes?.trim() || null,
    source_channel: record.sourceChannel,
  }));

  const { error } = await supabase.from("parish_contributions").insert(rows);

  if (error) {
    return {
      inserted: 0,
      errors: [{ row: 0, message: error.message }],
    };
  }

  revalidatePath("/dashboard/archdiocese/contributions");
  revalidatePath("/dashboard/archdiocese/dashboard");

  return { inserted: rows.length, errors: [] };
}

/**
 * Delete a contribution by id.  Restricted to admins only for v1 —
 * proxy-entry staff cannot delete records they've entered.
 */
export async function deleteContribution(id: string): Promise<{ error: string | null }> {
  const ctx = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });

  const supabase = createAdminClient();
  const { error } = await supabase.from("parish_contributions").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/archdiocese/contributions");
  return { error: null };
}
