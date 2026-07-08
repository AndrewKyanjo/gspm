import {
  BarChart3,
  FileText,
  FolderKanban,
  HandCoins,
  House,
  Image,
  Landmark,
  Settings,
} from "lucide-react";
import { DashboardSidebar, type DashboardNavigationItem } from "@/components/dashboard/shared/dashboard-sidebar";
import type { AppRole } from "@/types/auth";

const deaneryNavigation: DashboardNavigationItem[] = [
  { href: "/dashboard/deanery/dashboard", label: "Overview", icon: House },
  { href: "/dashboard/deanery/parishes", label: "Parishes", icon: Landmark },
  { href: "/dashboard/deanery/contributions", label: "Contributions", icon: HandCoins },
  { href: "/dashboard/deanery/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/deanery/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/deanery/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/deanery/media", label: "Media", icon: Image },
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
