// src/lib/permissions/access.ts
//
// The permission helpers referenced in Section 6 of the project
// description. Every Server Action that mutates data calls one of
// these FIRST, and throws ForbiddenError if it returns false — before
// ever touching Supabase. The database RLS policies enforce the exact
// same rules again independently; that duplication is intentional
// defense-in-depth, not accidental drift (see phase3_access_layer.sql).

import type { AccessContext } from "@/types/auth";
import { isAdminRole, PROXY_ENTRY_ROLES } from "./roles";
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

type ProxyEntryTarget = {
  parishId: string | null;
  deaneryId?: string | null;
  vicariateId?: string | null;
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

/**
 * Can this user proxy-enter data on behalf of a target parish?
 *
 * Mirrors the SQL function `app.current_user_can_proxy_enter(p_parish_id uuid)`.
 * The logic is:
 *   1. super_admin, archdiocese_admin, and archdiocese_data_entry can proxy
 *      for any parish in the archdiocese.
 *   2. Vicariate-level users can proxy for parishes under their vicariate.
 *   3. Deanery-level users can proxy for parishes under their deanery.
 *   4. Parish-level users cannot proxy — they just do self-entry.
 *
 * This is used by Server Actions and UI to decide whether to show the scope
 * selector and allow proxy-mode inserts.  RLS enforces the same rule
 * independently on the database side.
 */
export function canProxyEnterForScope(
  ctx: AccessContext,
  target: ProxyEntryTarget,
): boolean {
  // Archdiocese-level roles with proxy permission can enter for any parish.
  if (PROXY_ENTRY_ROLES.includes(ctx.role)) {
    return true;
  }

  // Vicariate-level staff can proxy for parishes under their vicariate.
  if (
    ctx.level === "vicariate" &&
    ctx.vicariateId != null &&
    target.vicariateId === ctx.vicariateId
  ) {
    return true;
  }

  // Deanery-level staff can proxy for parishes under their deanery.
  if (
    ctx.level === "deanery" &&
    ctx.deaneryId != null &&
    target.deaneryId === ctx.deaneryId
  ) {
    return true;
  }

  return false;
}

/**
 * Does the current user's role qualify as a data-entry role that can use the
 * proxy-entry workflow?  Includes both admin roles AND the dedicated
 * archdiocese_data_entry role (which lacks admin powers like approving
 * registrations or managing users).
 */
export function isProxyEntryRole(ctx: AccessContext): boolean {
  return PROXY_ENTRY_ROLES.includes(ctx.role);
}
