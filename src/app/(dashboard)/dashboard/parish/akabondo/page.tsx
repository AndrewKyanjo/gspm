import { ClipboardList, Home, MapPin, Users } from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AkabondoEvaluationForm } from "@/components/dashboard/akabondo/evaluation-form";
import { createParishAkabondoEvaluation } from "@/features/akabondo/actions";
import { getAkabondoSummary, getParishLowerLevelOptions } from "@/features/akabondo/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function ParishAkabondoPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  if (!context.parishId) return null;

  const [options, summary] = await Promise.all([
    getParishLowerLevelOptions(context.parishId),
    getAkabondoSummary(context.parishId),
  ]);

  return (
    <ParishShell
      pathname="/dashboard/parish/akabondo"
      eyebrow="Akabondo Evaluations"
      title="Akabondo intake"
      subtitle="Capture lower-level parish evaluation forms one person at a time."
      actions={<Button href="/dashboard/parish/needs">Parish needs</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Evaluation form"
        description="Sub Parish and Akabondo names are saved as you enter forms, so the parish lower-level structure grows from field data."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Evaluations" value={summary.totalEvaluations} helper="People assessed" icon={ClipboardList} />
        <StatCard label="Sub Parishes" value={summary.totalSubParishes} helper="Captured lower units" icon={Home} />
        <StatCard label="Akabondos" value={summary.totalAkabondos} helper="Village-level groups" icon={MapPin} />
        <StatCard label="Top need" value={summary.assistance[0]?.label ?? "-"} helper={`${summary.assistance[0]?.count ?? 0} records`} icon={Users} />
      </section>

      <AkabondoEvaluationForm
        action={createParishAkabondoEvaluation}
        subParishes={options.subParishes}
        akabondos={options.akabondos}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          title="Assistance needed"
          rows={summary.assistance}
          columns={[
            { header: "Need", cell: (item) => item.label },
            { header: "People", cell: (item) => item.count },
          ]}
        />
        <SimpleTable
          title="Challenges"
          rows={summary.challenges}
          columns={[
            { header: "Challenge", cell: (item) => item.label },
            { header: "People", cell: (item) => item.count },
          ]}
        />
      </section>

      <SimpleTable
        title="Recent evaluations"
        rows={summary.recentEvaluations}
        columns={[
          { header: "Name", cell: (item) => <span className="font-medium">{item.personName}</span> },
          { header: "Sub Parish", cell: (item) => item.subParishName ?? "-" },
          { header: "Akabondo", cell: (item) => item.akabondoName ?? "-" },
          { header: "Assistance", cell: (item) => <div className="flex flex-wrap gap-1">{item.assistance.map((need) => <Badge key={need}>{need}</Badge>)}</div> },
          { header: "Date", cell: (item) => new Date(item.evaluatedOn).toLocaleDateString() },
        ]}
      />
    </ParishShell>
  );
}
