import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeaneryReports } from "@/features/deanery/reports/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

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

type DeaneryReportsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DeaneryReportsPage({ searchParams }: DeaneryReportsPageProps) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const status = typeof resolvedSearchParams?.status === "string" ? resolvedSearchParams.status : undefined;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;
  const reports = await getDeaneryReports(context.deaneryId, { status, query });

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/reports"
      eyebrow="Deanery Reports"
      title="Parish report review"
      subtitle="Approve, reject, return, and comment on parish submissions within the deanery."
      searchQuery={query}
    >
      <PageHeader
        title="Reports queue"
        description="Use the status filter and search to work through parish submissions and track workflow history."
        actions={
          <form action="/dashboard/deanery/reports" method="get" className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="q" value={query ?? ""} />
            <select name="status" defaultValue={status ?? ""} className="rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface">
              <option value="">All statuses</option>
              <option value="submitted">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="returned">Returned</option>
            </select>
            <Button type="submit" variant="secondary">Apply</Button>
          </form>
        }
      />

      {reports.length ? (
        <SimpleTable
          title="Report register"
          rows={reports}
          columns={[
            { header: "Parish", cell: (report) => report.parishName ?? "-" },
            { header: "Period", cell: (report) => report.reportingPeriodLabel ?? "-" },
            { header: "Status", cell: (report) => <Badge variant={badgeVariantForStatus(report.status)}>{report.status ?? "unknown"}</Badge> },
            { header: "Summary", cell: (report) => report.summary ?? "-" },
            { header: "Submitted", cell: (report) => (report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "-") },
            { header: "Open", cell: (report) => <Button href={`/dashboard/deanery/reports/${report.id}`} size="sm" variant="secondary">Review</Button> },
          ]}
        />
      ) : (
        <EmptyState title="No reports matched the current filters" description="Try changing the status filter or searching with a broader term." />
      )}
    </DeaneryShell>
  );
}
