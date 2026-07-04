// src/lib/auth/requireApprovedUser.ts
//
// Used by the (dashboard) layout (Section 5.3 / 4.4's post-login check
// list: valid session? approved profile? active primary assignment?).
// Unlike requireAuth(), this returns a discriminated status instead of
// throwing, so the layout can route the user to the *right* message —
// "Pending Approval" vs "Access Denied" — instead of a generic error.

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAccessContext } from "./getAccessContext";
import type { AccessContext } from "@/types/auth";

export type ApprovedUserResult =
  | { status: "ok"; context: AccessContext }
  | { status: "unauthenticated" }
  | { status: "pending_approval" }
  | { status: "rejected_or_suspended" }
  | { status: "no_assignment" };

export async function requireApprovedUser(): Promise<ApprovedUserResult> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { status: "unauthenticated" };
  }

  const adminSupabase = createAdminClient();

  const { data: profile, error: profileError } = await adminSupabase
    .from("profiles")
    .select("account_status, is_active")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) {
    return { status: "unauthenticated" };
  }

  if (profile.account_status === "pending") {
    return { status: "pending_approval" };
  }

  if (profile.account_status !== "approved" || profile.is_active !== true) {
    return { status: "rejected_or_suspended" };
  }

  const context = await getAccessContext();
  if (!context) {
    return { status: "no_assignment" };
  }

  return { status: "ok", context };
}
