import { createAdminClient } from "@/lib/supabase/admin";
import {
  getDeaneryHierarchyContext,
  getDeaneryUserAssignments,
  getProfilesByIds,
} from "@/lib/db/queries/deanery";
import type { DeaneryContext, DeanerySettingsUser } from "../types";

export async function getDeanerySettingsOverview(
  deaneryId: string,
): Promise<{ context: DeaneryContext; users: DeanerySettingsUser[] }> {
  const supabase = createAdminClient();

  const [context, assignments] = await Promise.all([
    getDeaneryHierarchyContext(deaneryId),
    getDeaneryUserAssignments(deaneryId),
  ]);

  const userIds = assignments
    .map((assignment) =>
      typeof assignment.user_id === "string" ? assignment.user_id : null,
    )
    .filter(Boolean) as string[];

  const profiles = await getProfilesByIds(userIds);
  const profileMap = new Map(
    profiles.map((profile) => [
      String(profile.id),
      { fullName: profile.full_name ?? null, email: profile.email ?? null },
    ]),
  );

  // Fetch role names for each assignment
  const roleIds = [
    ...new Set(
      assignments
        .map((a) => (typeof a.role_id === "string" ? a.role_id : null))
        .filter(Boolean),
    ),
  ] as string[];

  let roleNameMap = new Map<string, string>();
  if (roleIds.length > 0) {
    const { data: roles } = await supabase
      .from("roles")
      .select("id, name")
      .in("id", roleIds);
    for (const role of roles ?? []) {
      roleNameMap.set(String(role.id), String(role.name ?? "unknown"));
    }
  }

  const users: DeanerySettingsUser[] = assignments.map((assignment) => {
    const userId = String(assignment.user_id ?? "");
    const profile = profileMap.get(userId);
    return {
      id: userId,
      fullName: profile?.fullName ?? null,
      email: profile?.email ?? null,
      role: roleNameMap.get(String(assignment.role_id ?? "")) ?? "unknown",
      isPrimary: Boolean(assignment.is_primary),
      isActive: Boolean(assignment.is_active),
    };
  });

  return { context, users };
}
