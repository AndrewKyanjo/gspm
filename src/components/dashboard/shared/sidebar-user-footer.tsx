"use client";

// src/components/dashboard/shared/sidebar-user-footer.tsx
//
// Rendered at the bottom of every dashboard sidebar.  Shows the currently
// signed-in user's name, their role, and a logout button.

import { useState } from "react";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/features/auth/actions";
import { ROLE_LABELS } from "@/lib/permissions/roles";
import type { AppRole } from "@/types/auth";

export type SidebarUserFooterProps = {
  userName: string | null;
  userEmail: string | null;
  userRole: AppRole;
};

export function SidebarUserFooter({
  userName,
  userEmail,
  userRole,
}: SidebarUserFooterProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // If the Server Action throws (or redirects mid-flight), let it
      // complete naturally.  Reset only if we're somehow still here.
      setLoggingOut(false);
    }
  };

  const displayName = userName ?? userEmail ?? "Signed-in User";
  const roleLabel = ROLE_LABELS[userRole] ?? userRole;

  return (
    <div className="border-t border-white/10 px-5 py-4">
      {/* User identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-on-primary">
          <User className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-on-primary">
            {displayName}
          </p>
          <p className="truncate text-xs text-primary-fixed">{roleLabel}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-primary-fixed transition-colors hover:bg-white/10 hover:text-on-primary disabled:opacity-50",
          )}
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
