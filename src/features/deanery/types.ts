export type DeaneryContext = {
  deaneryId: string;
  deaneryName: string | null;
  vicariateName: string | null;
  archdioceseName: string | null;
};

export type DeaneryDashboardStats = {
  totalParishes: number;
  totalRegisteredFollowers: number;
  totalFamilies: number;
  totalSmallChristianCommunities: number;
  monthlyContributions: number;
  pendingParishReports: number;
  approvedReports: number;
  rejectedReports: number;
  returnedReports: number;
  activeProjects: number;
};

export type DeaneryTrendPoint = {
  label: string;
  value: number;
};

export type DeaneryRecentActivityItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  createdAt: string | null;
  module: "reports" | "contributions" | "projects" | "documents" | "media";
};

export type DeaneryParishOverview = {
  id: string;
  name: string;
  code: string;
  priestName: string | null;
  location: string | null;
  status: string | null;
  followers: number;
  families: number;
  totalContributions: number;
  totalProjects: number;
  recentActivityAt: string | null;
};

export type DeaneryContributionAggregate = {
  totalContributions: number;
  topPerformingParish: string | null;
  byParish: Array<{ parishName: string; amount: number }>;
  monthlyTrends: DeaneryTrendPoint[];
  quarterlyTrends: DeaneryTrendPoint[];
  yearlyTrends: DeaneryTrendPoint[];
  breakdown: Array<{ label: string; value: number }>;
};

export type DeaneryReportListItem = {
  id: string;
  parishId: string;
  parishName: string | null;
  reportingPeriodLabel: string | null;
  status: string | null;
  summary: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
};

export type DeaneryReportReviewEvent = {
  id: string;
  action: string;
  note: string | null;
  createdAt: string;
  createdByName: string | null;
};

export type DeaneryReportDetail = DeaneryReportListItem & {
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
  challenges: string | null;
  recommendations: string | null;
  events: DeaneryReportReviewEvent[];
};

export type DeaneryDocumentItem = {
  id: string;
  title: string;
  category: string;
  description: string | null;
  versionNumber: number;
  isArchived: boolean;
  createdAt: string;
  uploadedByName: string | null;
  downloadUrl: string | null;
  path: string;
};

export type DeaneryProjectOverview = {
  id: string;
  parishName: string | null;
  title: string;
  category: string | null;
  status: string | null;
  location: string | null;
  budgetAmount: number | null;
  amountRaised: number | null;
  targetEndDate: string | null;
  updatedAt: string | null;
  coverImageUrl: string | null;
};

export type DeaneryMediaItem = {
  path: string;
  name: string;
  parishName: string | null;
  monthLabel: string;
  category: "parish" | "deanery";
  updatedAt: string | null;
  previewUrl: string | null;
};

export type DeaneryMediaMonthGroup = {
  monthKey: string;
  monthLabel: string;
  items: DeaneryMediaItem[];
};

export type DeanerySettingsUser = {
  id: string;
  fullName: string | null;
  email: string | null;
  role: string;
  isPrimary: boolean;
  isActive: boolean;
};

export type DeanerySearchResult = {
  module: "parishes" | "contributions" | "reports" | "documents" | "projects" | "media";
  title: string;
  description: string;
  href: string;
  meta: string;
};
