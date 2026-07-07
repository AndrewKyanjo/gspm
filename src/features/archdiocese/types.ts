import type { AppRole, HierarchyLevel } from "@/types/auth";

export type ArchdioceseContext = {
  archdioceseId: string;
  archdioceseName: string | null;
};

export type ArchdioceseExecutiveStats = {
  totalVicariates: number;
  totalDeaneries: number;
  totalParishes: number;
  activeAssignments: number;
  pendingApprovals: number;
  submittedReports: number;
  approvedReports: number;
  reportedFamilies: number;
  reportedBeneficiaries: number;
  trackedProjects: number;
  annualContributions: number;
};

export type ArchdioceseRecentActivityItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  createdAt: string | null;
  module: "approvals" | "reports" | "contributions" | "projects";
};

export type ArchdioceseVicariateOverview = {
  id: string;
  name: string;
  code: string | null;
  status: string | null;
  deaneryCount: number;
  parishCount: number;
};

export type ArchdioceseDeaneryOverview = {
  id: string;
  name: string;
  code: string | null;
  status: string | null;
  vicariateName: string | null;
  parishCount: number;
  latestReportSubmittedAt: string | null;
};

export type ArchdioceseParishOverview = {
  id: string;
  name: string;
  code: string | null;
  status: string | null;
  vicariateName: string | null;
  deaneryName: string | null;
  latestReportStatus: string | null;
  totalProjects: number;
  totalContributions: number;
};

export type ArchdioceseUserOverview = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: AppRole;
  level: HierarchyLevel;
  isPrimary: boolean;
  isActive: boolean;
  vicariateName: string | null;
  deaneryName: string | null;
  parishName: string | null;
  assignedAt: string | null;
};

export type ArchdiocesePendingRequest = {
  id: string;
  userId: string;
  requestedRole: AppRole;
  requestedLevel: HierarchyLevel;
  requestedArchdioceseId: string | null;
  requestedVicariateId: string | null;
  requestedDeaneryId: string | null;
  requestedParishId: string | null;
  createdAt: string;
  profile: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  vicariateName: string | null;
  deaneryName: string | null;
  parishName: string | null;
};

export type ArchdioceseReportSummaryItem = {
  id: string;
  parishId: string;
  parishName: string | null;
  deaneryName: string | null;
  vicariateName: string | null;
  status: string | null;
  summary: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
};

export type ArchdioceseReportOverview = {
  submitted: number;
  approved: number;
  returned: number;
  recentReports: ArchdioceseReportSummaryItem[];
};

export type ArchdioceseProjectOverview = {
  id: string;
  title: string;
  status: string | null;
  parishName: string | null;
  deaneryName: string | null;
  vicariateName: string | null;
  budgetAmount: number | null;
  amountRaised: number | null;
  updatedAt: string | null;
};

export type ArchdioceseContributionSummary = {
  totalAmount: number;
  byVicariate: Array<{ name: string; amount: number }>;
  recentContributions: Array<{
    id: string;
    contributorName: string;
    contributionType: string;
    amount: number;
    currency: string;
    parishName: string | null;
    contributedOn: string;
  }>;
};

export type ArchdioceseSettingsSnapshot = {
  archdioceseName: string | null;
  currentUserName: string | null;
  currentUserEmail: string | null;
  totalVicariates: number;
  totalDeaneries: number;
  totalParishes: number;
  hierarchyDepth: number;
};
