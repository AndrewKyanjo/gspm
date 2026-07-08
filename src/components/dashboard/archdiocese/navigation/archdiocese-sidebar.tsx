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
import type { AppRole } from "@/types/auth";

const ALL_ARCHDIOCESE_NAV_ITEMS: DashboardNavigationItem[] = [
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

/** Nav items hidden from archdiocese_data_entry — they lack admin powers. */
const ADMIN_ONLY_LABELS = new Set(["Users", "Settings"]);

function navigationForRole(role: AppRole): DashboardNavigationItem[] {
  if (role === "archdiocese_data_entry") {
    return ALL_ARCHDIOCESE_NAV_ITEMS.filter(
      (item) => !ADMIN_ONLY_LABELS.has(item.label),
    );
  }

  return ALL_ARCHDIOCESE_NAV_ITEMS;
}

export function ArchdioceseSidebar({
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
      navigation={navigationForRole(role ?? "archdiocese_admin")}
      title="Archdiocese Executive"
      subtitle="System-wide oversight across hierarchy operations, approvals, finance, records, and parish performance."
      footerTitle="Executive console"
      footerDescription="Built around an explicit Archdiocese → Vicariate → Deanery → Parish hierarchy so the Vicariate layer can grow without refactoring the rest."
      userName={userName}
      userEmail={userEmail}
      userRole={role}
    />
  );
}
