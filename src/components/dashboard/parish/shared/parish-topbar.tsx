import type { ReactNode } from "react";
import { DashboardTopbar } from "@/components/dashboard/shared/dashboard-topbar";

export function ParishTopbar({
  eyebrow,
  title,
  subtitle,
  actions,
  searchQuery,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  searchQuery?: string;
}) {
  return (
    <DashboardTopbar
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
      searchAction="/dashboard/parish/search"
      searchPlaceholder="Search parish workspace"
      searchQuery={searchQuery}
      scopeLabel="Parish Scope"
    />
  );
}
