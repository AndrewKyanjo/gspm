"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getDeaneryReportRows } from "@/lib/db/queries/deanery";
import { insertDeaneryReportEvent, updateDeaneryReportStatus } from "@/lib/db/mutations/deanery";

export type DeaneryReportReviewState = {
  error: string | null;
};

export async function reviewDeaneryReport(
  _previousState: DeaneryReportReviewState,
  formData: FormData
): Promise<DeaneryReportReviewState> {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) {
    return { error: "Your account does not have a deanery scope." };
  }

  const reportId = String(formData.get("reportId") ?? "");
  const action = String(formData.get("action") ?? "commented");
  const note = String(formData.get("note") ?? "").trim() || null;

  const reports = await getDeaneryReportRows(context.deaneryId);
  const report = reports.find((item) => String(item.id) === reportId);
  if (!report) {
    return { error: "Report not found in your deanery scope." };
  }

  const stateChangingActions = ["approved", "rejected", "returned"];
  if (stateChangingActions.includes(action) && context.role !== "deanery_head") {
    return { error: "Only deanery heads can change report status." };
  }

  if (stateChangingActions.includes(action)) {
    const { error } = await updateDeaneryReportStatus(reportId, action, context.userId);
    if (error) {
      return { error: error.message };
    }
  }

  const { error: eventError } = await insertDeaneryReportEvent({
    reportId,
    archdioceseId: context.archdioceseId,
    vicariateId: context.vicariateId,
    deaneryId: context.deaneryId,
    parishId: String(report.parish_id),
    action,
    note,
    createdBy: context.userId,
  });

  if (eventError) {
    return { error: eventError.message };
  }

  revalidatePath("/dashboard/deanery/reports");
  revalidatePath(`/dashboard/deanery/reports/${reportId}`);
  return { error: null };
}
