import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarUserFooter } from "./sidebar-user-footer";
import type { AppRole } from "@/types/auth";

export type DashboardNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function DashboardSidebar({
  pathname,
  navigation,
  title,
  subtitle,
  footerTitle,
  footerDescription,
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
  return (
    <aside className="hidden w-[272px] shrink-0 border-r border-outline-variant bg-primary text-on-primary lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-fixed">
          Good Samaritan Ministry
        </p>
        <h1 className="mt-3 text-xl font-semibold leading-tight">{title}</h1>
        <p className="mt-2 text-sm text-primary-fixed">{subtitle}</p>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const active =
              pathname === item.href || (item.href !== navigation[0]?.href && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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

      <div className="border-t border-white/10 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed-dim">{footerTitle}</p>
        <p className="mt-2 text-sm text-primary-fixed">{footerDescription}</p>
      </div>

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
