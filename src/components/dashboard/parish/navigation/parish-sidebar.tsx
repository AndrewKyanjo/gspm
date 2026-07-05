import Link from "next/link";
import {
  BarChart3,
  FileText,
  FolderKanban,
  HandCoins,
  House,
  Image,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const parishNavigation = [
  { href: "/dashboard/parish", label: "Overview", icon: House },
  { href: "/dashboard/parish/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/parish/contributions", label: "Contributions", icon: HandCoins },
  { href: "/dashboard/parish/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/parish/media", label: "Media", icon: Image },
  { href: "/dashboard/parish/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/parish/settings", label: "Settings", icon: Settings },
];

export function ParishSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-[272px] shrink-0 border-r border-outline-variant bg-primary text-on-primary lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-secondary-fixed">
          Good Samaritan Ministry
        </p>
        <h1 className="mt-3 text-xl font-semibold leading-tight">Parish Administration</h1>
        <p className="mt-2 text-sm text-primary-fixed">
          Quiet, high-trust operations for parish reporting, records, and local ministry planning.
        </p>
      </div>

      <nav className="flex-1 px-3 py-5">
        <ul className="space-y-1">
          {parishNavigation.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/dashboard/parish" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md border-l-2 px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "border-secondary bg-white/8 text-on-primary"
                      : "border-transparent text-primary-fixed hover:bg-white/6 hover:text-on-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-fixed-dim">
          Parish workspace
        </p>
        <p className="mt-2 text-sm text-primary-fixed">
          One shell for reports, media, records, and operational review.
        </p>
      </div>
    </aside>
  );
}
