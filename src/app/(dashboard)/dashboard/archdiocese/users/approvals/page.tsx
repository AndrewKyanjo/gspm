import { redirect } from "next/navigation";
import RegistrationTable, {
  type RegistrationRequestRow,
} from "@/components/dashboard/RegistrationTable";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createClient } from "@/lib/supabase/server";

type RegistrationRequestRecord = {
  id: string;
  user_id: string;
  requested_role: RegistrationRequestRow["requested_role"];
  requested_level: RegistrationRequestRow["requested_level"];
  requested_archdiocese_id: string | null;
  requested_vicariate_id: string | null;
  requested_deanery_id: string | null;
  requested_parish_id: string | null;
  created_at: string;
};

async function getPendingRegistrationRows(): Promise<{
  rows: RegistrationRequestRow[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registration_requests")
    .select(
      "id, user_id, requested_role, requested_level, requested_archdiocese_id, requested_vicariate_id, requested_deanery_id, requested_parish_id, created_at"
    )
    .eq("approval_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return { rows: [], error: error.message };
  }

  const requests = (data ?? []) as RegistrationRequestRecord[];

  if (requests.length === 0) {
    return { rows: [], error: null };
  }

  const unique = (values: Array<string | null | undefined>) =>
    [...new Set(values.filter((value): value is string => Boolean(value)))];

  const userIds = unique(requests.map((request) => request.user_id));
  const vicariateIds = unique(requests.map((request) => request.requested_vicariate_id));
  const deaneryIds = unique(requests.map((request) => request.requested_deanery_id));
  const parishIds = unique(requests.map((request) => request.requested_parish_id));

  const [profilesResult, vicariatesResult, deaneriesResult, parishesResult] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, full_name, email, phone").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    vicariateIds.length
      ? supabase.from("vicariates").select("id, name").in("id", vicariateIds)
      : Promise.resolve({ data: [], error: null }),
    deaneryIds.length
      ? supabase.from("deaneries").select("id, name").in("id", deaneryIds)
      : Promise.resolve({ data: [], error: null }),
    parishIds.length
      ? supabase.from("parishes").select("id, name").in("id", parishIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const relatedError =
    profilesResult.error?.message ||
    vicariatesResult.error?.message ||
    deaneriesResult.error?.message ||
    parishesResult.error?.message ||
    null;

  if (relatedError) {
    return { rows: [], error: relatedError };
  }

  const profilesById = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile])
  );
  const vicariatesById = new Map(
    (vicariatesResult.data ?? []).map((vicariate) => [vicariate.id, vicariate])
  );
  const deaneriesById = new Map(
    (deaneriesResult.data ?? []).map((deanery) => [deanery.id, deanery])
  );
  const parishesById = new Map(
    (parishesResult.data ?? []).map((parish) => [parish.id, parish])
  );

  return {
    rows: requests.map((request) => ({
      id: request.id,
      requested_role: request.requested_role,
      requested_level: request.requested_level,
      requested_archdiocese_id: request.requested_archdiocese_id,
      requested_vicariate_id: request.requested_vicariate_id,
      requested_deanery_id: request.requested_deanery_id,
      requested_parish_id: request.requested_parish_id,
      created_at: request.created_at,
      profile: profilesById.get(request.user_id) ?? null,
      vicariate: request.requested_vicariate_id
        ? vicariatesById.get(request.requested_vicariate_id) ?? null
        : null,
      deanery: request.requested_deanery_id
        ? deaneriesById.get(request.requested_deanery_id) ?? null
        : null,
      parish: request.requested_parish_id
        ? parishesById.get(request.requested_parish_id) ?? null
        : null,
    })),
    error: null,
  };
}

export default async function ApprovalsPage() {
  const context = await requireAuth();

  if (context.role !== "super_admin" && context.role !== "archdiocese_admin") {
    redirect("/dashboard");
  }

  const { rows, error } = await getPendingRegistrationRows();

  return (
    <div className="space-y-6 px-6 py-8">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-primary">
          Archdiocese Admin
        </p>
        <h1 className="text-3xl font-semibold text-on-surface">Registration approvals</h1>
        <p className="max-w-2xl text-sm text-on-surface-variant">
          Review incoming portal access requests, confirm the requested office, and approve or reject
          each signup.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-sm text-on-surface-variant">Pending requests</p>
          <p className="mt-2 text-3xl font-semibold text-on-surface">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-sm text-on-surface-variant">Approval model</p>
          <p className="mt-2 text-sm text-on-surface">
            Centralized review by Archdiocese admins only.
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
          <p className="text-sm text-on-surface-variant">Current focus</p>
          <p className="mt-2 text-sm text-on-surface">
            Identity check, scope validation, and role confirmation.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-error bg-error-container p-5 text-sm text-on-error-container">
          We could not load pending registration requests: {error}
        </div>
      ) : (
        <RegistrationTable requests={rows} />
      )}
    </div>
  );
}
