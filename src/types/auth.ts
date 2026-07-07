// src/types/auth.ts
// Mirrors the AccessContext described in Section 6 of the project
// description, plus the enum types from Appendix B / the SQL schema.

export type AppRole =
  | "super_admin"
  | "archdiocese_admin"
  | "archdiocese_data_entry"
  | "vicariate_head"
  | "vicariate_staff"
  | "deanery_head"
  | "deanery_staff"
  | "parish_head"
  | "parish_data_entry";

export type HierarchyLevel = "archdiocese" | "vicariate" | "deanery" | "parish";

export type AccountStatus = "pending" | "approved" | "rejected" | "suspended";

/**
 * Built once per request (middleware / Server Component) from the
 * caller's profile + primary active user_assignments row. Passed down
 * to Server Actions, permission helpers, and UI components.
 *
 * `approved` / `active` are kept even though a "null" AccessContext
 * already implies "no access" — they let a page render a specific
 * "pending approval" vs "access denied" message instead of a generic 404.
 */
export type AccessContext = {
  userId: string;
  role: AppRole;
  level: HierarchyLevel;
  archdioceseId: string | null;
  vicariateId: string | null;
  deaneryId: string | null;
  parishId: string | null;
  approved: boolean;
  active: boolean;
};

/** Thrown by requireAuth()/permission helpers when a check fails. */
export class ForbiddenError extends Error {
  constructor(message = "You are not allowed to perform this action") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Thrown when there is no valid session at all. */
export class UnauthenticatedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}
