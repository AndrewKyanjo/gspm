/* eslint-disable @next/next/no-img-element */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DeaneryMediaItem } from "@/features/deanery/types";

export function DeaneryMediaDetailPanel({ item }: { item: DeaneryMediaItem }) {
  return (
    <aside className="w-full xl:sticky xl:top-6 xl:max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{item.name}</CardTitle>
          <CardDescription>{item.parishName ? `${item.parishName} • ${item.monthLabel}` : item.monthLabel}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {item.previewUrl ? (
            <img src={item.previewUrl} alt={item.name} className="aspect-[4/5] w-full rounded-md object-cover" />
          ) : null}
          <div className="rounded-md bg-surface-container p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Source</p>
            <p className="mt-1 text-sm text-on-surface">{item.parishName ? `Parish media • ${item.parishName}` : "Deanery media"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {item.previewUrl ? (
              <Button href={item.previewUrl} target="_blank" rel="noreferrer">
                Open image
              </Button>
            ) : null}
            <Button href="/dashboard/deanery/media" variant="secondary">
              Close panel
            </Button>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
