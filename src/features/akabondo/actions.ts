"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuth } from "@/lib/auth/requireAuth";
import type { AccessContext } from "@/types/auth";

export type AkabondoActionState = {
  error: string | null;
  success?: string | null;
};

const ARCHDIOCESE_ROLES = ["super_admin", "archdiocese_admin", "archdiocese_data_entry"] as const;
const PARISH_ROLES = ["parish_head", "parish_data_entry"] as const;

function text(formData: FormData, key: string, max = 300) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function checkbox(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function nullable(value: string) {
  return value ? value : null;
}

async function getParishHierarchy(parishId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("parishes")
    .select("id, archdiocese_id, vicariate_id, deanery_id, name")
    .eq("id", parishId)
    .maybeSingle();
  return data;
}

function canAccessParish(context: AccessContext, parish: Awaited<ReturnType<typeof getParishHierarchy>>) {
  if (!parish) return false;
  if (context.role === "super_admin") return true;
  if (
    (context.role === "archdiocese_admin" || context.role === "archdiocese_data_entry") &&
    context.archdioceseId === parish.archdiocese_id
  ) return true;
  if (context.parishId === parish.id) return true;
  return false;
}

async function ensureSubParish({
  parish,
  name,
  userId,
}: {
  parish: NonNullable<Awaited<ReturnType<typeof getParishHierarchy>>>;
  name: string;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("sub_parishes")
    .select("*")
    .eq("parish_id", parish.id)
    .ilike("name", name)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("sub_parishes")
    .insert({
      archdiocese_id: parish.archdiocese_id,
      vicariate_id: parish.vicariate_id,
      deanery_id: parish.deanery_id,
      parish_id: parish.id,
      name,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function ensureAkabondo({
  parish,
  subParishId,
  name,
  village,
  userId,
}: {
  parish: NonNullable<Awaited<ReturnType<typeof getParishHierarchy>>>;
  subParishId: string;
  name: string;
  village: string | null;
  userId: string;
}) {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("akabondos")
    .select("*")
    .eq("sub_parish_id", subParishId)
    .ilike("name", name)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("akabondos")
    .insert({
      archdiocese_id: parish.archdiocese_id,
      vicariate_id: parish.vicariate_id,
      deanery_id: parish.deanery_id,
      parish_id: parish.id,
      sub_parish_id: subParishId,
      name,
      village_name: village,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

async function saveEvaluationForParish(
  context: AccessContext,
  formData: FormData,
  parishId: string,
  revalidateTarget: string,
): Promise<AkabondoActionState> {
  const parish = await getParishHierarchy(parishId);
  if (!canAccessParish(context, parish)) {
    return { error: "You are not allowed to enter Akabondo data for this parish." };
  }
  if (!parish) {
    return { error: "Selected parish was not found." };
  }

  const personName = text(formData, "personName", 180);
  const subParishName = text(formData, "subParishName", 140);
  const akabondoName = text(formData, "akabondoName", 140);
  const village = text(formData, "village", 140);

  if (!personName || !subParishName || !akabondoName) {
    return { error: "Name, Sub Parish, and Akabondo are required." };
  }

  const ageText = text(formData, "age", 3);
  const age = ageText ? Number(ageText) : null;
  if (age != null && (!Number.isInteger(age) || age < 0 || age > 130)) {
    return { error: "Age must be a valid number between 0 and 130." };
  }

  try {
    const subParish = await ensureSubParish({ parish, name: subParishName, userId: context.userId });
    const akabondo = await ensureAkabondo({
      parish,
      subParishId: subParish.id,
      name: akabondoName,
      village: village || null,
      userId: context.userId,
    });

    const genderInput = text(formData, "gender", 20);
    const gender = genderInput === "male" || genderInput === "female" ? genderInput : "unknown";
    const supabase = createAdminClient();
    const { error } = await supabase.from("akabondo_evaluations").insert({
      archdiocese_id: parish.archdiocese_id,
      vicariate_id: parish.vicariate_id,
      deanery_id: parish.deanery_id,
      parish_id: parish.id,
      sub_parish_id: subParish.id,
      akabondo_id: akabondo.id,
      entered_by: context.userId,
      person_name: personName,
      age,
      gender,
      contact_number: nullable(text(formData, "contactNumber", 80)),
      village: nullable(village),
      challenge_sick: checkbox(formData, "challengeSick"),
      challenge_aged: checkbox(formData, "challengeAged"),
      challenge_unemployed: checkbox(formData, "challengeUnemployed"),
      challenge_disabled: checkbox(formData, "challengeDisabled"),
      challenge_other: nullable(text(formData, "challengeOther", 240)),
      assistance_food: checkbox(formData, "assistanceFood"),
      assistance_shelter: checkbox(formData, "assistanceShelter"),
      assistance_bedding: checkbox(formData, "assistanceBedding"),
      assistance_clothing: checkbox(formData, "assistanceClothing"),
      assistance_medical: checkbox(formData, "assistanceMedical"),
      assistance_education: checkbox(formData, "assistanceEducation"),
      assistance_financial: checkbox(formData, "assistanceFinancial"),
      assistance_other: nullable(text(formData, "assistanceOther", 240)),
      additional_information: nullable(text(formData, "additionalInformation", 1000)),
      evaluated_on: text(formData, "evaluatedOn", 10) || new Date().toISOString().slice(0, 10),
    });

    if (error) return { error: error.message };
    revalidatePath(revalidateTarget);
    return { error: null, success: "Evaluation saved." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save evaluation." };
  }
}

export async function createParishAkabondoEvaluation(
  _previousState: AkabondoActionState,
  formData: FormData,
): Promise<AkabondoActionState> {
  const context = await requireAuth({ roles: [...PARISH_ROLES] });
  if (!context.parishId) return { error: "Your account does not have a parish scope." };
  return saveEvaluationForParish(context, formData, context.parishId, "/dashboard/parish/akabondo");
}

export async function createArchdioceseAkabondoEvaluation(
  _previousState: AkabondoActionState,
  formData: FormData,
): Promise<AkabondoActionState> {
  const context = await requireAuth({ roles: [...ARCHDIOCESE_ROLES] });
  const parishId = text(formData, "parishId", 80);
  if (!parishId) return { error: "Select the parish before entering Akabondo data." };
  return saveEvaluationForParish(context, formData, parishId, `/dashboard/archdiocese/akabondo?parishId=${parishId}`);
}

export async function createParishNeed(
  _previousState: AkabondoActionState,
  formData: FormData,
): Promise<AkabondoActionState> {
  const context = await requireAuth({ roles: [...PARISH_ROLES, ...ARCHDIOCESE_ROLES] });
  const parishId = text(formData, "parishId", 80) || context.parishId;
  if (!parishId) return { error: "Select a parish for this need." };

  const parish = await getParishHierarchy(parishId);
  if (!canAccessParish(context, parish)) {
    return { error: "You are not allowed to add needs for this parish." };
  }
  if (!parish) {
    return { error: "Selected parish was not found." };
  }

  const title = text(formData, "title", 180);
  const needType = text(formData, "needType", 40);
  if (!title || !needType) return { error: "Need type and title are required." };

  const estimated = text(formData, "estimatedHouseholds", 6);
  const estimatedHouseholds = estimated ? Number(estimated) : null;
  if (estimatedHouseholds != null && (!Number.isInteger(estimatedHouseholds) || estimatedHouseholds < 0)) {
    return { error: "Estimated households must be a positive whole number." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("parish_needs").insert({
    archdiocese_id: parish.archdiocese_id,
    vicariate_id: parish.vicariate_id,
    deanery_id: parish.deanery_id,
    parish_id: parish.id,
    created_by: context.userId,
    need_type: needType,
    title,
    description: nullable(text(formData, "description", 1000)),
    priority: text(formData, "priority", 20) || "medium",
    source: text(formData, "source", 40) || "manual",
    estimated_households: estimatedHouseholds,
    status: "open",
  });

  if (error) return { error: error.message };
  revalidatePath(context.parishId ? "/dashboard/parish/needs" : `/dashboard/archdiocese/akabondo?parishId=${parish.id}`);
  return { error: null, success: "Parish need saved." };
}

export async function createParishNeedFromSuggestion(formData: FormData) {
  await createParishNeed({ error: null, success: null }, formData);
}
