import type { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/shared/dashboard-topbar";
import { ArchdioceseSidebar } from "../navigation/archdiocese-sidebar";
import type { AppRole } from "@/types/auth";

export function ArchdioceseShell({
  pathname,
  eyebrow,
  title,
  subtitle,
  actions,
  searchAction = "/dashboard/archdiocese/parishes",
  searchPlaceholder = "Search parishes, deaneries, users, or reports",
  searchQuery,
  role,
  children,
}: {
  pathname: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  searchAction?: string;
  searchPlaceholder?: string;
  searchQuery?: string;
  role?: AppRole;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface md:flex">
      <ArchdioceseSidebar pathname={pathname} role={role} />
      <div className="min-w-0 flex-1">
        <DashboardTopbar
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          actions={actions}
          searchAction={searchAction}
          searchPlaceholder={searchPlaceholder}
          searchQuery={searchQuery}
          scopeLabel="Archdiocese Scope"
        />
        <main className="space-y-8 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
