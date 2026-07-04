export type { HierarchyLevel } from "./auth";

export type RecordStatus = "active" | "inactive" | "archived";

export interface Archdiocese {
  id: string;
  name: string;
  code?: string | null;
  status?: RecordStatus | null;
}

export interface Vicariate {
  id: string;
  name: string;
  archdiocese_id: string;
  code?: string | null;
  status?: RecordStatus | null;
}

export interface Deanery {
  id: string;
  name: string;
  archdiocese_id: string;
  vicariate_id: string;
  code?: string | null;
  status?: RecordStatus | null;
}

export interface Parish {
  id: string;
  name: string;
  archdiocese_id: string;
  vicariate_id: string;
  deanery_id: string;
  code?: string | null;
  status?: RecordStatus | null;
}

export interface HierarchyOptions {
  archdioceseId: string;
  vicariates: Vicariate[];
  deaneries: Deanery[];
  parishes: Parish[];
}
