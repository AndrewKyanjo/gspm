import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BarListChart({
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
      <CardContent className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-on-surface">{item.label}</span>
                <span className="text-on-surface-variant">{formatter(item.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-surface-container">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-on-surface-variant">No chart data available yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
