/* eslint-disable @next/next/no-img-element */
import { Camera, Image } from "lucide-react";
import { VicariateShell } from "@/components/dashboard/vicariate/shared/vicariate-shell";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { getVicariateMediaGroups } from "@/features/vicariate/queries";
import { requireAuth } from "@/lib/auth/requireAuth";

export default async function VicariateMediaPage() {
  const context = await requireAuth({ roles: ["vicariate_head", "vicariate_staff"] });
  if (!context.archdioceseId || !context.vicariateId) return null;

  const groups = await getVicariateMediaGroups(context.archdioceseId, context.vicariateId);
  const items = groups.flatMap((g) => g.items);

  return (
    <VicariateShell
      pathname="/dashboard/vicariate/media"
      eyebrow="Vicariate Media"
      title="Media oversight"
      subtitle="Browse published media from parishes and vicariate uploads."
      actions={<Button href="/dashboard/vicariate/media/upload">Upload media</Button>}
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader title="Media library" description="Published images from across the vicariate, grouped by month." />
      <section className="grid gap-4 md:grid-cols-2">
        <StatCard label="Media items" value={items.length} helper="Published images" icon={Image} />
        <StatCard label="Active months" value={groups.length} helper="Grouped timeline buckets" icon={Camera} />
      </section>

      {groups.length ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.monthKey} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-on-surface">{group.monthLabel}</h3>
                <p className="text-sm text-on-surface-variant">{group.items.length} image(s)</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <div key={item.path} className="overflow-hidden rounded-md border border-outline-variant bg-surface-container-lowest">
                    {item.previewUrl ? (
                      <img src={item.previewUrl} alt={item.name} className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-surface-container text-sm text-on-surface-variant">Preview unavailable</div>
                    )}
                    <div className="space-y-1 p-3">
                      <p className="truncate text-sm font-medium text-on-surface">{item.name}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.parishName ? `${item.parishName}${item.deaneryName ? ` • ${item.deaneryName}` : ""}` : item.category === "vicariate" ? "Vicariate upload" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="No media yet" description="Once media is published to the vicariate or its parishes, it will appear here grouped by month." action={<Button href="/dashboard/vicariate/media/upload">Upload first image</Button>} />
      )}
    </VicariateShell>
  );
}
