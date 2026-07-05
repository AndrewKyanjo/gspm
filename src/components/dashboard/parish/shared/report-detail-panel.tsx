import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParishReportDetail } from "@/features/parish/types";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "submitted":
      return "info" as const;
    case "draft":
      return "warning" as const;
    default:
      return "default" as const;
  }
}

export function ReportDetailPanel({ report }: { report: ParishReportDetail }) {
  return (
    <aside className="w-full xl:sticky xl:top-6 xl:max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Report detail</CardTitle>
              <CardDescription>{report.reportingPeriodLabel ?? "Unknown period"}</CardDescription>
            </div>
            <Badge variant={badgeVariantForStatus(report.status)}>{report.status ?? "unknown"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
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
              <div key={String(label)} className="rounded-md bg-surface-container p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
                <p className="mt-1 text-lg font-semibold text-on-surface">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Donations received
              </p>
              <p className="mt-1 text-lg font-semibold text-on-surface">
                {currencyFormatter.format(report.totalDonationsReceived)}
              </p>
            </div>
            <div className="rounded-md bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Amount disbursed
              </p>
              <p className="mt-1 text-lg font-semibold text-on-surface">
                {currencyFormatter.format(report.totalAmountDisbursed)}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Created", formatDate(report.createdAt)],
              ["Updated", formatDate(report.updatedAt)],
              ["Submitted", formatDate(report.submittedAt)],
              ["Approved", formatDate(report.approvedAt)],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-md bg-surface-container p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
                <p className="mt-1 text-sm text-on-surface">{value}</p>
              </div>
            ))}
          </div>

          {[
            ["Summary", report.summary],
            ["Challenges", report.challenges],
            ["Recommendations", report.recommendations],
          ].map(([label, value]) => (
            <div key={String(label)} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{label}</p>
              <p className="text-sm text-on-surface">{value || "No entry provided."}</p>
            </div>
          ))}

          <Button href="/dashboard/parish/reports" variant="secondary">
            Close panel
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
