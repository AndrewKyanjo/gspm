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
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
          <div>
            <h1 className="break-words text-2xl font-semibold text-on-surface">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-on-surface-variant">{subtitle}</p>
          </div>
        </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
          <form
            action={searchAction}
            method="get"
            className="flex h-10 w-full items-center gap-2 rounded-md border border-outline-variant bg-surface px-3 text-sm text-on-surface-variant sm:w-72"
          >
            <Search className="h-4 w-4" />
            <input
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder={searchPlaceholder}
              className="w-full min-w-0 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
            />
          </form>
          <Badge variant="info">{scopeLabel}</Badge>
          <NotificationBell />
          </div>
        </div>
      </div>
      {actions ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-outline-variant pt-4">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
