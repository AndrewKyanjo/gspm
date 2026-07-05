"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PARISH_PROJECT_BUCKET } from "./constants";

export type ParishProjectFormState = {
  error: string | null;
};

async function ensureProjectBucket() {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.getBucket(PARISH_PROJECT_BUCKET);
  if (data) {
    return;
  }

  await supabase.storage.createBucket(PARISH_PROJECT_BUCKET, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
  });
}

export async function createParishProject(
  _previousState: ParishProjectFormState,
  formData: FormData
): Promise<ParishProjectFormState> {
  const context = await requireAuth({ roles: ["parish_head", "parish_data_entry"] });

  if (!context.parishId) {
    return { error: "Your account does not have a parish scope." };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { error: "Project title is required." };
  }

  const asAmount = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  const file = formData.get("coverImage");
  let coverImagePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      return { error: "Project cover images must be image files." };
    }

    await ensureProjectBucket();

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    coverImagePath = `parishes/${context.parishId}/${Date.now()}-${safeName}`;
    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage.from(PARISH_PROJECT_BUCKET).upload(coverImagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

    if (uploadError) {
      return { error: uploadError.message };
    }
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("parish_projects")
    .insert({
      archdiocese_id: context.archdioceseId,
      vicariate_id: context.vicariateId,
      deanery_id: context.deaneryId,
      parish_id: context.parishId,
      created_by: context.userId,
      title,
      category: String(formData.get("category") ?? "").trim() || null,
      status: String(formData.get("status") ?? "").trim() || "planned",
      location: String(formData.get("location") ?? "").trim() || null,
      description: String(formData.get("description") ?? "").trim() || null,
      start_date: String(formData.get("startDate") ?? "").trim() || null,
      target_end_date: String(formData.get("targetEndDate") ?? "").trim() || null,
      budget_amount: asAmount("budgetAmount"),
      amount_raised: asAmount("amountRaised"),
      cover_image_path: coverImagePath,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create the parish project." };
  }

  revalidatePath("/dashboard/parish/projects");
  redirect(`/dashboard/parish/projects/${data.id}`);
}
