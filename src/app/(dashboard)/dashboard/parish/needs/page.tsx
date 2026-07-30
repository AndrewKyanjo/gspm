import { CircleDollarSign, HeartHandshake, ListChecks, Wand2 } from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { SimpleTable } from "@/components/dashboard/parish/tables/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ParishNeedForm } from "@/components/dashboard/akabondo/parish-need-form";
import { createParishNeed, createParishNeedFromSuggestion } from "@/features/akabondo/actions";
import { getNeedSuggestionsFromAkabondo, getParishNeeds } from "@/features/akabondo/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

function priorityVariant(priority: string) {
  if (priority === "urgent") return "danger" as const;
  if (priority === "high") return "warning" as const;
  if (priority === "medium") return "info" as const;
  return "default" as const;
}

export default async function ParishNeedsPage() {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  if (!context.parishId) return null;

  const [needs, suggestions] = await Promise.all([
    getParishNeeds(context.parishId),
    getNeedSuggestionsFromAkabondo(context.parishId),
  ]);
  const openNeeds = needs.filter((need) => need.status === "open" || need.status === "in_progress");
  const manualNeeds = needs.filter((need) => need.source === "manual").length;
  const generatedNeeds = needs.filter((need) => need.source === "akabondo_analysis").length;

  return (
    <ParishShell
      pathname="/dashboard/parish/needs"
      eyebrow="Parish Needs"
      title="Needs register"
      subtitle="Combine manually entered parish needs with patterns generated from Akabondo evaluation forms."
      actions={<Button href="/dashboard/parish/akabondo">Akabondo evaluations</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Parish needs"
        description="Add needs directly, or convert Akabondo analysis into needs for planning and support follow-up."
      />

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Open needs" value={openNeeds.length} helper="Active parish priorities" icon={HeartHandshake} />
        <StatCard label="Manual" value={manualNeeds} helper="Entered by parish staff" icon={ListChecks} />
        <StatCard label="From Akabondo" value={generatedNeeds} helper="Generated from evaluations" icon={Wand2} />
        <StatCard label="Suggestions" value={suggestions.length} helper="Ready to add" icon={CircleDollarSign} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ParishNeedForm action={createParishNeed} />
        <SimpleTable
          title="Akabondo suggestions"
          description="These are calculated from assistance requested in evaluation forms."
          rows={suggestions}
          columns={[
            { header: "Need", cell: (item) => <span className="font-medium">{item.title}</span> },
            { header: "People", cell: (item) => item.count },
            { header: "Priority", cell: (item) => <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge> },
            {
              header: "Add",
              cell: (item) => (
                <form action={createParishNeedFromSuggestion}>
                  <input type="hidden" name="needType" value={item.needType} />
                  <input type="hidden" name="title" value={item.title} />
                  <input type="hidden" name="estimatedHouseholds" value={item.count} />
                  <input type="hidden" name="priority" value={item.priority} />
                  <input type="hidden" name="source" value="akabondo_analysis" />
                  <Button type="submit" size="sm" variant="secondary">Add</Button>
                </form>
              ),
            },
          ]}
        />
      </section>

      <SimpleTable
        title="Needs register"
        rows={needs}
        columns={[
          { header: "Need", cell: (item) => <span className="font-medium">{item.title}</span> },
          { header: "Type", cell: (item) => item.needType },
          { header: "Priority", cell: (item) => <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge> },
          { header: "Source", cell: (item) => item.source.replaceAll("_", " ") },
          { header: "Status", cell: (item) => item.status.replaceAll("_", " ") },
          { header: "Created", cell: (item) => new Date(item.createdAt).toLocaleDateString() },
        ]}
      />
    </ParishShell>
  );
}
