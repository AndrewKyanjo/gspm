"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidRoleLevelPair } from "@/lib/permissions/roles";
import type { HierarchyLevel } from "@/types/hierarchy";
import type { AppRole } from "@/types/roles";

type ActionResult = {
  ok: boolean;
  error?: string;
};

type ApproveRegistrationInput = {
  requestId: string;
  finalRole: AppRole;
  finalLevel: HierarchyLevel;
  archdioceseId: string | null;
  vicariateId: string | null;
  deaneryId: string | null;
  parishId: string | null;
  reviewNotes?: string | null;
};

export async function approveRegistration(input: ApproveRegistrationInput): Promise<ActionResult> {
  if (!isValidRoleLevelPair(input.finalRole, input.finalLevel)) {
    return { ok: false, error: "That role cannot be assigned at the selected level." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("approve_registration_request", {
    p_request_id: input.requestId,
    p_role: input.finalRole,
    p_level: input.finalLevel,
    p_archdiocese_id: input.archdioceseId,
    p_vicariate_id: input.vicariateId,
    p_deanery_id: input.deaneryId,
    p_parish_id: input.parishId,
    p_review_notes: input.reviewNotes ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/archdiocese/users/approvals");
  return { ok: true };
}

export async function rejectRegistration(
  requestId: string,
  reviewNotes?: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_registration_request", {
    p_request_id: requestId,
    p_review_notes: reviewNotes ?? null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/archdiocese/users/approvals");
  return { ok: true };
}
