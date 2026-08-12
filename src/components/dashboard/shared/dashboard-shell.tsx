import type { ReactNode } from "react";
import type { DashboardNavigationItem } from "./dashboard-sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardShell({
  pathname,
  eyebrow,
  title,
  subtitle,
  actions,
  searchAction,
  searchPlaceholder,
  searchQuery,
  scopeLabel,
  navigation,
  navigationTitle,
  navigationSubtitle,
  footerTitle,
  footerDescription,
  children,
}: {
  pathname: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  searchAction: string;
  searchPlaceholder: string;
  searchQuery?: string;
  scopeLabel: string;
  navigation: DashboardNavigationItem[];
  navigationTitle: string;
  navigationSubtitle: string;
  footerTitle: string;
  footerDescription: string;
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar
        pathname={pathname}
        navigation={navigation}
        title={navigationTitle}
        subtitle={navigationSubtitle}
        footerTitle={footerTitle}
        footerDescription={footerDescription}
      />
      <SidebarInset>
        <SidebarTrigger className="absolute left-5 top-4 z-10 md:hidden" />
        <DashboardTopbar
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          actions={actions}
          searchAction={searchAction}
          searchPlaceholder={searchPlaceholder}
          searchQuery={searchQuery}
          scopeLabel={scopeLabel}
        />
        <main className="space-y-8 px-5 py-6 md:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
