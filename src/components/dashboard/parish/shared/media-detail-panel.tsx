/* eslint-disable @next/next/no-img-element */
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ParishMediaItem } from "@/features/parish/types";

function formatBytes(size: number | null) {
  if (!size) {
    return "-";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaDetailPanel({ item }: { item: ParishMediaItem }) {
  return (
    <aside className="w-full xl:sticky xl:top-6 xl:max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{item.name}</CardTitle>
          <CardDescription>{item.monthLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.previewUrl ? (
            <img
              src={item.previewUrl}
              alt={item.name}
              className="aspect-[4/5] w-full rounded-md object-cover"
            />
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-md bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Size</p>
              <p className="mt-1 text-sm text-on-surface">{formatBytes(item.size)}</p>
            </div>
            <div className="rounded-md bg-surface-container p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Updated</p>
              <p className="mt-1 text-sm text-on-surface">
                {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {item.previewUrl ? (
              <Button href={item.previewUrl} target="_blank" rel="noreferrer">
                Open image
              </Button>
            ) : null}
            <Button href="/dashboard/parish/media" variant="secondary">
              Close panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
