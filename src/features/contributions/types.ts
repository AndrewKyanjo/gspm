// src/features/contributions/types.ts
//
// Shared types for the contributions module, used by all four dashboard
// levels (parish self-entry through archdiocese proxy-entry).

/** The mode by which a contribution record was entered into the system. */
export type EntryMethod = "self_reported" | "proxy_entered";

/**
 * The channel through which the contribution information was received.
 * `system` is the default for ordinary self-entry; the other values are
 * relevant when a staff member re-types data that arrived off-platform.
 */
export type SourceChannel =
  | "whatsapp"
  | "facebook"
  | "phone_call"
  | "email"
  | "in_person"
  | "system";

/** A single row in the bulk-entry grid for contributions. */
export type BulkContributionRow = {
  /** Temporary client-side id for keying React rows. */
  key: string;
  parishId: string;
  contributorName: string;
  contributionType: string;
  amount: number;
  currency: string;
  contributedOn: string; // ISO date string (YYYY-MM-DD)
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
  sourceChannel: SourceChannel;
};

/** The result of a bulk-create operation. */
export type BulkCreateContributionsResult = {
  inserted: number;
  errors: Array<{
    row: number; // 1-indexed row in the submitted batch
    message: string;
  }>;
};

/** The payload sent to the bulk-create Server Action. */
export type BulkCreateContributionsInput = {
  archdioceseId: string;
  records: Array<{
    parishId: string;
    vicariateId: string;
    deaneryId: string;
    contributorName: string;
    contributionType: string;
    amount: number;
    currency: string;
    contributedOn: string;
    paymentMethod?: string | null;
    referenceNumber?: string | null;
    notes?: string | null;
    sourceChannel: SourceChannel;
  }>;
};
