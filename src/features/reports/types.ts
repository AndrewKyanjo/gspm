// ── Generated Monthly Report Types ─────────────────────────────

export type MonthlyReportScope = "archdiocese" | "vicariate" | "deanery" | "parish";

export type MonthlyFinancialData = {
  monthLabel: string;
  year: number;
  month: number;
  totalEmitemwaPaid: number;
  totalAnnualDue: number;
  totalAnnualBalance: number;
  ytdPaid: number;
  goodSamaritanClearedCount: number;
  goodSamaritanTotalCount: number;
  goodSamaritanDue: number;
  goodSamaritanPaid: number;
  arrearsCount: number;
  arrearsTotal: number;
  byParish: Array<{
    parishId: string;
    parishName: string;
    deaneryName: string | null;
    monthPaid: number;
    ytdPaid: number;
    annualBalance: number;
    goodSamaritanCleared: boolean;
  }>;
  byContributionType: Array<{ type: string; amount: number }>;
  previousMonthComparison: {
    prevMonthPaid: number;
    changePercent: number;
  } | null;
};

export type MonthlyProjectData = {
  activeProjects: number;
  totalRaisedThisMonth: number;
  totalTarget: number;
  overallProgressPercent: number;
  byProject: Array<{
    id: string;
    name: string;
    status: string;
    raisedThisMonth: number;
    totalRaised: number;
    targetAmount: number | null;
    parishCount: number;
  }>;
};

export type MonthlyDocumentData = {
  totalDocuments: number;
  documents: Array<{
    id: string;
    title: string;
    category: string;
    scopeLevel: string;
    uploadedAt: string;
    uploadedByName: string | null;
    fileType: string | null;
    metadata: Record<string, unknown>;
  }>;
};

export type GeneratedMonthlyReport = {
  id: string;
  archdioceseId: string;
  scopeLevel: MonthlyReportScope;
  scopeEntityId: string;
  scopeName: string | null;
  reportYear: number;
  reportMonth: number;
  financialData: MonthlyFinancialData;
  projectData: MonthlyProjectData;
  documentData: MonthlyDocumentData;
  status: "generated" | "reviewed" | "published";
  generatedBy: string | null;
  generatedAt: string;
  publishedAt: string | null;
};

export type MonthlyReportListItem = {
  id: string;
  scopeLevel: MonthlyReportScope;
  scopeName: string | null;
  reportYear: number;
  reportMonth: number;
  monthLabel: string;
  status: "generated" | "reviewed" | "published";
  totalEmitemwaPaid: number;
  totalAnnualBalance: number;
  activeProjects: number;
  totalDocuments: number;
  generatedAt: string;
};
