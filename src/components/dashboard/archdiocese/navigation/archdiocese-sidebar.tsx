import {
  ArchiveRestore,
  BarChart3,
  Building2,
  FileText,
  FolderKanban,
  HandCoins,
  HeartHandshake,
  House,
  Image,
  Landmark,
  MessageSquareText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DashboardSidebar, type DashboardNavigationItem } from "@/components/dashboard/shared/dashboard-sidebar";
import type { AppRole } from "@/types/auth";

const ALL_ARCHDIOCESE_NAV_ITEMS: DashboardNavigationItem[] = [
  { href: "/dashboard/archdiocese/dashboard", label: "Overview", icon: House },
  {
    label: "Hierarchy",
    icon: Building2,
    children: [
      { href: "/dashboard/archdiocese/vicariates", label: "Vicariates", icon: Building2 },
      { href: "/dashboard/archdiocese/deaneries", label: "Deaneries", icon: Landmark },
      { href: "/dashboard/archdiocese/parishes", label: "Parishes", icon: ShieldCheck },
    ],
  },
  { href: "/dashboard/archdiocese/akabondo", label: "Akabondo", icon: HeartHandshake },
  {
    label: "Finance",
    icon: HandCoins,
    children: [
      {
        href: "/dashboard/archdiocese/finance/contributions",
        label: "Contributions",
        icon: HandCoins,
        aliases: ["/dashboard/archdiocese/contributions"],
      },
      { href: "/dashboard/archdiocese/finance/project-spending", label: "Project spending", icon: FolderKanban },
      {
        href: "/dashboard/archdiocese/finance/reports",
        label: "Financial reports",
        icon: BarChart3,
        aliases: ["/dashboard/archdiocese/reports/financial"],
      },
    ],
  },
  { href: "/dashboard/archdiocese/projects", label: "Projects", icon: FolderKanban },
  {
    label: "Documentation",
    icon: FileText,
    children: [
      {
        href: "/dashboard/archdiocese/documentation/reports",
        label: "Reports",
        icon: BarChart3,
        aliases: ["/dashboard/archdiocese/reports"],
      },
      {
        href: "/dashboard/archdiocese/documentation/documents",
        label: "Documents",
        icon: FileText,
        aliases: ["/dashboard/archdiocese/documents"],
      },
      {
        href: "/dashboard/archdiocese/documentation/past-import",
        label: "Past import",
        icon: ArchiveRestore,
        aliases: ["/dashboard/archdiocese/past-documents/import"],
      },
    ],
  },
  { href: "/dashboard/archdiocese/media", label: "Media", icon: Image },
  { href: "/dashboard/feed", label: "Feed", icon: MessageSquareText },
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
