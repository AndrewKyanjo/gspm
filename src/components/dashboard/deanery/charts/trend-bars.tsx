import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TrendBars({
  title,
  description,
  items,
  formatter = (value) => value.toLocaleString(),
}: {
  title: string;
  description: string;
  items: Array<{ label: string; value: number }>;
  formatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {items.map((item) => (
              <div key={item.label} className="space-y-2 rounded-md bg-surface-container p-3">
                <div className="flex h-24 items-end">
                  <div
                    className="w-full rounded-sm bg-primary"
                    style={{ height: `${Math.max(10, (item.value / maxValue) * 100)}%` }}
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{item.label}</p>
                  <p className="mt-1 text-sm text-on-surface">{formatter(item.value)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-on-surface-variant">No trend data available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
