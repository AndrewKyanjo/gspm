import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ParishTopbar({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-outline-variant bg-surface-container-lowest/95 px-5 py-4 backdrop-blur md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <div>
            <h1 className="text-2xl font-semibold text-on-surface">{title}</h1>
            <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface-variant md:flex">
            <Search className="h-4 w-4" />
            <span>Search parish workspace</span>
          </div>
          <Badge variant="info">Parish Scope</Badge>
          <Button variant="secondary" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </Button>
          {actions}
        </div>
      </div>
    </div>
  );
}
