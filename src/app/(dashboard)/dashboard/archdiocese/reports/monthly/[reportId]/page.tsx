import { notFound } from "next/navigation";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/dashboard/shared/print-button";
import { getMonthlyReport } from "@/features/reports/queries";
import { publishMonthlyReport } from "@/features/reports/actions";
import { requireAuth } from "@/lib/auth/requireAuth";
import { MONTH_LABELS } from "@/features/contributions/queries";
import { Activity, Building2, CalendarCheck, FileText, FolderKanban, HandCoins, TrendingUp } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

type Props = { params: Promise<{ reportId: string }> };

export default async function MonthlyReportDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const { reportId } = await params;
  const report = await getMonthlyReport(reportId);
  if (!report) notFound();

  const { financialData, projectData, documentData } = report;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Monthly Report"
      title={`${MONTH_LABELS[report.reportMonth - 1]} ${report.reportYear}`}
      subtitle={`${report.scopeName ?? "Archdiocese"} • ${report.status}`}
      actions={
        <div className="flex flex-wrap gap-2 print:hidden">
          <PrintButton />
          <Button href="/dashboard/archdiocese/reports/monthly" variant="secondary">All reports</Button>
          {report.status !== "published" && (
            <form action={publishMonthlyReport}>
              <input type="hidden" name="reportId" value={report.id} />
              <Button type="submit" variant="secondary">Publish</Button>
            </form>
          )}
        </div>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`${MONTH_LABELS[report.reportMonth - 1]} ${report.reportYear} — Monthly Report`}
        description={`Composite report for ${report.scopeName ?? "the archdiocese"} covering finances, projects, and documents.`}
        actions={<Badge>{report.status}</Badge>}
      />

      {/* ── Section 1: Financial Analysis ── */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
          <HandCoins className="h-5 w-5 text-primary" /> Financial Analysis
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Emitemwa paid" value={currencyFormatter.format(financialData.totalEmitemwaPaid)} helper={`${MONTH_LABELS[report.reportMonth - 1]} payments`} icon={HandCoins} />
          <StatCard label="YTD paid" value={currencyFormatter.format(financialData.ytdPaid)} helper="Year to date" icon={TrendingUp} />
          <StatCard label="Annual balance" value={currencyFormatter.format(financialData.totalAnnualBalance)} helper="Outstanding across all parishes" icon={Activity} />
          <StatCard label="G.S.D. cleared" value={`${financialData.goodSamaritanClearedCount}/${financialData.goodSamaritanTotalCount}`} helper="Good Samaritan Day clearances" icon={CalendarCheck} />
        </div>

        {financialData.byContributionType.length > 0 && (
          <SimpleTable
            title="By contribution type"
            rows={financialData.byContributionType}
            columns={[
              { header: "Type", cell: (item) => <span className="font-medium">{item.type}</span> },
              { header: "Amount", cell: (item) => currencyFormatter.format(item.amount) },
            ]}
          />
        )}

        {financialData.byParish.length > 0 && (
          <SimpleTable
            title="Per parish breakdown"
            description="Monthly Emitemwa payments, year-to-date totals, and outstanding balances per parish."
            rows={financialData.byParish}
            columns={[
              { header: "Parish", cell: (p) => <span className="font-medium">{p.parishName}</span> },
              { header: "Deanery", cell: (p) => p.deaneryName ?? "-" },
              { header: "Month paid", cell: (p) => currencyFormatter.format(p.monthPaid) },
              { header: "YTD paid", cell: (p) => currencyFormatter.format(p.ytdPaid) },
              { header: "Balance", cell: (p) => currencyFormatter.format(p.annualBalance) },
              { header: "G.S.D.", cell: (p) => p.goodSamaritanCleared ? <Badge variant="success">Cleared</Badge> : <Badge variant="warning">Due</Badge> },
            ]}
          />
        )}
      </section>

      {/* ── Section 2: Project Involvement ── */}
      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
          <FolderKanban className="h-5 w-5 text-primary" /> Project Involvement
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Active projects" value={projectData.activeProjects} helper="In scope" icon={FolderKanban} />
          <StatCard label="Raised this month" value={currencyFormatter.format(projectData.totalRaisedThisMonth)} helper="Project contributions" icon={HandCoins} />
          <StatCard label="Overall progress" value={`${projectData.overallProgressPercent}%`} helper={`${currencyFormatter.format(projectData.totalRaisedThisMonth + (projectData.byProject.reduce((sum, p) => sum + p.totalRaised, 0) - projectData.totalRaisedThisMonth))} of ${currencyFormatter.format(projectData.totalTarget)} target`} icon={TrendingUp} />
        </div>
        {projectData.byProject.length > 0 && (
          <SimpleTable
            title="Project breakdown"
            rows={projectData.byProject}
            columns={[
              { header: "Project", cell: (p) => <span className="font-medium">{p.name}</span> },
              { header: "Raised this month", cell: (p) => currencyFormatter.format(p.raisedThisMonth) },
              { header: "Total raised", cell: (p) => currencyFormatter.format(p.totalRaised) },
              { header: "Target", cell: (p) => p.targetAmount != null ? currencyFormatter.format(p.targetAmount) : "-" },
              { header: "Parishes", cell: (p) => p.parishCount.toLocaleString() },
            ]}
          />
        )}
      </section>

      {/* ── Section 3: Document Registry ── */}
      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> Document Registry
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard label="Documents saved" value={documentData.totalDocuments} helper={`During ${MONTH_LABELS[report.reportMonth - 1]} ${report.reportYear}`} icon={FileText} />
          <StatCard label="Categories" value={new Set(documentData.documents.map((d) => d.category)).size} helper="Distinct document categories" icon={Building2} />
        </div>
        {documentData.documents.length > 0 ? (
          <SimpleTable
            title="Documents uploaded this month"
            rows={documentData.documents}
            columns={[
              { header: "Title", cell: (d) => <span className="font-medium">{d.title}</span> },
              { header: "Category", cell: (d) => d.category },
              { header: "Scope", cell: (d) => <Badge>{d.scopeLevel}</Badge> },
              { header: "Uploaded", cell: (d) => new Date(d.uploadedAt).toLocaleDateString() },
            ]}
          />
        ) : (
          <Card>
            <CardHeader><CardTitle>No documents</CardTitle><CardDescription>No documents were saved during this month.</CardDescription></CardHeader>
          </Card>
        )}
      </section>

      <style>{`
        @media print {
          aside, header, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>
    </ArchdioceseShell>
  );
}
