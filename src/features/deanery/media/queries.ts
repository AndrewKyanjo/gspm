import { getDeaneryParishRows } from "@/lib/db/queries/deanery";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DeaneryMediaItem, DeaneryMediaMonthGroup } from "../types";
import { DEANERY_MEDIA_BUCKET, PARISH_MEDIA_BUCKET } from "./constants";

function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }
  return date.toLocaleDateString("en-US", { month: "long", year: "2-digit", timeZone: "UTC" });
}

async function listBucketMedia(
  bucket: string,
  prefix: string,
  monthKey: string,
  category: "parish" | "deanery",
  parishName: string | null
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 200,
    sortBy: { column: "updated_at", order: "desc" },
  });

  if (error || !data) {
    return [] as DeaneryMediaItem[];
  }

  return Promise.all(
    data
      .filter((item) => item.id && /\.(jpg|jpeg|png|webp|avif)$/i.test(item.name))
      .map(async (item) => {
        const path = `${prefix}/${item.name}`;
        const { data: signedUrl } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 15);
        return {
          path,
          name: item.name,
          parishName,
          monthLabel: formatMonthLabel(monthKey),
          category,
          updatedAt: item.updated_at ?? null,
          previewUrl: signedUrl?.signedUrl ?? null,
        } satisfies DeaneryMediaItem;
      })
  );
}

export async function getDeaneryMediaGroups(deaneryId: string): Promise<DeaneryMediaMonthGroup[]> {
  const parishes = await getDeaneryParishRows(deaneryId);
  const supabase = createAdminClient();
  const grouped = new Map<string, DeaneryMediaItem[]>();

  const { data: deaneryMonthEntries } = await supabase.storage
    .from(DEANERY_MEDIA_BUCKET)
    .list(`deaneries/${deaneryId}`, { limit: 200, sortBy: { column: "name", order: "desc" } });

  for (const entry of deaneryMonthEntries ?? []) {
    if (!/^\d{4}-\d{2}$/.test(entry.name)) continue;
    const items = await listBucketMedia(
      DEANERY_MEDIA_BUCKET,
      `deaneries/${deaneryId}/${entry.name}`,
      entry.name,
      "deanery",
      null
    );
    grouped.set(entry.name, [...(grouped.get(entry.name) ?? []), ...items]);
  }

  for (const parish of parishes) {
    const { data: monthEntries } = await supabase.storage
      .from(PARISH_MEDIA_BUCKET)
      .list(`parishes/${parish.id}`, { limit: 200, sortBy: { column: "name", order: "desc" } });

    for (const entry of monthEntries ?? []) {
      if (!/^\d{4}-\d{2}$/.test(entry.name)) continue;
      const items = await listBucketMedia(
        PARISH_MEDIA_BUCKET,
        `parishes/${parish.id}/${entry.name}`,
        entry.name,
        "parish",
        String(parish.name)
      );
      grouped.set(entry.name, [...(grouped.get(entry.name) ?? []), ...items]);
    }
  }

  return [...grouped.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([monthKey, items]) => ({
      monthKey,
      monthLabel: formatMonthLabel(monthKey),
      items: items.sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime()),
    }))
    .filter((group) => group.items.length);
}
