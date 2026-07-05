import { FolderKanban, Hammer } from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getParishProjectSummary } from "@/features/parish/projects/queries";

export default async function ParishProjectsPage() {
  await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  const summary = await getParishProjectSummary();

  return (
    <ParishShell
      pathname="/dashboard/parish/projects"
      eyebrow="Parish Projects"
      title="Project oversight"
      subtitle="Track construction, campaigns, and ministry initiatives from the parish side with one consistent operating view."
      actions={<Button>New project</Button>}
    >
      <PageHeader
        title="Parish projects"
        description="The reference design’s project cards are now a structured route, but the live project-tracking schema still needs to be finalized in Supabase."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Project register" value="Pending" helper="Schema hookup required" icon={FolderKanban} />
        <StatCard label="Operational mode" value="Ready" helper="UI prepared for live records" icon={Hammer} />
      </section>

      <EmptyState title="No connected project records" description={summary.reason} />
    </ParishShell>
  );
}
