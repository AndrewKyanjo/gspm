import { createAdminClient } from "@/lib/supabase/admin";

export function createDeaneryQueryClient() {
  return createAdminClient();
}

export async function getDeaneryHierarchyContext(deaneryId: string) {
  const supabase = createDeaneryQueryClient();
  const { data: deanery } = await supabase.from("deaneries").select("*").eq("id", deaneryId).maybeSingle();
  const { data: vicariate } = deanery?.vicariate_id
    ? await supabase.from("vicariates").select("*").eq("id", deanery.vicariate_id).maybeSingle()
    : { data: null };
  const { data: archdiocese } = vicariate?.archdiocese_id
    ? await supabase.from("archdioceses").select("*").eq("id", vicariate.archdiocese_id).maybeSingle()
    : { data: null };

  return {
    deaneryId,
    deaneryName: deanery?.name ?? null,
    vicariateName: vicariate?.name ?? null,
    archdioceseName: archdiocese?.name ?? null,
  };
}

export async function getDeaneryParishRows(deaneryId: string) {
  const supabase = createDeaneryQueryClient();
  const { data } = await supabase
    .from("parishes")
    .select("*")
    .eq("deanery_id", deaneryId)
    .order("name", { ascending: true });

  return data ?? [];
}

export async function getDeaneryReportRows(deaneryId: string) {
  const supabase = createDeaneryQueryClient();
  const { data } = await supabase
    .from("parish_reports")
    .select("*")
    .eq("deanery_id", deaneryId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getDeaneryContributionRows(deaneryId: string) {
  const supabase = createDeaneryQueryClient();
  const { data } = await supabase
    .from("parish_contributions")
    .select("*")
    .eq("deanery_id", deaneryId)
    .order("contributed_on", { ascending: false });

  return data ?? [];
}

export async function getDeaneryProjectRows(deaneryId: string) {
  const supabase = createDeaneryQueryClient();
  const { data } = await supabase
    .from("parish_projects")
    .select("*")
    .eq("deanery_id", deaneryId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getProfilesByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = createDeaneryQueryClient();
  const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", uniqueIds);
  return data ?? [];
}

export async function getReportingPeriodsByIds(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return [];
  }

  const supabase = createDeaneryQueryClient();
  const { data } = await supabase.from("reporting_periods").select("id, year, month").in("id", uniqueIds);
  return data ?? [];
}

export async function getDeaneryUserAssignments(deaneryId: string) {
  const supabase = createDeaneryQueryClient();
  const { data } = await supabase
    .from("user_assignments")
    .select("*")
    .eq("deanery_id", deaneryId)
    .eq("is_active", true)
    .order("assigned_at", { ascending: false });

  return data ?? [];
}

export async function getDeaneryDocumentRows(deaneryId: string) {
  const supabase = createDeaneryQueryClient();
  const { data } = await supabase
    .from("deanery_documents")
    .select("*")
    .eq("deanery_id", deaneryId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getDeaneryReportEventRows(deaneryId: string, reportId?: string) {
  const supabase = createDeaneryQueryClient();
  let query = supabase
    .from("deanery_report_review_events")
    .select("*")
    .eq("deanery_id", deaneryId)
    .order("created_at", { ascending: false });

  if (reportId) {
    query = query.eq("report_id", reportId);
  }

  const { data } = await query;
  return data ?? [];
}
