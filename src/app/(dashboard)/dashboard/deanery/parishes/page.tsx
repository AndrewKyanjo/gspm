import { Building2, HandCoins } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { BarListChart } from "@/components/dashboard/deanery/charts/bar-list-chart";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { getDeaneryParishOverviews } from "@/features/deanery/parishes/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

const currencyFormatter = new Intl.NumberFormat("en-UG", {
  style: "currency",
  currency: "UGX",
  maximumFractionDigits: 0,
});

type DeaneryParishesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DeaneryParishesPage({ searchParams }: DeaneryParishesPageProps) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q.trim().toLowerCase() : "";
  const parishes = await getDeaneryParishOverviews(context.deaneryId);
  const filteredParishes = query
    ? parishes.filter((parish) =>
        [parish.name, parish.code, parish.priestName, parish.location]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      )
    : parishes;

  return (
    <DeaneryShell
      pathname="/dashboard/deanery/parishes"
      eyebrow="Deanery Parishes"
      title="Parish supervision"
      subtitle="Search, compare, and monitor every parish assigned to the deanery."
      searchQuery={query}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Assigned parishes"
        description="This is the deanery’s supervisory register for parish status, reported families, contribution performance, and recent activity."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Parish count" value={filteredParishes.length} helper="Within this deanery scope" icon={Building2} />
        <StatCard
          label="Combined contributions"
          value={currencyFormatter.format(filteredParishes.reduce((sum, parish) => sum + parish.totalContributions, 0))}
          helper="Visible parish contribution totals"
          icon={HandCoins}
        />
      </section>

      <BarListChart
        title="Parish contribution comparison"
        description="Quick comparison of parish contribution totals."
        items={filteredParishes.map((parish) => ({ label: parish.name, value: parish.totalContributions }))}
        formatter={(value) => currencyFormatter.format(value)}
      />

      {filteredParishes.length ? (
        <SimpleTable
          title="Parish register"
          description="Use the search bar to narrow the list by parish name, code, priest, or location."
          rows={filteredParishes}
          columns={[
            {
              header: "Parish",
              cell: (parish) => (
                <Button href={`/dashboard/deanery/parishes/${parish.id}`} variant="ghost" className="h-auto px-0 py-0 font-medium">
                  {parish.name}
                </Button>
              ),
            },
            { header: "Priest", cell: (parish) => parish.priestName ?? "-" },
            { header: "Location", cell: (parish) => parish.location ?? "-" },
            { header: "Followers", cell: (parish) => parish.followers.toLocaleString() },
            { header: "Families", cell: (parish) => parish.families.toLocaleString() },
            { header: "Projects", cell: (parish) => parish.totalProjects.toLocaleString() },
          ]}
        />
      ) : (
        <EmptyState title="No parishes matched your search" description="Try a broader parish name, code, priest, or location term." />
      )}
    </DeaneryShell>
  );
}
