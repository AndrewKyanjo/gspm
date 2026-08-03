import {
  BarChart3,
  FileText,
  FolderKanban,
  HandCoins,
  House,
  Image,
  Landmark,
  MessageSquareText,
  Settings,
} from "lucide-react";
import { DashboardSidebar, type DashboardNavigationItem } from "@/components/dashboard/shared/dashboard-sidebar";
import type { AppRole } from "@/types/auth";

const vicariateNavigation: DashboardNavigationItem[] = [
  { href: "/dashboard/vicariate", label: "Overview", icon: House },
  { href: "/dashboard/vicariate/deaneries", label: "Deaneries", icon: Landmark },
  {
    label: "Finance",
    icon: HandCoins,
    children: [
      {
        href: "/dashboard/vicariate/finance/contributions",
        label: "Contributions",
        icon: HandCoins,
        aliases: ["/dashboard/vicariate/contributions"],
      },
      { href: "/dashboard/vicariate/finance/project-spending", label: "Project spending", icon: FolderKanban },
      { href: "/dashboard/vicariate/finance/reports", label: "Financial reports", icon: BarChart3 },
    ],
  },
  { href: "/dashboard/vicariate/projects", label: "Projects", icon: FolderKanban },
  {
    label: "Documentation",
    icon: FileText,
    children: [
      {
        href: "/dashboard/vicariate/documentation/reports",
        label: "Reports",
        icon: BarChart3,
        aliases: ["/dashboard/vicariate/reports"],
      },
      {
        href: "/dashboard/vicariate/documentation/documents",
        label: "Documents",
        icon: FileText,
        aliases: ["/dashboard/vicariate/documents"],
      },
    ],
  },
  { href: "/dashboard/vicariate/media", label: "Media", icon: Image },
  { href: "/dashboard/feed", label: "Feed", icon: MessageSquareText },
  { href: "/dashboard/vicariate/settings", label: "Settings", icon: Settings },
];

export function VicariateSidebar({
  pathname,
  role,
  userName,
  userEmail,
}: {
  pathname: string;
  role?: AppRole;
  userName?: string | null;
  userEmail?: string | null;
}) {
  return (
    <DashboardSidebar
      pathname={pathname}
      navigation={vicariateNavigation}
      title="Vicariate Operations"
      subtitle="A supervisory workspace for deaneries, parish compliance, reports, projects, and records."
      footerTitle="Vicariate workspace"
      footerDescription="Roll up deaneries and parishes while keeping rates and contribution expectations explicit."
      userName={userName}
      userEmail={userEmail}
      userRole={role}
    />
  );
}
