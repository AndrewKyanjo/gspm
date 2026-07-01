// src/lib/permissions/access.ts
//
// The permission helpers referenced in Section 6 of the project
// description. Every Server Action that mutates data calls one of
// these FIRST, and throws ForbiddenError if it returns false — before
// ever touching Supabase. The database RLS policies enforce the exact
// same rules again independently; that duplication is intentional
// defense-in-depth, not accidental drift (see phase3_access_layer.sql).

import type { AccessContext } from "@/types/auth";
import { isAdminRole } from "./roles";
import { hasScope, canWriteParishScope } from "./scopes";

type ParishLike = {
  id: string;
  archdioceseId: string | null;
  vicariateId: string | null;
  deaneryId: string | null;
};

type ParishReportLike = {
  parishId: string;
  archdioceseId: string | null;
  vicariateId: string | null;
  deaneryId: string | null;
  status: "draft" | "submitted" | "returned" | "approved";
};

/** Can this user view the given parish's details / reports? */
export function canViewParish(ctx: AccessContext, parish: ParishLike): boolean {
  return hasScope(ctx, {
    archdioceseId: parish.archdioceseId,
    vicariateId: parish.vicariateId,
    deaneryId: parish.deaneryId,
    parishId: parish.id,
  });
}

/**
 * Can this user edit the given parish report? Mirrors
 * parish_reports_update_own_parish_draft: must be the parish itself (or
 * an admin), AND the report must still be a draft — once submitted, a
 * parish user can no longer edit it themselves.
 */
export function canEditParishReport(ctx: AccessContext, report: ParishReportLike): boolean {
  const inWriteScope = canWriteParishScope(ctx, report.parishId);
  if (!inWriteScope) return false;
  if (isAdminRole(ctx.role)) return true;
  return report.status === "draft";
}

/** Can this user view (read-only) the given parish report? */
export function canViewParishReport(ctx: AccessContext, report: ParishReportLike): boolean {
  return hasScope(ctx, {
    archdioceseId: report.archdioceseId,
    vicariateId: report.vicariateId,
    deaneryId: report.deaneryId,
    parishId: report.parishId,
  });
}

/** Only super_admin / archdiocese_admin approve or reject registrations. */
export function canApproveRegistrations(ctx: AccessContext): boolean {
  return isAdminRole(ctx.role);
}

/**
 * Only super_admin / archdiocese_admin manage users in V1. Phase 7 notes
 * "delegated user management" (vicariate heads approving parish users
 * under them) as future work — this is the single place that will need
 * to change when that ships.
 */
export function canManageUsers(ctx: AccessContext): boolean {
  return isAdminRole(ctx.role);
}

/** Only super_admin edits the hierarchy tables themselves (Section 3). */
export function canManageHierarchy(ctx: AccessContext): boolean {
  return ctx.role === "super_admin";
}
