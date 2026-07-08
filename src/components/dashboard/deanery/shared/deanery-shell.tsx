import type { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/shared/dashboard-topbar";
import { DeanerySidebar } from "../navigation/deanery-sidebar";
import type { AppRole } from "@/types/auth";

export function DeaneryShell({
  pathname,
  eyebrow,
  title,
  subtitle,
  actions,
  searchQuery,
  role,
  userName,
  userEmail,
  children,
}: {
  pathname: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  searchQuery?: string;
  role?: AppRole;
  userName?: string | null;
  userEmail?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface md:flex">
      <DeanerySidebar
        pathname={pathname}
        role={role}
        userName={userName}
        userEmail={userEmail}
      />
      <div className="min-w-0 flex-1">
        <DashboardTopbar
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          actions={actions}
          searchAction="/dashboard/deanery/search"
          searchPlaceholder="Search deanery workspace"
          searchQuery={searchQuery}
          scopeLabel="Deanery Scope"
        />
        <main className="space-y-8 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
