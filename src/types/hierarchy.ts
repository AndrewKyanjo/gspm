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
  monthly_emitemwa_amount?: number | string | null;
  good_samaritan_day_amount?: number | string | null;
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
  /** Custom monthly Emitemwa rate. NULL = inherit from vicariate. */
  monthly_emitemwa_amount?: number | string | null;
  /** Custom Good Samaritan Day rate. NULL = inherit from vicariate. */
  good_samaritan_day_amount?: number | string | null;
}

export interface HierarchyOptions {
  archdioceseId: string;
  vicariates: Vicariate[];
  deaneries: Deanery[];
  parishes: Parish[];
}
