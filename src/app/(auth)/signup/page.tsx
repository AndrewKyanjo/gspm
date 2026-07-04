import SignUpForm from "@/components/auth/SignUpForm";
import { createClient } from "@/lib/supabase/server";
import type { HierarchyOptions } from "@/types/hierarchy";

async function getHierarchyOptions(): Promise<HierarchyOptions | null> {
  const supabase = await createClient();

  const [archdioceseResult, vicariatesResult, deaneriesResult, parishesResult] = await Promise.all([
    supabase.from("archdioceses").select("id").eq("status", "active").order("name").limit(1).maybeSingle(),
    supabase.from("vicariates").select("id, name, archdiocese_id").eq("status", "active").order("name"),
    supabase
      .from("deaneries")
      .select("id, name, archdiocese_id, vicariate_id")
      .eq("status", "active")
      .order("name"),
    supabase
      .from("parishes")
      .select("id, name, archdiocese_id, vicariate_id, deanery_id")
      .eq("status", "active")
      .order("name"),
  ]);

  if (
    archdioceseResult.error ||
    !archdioceseResult.data?.id ||
    vicariatesResult.error ||
    deaneriesResult.error ||
    parishesResult.error
  ) {
    return null;
  }

  return {
    archdioceseId: archdioceseResult.data.id,
    vicariates: vicariatesResult.data ?? [],
    deaneries: deaneriesResult.data ?? [],
    parishes: parishesResult.data ?? [],
  };
}

export default async function SignUpPage() {
  const hierarchy = await getHierarchyOptions();

  return (
    <div className="min-h-screen bg-surface p-4">
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        {hierarchy ? (
          <SignUpForm hierarchy={hierarchy} />
        ) : (
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-on-surface">Registration unavailable</h1>
            <p className="text-sm text-on-surface-variant">
              We could not load the church hierarchy needed for signup. Please contact an administrator
              before trying again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
