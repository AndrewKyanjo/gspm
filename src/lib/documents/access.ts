import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessContext } from "@/types/auth";

export type DocumentStorageReference = {
  bucket: string;
  path: string;
};

const ALLOWED_BUCKETS = new Set([
  "past-document-imports",
  "archdiocese-documents",
  "vicariate-documents",
  "deanery-documents",
  "parish-documents",
]);

function cleanPath(path: string) {
  return path.replace(/^\/+/, "").replace(/\\/g, "/");
}

export function parseDocumentStorageReference(searchParams: URLSearchParams): DocumentStorageReference {
  const bucket = searchParams.get("bucket")?.trim() ?? "";
  const path = cleanPath(searchParams.get("path")?.trim() ?? "");

  if (!ALLOWED_BUCKETS.has(bucket)) {
    throw new Error("Unsupported document bucket.");
  }

  if (!path || path.includes("..") || path.startsWith("/")) {
    throw new Error("Invalid document path.");
  }

  return { bucket, path };
}

function contextCanAccessHierarchy(
  context: AccessContext,
  row: {
    archdiocese_id?: string | null;
    vicariate_id?: string | null;
    deanery_id?: string | null;
    parish_id?: string | null;
  },
) {
  if (context.role === "super_admin") {
    return true;
  }

  if (
    (context.role === "archdiocese_admin" || context.role === "archdiocese_data_entry") &&
    context.archdioceseId &&
    row.archdiocese_id === context.archdioceseId
  ) {
    return true;
  }

  if (context.vicariateId && row.vicariate_id === context.vicariateId) {
    return true;
  }

  if (context.deaneryId && row.deanery_id === context.deaneryId) {
    return true;
  }

  if (context.parishId && row.parish_id === context.parishId) {
    return true;
  }

  return false;
}

export async function assertCanAccessDocumentStorage(
  context: AccessContext,
  reference: DocumentStorageReference,
) {
  const { bucket, path } = reference;
  const supabase = createAdminClient();

  if (bucket === "past-document-imports") {
    const { data } = await supabase
      .from("past_document_imports")
      .select("archdiocese_id")
      .eq("staging_storage_path", path)
      .maybeSingle();

    if (
      data &&
      (context.role === "super_admin" ||
        ((context.role === "archdiocese_admin" || context.role === "archdiocese_data_entry") &&
          data.archdiocese_id === context.archdioceseId))
    ) {
      return;
    }
  }

  if (bucket === "archdiocese-documents") {
    const { data } = await supabase
      .from("archdiocese_documents")
      .select("archdiocese_id")
      .eq("storage_path", path)
      .maybeSingle();
    if (data && contextCanAccessHierarchy(context, data)) return;
  }

  if (bucket === "vicariate-documents") {
    const { data } = await supabase
      .from("vicariate_documents")
      .select("archdiocese_id, vicariate_id")
      .eq("storage_path", path)
      .maybeSingle();
    if (data && contextCanAccessHierarchy(context, data)) return;
  }

  if (bucket === "deanery-documents") {
    const { data } = await supabase
      .from("deanery_documents")
      .select("archdiocese_id, vicariate_id, deanery_id")
      .eq("storage_path", path)
      .maybeSingle();
    if (data && contextCanAccessHierarchy(context, data)) return;

    const { data: legacyData } = await supabase
      .from("deanery_documents")
      .select("archdiocese_id, vicariate_id, deanery_id")
      .eq("file_path", path)
      .maybeSingle();
    if (legacyData && contextCanAccessHierarchy(context, legacyData)) return;

    if (context.deaneryId && path.startsWith(`deaneries/${context.deaneryId}/`)) {
      return;
    }
  }

  if (bucket === "parish-documents") {
    const { data } = await supabase
      .from("parish_documents")
      .select("archdiocese_id, vicariate_id, deanery_id, parish_id")
      .eq("storage_path", path)
      .maybeSingle();
    if (data && contextCanAccessHierarchy(context, data)) return;

    if (context.parishId && path.startsWith(`parishes/${context.parishId}/`)) {
      return;
    }
  }

  throw new Error("You are not allowed to preview this document.");
}
