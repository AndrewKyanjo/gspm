import { createAdminClient } from "@/lib/supabase/admin";
import type { ParishMediaItem, ParishMediaMonthGroup, ParishMediaSummary } from "../types";
import { PARISH_MEDIA_BUCKET } from "./constants";

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

function formatMonthLabel(monthKey: string) {
  const date = new Date(`${monthKey}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function isImageName(name: string) {
  const lowerName = name.toLowerCase();
  return imageExtensions.some((extension) => lowerName.endsWith(extension));
}

function displayNameFromStorageName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/__[^_]+$/, "");
}

export async function getParishMediaSummary(): Promise<ParishMediaSummary> {
  return {
    recordsAvailable: false,
    reason: "Media summary cards are now driven by storage counts on the live media page.",
  };
}

export async function getParishMediaGroups(parishId: string): Promise<ParishMediaMonthGroup[]> {
  const supabase = createAdminClient();
  const basePrefix = `parishes/${parishId}`;
  const { data: monthEntries, error } = await supabase.storage.from(PARISH_MEDIA_BUCKET).list(basePrefix, {
    limit: 200,
    sortBy: { column: "name", order: "desc" },
  });

  if (error || !monthEntries) {
    return [];
  }

  const monthKeys = monthEntries
    .map((entry) => entry.name)
    .filter((name) => /^\d{4}-\d{2}$/.test(name))
    .sort((a, b) => b.localeCompare(a));

  const groups = await Promise.all(
    monthKeys.map(async (monthKey) => {
      const prefix = `${basePrefix}/${monthKey}`;
      const { data: files, error: filesError } = await supabase.storage.from(PARISH_MEDIA_BUCKET).list(prefix, {
        limit: 200,
        sortBy: { column: "updated_at", order: "desc" },
      });

      if (filesError || !files) {
        return null;
      }

      const items = await Promise.all(
        files
          .filter((file) => file.id && isImageName(file.name))
          .map(async (file) => {
            const fullPath = `${prefix}/${file.name}`;
            const { data: signedUrl } = await supabase.storage
              .from(PARISH_MEDIA_BUCKET)
              .createSignedUrl(fullPath, 60 * 15);

            const item: ParishMediaItem = {
              name: displayNameFromStorageName(file.name),
              path: fullPath,
              monthKey,
              monthLabel: formatMonthLabel(monthKey),
              size: file.metadata?.size ? Number(file.metadata.size) : null,
              updatedAt: file.updated_at ?? null,
              previewUrl: signedUrl?.signedUrl ?? null,
            };

            return item;
          })
      );

      return {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        items,
      } satisfies ParishMediaMonthGroup;
    })
  );

  return groups.filter((group): group is ParishMediaMonthGroup => Boolean(group && group.items.length));
}
