import {
  BarChart3,
  Building2,
  FileText,
  FolderKanban,
  HandCoins,
  House,
  Image,
  Landmark,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DashboardSidebar, type DashboardNavigationItem } from "@/components/dashboard/shared/dashboard-sidebar";

const archdioceseNavigation: DashboardNavigationItem[] = [
  { href: "/dashboard/archdiocese/dashboard", label: "Overview", icon: House },
  { href: "/dashboard/archdiocese/vicariates", label: "Vicariates", icon: Building2 },
  { href: "/dashboard/archdiocese/deaneries", label: "Deaneries", icon: Landmark },
  { href: "/dashboard/archdiocese/parishes", label: "Parishes", icon: ShieldCheck },
  { href: "/dashboard/archdiocese/contributions", label: "Contributions", icon: HandCoins },
  { href: "/dashboard/archdiocese/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/archdiocese/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/archdiocese/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/archdiocese/media", label: "Media", icon: Image },
  { href: "/dashboard/archdiocese/users", label: "Users", icon: Users },
  { href: "/dashboard/archdiocese/settings", label: "Settings", icon: Settings },
];

export function ArchdioceseSidebar({ pathname }: { pathname: string }) {
  return (
    <DashboardSidebar
      pathname={pathname}
      navigation={archdioceseNavigation}
      title="Archdiocese Executive"
      subtitle="System-wide oversight across hierarchy operations, approvals, finance, records, and parish performance."
      footerTitle="Executive console"
      footerDescription="Built around an explicit Archdiocese → Vicariate → Deanery → Parish hierarchy so the Vicariate layer can grow without refactoring the rest."
    />
  );
}
