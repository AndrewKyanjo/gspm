// src/lib/auth/getAccessContext.ts
//
// Builds the AccessContext described in Section 6 of the project
// description. This is the TypeScript-side equivalent of the SQL
// app.current_user_assignment() helper — same rule (primary + active
// assignment, approved + active profile), expressed as a query the app
// can call once per request and pass down.
//
// Returns null if there's no session, no approved profile, or no active
// primary assignment — callers decide what to do with "no context"
// (show a login page, a pending-approval page, etc).

import { createClient } from "@/lib/supabase/server";
import type { AccessContext } from "@/types/auth";

export async function getAccessContext(): Promise<AccessContext | null> {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData?.user) {
    return null;
  }
  const userId = userData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_status, is_active")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return null;
  }

  const approved = profile.account_status === "approved";
  const active = profile.is_active === true;

  if (!approved || !active) {
    // Still return null rather than a half-built context — callers that
    // need to distinguish "pending" from "no assignment yet" should
    // query profiles directly for that messaging (see
    // requireApprovedUser.ts), not infer it from a null AccessContext.
    return null;
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("user_assignments")
    .select("role, level, archdiocese_id, vicariate_id, deanery_id, parish_id, is_active")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .eq("is_active", true)
    .maybeSingle();

  if (assignmentError || !assignment) {
    return null;
  }

  return {
    userId,
    role: assignment.role,
    level: assignment.level,
    archdioceseId: assignment.archdiocese_id,
    vicariateId: assignment.vicariate_id,
    deaneryId: assignment.deanery_id,
    parishId: assignment.parish_id,
    approved,
    active,
  };
}
