import { notFound } from "next/navigation";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { DeaneryReportReviewForm } from "@/components/dashboard/deanery/forms/deanery-report-review-form";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeaneryReportDetail } from "@/features/deanery/reports/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "submitted":
      return "info" as const;
    case "returned":
      return "warning" as const;
    case "rejected":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

type DeaneryReportDetailPageProps = {
  params: Promise<{ reportId: string }>;
};

export default async function DeaneryReportDetailPage({ params }: DeaneryReportDetailPageProps) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const { reportId } = await params;
  const report = await getDeaneryReportDetail(context.deaneryId, reportId);
  if (!report) notFound();

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/reports"
      eyebrow="Deanery Reports"
      title={report.parishName ?? "Parish report"}
      subtitle="Full submission detail, comments, approval workflow, and review history."
      actions={<Button href="/dashboard/deanery/reports" variant="secondary">Back to reports</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`${report.parishName ?? "Parish"} • ${report.reportingPeriodLabel ?? "Period"}`}
        description={report.summary ?? "No summary provided."}
        actions={<Badge variant={badgeVariantForStatus(report.status)}>{report.status ?? "unknown"}</Badge>}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report metrics</CardTitle>
              <CardDescription>Operational totals reported by the parish.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["Households", report.totalHouseholds],
                ["Beneficiaries", report.totalBeneficiaries],
                ["Male", report.maleBeneficiaries],
                ["Female", report.femaleBeneficiaries],
                ["Youth", report.youthBeneficiaries],
                ["Elderly", report.elderlyBeneficiaries],
                ["Cases opened", report.totalCasesOpened],
                ["Cases closed", report.totalCasesClosed],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-md bg-surface-container p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
                  <p className="mt-1 text-lg font-semibold text-on-surface">{value}</p>
                </div>
              ))}
              <div className="rounded-md bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Donations received</p>
                <p className="mt-1 text-lg font-semibold text-on-surface">{currencyFormatter.format(report.totalDonationsReceived)}</p>
              </div>
              <div className="rounded-md bg-surface-container p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Amount disbursed</p>
                <p className="mt-1 text-lg font-semibold text-on-surface">{currencyFormatter.format(report.totalAmountDisbursed)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Review history</CardTitle>
              <CardDescription>Timeline of deanery comments and workflow changes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.events.length ? (
                report.events.map((event) => (
                  <div key={event.id} className="rounded-md border border-outline-variant p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant={badgeVariantForStatus(event.action)}>{event.action}</Badge>
                      <span className="text-xs text-on-surface-variant">{new Date(event.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-on-surface">{event.note ?? "No note added."}</p>
                    <p className="mt-2 text-xs text-on-surface-variant">{event.createdByName ?? "Deanery reviewer"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">No review events recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Review workflow</CardTitle>
            <CardDescription>Approve, reject, return, or comment on the parish submission.</CardDescription>
          </CardHeader>
          <CardContent>
            <DeaneryReportReviewForm reportId={report.id} />
          </CardContent>
        </Card>
      </section>
    </DeaneryShell>
  );
}
