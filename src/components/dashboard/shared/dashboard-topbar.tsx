import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/dashboard/shared/notifications/NotificationBell";

export function DashboardTopbar({
  eyebrow,
  title,
  subtitle,
  actions,
  searchAction,
  searchPlaceholder,
  searchQuery,
  scopeLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  searchAction: string;
  searchPlaceholder: string;
  searchQuery?: string;
  scopeLabel: string;
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
          <form
            action={searchAction}
            method="get"
            className="flex w-full items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface-variant sm:w-auto"
          >
            <Search className="h-4 w-4" />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder={searchPlaceholder}
              className="w-full min-w-0 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant sm:w-52"
            />
          </form>
          <Badge variant="info">{scopeLabel}</Badge>
          <NotificationBell />
          {actions}
        </div>
      </div>
    </div>
  );
}
