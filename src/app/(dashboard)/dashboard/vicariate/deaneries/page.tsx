import { Landmark, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { Badge } from "@/components/ui/badge";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { requireAuth } from "@/lib/auth/requireAuth";

function statusVariant(status: string | null) {
  if (status === "active") return "success" as const;
  if (status === "inactive") return "warning" as const;
  if (status === "archived") return "danger" as const;
  return "default" as const;
}

export default async function VicariateDeaneriesPage() {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const hierarchy = await getHierarchyCollections({
    archdioceseId: context.archdioceseId,
    vicariateId: context.vicariateId,
  });

  const rows = hierarchy.deaneries.map((deanery) => ({
    id: deanery.id,
    name: deanery.name,
    code: deanery.code ?? null,
    status: deanery.status ?? null,
    parishCount: hierarchy.parishes.filter((parish) => parish.deanery_id === deanery.id).length,
  }));

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/deaneries"
      eyebrow="Vicariate Deaneries"
      title="Deaneries"
      subtitle="Deaneries and parish coverage within this vicariate."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={hierarchy.vicariates[0]?.name ?? "Vicariate deaneries"}
        description="Every deanery shown here belongs to this vicariate scope."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Deaneries" value={rows.length} helper="Administrative clusters" icon={Landmark} />
        <StatCard
          label="Parishes"
          value={rows.reduce((total, row) => total + row.parishCount, 0)}
          helper="Across all deaneries"
          icon={ShieldCheck}
        />
      </section>

      <SimpleTable
        title="Deanery registry"
        rows={rows}
        columns={[
          {
            header: "Deanery",
            cell: (row) => (
              <div className="space-y-1">
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-on-surface-variant">{row.code ?? "No code"}</div>
              </div>
            ),
          },
          { header: "Status", cell: (row) => <Badge variant={statusVariant(row.status)}>{row.status ?? "unknown"}</Badge> },
          { header: "Parishes", cell: (row) => row.parishCount },
        ]}
      />
    </VicariateShell>
  );
}
