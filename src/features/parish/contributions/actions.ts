"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";

export type ParishContributionFormState = {
  error: string | null;
};

export async function recordParishContribution(
  _previousState: ParishContributionFormState,
  formData: FormData
): Promise<ParishContributionFormState> {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return { error: "Your account does not have a parish scope." };
  }

  const contributorName = String(formData.get("contributorName") ?? "").trim();
  const contributionType = String(formData.get("contributionType") ?? "").trim();
  const amount = Number(String(formData.get("amount") ?? "0").trim());
  const contributedOn = String(formData.get("contributedOn") ?? "").trim();

  if (!contributorName || !contributionType || !contributedOn || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Complete contributor, type, amount, and date before saving." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("parish_contributions").insert({
    archdiocese_id: context.archdioceseId,
    vicariate_id: context.vicariateId,
    deanery_id: context.deaneryId,
    parish_id: context.parishId,
    recorded_by: context.userId,
    contributor_name: contributorName,
    contribution_type: contributionType,
    amount,
    currency: String(formData.get("currency") ?? "UGX").trim() || "UGX",
    contributed_on: contributedOn,
    payment_method: String(formData.get("paymentMethod") ?? "").trim() || null,
    reference_number: String(formData.get("referenceNumber") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/parish/contributions");
  redirect("/dashboard/parish/contributions");
}
