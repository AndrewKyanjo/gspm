// src/features/projects/types.ts
//
// Shared types for the projects module, used by all four dashboard levels.

import type { EntryMethod, SourceChannel } from "@/features/contributions/types";

export type { EntryMethod, SourceChannel };

/** A single row in the bulk-entry grid for projects. */
export type BulkProjectRow = {
  /** Temporary client-side id for keying React rows. */
  key: string;
  parishId: string;
  title: string;
  category?: string | null;
  status: string;
  location?: string | null;
  description?: string | null;
  startDate?: string | null; // ISO date string (YYYY-MM-DD)
  targetEndDate?: string | null;
  budgetAmount?: number | null;
  amountRaised?: number | null;
  sourceChannel: SourceChannel;
};

/** The result of a bulk-create operation for projects. */
export type BulkCreateProjectsResult = {
  inserted: number;
  errors: Array<{
    row: number; // 1-indexed row in the submitted batch
    message: string;
  }>;
};

/** The payload sent to the bulk-create Server Action. */
export type BulkCreateProjectsInput = {
  archdioceseId: string;
  records: Array<{
    parishId: string;
    vicariateId: string;
    deaneryId: string;
    title: string;
    category?: string | null;
    status: string;
    location?: string | null;
    description?: string | null;
    startDate?: string | null;
    targetEndDate?: string | null;
    budgetAmount?: number | null;
    amountRaised?: number | null;
    sourceChannel: SourceChannel;
  }>;
};
