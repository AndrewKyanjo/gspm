"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/requireAuth";
import { saveParishDetails } from "./parish-management";

export type ParishActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export async function updateParish(_previousState: ParishActionState, formData: FormData): Promise<ParishActionState> {
  const context = await requireAuth({ roles: ["super_admin", "archdiocese_admin"] });
  const result = await saveParishDetails(context, formData);
  if (result.error) return { status: "error", message: result.error };
  revalidatePath("/dashboard", "layout");
  revalidatePath("/signup");
  if (result.archdioceseId !== context.archdioceseId) redirect("/dashboard/archdiocese/parishes");
  return { status: "success", message: "Parish details and contribution rates saved." };
}