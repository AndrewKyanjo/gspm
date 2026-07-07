import { Landmark, ShieldCheck, Table2 } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseParishOverviews } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

type ArchdioceseParishesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function statusVariant(status: string | null) {
  switch (status) {
    case "approved":
    case "active":
      return "success" as const;
    case "submitted":
    case "inactive":
      return "warning" as const;
    case "returned":
    case "archived":
      return "danger" as const;
    default:
      return "default" as const;
  }
}

export default async function ArchdioceseParishesPage({ searchParams }: ArchdioceseParishesPageProps) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) {
    return null;
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";

  const parishes = await getArchdioceseParishOverviews(context.archdioceseId);
  const filtered = query
    ? parishes.filter((parish) =>
        [parish.name, parish.code, parish.deaneryName, parish.vicariateName]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(query.toLowerCase()))
      )
    : parishes;

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/parishes"
      eyebrow="Archdiocese Parishes"
      title="Parish directory"
      subtitle="Search and supervise every parish with deanery and vicariate context intact."
      searchAction="/dashboard/archdiocese/parishes"
      searchQuery={query}
    >
      <PageHeader
        title="Parishes"
        description="The list stays hierarchy-aware by carrying both deanery and vicariate metadata for every parish record."
        actions={<Button href="/dashboard/archdiocese/settings/hierarchy">Hierarchy settings</Button>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Parishes" value={filtered.length} helper={query ? "Matching the current search" : "Total parishes in scope"} icon={ShieldCheck} />
        <StatCard
          label="Deaneries represented"
          value={new Set(filtered.map((item) => item.deaneryName).filter(Boolean)).size}
          helper="Active supervisory groupings"
          icon={Landmark}
        />
        <StatCard
          label="Tracked records"
          value={filtered.reduce((total, item) => total + item.totalProjects + item.totalContributions, 0)}
          helper="Projects plus contribution rows"
          icon={Table2}
        />
      </section>

      {filtered.length ? (
        <SimpleTable
          title="Parish register"
          description="Operational visibility across the full hierarchy."
          rows={filtered}
          columns={[
            {
              header: "Parish",
              cell: (item) => (
                <div className="space-y-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-on-surface-variant">{item.code ?? "No parish code"}</div>
                </div>
              ),
            },
            {
              header: "Deanery",
              cell: (item) => item.deaneryName ?? "Unassigned",
            },
            {
              header: "Vicariate",
              cell: (item) => item.vicariateName ?? "Unassigned",
            },
            {
              header: "Latest report",
              cell: (item) => (
                <Badge variant={statusVariant(item.latestReportStatus)}>{item.latestReportStatus ?? "none"}</Badge>
              ),
            },
            {
              header: "Projects",
              cell: (item) => item.totalProjects,
            },
            {
              header: "Contributions",
              cell: (item) => item.totalContributions,
            },
            {
              header: "Open",
              cell: (item) => (
                <Button href={`/dashboard/archdiocese/parishes/${item.id}`} size="sm" variant="secondary">
                  View
                </Button>
              ),
            },
          ]}
        />
      ) : (
        <EmptyState
          title="No parishes matched your search"
          description="Try a broader parish, deanery, or vicariate term."
          action={<Button href="/dashboard/archdiocese/parishes" variant="secondary">Clear search</Button>}
        />
      )}
    </ArchdioceseShell>
  );
}
