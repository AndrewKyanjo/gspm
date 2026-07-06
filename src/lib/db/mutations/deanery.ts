import { createAdminClient } from "@/lib/supabase/admin";

export async function updateDeaneryReportStatus(reportId: string, status: string, userId: string) {
  const supabase = createAdminClient();
  return supabase
    .from("parish_reports")
    .update({
      status,
      approved_by: status === "approved" ? userId : null,
      approved_at: status === "approved" ? new Date().toISOString() : null,
    })
    .eq("id", reportId)
    .select("id")
    .single();
}

export async function insertDeaneryReportEvent(event: {
  reportId: string;
  archdioceseId: string | null;
  vicariateId: string | null;
  deaneryId: string;
  parishId: string;
  action: string;
  note: string | null;
  createdBy: string;
}) {
  const supabase = createAdminClient();
  return supabase.from("deanery_report_review_events").insert({
    report_id: event.reportId,
    archdiocese_id: event.archdioceseId,
    vicariate_id: event.vicariateId,
    deanery_id: event.deaneryId,
    parish_id: event.parishId,
    action: event.action,
    note: event.note,
    created_by: event.createdBy,
  });
}

export async function insertDeaneryDocument(document: {
  archdioceseId: string | null;
  vicariateId: string | null;
  deaneryId: string;
  uploadedBy: string;
  title: string;
  category: string;
  description: string | null;
  storagePath: string;
  versionNumber: number;
  replacesDocumentId: string | null;
}) {
  const supabase = createAdminClient();
  return supabase.from("deanery_documents").insert({
    archdiocese_id: document.archdioceseId,
    vicariate_id: document.vicariateId,
    deanery_id: document.deaneryId,
    uploaded_by: document.uploadedBy,
    title: document.title,
    category: document.category,
    description: document.description,
    storage_path: document.storagePath,
    version_number: document.versionNumber,
    replaces_document_id: document.replacesDocumentId,
  });
}

export async function archiveDeaneryDocument(documentId: string, archived: boolean) {
  const supabase = createAdminClient();
  return supabase.from("deanery_documents").update({ is_archived: archived }).eq("id", documentId);
}
