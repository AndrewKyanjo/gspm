"use server";

// src/features/contributions/actions.ts
//
// Shared contribution actions used by all dashboard levels.  The bulk-create
// action is the primary proxy-entry surface for the Archdiocese.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

const CONTRIBUTION_ENTRY_ROLES = [
  "super_admin",
  "archdiocese_admin",
  "archdiocese_data_entry",
  "vicariate_head",
  "vicariate_staff",
  "deanery_head",
  "deanery_staff",
  "parish_head",
  "parish_data_entry",
] as const;

const PROJECT_ADMIN_ROLES = [
  "super_admin",
  "archdiocese_admin",
  "archdiocese_data_entry",
  "vicariate_head",
  "vicariate_staff",
  "deanery_head",
  "deanery_staff",
] as const;

export type ContributionActionState = {
  error: string | null;
  message?: string | null;
};

function readString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAmount(formData: FormData, key: string) {
  const value = Number(readString(formData, key));
  return Number.isFinite(value) ? value : NaN;
}

async function getParishForWrite(parishId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parishes")
    .select("id, archdiocese_id, vicariate_id, deanery_id")
    .eq("id", parishId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function canWriteParishContribution(
  ctx: Awaited<ReturnType<typeof requireAuth>>,
  parish: {
    id: string;
    archdiocese_id: string | null;
    vicariate_id: string | null;
    deanery_id: string | null;
  },
) {
  if (ctx.parishId && ctx.parishId === parish.id) return true;
  return canProxyEnterForScope(ctx, {
    parishId: parish.id,
    vicariateId: parish.vicariate_id,
    deaneryId: parish.deanery_id,
  });
}

function revalidateContributionViews() {
  revalidatePath("/dashboard/parish/contributions");
  revalidatePath("/dashboard/deanery/contributions");
  revalidatePath("/dashboard/vicariate/contributions");
  revalidatePath("/dashboard/archdiocese/contributions");
  revalidatePath("/dashboard/archdiocese/reports/financial");
}

export async function recordMandatoryContribution(
  _previousState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const ctx = await requireAuth({ roles: [...CONTRIBUTION_ENTRY_ROLES] });

  const targetParishId = readString(formData, "parishId") || ctx.parishId;
  if (!targetParishId) {
    return { error: "Choose the parish this payment belongs to." };
  }

  const parish = await getParishForWrite(targetParishId);
  if (!parish || !canWriteParishContribution(ctx, parish)) {
    return { error: "You do not have permission to record payments for this parish." };
  }

  const paymentKind = readString(formData, "paymentKind");
  const year = Number(readString(formData, "contributionYear"));
  const month = paymentKind === "monthly" ? Number(readString(formData, "contributionMonth")) : null;
  const amount = readAmount(formData, "amount");
  const paidOn = readString(formData, "paidOn");

  if (paymentKind !== "monthly" && paymentKind !== "good_samaritan_day") {
    return { error: "Choose either monthly Emitemwa or Good Samaritan Day." };
  }

  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return { error: "Enter a valid contribution year." };
  }

  if (paymentKind === "monthly" && (month === null || !Number.isInteger(month) || month < 1 || month > 12)) {
    return { error: "Choose the month this Emitemwa payment covers." };
  }

  if (!Number.isFinite(amount) || amount <= 0 || !paidOn) {
    return { error: "Enter a positive amount and payment date." };
  }

  const supabase = createAdminClient();
  const currency = readString(formData, "currency") || "UGX";
  const paymentMethod = readString(formData, "paymentMethod") || null;
  const referenceNumber = readString(formData, "referenceNumber") || null;
  const notes = readString(formData, "notes") || null;
  const sourceChannel = readString(formData, "sourceChannel") || "system";

  // ── Smart auto-allocation for monthly Emitemwa ─────────────────
  if (paymentKind === "monthly") {
    // Get vicariate rates for this parish
    const { data: vicariate } = await supabase
      .from("vicariates")
      .select("monthly_emitemwa_amount, good_samaritan_day_amount")
      .eq("id", parish.vicariate_id)
      .maybeSingle();

    const monthlyRate = Number(vicariate?.monthly_emitemwa_amount ?? 50000);
    const annualDue = monthlyRate * 12;

    // Get YTD Emitemwa paid (including legacy)
    const { data: ytdPayments } = await supabase
      .from("emitemwa_payments")
      .select("amount")
      .eq("parish_id", parish.id)
      .eq("contribution_year", year)
      .eq("payment_kind", "monthly");

    const ytdPaidSoFar = (ytdPayments ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

    // Get legacy opening balance
    const { data: legacy } = await supabase
      .from("contribution_legacy_opening_balances")
      .select("paid_amount, balance_amount")
      .eq("parish_id", parish.id)
      .eq("snapshot_year", year)
      .maybeSingle();

    const legacyPaid = Number(legacy?.paid_amount ?? 0);
    const legacyBalance = Number(legacy?.balance_amount ?? 0);
    const effectiveAnnualDue = legacy ? legacyPaid + legacyBalance : annualDue;
    const effectiveYtdPaid = legacyPaid + ytdPaidSoFar;
    const remaining = effectiveAnnualDue - effectiveYtdPaid;

    if (remaining <= 0) {
      // Annual Emitemwa is fully paid — entire amount goes to GSD
      const { error } = await supabase.from("emitemwa_payments").insert({
        archdiocese_id: parish.archdiocese_id,
        vicariate_id: parish.vicariate_id,
        deanery_id: parish.deanery_id,
        parish_id: parish.id,
        recorded_by: ctx.userId,
        payment_kind: "good_samaritan_day",
        contribution_year: year,
        contribution_month: null,
        amount,
        currency,
        paid_on: paidOn,
        payment_method: paymentMethod,
        reference_number: referenceNumber,
        notes: notes ? `${notes} (auto-allocated: Emitemwa fully paid for ${year})` : `Auto-allocated: Emitemwa fully paid for ${year}`,
        source_channel: sourceChannel,
      });

      if (error) return { error: error.message };

      revalidateContributionViews();
      redirect(readString(formData, "returnTo") || "/dashboard/parish/contributions");
    }

    if (amount > remaining) {
      // Split: remaining goes to Emitemwa, excess goes to GSD
      const emitemwaAmount = remaining;
      const gsdAmount = amount - remaining;

      const { error } = await supabase.from("emitemwa_payments").insert([
        {
          archdiocese_id: parish.archdiocese_id,
          vicariate_id: parish.vicariate_id,
          deanery_id: parish.deanery_id,
          parish_id: parish.id,
          recorded_by: ctx.userId,
          payment_kind: "monthly",
          contribution_year: year,
          contribution_month: month,
          amount: emitemwaAmount,
          currency,
          paid_on: paidOn,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          notes: notes ? `${notes} (auto-split: ${emitemwaAmount} to Emitemwa)` : `Auto-split: ${emitemwaAmount} to Emitemwa`,
          source_channel: sourceChannel,
        },
        {
          archdiocese_id: parish.archdiocese_id,
          vicariate_id: parish.vicariate_id,
          deanery_id: parish.deanery_id,
          parish_id: parish.id,
          recorded_by: ctx.userId,
          payment_kind: "good_samaritan_day",
          contribution_year: year,
          contribution_month: null,
          amount: gsdAmount,
          currency,
          paid_on: paidOn,
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          notes: notes ? `${notes} (auto-split: ${gsdAmount} surplus to GSD)` : `Auto-split: ${gsdAmount} surplus to Good Samaritan Day`,
          source_channel: sourceChannel,
        },
      ]);

      if (error) return { error: error.message };

      revalidateContributionViews();
      redirect(readString(formData, "returnTo") || "/dashboard/parish/contributions");
    }
    // else: amount <= remaining — normal insert below
  }

  // ── Normal insert (no split needed) ────────────────────────────
  const { error } = await supabase.from("emitemwa_payments").insert({
    archdiocese_id: parish.archdiocese_id,
    vicariate_id: parish.vicariate_id,
    deanery_id: parish.deanery_id,
    parish_id: parish.id,
    recorded_by: ctx.userId,
    payment_kind: paymentKind,
    contribution_year: year,
    contribution_month: month,
    amount,
    currency,
    paid_on: paidOn,
    payment_method: paymentMethod,
    reference_number: referenceNumber,
    notes,
    source_channel: sourceChannel,
  });

  if (error) {
    return { error: error.message };
  }

  revalidateContributionViews();
  redirect(readString(formData, "returnTo") || "/dashboard/parish/contributions");
}

async function projectIncludesParish(projectId: string, parish: Awaited<ReturnType<typeof getParishForWrite>>) {
  if (!parish) return false;
  const supabase = createAdminClient();
  const { data: project } = await supabase
    .from("contribution_projects")
    .select("id, archdiocese_id, scope_level, scope_vicariate_id, scope_deanery_id")
    .eq("id", projectId)
    .maybeSingle();

  if (!project) return false;
  if (project.scope_level === "archdiocese") return project.archdiocese_id === parish.archdiocese_id;
  if (project.scope_level === "vicariate") return project.scope_vicariate_id === parish.vicariate_id;
  if (project.scope_level === "deanery") return project.scope_deanery_id === parish.deanery_id;

  const { data: scopeRow } = await supabase
    .from("contribution_project_scope_parishes")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("parish_id", parish.id)
    .maybeSingle();

  return Boolean(scopeRow);
}

export async function recordProjectContribution(
  _previousState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const ctx = await requireAuth({ roles: [...CONTRIBUTION_ENTRY_ROLES] });
  const targetParishId = readString(formData, "parishId") || ctx.parishId;
  const projectId = readString(formData, "projectId");

  if (!targetParishId || !projectId) {
    return { error: "Choose a parish and project." };
  }

  const parish = await getParishForWrite(targetParishId);
  if (!parish || !canWriteParishContribution(ctx, parish)) {
    return { error: "You do not have permission to record project payments for this parish." };
  }

  if (!(await projectIncludesParish(projectId, parish))) {
    return { error: "This parish is not in the selected project's scope." };
  }

  const amount = readAmount(formData, "amount");
  const paidOn = readString(formData, "paidOn");
  if (!Number.isFinite(amount) || amount <= 0 || !paidOn) {
    return { error: "Enter a positive amount and payment date." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("project_contribution_payments").insert({
    project_id: projectId,
    archdiocese_id: parish.archdiocese_id,
    vicariate_id: parish.vicariate_id,
    deanery_id: parish.deanery_id,
    parish_id: parish.id,
    recorded_by: ctx.userId,
    amount,
    currency: readString(formData, "currency") || "UGX",
    paid_on: paidOn,
    payment_method: readString(formData, "paymentMethod") || null,
    reference_number: readString(formData, "referenceNumber") || null,
    notes: readString(formData, "notes") || null,
    source_channel: readString(formData, "sourceChannel") || "system",
  });

  if (error) {
    return { error: error.message };
  }

  revalidateContributionViews();
  revalidatePath("/dashboard/archdiocese/projects");
  redirect(readString(formData, "returnTo") || "/dashboard/parish/contributions");
}

export async function createContributionProject(
  _previousState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const ctx = await requireAuth({ roles: [...PROJECT_ADMIN_ROLES] });
  if (!ctx.archdioceseId) {
    return { error: "Your account does not have an archdiocese scope." };
  }

  const name = readString(formData, "name");
  const scopeLevel = readString(formData, "scopeLevel");
  const targetAmountRaw = readString(formData, "targetAmount");
  const targetAmount = targetAmountRaw ? Number(targetAmountRaw) : null;

  if (!name) return { error: "Project name is required." };
  if (!["archdiocese", "vicariate", "deanery", "parishes"].includes(scopeLevel)) {
    return { error: "Choose a valid project scope." };
  }
  if (targetAmount != null && (!Number.isFinite(targetAmount) || targetAmount < 0)) {
    return { error: "Target amount must be zero or higher." };
  }

  const scopeVicariateId = scopeLevel === "vicariate" ? readString(formData, "scopeVicariateId") : null;
  const scopeDeaneryId = scopeLevel === "deanery" ? readString(formData, "scopeDeaneryId") : null;
  const parishIds = formData.getAll("scopeParishIds").map((value) => String(value).trim()).filter(Boolean);

  if (scopeLevel === "vicariate" && !scopeVicariateId) return { error: "Choose a vicariate." };
  if (scopeLevel === "deanery" && !scopeDeaneryId) return { error: "Choose a deanery." };
  if (scopeLevel === "parishes" && parishIds.length === 0) return { error: "Choose at least one parish." };

  if (ctx.level === "vicariate" && scopeVicariateId && scopeVicariateId !== ctx.vicariateId) {
    return { error: "You can only create projects inside your vicariate." };
  }
  if (ctx.level === "deanery" && scopeDeaneryId && scopeDeaneryId !== ctx.deaneryId) {
    return { error: "You can only create projects inside your deanery." };
  }

  const supabase = createAdminClient();
  const { data: project, error } = await supabase
    .from("contribution_projects")
    .insert({
      archdiocese_id: ctx.archdioceseId,
      created_by: ctx.userId,
      name,
      description: readString(formData, "description") || null,
      target_amount: targetAmount,
      start_date: readString(formData, "startDate") || new Date().toISOString().slice(0, 10),
      end_date: readString(formData, "endDate") || null,
      status: readString(formData, "status") || "active",
      scope_level: scopeLevel,
      scope_vicariate_id: scopeVicariateId,
      scope_deanery_id: scopeDeaneryId,
    })
    .select("id")
    .single();

  if (error || !project) {
    return { error: error?.message ?? "Could not create the project." };
  }

  if (scopeLevel === "parishes") {
    const { error: scopeError } = await supabase.from("contribution_project_scope_parishes").insert(
      parishIds.map((parishId) => ({
        project_id: project.id,
        parish_id: parishId,
      })),
    );

    if (scopeError) return { error: scopeError.message };
  }

  revalidatePath("/dashboard/archdiocese/projects");
  revalidatePath("/dashboard/parish/contributions");
  redirect(readString(formData, "returnTo") || "/dashboard/archdiocese/projects");
}

export async function updateVicariateContributionRates(
  _previousState: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  const vicariateId = readString(formData, "vicariateId");
  const monthly = readAmount(formData, "monthlyEmitemwaAmount");
  const goodSamaritan = readAmount(formData, "goodSamaritanDayAmount");

  if (!vicariateId || !Number.isFinite(monthly) || monthly < 0 || !Number.isFinite(goodSamaritan) || goodSamaritan < 0) {
    return { error: "Enter valid vicariate rates." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("vicariates")
    .update({
      monthly_emitemwa_amount: monthly,
      good_samaritan_day_amount: goodSamaritan,
    })
    .eq("id", vicariateId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/archdiocese/vicariates");
  revalidateContributionViews();
  redirect(readString(formData, "returnTo") || "/dashboard/archdiocese/vicariates");
}

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
  await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });

  const supabase = createAdminClient();
  const { error } = await supabase.from("parish_contributions").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/archdiocese/contributions");
  return { error: null };
}
