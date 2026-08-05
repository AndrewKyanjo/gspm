import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVicariateReports } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function badgeVariantForStatus(status: string | null) {
  switch (status) {
    case "approved": return "success" as const;
    case "submitted": return "info" as const;
    case "returned": return "warning" as const;
    case "rejected": return "danger" as const;
    default: return "default" as const;
  }
}

type Props = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function VicariateReportsPage({ searchParams }: Props) {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const resolved = searchParams ? await searchParams : undefined;
  const status = typeof resolved?.status === "string" ? resolved.status : undefined;
  const query = typeof resolved?.q === "string" ? resolved.q : undefined;
  const reports = await getVicariateReports(context.archdioceseId, context.vicariateId, { status, query });

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/reports"
      eyebrow="Vicariate Reports"
      title="Parish report review"
      subtitle="Browse and monitor parish report submissions across the vicariate."
      searchQuery={query}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Reports queue"
        description="Use the status filter and search to review parish submissions across the vicariate."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button href="/dashboard/vicariate/reports/monthly" variant="secondary" size="sm">Monthly reports</Button>
            <form action="/dashboard/vicariate/reports" method="get" className="flex flex-wrap items-center gap-2">
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
          </div>
        }
      />

      {reports.length ? (
        <SimpleTable
          title="Report register"
          rows={reports}
          columns={[
            { header: "Parish", cell: (r) => r.parishName ?? "-" },
            { header: "Deanery", cell: (r) => r.deaneryName ?? "-" },
            { header: "Period", cell: (r) => r.reportingPeriodLabel ?? "-" },
            { header: "Status", cell: (r) => <Badge variant={badgeVariantForStatus(r.status)}>{r.status ?? "unknown"}</Badge> },
            { header: "Summary", cell: (r) => r.summary ?? "-" },
            { header: "Submitted", cell: (r) => r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "-" },
            { header: "Open", cell: (r) => <Button href={`/dashboard/vicariate/reports/${r.id}`} size="sm" variant="secondary">Review</Button> },
          ]}
        />
      ) : (
        <EmptyState title="No reports matched the current filters" description="Try changing the status filter or searching with a broader term." />
      )}
    </VicariateShell>
  );
}
