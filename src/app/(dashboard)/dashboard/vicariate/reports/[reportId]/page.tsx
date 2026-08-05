import { notFound } from "next/navigation";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getVicariateReportDetail } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "approved": return "success" as const;
    case "submitted": return "info" as const;
    case "returned": return "warning" as const;
    case "rejected": return "danger" as const;
    default: return "default" as const;
  }
}

type Props = { params: Promise<{ reportId: string }> };

export default async function VicariateReportDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const { reportId } = await params;
  const report = await getVicariateReportDetail(context.archdioceseId, context.vicariateId, reportId);
  if (!report) notFound();

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/reports"
      eyebrow="Vicariate Reports"
      title={report.parishName ?? "Parish report"}
      subtitle="Full submission detail from the vicariate supervision layer."
      actions={<Button href="/dashboard/vicariate/reports" variant="secondary">Back to reports</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={`${report.parishName ?? "Parish"} • ${report.reportingPeriodLabel ?? "Period"}`}
        description={report.summary ?? "No summary provided."}
        actions={<Badge variant={badgeVariantForStatus(report.status)}>{report.status ?? "unknown"}</Badge>}
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Context</CardTitle>
            <CardDescription>Parish hierarchy and submission timeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Parish</p><p className="mt-1 text-sm text-on-surface">{report.parishName ?? "-"}</p></div>
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Deanery</p><p className="mt-1 text-sm text-on-surface">{report.deaneryName ?? "-"}</p></div>
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Submitted</p><p className="mt-1 text-sm text-on-surface">{report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "-"}</p></div>
            <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Updated</p><p className="mt-1 text-sm text-on-surface">{report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : "-"}</p></div>
            {report.challenges && <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Challenges</p><p className="mt-1 text-sm text-on-surface">{report.challenges}</p></div>}
            {report.recommendations && <div className="rounded-md bg-surface-container p-4"><p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Recommendations</p><p className="mt-1 text-sm text-on-surface">{report.recommendations}</p></div>}
          </CardContent>
        </Card>
      </section>
    </VicariateShell>
  );
}
