"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidRoleLevelPair } from "@/lib/permissions/roles";
import type { HierarchyLevel } from "@/types/hierarchy";
import type { AppRole } from "@/types/roles";

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

type SignUpInput = {
  fullName: string;
  email: string;
  phone?: string;
  title?: string;
  password: string;
  requestedRole: AppRole;
  requestedLevel: HierarchyLevel;
  requestedArchdioceseId: string;
  requestedVicariateId?: string;
  requestedDeaneryId?: string;
  requestedParishId?: string;
};

type ActionResult = {
  ok: boolean;
  error?: string;
};

export type SignInState = {
  error: string | null;
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

function describeAuthError(error: unknown): string {
  if (error && typeof error === "object") {
    const authError = error as {
      message?: unknown;
      code?: unknown;
      status?: unknown;
      name?: unknown;
      cause?: unknown;
    };

    const message =
      typeof authError.message === "string" ? authError.message.trim() : "";

    if (message && message !== "{}") {
      return message;
    }

    const code = typeof authError.code === "string" ? authError.code : null;
    const status =
      typeof authError.status === "number" || typeof authError.status === "string"
        ? String(authError.status)
        : null;

    if (code || status) {
      return `Supabase Auth rejected the signup request${status ? ` (status ${status})` : ""}${code ? ` [${code}]` : ""}.`;
    }
  }

  return "Supabase Auth rejected the signup request before the app could create the profile or registration request. This usually points to an Auth configuration issue in Supabase rather than an app form error.";
}

export async function signInWithPassword(
  _previousState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter both your email address and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("[signIn] Supabase auth.signInWithPassword failed", {
      email,
      message: error.message,
      code: "code" in error ? error.code : undefined,
      status: "status" in error ? error.status : undefined,
      raw: JSON.stringify(error, null, 2),
    });

    return {
      error:
        error.message && error.message !== "{}"
          ? error.message
          : "Sign-in failed. Please confirm your email verification is complete and that this account has portal access.",
    };
  }

  redirect("/dashboard");
}

export async function signUp(input: SignUpInput): Promise<ActionResult> {
  try {
    if (!isValidRoleLevelPair(input.requestedRole, input.requestedLevel)) {
      return { ok: false, error: "That role cannot be assigned at the selected level." };
    }

    if (!input.requestedVicariateId) {
      return { ok: false, error: "A Vicariate selection is required." };
    }

    if (
      (input.requestedLevel === "deanery" || input.requestedLevel === "parish") &&
      !input.requestedDeaneryId
    ) {
      return { ok: false, error: "A Deanery selection is required." };
    }

    if (input.requestedLevel === "parish" && !input.requestedParishId) {
      return { ok: false, error: "A Parish selection is required." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: {
          full_name: input.fullName,
          phone: input.phone ?? null,
          title: input.title ?? null,
        },
      },
    });

    if (error) {
      console.error("[signUp] Supabase auth.signUp failed", {
        email: input.email,
        message: error.message,
        code: "code" in error ? error.code : undefined,
        status: "status" in error ? error.status : undefined,
        name: error.name,
        cause: "cause" in error ? error.cause : undefined,
        raw: JSON.stringify(error, null, 2),
      });
      return { ok: false, error: describeAuthError(error) };
    }

    if (!data.user) {
      console.error("[signUp] Supabase auth.signUp returned no user", {
        email: input.email,
      });
      return { ok: false, error: "Supabase did not return a user record." };
    }

    const adminSupabase = createAdminClient();

    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone ?? null,
        title: input.title ?? null,
      });

    if (profileError) {
      console.error("[signUp] Profile upsert failed", {
        email: input.email,
        userId: data.user.id,
        message: profileError.message,
      });
      return {
        ok: false,
        error: `Your account was created, but your profile could not be updated: ${profileError.message}`,
      };
    }

    const { error: requestError } = await adminSupabase.from("registration_requests").insert({
      user_id: data.user.id,
      requested_role: input.requestedRole,
      requested_level: input.requestedLevel,
      requested_archdiocese_id: input.requestedArchdioceseId,
      requested_vicariate_id: input.requestedVicariateId ?? null,
      requested_deanery_id: input.requestedDeaneryId ?? null,
      requested_parish_id: input.requestedParishId ?? null,
    });

    if (requestError) {
      console.error("[signUp] Registration request insert failed", {
        email: input.email,
        userId: data.user.id,
        message: requestError.message,
      });
      return {
        ok: false,
        error: `Your account was created, but the registration request could not be saved: ${requestError.message}`,
      };
    }

    return { ok: true };
  } catch (error) {
    console.error("[signUp] Unexpected error", {
      email: input.email,
      error,
    });
    return {
      ok: false,
      error: toErrorMessage(
        error,
        "The account may have been created, but the server failed while finishing registration setup."
      ),
    };
  }
}
