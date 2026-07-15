import { Building2, Calendar, CheckCircle2, Users, XCircle } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReportDetail } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { notFound } from "next/navigation";
import { ApproveReportButton } from "./approve-button";
import { ReturnReportButton } from "./return-button";

type Props = { params: Promise<{ reportId: string }> };

function statusVariant(status: string | null) {
  switch (status) {
    case "approved": return "success" as const;
    case "submitted": return "warning" as const;
    case "returned": return "danger" as const;
    default: return "default" as const;
  }
}

function monthLabel(year: number | null, month: number | null) {
  if (year == null || month == null) return "N/A";
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

export default async function ReportDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const { reportId } = await params;
  const detail = await getReportDetail(context.archdioceseId, reportId);
  if (!detail) notFound();

  const isAdmin = context.role === "super_admin" || context.role === "archdiocese_admin";
  const canReview = isAdmin && detail.status === "submitted";

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/reports"
      eyebrow="Archdiocese Reports"
      title={`Report — ${detail.parishName ?? "Unknown Parish"}`}
      subtitle={`Deanery: ${detail.deaneryName ?? "Unknown"} • Vicariate: ${detail.vicariateName ?? "Unknown"}`}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`Parish Report: ${detail.parishName ?? "Unknown Parish"}`}
        description={`Period: ${monthLabel(detail.reportingPeriodYear, detail.reportingPeriodMonth)}`}
        actions={
          <div className="flex gap-2">
            {canReview && (
              <>
                <ApproveReportButton reportId={detail.id} />
                <ReturnReportButton reportId={detail.id} />
              </>
            )}
            <Button href="/dashboard/archdiocese/reports" variant="secondary">All reports</Button>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Status" value={detail.status ?? "unknown"} helper="Current review state" icon={Building2} />
        <StatCard label="Households" value={detail.totalHouseholds ?? 0} helper="Reported households" icon={Users} />
        <StatCard label="Beneficiaries" value={detail.totalBeneficiaries ?? 0} helper="Total beneficiaries" icon={Users} />
        <StatCard label="Period" value={monthLabel(detail.reportingPeriodYear, detail.reportingPeriodMonth)} helper="Reporting period" icon={Calendar} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          {detail.summary && (
            <Card>
              <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-on-surface whitespace-pre-wrap">{detail.summary}</p></CardContent>
            </Card>
          )}
          {detail.narrative && (
            <Card>
              <CardHeader><CardTitle>Narrative</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-on-surface whitespace-pre-wrap">{detail.narrative}</p></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {detail.challenges && (
            <Card>
              <CardHeader><CardTitle>Challenges</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-on-surface whitespace-pre-wrap">{detail.challenges}</p></CardContent>
            </Card>
          )}
          {detail.recommendations && (
            <Card>
              <CardHeader><CardTitle>Recommendations</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-on-surface whitespace-pre-wrap">{detail.recommendations}</p></CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle>Hierarchy context</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between rounded-md bg-surface-container p-3">
                <span className="text-sm text-on-surface-variant">Vicariate</span>
                <span className="text-sm font-medium text-on-surface">{detail.vicariateName ?? "N/A"}</span>
              </div>
              <div className="flex justify-between rounded-md bg-surface-container p-3">
                <span className="text-sm text-on-surface-variant">Deanery</span>
                <span className="text-sm font-medium text-on-surface">{detail.deaneryName ?? "N/A"}</span>
              </div>
              <div className="flex justify-between rounded-md bg-surface-container p-3">
                <span className="text-sm text-on-surface-variant">Parish</span>
                <span className="text-sm font-medium text-on-surface">{detail.parishName ?? "N/A"}</span>
              </div>
              {detail.submittedAt && (
                <div className="flex justify-between rounded-md bg-surface-container p-3">
                  <span className="text-sm text-on-surface-variant">Submitted</span>
                  <span className="text-sm font-medium text-on-surface">{new Date(detail.submittedAt).toLocaleDateString()}</span>
                </div>
              )}
              {detail.approvedAt && (
                <div className="flex justify-between rounded-md bg-surface-container p-3">
                  <span className="text-sm text-on-surface-variant">Approved</span>
                  <span className="text-sm font-medium text-on-surface">{new Date(detail.approvedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </ArchdioceseShell>
  );
}
