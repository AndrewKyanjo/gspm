import { Image, UploadCloud } from "lucide-react";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getParishMediaSummary } from "@/features/parish/media/queries";

export default async function ParishMediaPage() {
  await requireAuth({ roles: ["parish_head", "parish_data_entry"] });
  const summary = await getParishMediaSummary();

  return (
    <ParishShell
      pathname="/dashboard/parish/media"
      eyebrow="Parish Media"
      title="Media library"
      subtitle="Photos, event galleries, and bulletin imagery arranged as a parish-ready media workspace."
      actions={<Button>Upload media</Button>}
    >
      <PageHeader
        title="Parish media library"
        description="The bento-grid media experience is rebuilt and waiting for the final storage metadata schema before real media items can appear."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Media sync" value="Pending" helper="Storage metadata hookup" icon={Image} />
        <StatCard label="Next step" value="Upload model" helper="Finalize table + bucket policy" icon={UploadCloud} />
      </section>

      <EmptyState title="No connected media records" description={summary.reason} />
    </ParishShell>
  );
}
