import { notFound, redirect } from "next/navigation";
import RegistrationReviewForm from "@/components/dashboard/RegistrationReviewForm";
import type { RegistrationRequestRow } from "@/components/dashboard/RegistrationTable";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createClient } from "@/lib/supabase/server";

type RequestPageProps = {
  params: Promise<{ requestId: string }>;
};

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

async function getRegistrationRequest(requestId: string): Promise<RegistrationRequestRow | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("registration_requests")
    .select(
      "id, user_id, requested_role, requested_level, requested_archdiocese_id, requested_vicariate_id, requested_deanery_id, requested_parish_id, created_at"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const request = data as RegistrationRequestRecord;

  const [profileResult, vicariateResult, deaneryResult, parishResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email, phone")
      .eq("id", request.user_id)
      .maybeSingle(),
    request.requested_vicariate_id
      ? supabase.from("vicariates").select("name").eq("id", request.requested_vicariate_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    request.requested_deanery_id
      ? supabase.from("deaneries").select("name").eq("id", request.requested_deanery_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    request.requested_parish_id
      ? supabase.from("parishes").select("name").eq("id", request.requested_parish_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (
    profileResult.error ||
    vicariateResult.error ||
    deaneryResult.error ||
    parishResult.error
  ) {
    return null;
  }

  return {
    id: request.id,
    requested_role: request.requested_role,
    requested_level: request.requested_level,
    requested_archdiocese_id: request.requested_archdiocese_id,
    requested_vicariate_id: request.requested_vicariate_id,
    requested_deanery_id: request.requested_deanery_id,
    requested_parish_id: request.requested_parish_id,
    created_at: request.created_at,
    profile: profileResult.data ?? null,
    vicariate: vicariateResult.data ?? null,
    deanery: deaneryResult.data ?? null,
    parish: parishResult.data ?? null,
  };
}

export default async function RegistrationApprovalRequestPage({ params }: RequestPageProps) {
  const context = await requireAuth();

  if (context.role !== "super_admin" && context.role !== "archdiocese_admin") {
    redirect("/dashboard");
  }

  const { requestId } = await params;
  const request = await getRegistrationRequest(requestId);

  if (!request) {
    notFound();
  }

  return (
    <div className="space-y-6 px-6 py-8">
      <RegistrationReviewForm request={request} />
    </div>
  );
}
