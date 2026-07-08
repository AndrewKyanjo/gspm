import { Building2, Landmark, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getVicariateDetail } from "@/features/archdiocese/queries";
import { requireAuth } from "@/lib/auth/requireAuth";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ vicariateId: string }> };

function statusVariant(status: string | null) {
  switch (status) {
    case "active": return "success" as const;
    case "inactive": return "warning" as const;
    case "archived": return "danger" as const;
    default: return "default" as const;
  }
}

export default async function VicariateDetailPage({ params }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const { vicariateId } = await params;
  const detail = await getVicariateDetail(context.archdioceseId, vicariateId);
  if (!detail) notFound();

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/vicariates"
      eyebrow="Archdiocese Vicariates"
      title={detail.name}
      subtitle={`Code: ${detail.code ?? "N/A"} • Status: ${detail.status ?? "unknown"}`}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title={detail.name}
        description={`Vicariate detail with ${detail.totalDeaneries} deaneries and ${detail.totalParishes} parishes under management.`}
        actions={<Button href="/dashboard/archdiocese/vicariates" variant="secondary">All vicariates</Button>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Deaneries" value={detail.totalDeaneries} helper="Child administrative clusters" icon={Landmark} />
        <StatCard label="Parishes" value={detail.totalParishes} helper="Total operating units" icon={ShieldCheck} />
        <StatCard label="Status" value={detail.status ?? "unknown"} helper="Current lifecycle status" icon={Building2} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          title="Deaneries in this vicariate"
          description="Administrative clusters grouped under this vicariate."
          rows={detail.deaneries}
          columns={[
            { header: "Deanery", cell: (item) => <div className="space-y-1"><div className="font-medium">{item.name}</div></div> },
            { header: "Parishes", cell: (item) => item.parishCount },
            { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
            { header: "Open", cell: (item) => <Button href={`/dashboard/archdiocese/deaneries/${item.id}`} size="sm" variant="secondary">View</Button> },
          ]}
        />

        <SimpleTable
          title="Parishes in this vicariate"
          description="All parishes under the vicariate with their deanery context."
          rows={detail.parishes}
          columns={[
            { header: "Parish", cell: (item) => <div className="space-y-1"><div className="font-medium">{item.name}</div></div> },
            { header: "Deanery", cell: (item) => item.deaneryName ?? "Unassigned" },
            { header: "Status", cell: (item) => <Badge variant={statusVariant(item.status)}>{item.status ?? "unknown"}</Badge> },
            { header: "Open", cell: (item) => <Button href={`/dashboard/archdiocese/parishes/${item.id}`} size="sm" variant="secondary">View</Button> },
          ]}
        />
      </section>
    </ArchdioceseShell>
  );
}
