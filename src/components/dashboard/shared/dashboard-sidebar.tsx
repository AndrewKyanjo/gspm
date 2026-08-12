"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarUserFooter } from "./sidebar-user-footer";
import type { AppRole } from "@/types/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";

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
    <Sidebar collapsible="icon" variant="sidebar" className="bg-primary text-on-primary border-outline-variant">
      {/* Branding header */}
      <SidebarHeader className="border-b border-white/10 px-3 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="GSPM Portal"
              className="hover:bg-white/6 data-[active=true]:bg-white/8"
            >
              <Link href="/dashboard" className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-bold text-on-secondary">
                  GS
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold leading-tight">GSPM Portal</span>
                  <span className="block truncate text-xs text-primary-fixed-dim">{title}</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-4">
        {navigation.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          const children = item.children ?? [];

          if (children.length > 0) {
            // Section header with children — becomes a SidebarGroup (column)
            return (
              <SidebarGroup key={item.label} className="py-1">
                <SidebarGroupLabel
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    active ? "bg-white/8 text-on-primary" : "text-primary-fixed-dim",
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = isActive(child);
                      return (
                        <SidebarMenuItem key={child.href ?? child.label}>
                          <SidebarMenuButton
                            isActive={childActive}
                            tooltip={child.label}
                            className={cn(
                              "pl-6 text-sm font-medium transition-colors",
                              childActive
                                ? "bg-white/10 text-on-primary"
                                : "text-primary-fixed hover:bg-white/6 hover:text-on-primary",
                            )}
                          >
                            <Link href={child.href ?? "#"} className="flex items-center gap-3">
                              <ChildIcon className="h-4 w-4" />
                              <span>{child.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          }

          // Top-level item (no children)
          return (
            <SidebarMenu key={item.href ?? item.label}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={item.label}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    active
                      ? "border-l-2 border-secondary bg-white/8 text-on-primary"
                      : "border-l-2 border-transparent text-primary-fixed hover:bg-white/6 hover:text-on-primary",
                  )}
                >
                  <Link href={item.href ?? "#"} className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          );
        })}
      </SidebarContent>

      {/* User footer */}
      {userRole && (
        <SidebarFooter className="border-t border-white/10">
          <SidebarUserFooter
            userName={userName ?? null}
            userEmail={userEmail ?? null}
            userRole={userRole}
          />
        </SidebarFooter>
      )}

      <SidebarRail className="after:bg-transparent hover:after:bg-white/4" />
    </Sidebar>
  );
}
