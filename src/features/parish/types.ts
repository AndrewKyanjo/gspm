import type { AccountStatus, AppRole } from "@/types/auth";

export type ParishDashboardUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  title: string | null;
  accountStatus: AccountStatus;
};

export type ParishDashboardContext = {
  userId: string;
  role: AppRole;
  parishId: string;
  parishName: string | null;
  deaneryName: string | null;
  vicariateName: string | null;
};

export type ParishReportListItem = {
  id: string;
  status: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  reportingPeriodId: string | null;
  reportingPeriodLabel?: string | null;
};

export type ParishContributionSummary = {
  recordsAvailable: false;
  reason: string;
};

export type ParishDocumentSummary = {
  recordsAvailable: false;
  reason: string;
};

export type ParishMediaSummary = {
  recordsAvailable: false;
  reason: string;
};

export type ParishProjectSummary = {
  recordsAvailable: false;
  reason: string;
};

export type ParishDashboardStats = {
  totalReports: number;
  draftReports: number;
  submittedReports: number;
  approvedReports: number;
};

export type ReportingPeriod = {
  id: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  isOpen: boolean;
};

export type ParishReportDetail = {
  id: string;
  reportingPeriodId: string;
  reportingPeriodLabel: string | null;
  status: string | null;
  totalHouseholds: number;
  totalBeneficiaries: number;
  maleBeneficiaries: number;
  femaleBeneficiaries: number;
  youthBeneficiaries: number;
  elderlyBeneficiaries: number;
  totalCasesOpened: number;
  totalCasesClosed: number;
  totalDonationsReceived: number;
  totalAmountDisbursed: number;
  summary: string | null;
  challenges: string | null;
  recommendations: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
};

export type ParishContribution = {
  id: string;
  contributorName: string;
  contributionType: string;
  amount: number;
  currency: string;
  contributedOn: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
};

export type ParishDocumentItem = {
  name: string;
  path: string;
  category: string;
  size: number | null;
  updatedAt: string | null;
  downloadUrl: string | null;
};

export type ParishMediaItem = {
  name: string;
  path: string;
  monthKey: string;
  monthLabel: string;
  size: number | null;
  updatedAt: string | null;
  previewUrl: string | null;
};

export type ParishMediaMonthGroup = {
  monthKey: string;
  monthLabel: string;
  items: ParishMediaItem[];
};

export type ParishProject = {
  id: string;
  title: string;
  category: string | null;
  status: string | null;
  location: string | null;
  description: string | null;
  startDate: string | null;
  targetEndDate: string | null;
  budgetAmount: number | null;
  amountRaised: number | null;
  coverImagePath: string | null;
  coverImageUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ParishSearchResult = {
  module: "reports" | "documents" | "contributions" | "media" | "projects";
  title: string;
  description: string;
  href: string;
  meta: string;
};
