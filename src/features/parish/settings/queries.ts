import { createAdminClient } from "@/lib/supabase/admin";

export type ParishSettingsSnapshot = {
  parishName: string | null;
  parishCode: string | null;
  deaneryName: string | null;
  vicariateName: string | null;
  currentUserName: string | null;
  currentUserEmail: string | null;
};

export async function getParishSettingsSnapshot(parishId: string, userId: string): Promise<ParishSettingsSnapshot> {
  const supabase = createAdminClient();
  const [parishResult, userResult] = await Promise.all([
    supabase
      .from("parishes")
      .select("name, code, deaneries(name), vicariates(name)")
      .eq("id", parishId)
      .maybeSingle(),
    supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle(),
  ]);

  return {
    parishName: parishResult.data?.name ?? null,
    parishCode: parishResult.data?.code ?? null,
    deaneryName:
      parishResult.data &&
      "deaneries" in parishResult.data &&
      parishResult.data.deaneries &&
      typeof parishResult.data.deaneries === "object" &&
      "name" in parishResult.data.deaneries
        ? (parishResult.data.deaneries.name as string | null)
        : null,
    vicariateName:
      parishResult.data &&
      "vicariates" in parishResult.data &&
      parishResult.data.vicariates &&
      typeof parishResult.data.vicariates === "object" &&
      "name" in parishResult.data.vicariates
        ? (parishResult.data.vicariates.name as string | null)
        : null,
    currentUserName: userResult.data?.full_name ?? null,
    currentUserEmail: userResult.data?.email ?? null,
  };
}
