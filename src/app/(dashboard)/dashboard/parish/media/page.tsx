/* eslint-disable @next/next/no-img-element */
import { Image, UploadCloud } from "lucide-react";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { MediaDetailPanel } from "@/components/dashboard/parish/shared/media-detail-panel";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { ParishShell } from "@/components/dashboard/parish/shared/parish-shell";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { getParishMediaGroups } from "@/features/parish/media/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

type ParishMediaPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ParishMediaPage({ searchParams }: ParishMediaPageProps) {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return null;
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedPath = typeof resolvedSearchParams?.media === "string" ? resolvedSearchParams.media : null;

  const groups = await getParishMediaGroups(context.parishId);
  const allItems = groups.flatMap((group) => group.items);
  const selectedItem = selectedPath ? allItems.find((item) => item.path === selectedPath) ?? null : null;

  return (
    <ParishShell
      pathname="/dashboard/parish/media"
      eyebrow="Parish Media"
      title="Media library"
      subtitle="Photos, event galleries, and bulletin imagery arranged as a parish-ready media workspace."
      actions={<Button href="/dashboard/parish/media/upload">Upload media</Button>}
    >
      <PageHeader
        title="Parish media library"
        description="Uploaded images are compressed before storage, grouped by month, and opened in a side panel for quick review."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Media items" value={allItems.length} helper="Compressed images in storage" icon={Image} />
        <StatCard label="Active months" value={groups.length} helper="Gallery groups by month" icon={UploadCloud} />
      </section>

      {groups.length ? (
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-8">
            {groups.map((group) => (
              <section key={group.monthKey} className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-on-surface">{group.monthLabel}</h3>
                    <p className="text-sm text-on-surface-variant">{group.items.length} image(s)</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => (
                    <a
                      key={item.path}
                      href={`/dashboard/parish/media?media=${encodeURIComponent(item.path)}`}
                      className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest transition-colors hover:border-primary"
                    >
                      {item.previewUrl ? (
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-surface-container text-sm text-on-surface-variant">
                          Preview unavailable
                        </div>
                      )}
                      <div className="space-y-1 p-3">
                        <p className="truncate text-sm font-medium text-on-surface">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {selectedItem ? (
            <MediaDetailPanel item={selectedItem} />
          ) : (
            <EmptyState
              title="Open an image"
              description="Pick any image from the month groups to open it in the side panel."
              action={<Button href="/dashboard/parish/media/upload">Upload more media</Button>}
            />
          )}
        </section>
      ) : (
        <EmptyState
          title="No parish media yet"
          description="Upload the first parish image and it will appear here in a month-based gallery."
          action={<Button href="/dashboard/parish/media/upload">Upload first image</Button>}
        />
      )}
    </ParishShell>
  );
}
