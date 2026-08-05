"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildFinancialSection, buildProjectSection, buildDocumentSection } from "./generator";

export type GenerateReportResult = {
  success: boolean;
  reportId?: string;
  error?: string;
};

export async function generateMonthlyReport(
  _prevState: GenerateReportResult | null,
  formData: FormData,
): Promise<GenerateReportResult> {
  const scopeLevel = String(formData.get("scopeLevel") ?? "");
  const scopeEntityId = String(formData.get("scopeEntityId") ?? "");
  const year = Number(formData.get("year") ?? 0);
  const month = Number(formData.get("month") ?? 0);

  const context = await requireAuth({
    roles: [
      "super_admin",
      "archdiocese_admin",
      "archdiocese_data_entry",
      "vicariate_head",
      "vicariate_staff",
      "deanery_head",
      "deanery_staff",
      "parish_head",
      "parish_data_entry",
    ],
  });

  if (!context.archdioceseId) {
    return { success: false, error: "No archdiocese scope found." };
  }

  const supabase = createAdminClient();

  // Check if report already exists
  const { data: existing } = await supabase
    .from("generated_monthly_reports")
    .select("id")
    .eq("scope_level", scopeLevel)
    .eq("scope_entity_id", scopeEntityId)
    .eq("report_year", year)
    .eq("report_month", month)
    .maybeSingle();

  const scope = {
    archdioceseId: context.archdioceseId,
    vicariateId: scopeLevel === "vicariate" ? scopeEntityId : undefined,
    deaneryId: scopeLevel === "deanery" ? scopeEntityId : undefined,
    parishId: scopeLevel === "parish" ? scopeEntityId : undefined,
  };

  // Build all sections
  const [financialData, projectData, documentData] = await Promise.all([
    buildFinancialSection(scope, year, month),
    buildProjectSection(scope, year, month),
    buildDocumentSection(context.archdioceseId, year, month),
  ]);

  const payload = {
    archdiocese_id: context.archdioceseId,
    scope_level: scopeLevel,
    scope_entity_id: scopeEntityId,
    report_year: year,
    report_month: month,
    financial_data: financialData as unknown as Record<string, unknown>,
    project_data: projectData as unknown as Record<string, unknown>,
    document_data: documentData as unknown as Record<string, unknown>,
    status: "generated",
    generated_by: context.userId,
    generated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase
      .from("generated_monthly_reports")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard");
    return { success: true, reportId: existing.id };
  }

  const { data, error } = await supabase
    .from("generated_monthly_reports")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Failed to generate report." };
  }

  revalidatePath("/dashboard");
  return { success: true, reportId: data.id };
}

export async function publishMonthlyReport(
  formData: FormData,
): Promise<void> {
  const reportId = String(formData.get("reportId") ?? "");
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry", "vicariate_head", "deanery_head", "parish_head"],
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("generated_monthly_reports")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    console.error("Failed to publish report:", error.message);
    return;
  }

  revalidatePath("/dashboard");
}
