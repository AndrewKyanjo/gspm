import { createAdminClient } from "@/lib/supabase/admin";
import type { Archdiocese, Deanery, Parish, Vicariate } from "@/types/hierarchy";

export type HierarchyScope = {
  archdioceseId?: string | null;
  vicariateId?: string | null;
  deaneryId?: string | null;
  parishId?: string | null;
};

export type HierarchyCollections = {
  archdioceses: Archdiocese[];
  vicariates: Vicariate[];
  deaneries: Deanery[];
  parishes: Parish[];
};

export type HierarchyMaps = {
  archdiocesesById: Map<string, Archdiocese>;
  vicariatesById: Map<string, Vicariate>;
  deaneriesById: Map<string, Deanery>;
  parishesById: Map<string, Parish>;
};

type HierarchyColumn = "archdioceseId" | "vicariateId" | "deaneryId" | "parishId";
type HierarchyScopedQuery = {
  eq(column: string, value: string): HierarchyScopedQuery;
};

const COLUMN_BY_SCOPE_KEY: Record<HierarchyColumn, string> = {
  archdioceseId: "archdiocese_id",
  vicariateId: "vicariate_id",
  deaneryId: "deanery_id",
  parishId: "id",
};

function applyHierarchyScope(
  query: HierarchyScopedQuery,
  scope: HierarchyScope,
  supportedColumns: HierarchyColumn[]
) {
  return supportedColumns.reduce((currentQuery, scopeKey) => {
    const value = scope[scopeKey];
    if (!value) {
      return currentQuery;
    }

    return currentQuery.eq(COLUMN_BY_SCOPE_KEY[scopeKey], value);
  }, query);
}

export async function getHierarchyCollections(scope: HierarchyScope = {}): Promise<HierarchyCollections> {
  const supabase = createAdminClient();

  const archdioceseQuery = scope.archdioceseId
    ? supabase.from("archdioceses").select("id, name, code, status").eq("id", scope.archdioceseId)
    : supabase.from("archdioceses").select("id, name, code, status").order("name", { ascending: true });

  const vicariateQuery = applyHierarchyScope(
    supabase.from("vicariates").select("id, name, archdiocese_id, code, status").order("name", { ascending: true }),
    scope,
    ["archdioceseId", "vicariateId"]
  );

  const deaneryQuery = applyHierarchyScope(
    supabase
      .from("deaneries")
      .select("id, name, archdiocese_id, vicariate_id, code, status")
      .order("name", { ascending: true }),
    scope,
    ["archdioceseId", "vicariateId", "deaneryId"]
  );

  const parishQuery = applyHierarchyScope(
    supabase
      .from("parishes")
      .select("id, name, archdiocese_id, vicariate_id, deanery_id, code, status")
      .order("name", { ascending: true }),
    scope,
    ["archdioceseId", "vicariateId", "deaneryId", "parishId"]
  );

  const [archdiocesesResult, vicariatesResult, deaneriesResult, parishesResult] = await Promise.all([
    archdioceseQuery,
    vicariateQuery,
    deaneryQuery,
    parishQuery,
  ]);

  return {
    archdioceses: (archdiocesesResult.data ?? []) as Archdiocese[],
    vicariates: (vicariatesResult.data ?? []) as Vicariate[],
    deaneries: (deaneriesResult.data ?? []) as Deanery[],
    parishes: (parishesResult.data ?? []) as Parish[],
  };
}

export function buildHierarchyMaps(collections: HierarchyCollections): HierarchyMaps {
  return {
    archdiocesesById: new Map(collections.archdioceses.map((item) => [item.id, item])),
    vicariatesById: new Map(collections.vicariates.map((item) => [item.id, item])),
    deaneriesById: new Map(collections.deaneries.map((item) => [item.id, item])),
    parishesById: new Map(collections.parishes.map((item) => [item.id, item])),
  };
}
