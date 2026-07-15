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
  monthlyEmitemwaAmount: number;
  goodSamaritanDayAmount: number;
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
  vicariateId: string;
  deaneryId: string;
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

// ── Detail types ──────────────────────────────────────────────

export type VicariateDetail = {
  id: string;
  name: string;
  code: string | null;
  status: string | null;
  deaneries: Array<{
    id: string;
    name: string;
    parishCount: number;
    status: string | null;
  }>;
  parishes: Array<{
    id: string;
    name: string;
    deaneryName: string | null;
    status: string | null;
  }>;
  totalDeaneries: number;
  totalParishes: number;
};

export type DeaneryDetail = {
  id: string;
  name: string;
  code: string | null;
  status: string | null;
  vicariateId: string;
  vicariateName: string | null;
  archdioceseName: string | null;
  parishes: Array<{
    id: string;
    name: string;
    code: string | null;
    status: string | null;
  }>;
  recentReports: Array<{
    id: string;
    parishName: string | null;
    status: string | null;
    updatedAt: string | null;
  }>;
  recentProjects: Array<{
    id: string;
    title: string;
    parishName: string | null;
    status: string | null;
  }>;
  totalParishes: number;
  totalReports: number;
  totalProjects: number;
  totalContributions: number;
};

export type ParishDetail = {
  id: string;
  name: string;
  code: string | null;
  status: string | null;
  vicariateId: string;
  vicariateName: string | null;
  deaneryId: string;
  deaneryName: string | null;
  archdioceseName: string | null;
  recentReports: ArchdioceseReportSummaryItem[];
  recentProjects: Array<{
    id: string;
    title: string;
    status: string | null;
    budgetAmount: number | null;
    amountRaised: number | null;
    updatedAt: string | null;
  }>;
  recentContributions: Array<{
    id: string;
    contributorName: string;
    contributionType: string;
    amount: number;
    currency: string;
    contributedOn: string;
  }>;
  totalReports: number;
  totalProjects: number;
  totalContributions: number;
  contributionTotal: number;
  projectBudgetTotal: number;
};

export type ProjectDetail = {
  id: string;
  title: string;
  status: string | null;
  category: string | null;
  location: string | null;
  description: string | null;
  startDate: string | null;
  targetEndDate: string | null;
  budgetAmount: number | null;
  amountRaised: number | null;
  parishName: string | null;
  deaneryName: string | null;
  vicariateName: string | null;
  archdioceseName: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ReportDetail = {
  id: string;
  parishName: string | null;
  deaneryName: string | null;
  vicariateName: string | null;
  status: string | null;
  summary: string | null;
  totalHouseholds: number | null;
  totalBeneficiaries: number | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  updatedAt: string | null;
  reportingPeriodYear: number | null;
  reportingPeriodMonth: number | null;
  narrative: string | null;
  challenges: string | null;
  recommendations: string | null;
};

export type ArchdioceseFinancialSummary = {
  totalAmount: number;
  byVicariate: Array<{ name: string; amount: number }>;
  byDeanery: Array<{ name: string; amount: number }>;
  byMonth: Array<{ month: string; amount: number }>;
  byContributionType: Array<{ type: string; amount: number }>;
  recentContributions: Array<{
    id: string;
    contributorName: string;
    parishName: string | null;
    deaneryName: string | null;
    vicariateName: string | null;
    contributionType: string;
    amount: number;
    currency: string;
    contributedOn: string;
  }>;
};

export type ArchdioceseAuditLogEntry = {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userId: string | null;
  userName: string | null;
  details: string | null;
  createdAt: string;
};

export type ArchdioceseAssignmentDetail = {
  userId: string;
  fullName: string | null;
  email: string | null;
  role: string;
  level: string;
  isPrimary: boolean;
  isActive: boolean;
  vicariateName: string | null;
  deaneryName: string | null;
  parishName: string | null;
  assignedAt: string | null;
  assignmentId: string;
};
