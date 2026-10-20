import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { AccessContext } from "@/types/auth";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readText(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : null;
}

function readRate(formData: FormData, field: string): number | null | undefined {
  const value = readText(formData, field);
  if (value === null) return undefined;
  if (value === "") return null;
  // Match the numeric(12,2) columns and reject exponents, negatives and overflow.
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) return undefined;
  return Number(value);
}

export async function saveParishDetails(context: AccessContext, formData: FormData, ratesOnly = false) {
  if (!context.approved || !context.active || context.level !== "archdiocese" ||
      !["super_admin", "archdiocese_admin"].includes(context.role) || !context.archdioceseId) {
    return { error: "You do not have permission to edit parishes." };
  }

  const parishId = readText(formData, "parishId");
  if (!parishId || !uuidPattern.test(parishId)) return { error: "Choose a valid parish." };

  const monthly = readRate(formData, "monthlyEmitemwaAmount");
  const goodSamaritan = readRate(formData, "goodSamaritanDayAmount");
  if (monthly === undefined || goodSamaritan === undefined) {
    return { error: "Enter contribution rates from 0 to 9,999,999,999.99, with at most two decimal places, or leave blank to use the vicariate rate." };
  }

  const supabase = createAdminClient();
  const { data: parish, error: parishError } = await supabase.from("parishes")
    .select("id, name, archdiocese_id, vicariate_id, deanery_id")
    .eq("id", parishId).eq("archdiocese_id", context.archdioceseId).maybeSingle();
  if (parishError || !parish) return { error: "Parish not found in your archdiocese." };

  const updates: Record<string, string | number | null> = {
    updated_at: new Date().toISOString(),
    monthly_emitemwa_amount: monthly,
    good_samaritan_day_amount: goodSamaritan,
  };
  let archdioceseId = parish.archdiocese_id as string;

  if (!ratesOnly) {
    const name = readText(formData, "name");
    const destinationArchdioceseId = readText(formData, "archdioceseId");
    const deaneryId = readText(formData, "deaneryId");
    if (!name || name.length > 200 || /[\u0000-\u001f\u007f]/.test(name)) {
      return { error: "Enter a parish name between 1 and 200 characters." };
    }
    if (!destinationArchdioceseId || !uuidPattern.test(destinationArchdioceseId) || !deaneryId || !uuidPattern.test(deaneryId)) {
      return { error: "Choose a valid archdiocese and deanery." };
    }
    if (context.role !== "super_admin" && destinationArchdioceseId !== context.archdioceseId) {
      return { error: "Only a super administrator can transfer a parish to another archdiocese." };
    }

    const [{ data: archdiocese, error: archdioceseError }, { data: deanery, error: deaneryError }] = await Promise.all([
      supabase.from("archdioceses").select("id, status").eq("id", destinationArchdioceseId).maybeSingle(),
      supabase.from("deaneries").select("id, archdiocese_id, vicariate_id, status")
        .eq("id", deaneryId).eq("archdiocese_id", destinationArchdioceseId).maybeSingle(),
    ]);
    if (archdioceseError || deaneryError || !archdiocese || !deanery) {
      return { error: "The selected deanery must belong to the selected archdiocese." };
    }
    const { data: vicariate, error: vicariateError } = await supabase.from("vicariates")
      .select("id, archdiocese_id, status").eq("id", deanery.vicariate_id)
      .eq("archdiocese_id", destinationArchdioceseId).maybeSingle();
    if (vicariateError || !vicariate) return { error: "The selected deanery has an invalid vicariate." };

    const hierarchyChanged = deanery.id !== parish.deanery_id ||
      vicariate.id !== parish.vicariate_id || archdiocese.id !== parish.archdiocese_id;
    if (hierarchyChanged && [archdiocese, deanery, vicariate].some((item) => item.status !== "active")) {
      return { error: "Choose an active archdiocese, vicariate and deanery for the transfer." };
    }
    if (hierarchyChanged) {
      // Reparenting must update copied scopes and user assignments in the same
      // database transaction. Fail closed until the transfer trigger is installed.
      const { data: ready, error: readinessError } = await supabase.rpc("parish_hierarchy_transfer_ready");
      if (readinessError || ready !== true) {
        return { error: "Parish transfers require the database update. Ask your system administrator to apply the parish hierarchy migration." };
      }
    }
    updates.name = name;
    updates.archdiocese_id = archdiocese.id;
    updates.vicariate_id = vicariate.id;
    updates.deanery_id = deanery.id;
    archdioceseId = archdiocese.id;
  }

  const { data: saved, error } = await supabase.from("parishes").update(updates)
    .eq("id", parish.id).eq("archdiocese_id", parish.archdiocese_id)
    .eq("vicariate_id", parish.vicariate_id).eq("deanery_id", parish.deanery_id)
    .select("id").maybeSingle();
  if (error) {
    return { error: error.code === "23505" ? "A parish with these details already exists." : "Could not save the parish. Please try again." };
  }
  if (!saved) return { error: "The parish changed while you were editing. Reload and try again." };
  return { error: null, parishId: saved.id as string, archdioceseId };
}