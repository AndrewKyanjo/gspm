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

const deaneryNavigation: DashboardNavigationItem[] = [
  { href: "/dashboard/deanery/dashboard", label: "Overview", icon: House },
  { href: "/dashboard/deanery/parishes", label: "Parishes", icon: Landmark },
  {
    label: "Finance",
    icon: HandCoins,
    children: [
      {
        href: "/dashboard/deanery/finance/contributions",
        label: "Contributions",
        icon: HandCoins,
        aliases: ["/dashboard/deanery/contributions"],
      },
      { href: "/dashboard/deanery/finance/project-spending", label: "Project spending", icon: FolderKanban },
      { href: "/dashboard/deanery/finance/reports", label: "Financial reports", icon: BarChart3 },
    ],
  },
  {
    label: "Documentation",
    icon: FileText,
    children: [
      {
        href: "/dashboard/deanery/documentation/reports",
        label: "Reports",
        icon: BarChart3,
        aliases: ["/dashboard/deanery/reports"],
      },
      {
        href: "/dashboard/deanery/documentation/documents",
        label: "Documents",
        icon: FileText,
        aliases: ["/dashboard/deanery/documents"],
      },
    ],
  },
  { href: "/dashboard/deanery/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/deanery/media", label: "Media", icon: Image },
  { href: "/dashboard/feed", label: "Feed", icon: MessageSquareText },
  { href: "/dashboard/deanery/settings", label: "Settings", icon: Settings },
];

export function DeanerySidebar({
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
      navigation={deaneryNavigation}
      title="Deanery Operations"
      subtitle="A supervisory layer for parish oversight, comparisons, approvals, and deanery-wide coordination."
      footerTitle="Deanery workspace"
      footerDescription="Executive visibility across parishes, reports, contributions, projects, and records."
      userName={userName}
      userEmail={userEmail}
      userRole={role}
    />
  );
}
