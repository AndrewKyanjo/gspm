// src/lib/permissions/scopes.ts
//
// The TypeScript mirror of app.current_user_has_scope(...) in SQL. Used
// so the UI can decide what to render (show a link, disable a button)
// without a round trip — the database RLS policy is still what actually
// enforces the rule on every read/write.

import type { AccessContext } from "@/types/auth";

export type ScopeTarget = {
  archdioceseId: string | null;
  vicariateId?: string | null;
  deaneryId?: string | null;
  parishId?: string | null;
};

/**
 * Does this AccessContext's assignment cover the given target scope?
 * Mirrors app.current_user_has_scope(): admins see everything; everyone
 * else must match at their own level.
 */
export function hasScope(ctx: AccessContext, target: ScopeTarget): boolean {
  if (ctx.role === "super_admin" || ctx.role === "archdiocese_admin") {
    return true;
  }

  switch (ctx.level) {
    case "vicariate":
      return !!target.vicariateId && target.vicariateId === ctx.vicariateId;
    case "deanery":
      return !!target.deaneryId && target.deaneryId === ctx.deaneryId;
    case "parish":
      return !!target.parishId && target.parishId === ctx.parishId;
    default:
      return false;
  }
}

/**
 * Narrower "write" scope check, mirroring
 * app.current_user_can_write_parish_scope(): only the parish itself, or
 * an admin, may write a parish-level record. Vicariate/deanery users are
 * read-only over data that isn't theirs to produce.
 */
export function canWriteParishScope(ctx: AccessContext, parishId: string | null): boolean {
  if (ctx.role === "super_admin" || ctx.role === "archdiocese_admin") {
    return true;
  }
  return ctx.level === "parish" && !!parishId && parishId === ctx.parishId;
}
