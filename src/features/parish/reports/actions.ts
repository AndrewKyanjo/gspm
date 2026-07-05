"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ParishReportFormState = {
  error: string | null;
};

export async function createParishReport(
  _previousState: ParishReportFormState,
  formData: FormData
): Promise<ParishReportFormState> {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return { error: "Your account does not have a parish scope." };
  }

  const reportingPeriodId = String(formData.get("reportingPeriodId") ?? "");
  if (!reportingPeriodId) {
    return { error: "Select a reporting period." };
  }

  const asNumber = (key: string) => {
    const raw = String(formData.get(key) ?? "0").trim();
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  };

  const intent = String(formData.get("intent") ?? "draft");
  const status = intent === "submit" ? "submitted" : "draft";
  const submittedAt = intent === "submit" ? new Date().toISOString() : null;

  const payload = {
    reporting_period_id: reportingPeriodId,
    archdiocese_id: context.archdioceseId,
    vicariate_id: context.vicariateId,
    deanery_id: context.deaneryId,
    parish_id: context.parishId,
    prepared_by: context.userId,
    submitted_by: intent === "submit" ? context.userId : null,
    status,
    total_households: asNumber("totalHouseholds"),
    total_beneficiaries: asNumber("totalBeneficiaries"),
    male_beneficiaries: asNumber("maleBeneficiaries"),
    female_beneficiaries: asNumber("femaleBeneficiaries"),
    youth_beneficiaries: asNumber("youthBeneficiaries"),
    elderly_beneficiaries: asNumber("elderlyBeneficiaries"),
    total_cases_opened: asNumber("totalCasesOpened"),
    total_cases_closed: asNumber("totalCasesClosed"),
    total_donations_received: asNumber("totalDonationsReceived"),
    total_amount_disbursed: asNumber("totalAmountDisbursed"),
    summary: String(formData.get("summary") ?? "").trim() || null,
    challenges: String(formData.get("challenges") ?? "").trim() || null,
    recommendations: String(formData.get("recommendations") ?? "").trim() || null,
    submitted_at: submittedAt,
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("parish_reports").insert(payload).select("id").single();

  if (error || !data) {
    if (error?.code === "23505") {
      return {
        error: "Your database is still enforcing a one-report-per-period rule. Apply the migration that drops the old unique parish report constraint, then try again.",
      };
    }

    return { error: error?.message ?? "Could not create the parish report." };
  }

  revalidatePath("/dashboard/parish");
  revalidatePath("/dashboard/parish/reports");
  redirect(`/dashboard/parish/reports?report=${data.id}`);
}
