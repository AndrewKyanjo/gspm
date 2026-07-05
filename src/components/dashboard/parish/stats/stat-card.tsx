import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-on-surface-variant">{label}</p>
            <p className="text-3xl font-semibold text-on-surface">{value}</p>
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">{helper}</p>
          </div>
          <div className="rounded-md bg-surface-container p-2 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
