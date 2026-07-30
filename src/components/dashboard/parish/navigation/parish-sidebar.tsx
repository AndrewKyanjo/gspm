import {
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
  { href: "/dashboard/parish/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/parish/akabondo", label: "Akabondo", icon: MapPin },
  { href: "/dashboard/parish/needs", label: "Needs", icon: HeartHandshake },
  { href: "/dashboard/parish/contributions", label: "Contributions", icon: HandCoins },
  { href: "/dashboard/parish/documents", label: "Documents", icon: FileText },
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
