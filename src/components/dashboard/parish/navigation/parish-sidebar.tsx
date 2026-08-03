import {
  ArchiveRestore,
  BarChart3,
  FileText,
  FolderKanban,
  HandCoins,
  HeartHandshake,
  House,
  Image,
  MapPin,
  MessageSquareText,
  Settings,
} from "lucide-react";
import { DashboardSidebar, type DashboardNavigationItem } from "@/components/dashboard/shared/dashboard-sidebar";
import type { AppRole } from "@/types/auth";

const parishNavigation: DashboardNavigationItem[] = [
  { href: "/dashboard/parish", label: "Overview", icon: House },
  { href: "/dashboard/parish/akabondo", label: "Akabondo", icon: MapPin },
  { href: "/dashboard/parish/needs", label: "Needs", icon: HeartHandshake },
  {
    label: "Finance",
    icon: HandCoins,
    children: [
      {
        href: "/dashboard/parish/finance/contributions",
        label: "Contributions",
        icon: HandCoins,
        aliases: ["/dashboard/parish/contributions"],
      },
      { href: "/dashboard/parish/finance/project-spending", label: "Project spending", icon: FolderKanban },
      {
        href: "/dashboard/parish/finance/reports",
        label: "Financial reports",
        icon: BarChart3,
        aliases: ["/dashboard/parish/contributions/report"],
      },
    ],
  },
  {
    label: "Documentation",
    icon: FileText,
    children: [
      {
        href: "/dashboard/parish/documentation/reports",
        label: "Reports",
        icon: BarChart3,
        aliases: ["/dashboard/parish/reports"],
      },
      {
        href: "/dashboard/parish/documentation/documents",
        label: "Documents",
        icon: FileText,
        aliases: ["/dashboard/parish/documents"],
      },
      { href: "/dashboard/parish/documentation/past-import", label: "Past import", icon: ArchiveRestore },
    ],
  },
  { href: "/dashboard/parish/media", label: "Media", icon: Image },
  { href: "/dashboard/parish/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/feed", label: "Feed", icon: MessageSquareText },
  { href: "/dashboard/parish/settings", label: "Settings", icon: Settings },
];

export function ParishSidebar({
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
      navigation={parishNavigation}
      title="Parish Administration"
      subtitle="Quiet, high-trust operations for parish reporting, records, and local ministry planning."
      footerTitle="Parish workspace"
      footerDescription="One shell for reports, media, records, and operational review."
      userName={userName}
      userEmail={userEmail}
      userRole={role}
    />
  );
}
