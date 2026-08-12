import type { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/shared/dashboard-topbar";
import { VicariateSidebar } from "../navigation/vicariate-sidebar";
import type { AppRole } from "@/types/auth";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export function VicariateShell({
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
    <SidebarProvider>
      <VicariateSidebar
        pathname={pathname}
        role={role}
        userName={userName}
        userEmail={userEmail}
      />
      <SidebarInset>
        <SidebarTrigger className="absolute left-5 top-4 z-10 md:hidden" />
        <DashboardTopbar
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          actions={actions}
          searchAction="/dashboard/vicariate/deaneries"
          searchPlaceholder="Search vicariate workspace"
          searchQuery={searchQuery}
          scopeLabel="Vicariate Scope"
        />
        <main className="space-y-8 px-5 py-6 md:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
