// src/app/(dashboard)/dashboard/archdiocese/media/page.tsx
import { Image, FolderOpen, Upload } from "lucide-react";
import { ArchdioceseShell } from "@/components/dashboard/archdiocese/shared/archdiocese-shell";
import { PageHeader } from "@/components/dashboard/parish/shared/page-header";
import { EmptyState } from "@/components/dashboard/parish/shared/empty-state";
import { StatCard } from "@/components/dashboard/parish/stats/stat-card";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  parishName: string | null;
  deaneryName: string | null;
  storagePath: string;
  createdAt: string;
};

async function getArchdioceseMedia(archdioceseId: string): Promise<MediaItem[]> {
  const supabase = createAdminClient();

  // Query parish projects with cover images as a source of media
  const { data: projects } = await supabase
    .from("parish_projects")
    .select("id, title, description, parish_id, cover_image_path, created_at")
    .eq("archdiocese_id", archdioceseId)
    .not("cover_image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!projects?.length) return [];

  const parishIds = [...new Set(projects.map((p) => p.parish_id).filter(Boolean))];
  const { data: parishes } = parishIds.length
    ? await supabase.from("parishes").select("id, name, deanery_id").in("id", parishIds)
    : { data: [] };

  const parishMap = new Map((parishes ?? []).map((p) => [p.id, p]));
  const deaneryIds = [...new Set((parishes ?? []).map((p) => p.deanery_id).filter(Boolean))];
  const { data: deaneries } = deaneryIds.length
    ? await supabase.from("deaneries").select("id, name").in("id", deaneryIds)
    : { data: [] };
  const deaneryMap = new Map((deaneries ?? []).map((d) => [d.id, d.name]));

  return projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ?? null,
    parishName: parishMap.get(p.parish_id)?.name ?? null,
    deaneryName: p.parish_id
      ? deaneryMap.get(parishMap.get(p.parish_id)?.deanery_id ?? "") ?? null
      : null,
    storagePath: p.cover_image_path,
    createdAt: p.created_at,
  }));
}

export default async function ArchdioceseMediaPage() {
  const context = await requireAuth({
    roles: ["super_admin", "archdiocese_admin", "archdiocese_data_entry"],
  });
  if (!context.archdioceseId) return null;

  const media = await getArchdioceseMedia(context.archdioceseId);

  return (
    <ArchdioceseShell
      pathname="/dashboard/archdiocese/media"
      eyebrow="Archdiocese Media"
      title="Media library"
      subtitle="Project images and media across the archdiocese."
      actions={
        <Button href="/dashboard/archdiocese/media/upload">
          <Upload className="h-4 w-4 mr-2" />
          Upload media
        </Button>
      }
      userName={context.fullName}
      userEmail={context.email}
      role={context.role}
    >
      <PageHeader
        title="Media"
        description="Browse project cover images and media uploaded across parishes and deaneries."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Media items" value={media.length} helper="Total project images" icon={Image} />
        <StatCard
          label="Parishes"
          value={new Set(media.map((m) => m.parishName).filter(Boolean)).size}
          helper="Parishes with media"
          icon={FolderOpen}
        />
        <StatCard
          label="Deaneries"
          value={new Set(media.map((m) => m.deaneryName).filter(Boolean)).size}
          helper="Deaneries with media"
          icon={FolderOpen}
        />
      </section>

      {media.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/3] bg-surface-container flex items-center justify-center overflow-hidden">
                <img
                  src={item.storagePath}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <span className="material-symbols-outlined text-4xl text-outline hidden">
                  image_not_supported
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-medium text-sm text-on-surface truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-on-surface-variant mt-1">
                  {item.parishName ?? "Unknown parish"}
                  {item.deaneryName ? ` • ${item.deaneryName}` : ""}
                </p>
                <p className="text-xs text-outline mt-2">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No media yet"
          description="Project cover images and media from across the archdiocese will appear here."
          action={
            <Button href="/dashboard/archdiocese/media/upload" variant="secondary">
              Upload media
            </Button>
          }
        />
      )}
    </ArchdioceseShell>
  );
}
