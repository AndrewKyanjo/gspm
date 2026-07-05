import type { ReactNode } from "react";
import { ParishSidebar } from "../navigation/parish-sidebar";
import { ParishTopbar } from "./parish-topbar";

export function ParishShell({
  pathname,
  eyebrow,
  title,
  subtitle,
  actions,
  searchQuery,
  children,
}: {
  pathname: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  searchQuery?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface md:flex">
      <ParishSidebar pathname={pathname} />
      <div className="min-w-0 flex-1">
        <ParishTopbar eyebrow={eyebrow} title={title} subtitle={subtitle} actions={actions} searchQuery={searchQuery} />
        <main className="space-y-8 px-5 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
