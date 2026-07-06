/* eslint-disable @next/next/no-img-element */
import { Camera, Image } from "lucide-react";
import { DeaneryShell } from "@/components/dashboard/deanery/shared/deanery-shell";
import { DeaneryMediaDetailPanel } from "@/components/dashboard/deanery/shared/deanery-media-detail-panel";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { getDeaneryMediaGroups } from "@/features/deanery/media/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

type DeaneryMediaPageProps = { searchParams?: Promise<Record<string, string | string[] | undefined>> };

export default async function DeaneryMediaPage({ searchParams }: DeaneryMediaPageProps) {
  const context = await requireAuth({ roles: ["deanery_head", "deanery_staff"] });
  if (!context.deaneryId) return null;

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedPath = typeof resolvedSearchParams?.media === "string" ? resolvedSearchParams.media : null;
  const groups = await getDeaneryMediaGroups(context.deaneryId);
  const items = groups.flatMap((group) => group.items);
  const selectedItem = selectedPath ? items.find((item) => item.path === selectedPath) ?? null : null;

  return (
    <DeaneryShell pathname="/dashboard/deanery/media" eyebrow="Deanery Media" title="Media oversight" subtitle="Supervise parish media and deanery uploads from one grouped gallery." actions={<Button href="/dashboard/deanery/media/upload">Upload deanery media</Button>}>
      <PageHeader title="Media library" description="Compressed deanery uploads sit alongside aggregated parish media grouped by month." />
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Media items" value={items.length} helper="Parish and deanery images" icon={Image} />
        <StatCard label="Active months" value={groups.length} helper="Grouped timeline buckets" icon={Camera} />
      </section>

      {groups.length ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.monthKey} className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">{group.monthLabel}</h3>
                  <p className="text-sm text-on-surface-variant">{group.items.length} image(s)</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => (
                    <a key={item.path} href={`/dashboard/deanery/media?media=${encodeURIComponent(item.path)}`} className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest transition-colors hover:border-primary">
                      {item.previewUrl ? <img src={item.previewUrl} alt={item.name} className="aspect-[4/3] w-full object-cover" /> : <div className="flex aspect-[4/3] items-center justify-center bg-surface-container text-sm text-on-surface-variant">Preview unavailable</div>}
                      <div className="space-y-1 p-3">
                        <p className="truncate text-sm font-medium text-on-surface">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">{item.parishName ? `${item.parishName} • ` : ""}{item.monthLabel}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
          {selectedItem ? <DeaneryMediaDetailPanel item={selectedItem} /> : <EmptyState title="Open an image" description="Select any deanery or parish image to inspect it in the side panel." action={<Button href="/dashboard/deanery/media/upload">Upload media</Button>} />}
        </section>
      ) : (
        <EmptyState title="No media yet" description="Once parishes upload media or the deanery adds its own images, they will appear here grouped by month." action={<Button href="/dashboard/deanery/media/upload">Upload first image</Button>} />
      )}
    </DeaneryShell>
  );
}
