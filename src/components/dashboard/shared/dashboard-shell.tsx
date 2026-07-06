import type { ReactNode } from "react";
import type { DashboardNavigationItem } from "./dashboard-sidebar";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

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
    <div className="min-h-screen bg-surface md:flex">
      <DashboardSidebar
        pathname={pathname}
        navigation={navigation}
        title={navigationTitle}
        subtitle={navigationSubtitle}
        footerTitle={footerTitle}
        footerDescription={footerDescription}
      />
      <div className="min-w-0 flex-1">
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
      </div>
    </div>
  );
}
