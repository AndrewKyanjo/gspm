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

export type ContributionKind = "monthly" | "good_samaritan_day";

export type MonthContributionStatus = "paid" | "partial" | "unpaid";

export type MonthlyContributionSummary = {
  month: number;
  label: string;
  due: number;
  paid: number;
  balance: number;
  status: MonthContributionStatus;
};

export type EmitemwaPayment = {
  id: string;
  parishId: string;
  parishName: string | null;
  paymentKind: ContributionKind;
  contributionYear: number;
  contributionMonth: number | null;
  amount: number;
  currency: string;
  paidOn: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  notes: string | null;
};

export type GoodSamaritanStatus = {
  due: number;
  paid: number;
  balance: number;
  cleared: boolean;
};

export type ParishContributionProject = {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  scopeLevel: string;
  totalRaised: number;
  parishRaised: number;
};

export type ParishContributionDashboard = {
  parishId: string;
  parishName: string;
  deaneryName: string | null;
  vicariateName: string | null;
  year: number;
  monthlyRate: number;
  goodSamaritanRate: number;
  months: MonthlyContributionSummary[];
  monthlyPaidTotal: number;
  monthlyAnnualDue: number;
  monthlyAnnualBalance: number;
  goodSamaritan: GoodSamaritanStatus;
  payments: EmitemwaPayment[];
  projects: ParishContributionProject[];
  legacyOpeningBalance: {
    sourceParishName: string;
    paidAmount: number;
    balanceAmount: number;
  } | null;
};

export type ContributionReportRow = {
  parishId: string;
  parishName: string;
  deaneryName: string | null;
  vicariateName: string | null;
  legacyPaid: number;
  legacyBalance: number;
  hasLegacyOpeningBalance: boolean;
  monthlyDue: number;
  monthPaid: number;
  ytdPaid: number;
  annualDue: number;
  annualBalance: number;
  goodSamaritanDue: number;
  goodSamaritanPaid: number;
  goodSamaritanCleared: boolean;
  payments: EmitemwaPayment[];
};

export type ContributionRollupReport = {
  title: string;
  scopeLabel: string;
  year: number;
  month: number;
  rows: ContributionReportRow[];
  totals: {
    monthPaid: number;
    ytdPaid: number;
    annualDue: number;
    annualBalance: number;
    goodSamaritanDue: number;
    goodSamaritanPaid: number;
    goodSamaritanClearedCount: number;
  };
};

export type ProjectContributionBreakdown = {
  projectId: string;
  name: string;
  description: string | null;
  targetAmount: number | null;
  totalRaised: number;
  byParish: Array<{
    parishId: string;
    parishName: string;
    amount: number;
  }>;
};

export type ContributionProjectOverview = {
  id: string;
  name: string;
  status: string;
  scopeLevel: string;
  targetAmount: number | null;
  totalRaised: number;
  startDate: string | null;
  endDate: string | null;
};
