import { ClipboardList, HeartHandshake, MapPin, ShieldCheck } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Button } from "@/components/ui/button";
import { AkabondoEvaluationForm } from "@/components/dashboard/akabondo/evaluation-form";
import { createArchdioceseAkabondoEvaluation } from "@/features/akabondo/actions";
import {
  getAkabondoSummary,
  getArchdioceseAkabondoOverview,
  getParishLowerLevelOptions,
} from "@/features/akabondo/queries";
import { getHierarchyCollections } from "@/lib/db/queries/hierarchy";
import { requireAuth } from "@/lib/auth/requireAuth";

type Props = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchdioceseAkabondoPage({ searchParams }: Props) {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] });
  if (!context.archdioceseId) return null;

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedParishId = typeof resolvedSearchParams.parishId === "string" ? resolvedSearchParams.parishId : "";
  const [hierarchy, overview] = await Promise.all([
    getHierarchyCollections({ archdioceseId: context.archdioceseId }),
    getArchdioceseAkabondoOverview(context.archdioceseId),
  ]);

  const selectedParish = hierarchy.parishes.find((parish) => parish.id === selectedParishId) ?? null;
  const [options, parishSummary] = selectedParish
    ? await Promise.all([
        getParishLowerLevelOptions(selectedParish.id),
        getAkabondoSummary(selectedParish.id),
      ])
    : [{ subParishes: [], akabondos: [] }, null];

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/akabondo"
      eyebrow="Akabondo Evaluations"
      title="Lower-level parish evaluations"
      subtitle="Select a parish, capture Sub Parish and Akabondo entries, and analyse needs across the Archdiocese."
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Akabondo data entry"
        description="This creates Sub Parish and Akabondo records as field forms are entered, then rolls the data into parish and archdiocese needs analysis."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Evaluations" value={overview.totalEvaluations} helper="All captured forms" icon={ClipboardList} />
        <StatCard label="Parishes" value={overview.parishes.length} helper="With captured data" icon={ShieldCheck} />
        <StatCard label="Top need" value={overview.assistance[0]?.label ?? "-"} helper={`${overview.assistance[0]?.count ?? 0} records`} icon={HeartHandshake} />
        <StatCard label="Selected parish" value={selectedParish ? "Ready" : "None"} helper="Choose below" icon={MapPin} />
      </section>

      <form action="/dashboard/archdiocese/akabondo" className="rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
        <label className="space-y-1 text-sm font-medium text-on-surface">
          <span>Select parish for data entry</span>
          <select name="parishId" defaultValue={selectedParishId} className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm">
            <option value="">Choose parish</option>
            {hierarchy.parishes.map((parish) => {
              const deanery = hierarchy.deaneries.find((item) => item.id === parish.deanery_id);
              const vicariate = hierarchy.vicariates.find((item) => item.id === parish.vicariate_id);
              return (
                <option key={parish.id} value={parish.id}>
                  {parish.name} | {deanery?.name ?? "Deanery"} | {vicariate?.name ?? "Vicariate"}
                </option>
              );
            })}
          </select>
        </label>
        <div className="mt-4">
          <Button type="submit">Load parish</Button>
        </div>
      </form>

      {selectedParish ? (
        <>
          <AkabondoEvaluationForm
            action={createArchdioceseAkabondoEvaluation}
            parishId={selectedParish.id}
            subParishes={options.subParishes}
            akabondos={options.akabondos}
          />

          {parishSummary ? (
            <section className="grid gap-6 xl:grid-cols-2">
              <SimpleTable
                title={`${selectedParish.name} assistance needed`}
                rows={parishSummary.assistance}
                columns={[
                  { header: "Need", cell: (item) => item.label },
                  { header: "People", cell: (item) => item.count },
                ]}
              />
              <SimpleTable
                title={`${selectedParish.name} recent evaluations`}
                rows={parishSummary.recentEvaluations}
                columns={[
                  { header: "Name", cell: (item) => item.personName },
                  { header: "Akabondo", cell: (item) => item.akabondoName ?? "-" },
                  { header: "Village", cell: (item) => item.village ?? "-" },
                  { header: "Date", cell: (item) => new Date(item.evaluatedOn).toLocaleDateString() },
                ]}
              />
            </section>
          ) : null}
        </>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <SimpleTable
          title="Archdiocese assistance analysis"
          rows={overview.assistance}
          columns={[
            { header: "Need", cell: (item) => item.label },
            { header: "People", cell: (item) => item.count },
          ]}
        />
        <SimpleTable
          title="Parishes with Akabondo entries"
          rows={overview.parishes}
          columns={[
            { header: "Parish", cell: (item) => item.parishName },
            { header: "Forms", cell: (item) => item.count },
          ]}
        />
      </section>
    </ArchdioceseShell>
  );
}
