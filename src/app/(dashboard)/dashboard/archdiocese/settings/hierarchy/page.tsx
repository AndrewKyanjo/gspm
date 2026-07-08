// src/app/(dashboard)/dashboard/archdiocese/settings/hierarchy/page.tsx
import { Building2, Landmark, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArchdioceseSettingsSnapshot } from "@/features/archdiocese/queries";
import { getArchdioceseVicariateOverviews, getArchdioceseDeaneryOverviews, getArchdioceseParishOverviews } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function statusVariant(status: string | null) {
  switch (status) {
    case "active": return "success" as const;
    case "inactive": return "warning" as const;
    case "archived": return "danger" as const;
    default: return "default" as const;
  }
}

export default async function HierarchySettingsPage() {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  if (!context.archdioceseId) return null;

  const [snapshot, vicariates, deaneries, parishes] = await Promise.all([
    getArchdioceseSettingsSnapshot(context.archdioceseId, context.userId),
    getArchdioceseVicariateOverviews(context.archdioceseId),
    getArchdioceseDeaneryOverviews(context.archdioceseId),
    getArchdioceseParishOverviews(context.archdioceseId),
  ]);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/settings"
      eyebrow="Archdiocese Settings"
      title="Hierarchy management"
      subtitle="Manage the full Archdiocese → Vicariate → Deanery → Parish hierarchy."
      actions={
        <Button href="/dashboard/archdiocese/settings" variant="secondary">
          Settings overview
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Hierarchy Management"
        description="View and manage all hierarchy entities. Status changes and name edits are performed by the Archdiocese admin via the database or API."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Vicariates" value={snapshot.totalVicariates} helper="First child layer" icon={Building2} />
        <StatCard label="Deaneries" value={snapshot.totalDeaneries} helper="Second layer" icon={Landmark} />
        <StatCard label="Parishes" value={snapshot.totalParishes} helper="Operating units" icon={ShieldCheck} />
        <StatCard label="Depth" value={snapshot.hierarchyDepth} helper="Levels inclusive" icon={ShieldCheck} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SimpleTable
          title="Vicariates"
          rows={vicariates}
          columns={[
            { header: "Name", cell: (item) => <div className="font-medium">{item.name}</div> },
            { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
            { header: "Deaneries", cell: (item) => item.deaneryCount },
            { header: "Parishes", cell: (item) => item.parishCount },
          ]}
        />

        <SimpleTable
          title="Deaneries"
          rows={deaneries.slice(0, 10)}
          columns={[
            { header: "Name", cell: (item) => <div className="space-y-1"><div className="font-medium">{item.name}</div></div> },
            { header: "Vicariate", cell: (item) => item.vicariateName ?? "N/A" },
            { header: "Parishes", cell: (item) => item.parishCount },
          ]}
        />

        <SimpleTable
          title="Parishes"
          rows={parishes.slice(0, 10)}
          columns={[
            { header: "Name", cell: (item) => <div className="space-y-1"><div className="font-medium">{item.name}</div></div> },
            { header: "Deanery", cell: (item) => item.deaneryName ?? "N/A" },
            { header: "Vicariate", cell: (item) => item.vicariateName ?? "N/A" },
          ]}
        />
      </section>

      <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-6">
        <p className="text-sm font-semibold text-on-surface mb-2">Management actions</p>
        <p className="text-sm text-on-surface-variant">
          Hierarchy mutations (create, update, delete, status changes) are performed via the Supabase database admin panel or API.
          For programmatic management, use the server actions in <code className="text-xs bg-surface-container px-1 py-0.5 rounded">src/features/archdiocese/actions.ts</code>.
          The executive console provides full read visibility across the hierarchy with vicariate-aware context.
        </p>
      </div>
    </ArchdioceseShell>
  );
}
