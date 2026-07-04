// src/lib/auth/requireAuth.ts
//
// The guard every protected Server Component / Server Action calls, per
// Section 5.3: "every protected page and server action calls a helper
// like requireAuth(), which loads the current AccessContext and throws
// if the user lacks the required role or scope."

import { getAccessContext } from "./getAccessContext";
import { ForbiddenError, UnauthenticatedError } from "@/types/auth";
import type { AccessContext, AppRole } from "@/types/auth";

type RequireAuthOptions = {
  /** If provided, the caller's role must be one of these. */
  roles?: AppRole[];
};

/**
 * Loads the current AccessContext, throwing if there isn't one, or if
 * `roles` is given and the caller's role isn't in it.
 *
 * Distinguishes "not signed in / not approved" (UnauthenticatedError,
 * -> redirect to /login or /pending-approval) from "signed in, approved,
 * but wrong role" (ForbiddenError, -> redirect to /dashboard or a 403).
 */
export async function requireAuth(options: RequireAuthOptions = {}): Promise<AccessContext> {
  const ctx = await getAccessContext();

  if (!ctx) {
    throw new UnauthenticatedError();
  }

  if (options.roles && !options.roles.includes(ctx.role)) {
    throw new ForbiddenError(
      `Role "${ctx.role}" is not permitted to perform this action`
    );
  }

  return ctx;
}
