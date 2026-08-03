import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarUserFooter } from "./sidebar-user-footer";
import type { AppRole } from "@/types/auth";

export type DashboardNavigationItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  aliases?: string[];
  children?: DashboardNavigationItem[];
};

export function DashboardSidebar({
  pathname,
  navigation,
  title,
  userName,
  userEmail,
  userRole,
}: {
  pathname: string;
  navigation: DashboardNavigationItem[];
  title: string;
  subtitle: string;
  footerTitle: string;
  footerDescription: string;
  /** Currently signed-in user's display name (for the user footer). */
  userName?: string | null;
  /** Currently signed-in user's email (fallback if name is null). */
  userEmail?: string | null;
  /** Currently signed-in user's role (for the role badge in the footer). */
  userRole?: AppRole;
}) {
  function isActive(item: DashboardNavigationItem) {
    const paths = [item.href, ...(item.aliases ?? [])].filter((path): path is string => Boolean(path));
    if (paths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;

    return item.children?.some(isActive) ?? false;
  }

  return (
    <aside className="hidden w-[272px] shrink-0 border-r border-outline-variant bg-primary text-on-primary lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-on-secondary">
            GS
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight">GSPM Portal</span>
            <span className="block truncate text-xs text-primary-fixed-dim">{title}</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1.5">
          {navigation.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            const children = item.children ?? [];

            if (children.length > 0) {
              return (
                <li key={item.label} className="space-y-1">
                  <div
                    className={cn(
                      "flex items-center gap-3 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wide",
                      active ? "bg-white/8 text-on-primary" : "text-primary-fixed-dim",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <ul className="ml-4 space-y-1 border-l border-white/10 pl-3">
                    {children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child);

                      return (
                        <li key={child.href ?? child.label}>
                          <Link
                            href={child.href ?? "#"}
                            className={cn(
                              "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                              childActive
                                ? "bg-white/10 text-on-primary"
                                : "text-primary-fixed hover:bg-white/6 hover:text-on-primary",
                            )}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            }

            return (
              <li key={item.href ?? item.label}>
                <Link
                  href={item.href ?? "#"}
                  className={cn(
                    "group flex items-center gap-3 rounded-md border-l-2 px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-secondary bg-white/8 text-on-primary"
                      : "border-transparent text-primary-fixed hover:bg-white/6 hover:text-on-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {userRole && (
        <SidebarUserFooter
          userName={userName ?? null}
          userEmail={userEmail ?? null}
          userRole={userRole}
        />
      )}
    </aside>
  );
}
