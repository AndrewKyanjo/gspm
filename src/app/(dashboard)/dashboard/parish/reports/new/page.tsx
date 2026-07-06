import { ReportForm } from "@/components/dashboard/parish/forms/report-form";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getOpenReportingPeriods } from "@/features/parish/reports/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function NewParishReportPage() {
  await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  const reportingPeriods = await getOpenReportingPeriods();

  return (
    <ParishShell
      pathname="/dashboard/parish/reports"
      eyebrow="Parish Reports"
      title="Create report"
      subtitle="Capture parish reporting totals, summary notes, and the final submission state for the selected reporting period."
      actions={
        <Button href="/dashboard/parish/reports" variant="secondary">
          Back to reports
        </Button>
      }
    >
      <PageHeader
        title="New parish report"
        description="Save a draft while collecting parish numbers, or submit the report immediately when the figures are ready."
      />

      {reportingPeriods.length ? (
        <Card>
          <CardContent className="p-5">
            <ReportForm reportingPeriods={reportingPeriods} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No reporting periods available"
          description="Add at least one reporting period in Supabase before parish users can create a report."
        />
      )}
    </ParishShell>
  );
}
