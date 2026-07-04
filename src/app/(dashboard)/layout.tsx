// src/app/(dashboard)/layout.tsx
//
// Ties Phase 3 together end-to-end: loads the AccessContext (or a
// specific denial reason), and redirects. This is the piece Section
// 5.3 calls "Server Component & Server Action Guards".

import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth/requireApprovedUser";
import { DASHBOARD_HOME_BY_ROLE } from "@/lib/permissions/roles";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await requireApprovedUser();

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");
    case "pending_approval":
      redirect("/pending-approval");
    case "rejected_or_suspended":
      redirect("/access-denied");
    case "no_assignment":
      // Approved profile, but no active primary assignment yet — this
      // shouldn't normally happen post-approval (approval always
      // creates one), but fail safe rather than showing a blank
      // dashboard.
      redirect("/pending-approval");
    case "ok":
      break;
  }

  return (
    <div className="min-h-screen">
      {/* Sidebar / shell would read result.context here to filter
          navigationConfig, per Section 8. */}
      {children}
    </div>
  );
}

/**
 * Used by /dashboard/page.tsx to redirect a freshly-logged-in user to
 * their role-specific home, per Section 8's routing table.
 */
export async function getDashboardHomeForCurrentUser(): Promise<string> {
  const result = await requireApprovedUser();

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");
    case "pending_approval":
      redirect("/pending-approval");
    case "rejected_or_suspended":
      redirect("/access-denied");
    case "no_assignment":
      redirect("/pending-approval");
    case "ok":
      break;
  }

  return DASHBOARD_HOME_BY_ROLE[result.context.role];
}
