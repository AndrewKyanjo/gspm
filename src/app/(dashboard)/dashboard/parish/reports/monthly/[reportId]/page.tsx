import { notFound } from "next/navigation";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
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
import { Activity, CalendarCheck, FileText, FolderKanban, HandCoins, TrendingUp } from "lucide-react";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

type Props = { params: Promise<{ reportId: string }> };

export default async function ParishMonthlyReportDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  if (!context.archdioceseId) return null;

  const { reportId } = await params;
  const report = await getMonthlyReport(reportId);
  if (!report) notFound();

  const { financialData, projectData, documentData } = report;

  return (
    <ParishShell
      pathname="/dashboard/parish/reports"
      eyebrow="Monthly Report"
      title={`${MONTH_LABELS[report.reportMonth - 1]} ${report.reportYear}`}
      subtitle={`${report.scopeName ?? "Parish"} • ${report.status}`}
      actions={
        <div className="flex flex-wrap gap-2 print:hidden">
          <PrintButton />
          <Button href="/dashboard/parish/reports/monthly" variant="secondary">All reports</Button>
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
      <PageHeader title={`${MONTH_LABELS[report.reportMonth - 1]} ${report.reportYear} — Monthly Report`} description={`Composite report for ${report.scopeName ?? "the parish"}.`} actions={<Badge>{report.status}</Badge>} />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2"><HandCoins className="h-5 w-5 text-primary" /> Financial Analysis</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Emitemwa paid" value={currencyFormatter.format(financialData.totalEmitemwaPaid)} helper="Monthly payments" icon={HandCoins} />
          <StatCard label="YTD paid" value={currencyFormatter.format(financialData.ytdPaid)} helper="Year to date" icon={TrendingUp} />
          <StatCard label="Balance" value={currencyFormatter.format(financialData.totalAnnualBalance)} helper="Outstanding" icon={Activity} />
          <StatCard label="G.S.D. cleared" value={`${financialData.goodSamaritanClearedCount}/${financialData.goodSamaritanTotalCount}`} helper="Good Samaritan Day" icon={CalendarCheck} />
        </div>
        {financialData.byContributionType.length > 0 && (
          <SimpleTable title="By type" rows={financialData.byContributionType} columns={[
            { header: "Type", cell: (item) => <span className="font-medium">{item.type}</span> },
            { header: "Amount", cell: (item) => currencyFormatter.format(item.amount) },
          ]} />
        )}
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2"><FolderKanban className="h-5 w-5 text-primary" /> Project Involvement</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Active projects" value={projectData.activeProjects} helper="In scope" icon={FolderKanban} />
          <StatCard label="Raised this month" value={currencyFormatter.format(projectData.totalRaisedThisMonth)} helper="Project contributions" icon={HandCoins} />
          <StatCard label="Progress" value={`${projectData.overallProgressPercent}%`} helper="Of target" icon={TrendingUp} />
        </div>
        {projectData.byProject.length > 0 && (
          <SimpleTable title="Projects" rows={projectData.byProject} columns={[
            { header: "Project", cell: (p) => <span className="font-medium">{p.name}</span> },
            { header: "Raised", cell: (p) => currencyFormatter.format(p.totalRaised) },
            { header: "Target", cell: (p) => p.targetAmount != null ? currencyFormatter.format(p.targetAmount) : "-" },
          ]} />
        )}
      </section>

      <section className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold text-on-surface flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Document Registry</h2>
        <StatCard label="Documents saved" value={documentData.totalDocuments} helper={`During ${MONTH_LABELS[report.reportMonth - 1]} ${report.reportYear}`} icon={FileText} />
        {documentData.documents.length > 0 ? (
          <SimpleTable title="Documents this month" rows={documentData.documents} columns={[
            { header: "Title", cell: (d) => <span className="font-medium">{d.title}</span> },
            { header: "Category", cell: (d) => d.category },
            { header: "Uploaded", cell: (d) => new Date(d.uploadedAt).toLocaleDateString() },
          ]} />
        ) : (
          <Card><CardHeader><CardTitle>No documents</CardTitle><CardDescription>No documents were saved during this month.</CardDescription></CardHeader></Card>
        )}
      </section>

      <style>{`@media print { aside, header, .print\\:hidden { display: none !important; } main { padding: 0 !important; } body { background: white !important; } }`}</style>
    </ParishShell>
  );
}
