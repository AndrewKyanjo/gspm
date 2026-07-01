// src/lib/permissions/roles.ts
//
// This is the TypeScript mirror of app.validate_role_level_pair() in the
// database. It is NOT a substitute for the SQL check — RLS is the last
// line of defense — but it lets the UI/forms reject an invalid
// role+level combination immediately, before a request ever reaches the
// database, and it's what signup/reassignment dropdowns use to filter
// which roles are offered for a chosen level.
//
// If you change one side, change the other. Keeping the mapping in a
// single exported constant (rather than scattering `if` statements)
// makes the drift easy to spot in review.

import type { AppRole, HierarchyLevel } from "@/types/auth";

export const ROLES_BY_LEVEL: Record<HierarchyLevel, AppRole[]> = {
  archdiocese: ["super_admin", "archdiocese_admin"],
  vicariate: ["vicariate_head", "vicariate_staff"],
  deanery: ["deanery_head", "deanery_staff"],
  parish: ["parish_head", "parish_data_entry"],
};

export const ADMIN_ROLES: AppRole[] = ["super_admin", "archdiocese_admin"];

export function isAdminRole(role: AppRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function isValidRoleLevelPair(role: AppRole, level: HierarchyLevel): boolean {
  return ROLES_BY_LEVEL[level].includes(role);
}

/** Which level a given role belongs to (the inverse of ROLES_BY_LEVEL). */
export function levelForRole(role: AppRole): HierarchyLevel {
  const entry = (Object.entries(ROLES_BY_LEVEL) as [HierarchyLevel, AppRole[]][]).find(
    ([, roles]) => roles.includes(role)
  );
  if (!entry) {
    throw new Error(`Unknown role: ${role}`);
  }
  return entry[0];
}

/** Where a role's role-specific dashboard home lives, per Section 8. */
export const DASHBOARD_HOME_BY_ROLE: Record<AppRole, string> = {
  super_admin: "/dashboard/archdiocese",
  archdiocese_admin: "/dashboard/archdiocese",
  vicariate_head: "/dashboard/vicariate",
  vicariate_staff: "/dashboard/vicariate",
  deanery_head: "/dashboard/deanery",
  deanery_staff: "/dashboard/deanery",
  parish_head: "/dashboard/parish",
  parish_data_entry: "/dashboard/parish",
};
