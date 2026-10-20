import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

// Read-only by default. Pass --apply to make the three requested parish changes.
// This script does not read or write payments or legacy opening balances.
const apply = process.argv.includes("--apply");
const monthlyAmount = 30000;
const columns =
  "id,name,code,archdiocese_id,deanery_id,vicariate_id,monthly_emitemwa_amount,good_samaritan_day_amount";

function loadEnvironment() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) continue;
    const value = match[2].trim();
    process.env[match[1]] = value.replace(/^(["'])(.*)\1$/, "$2");
  }
}

function requireData(label, result) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

function label(name) {
  return name.trim().replace(/\s+parish$/i, "").toLowerCase();
}

function singleParish(parishes, labels, description) {
  const matches = parishes.filter((parish) => labels.includes(label(parish.name)));
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${description} parish, found ${matches.length}. No further changes applied.`);
  }
  return matches[0];
}

async function main() {
  const unknownArguments = process.argv.slice(2).filter((arg) => arg !== "--apply");
  if (unknownArguments.length) throw new Error("Usage: node scripts/correct-parish-details.js [--apply]");
  loadEnvironment();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase URL or service role key.");
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20000) }) },
  });
  const parishes = requireData(
    "Read targeted parishes (parish contribution override migration must be applied)",
    await supabase.from("parishes").select(columns)
      .or("name.ilike.%Namayumba%,name.ilike.%Naddangira%,name.ilike.%Bugong%"),
  );
  // Validate every target before making any writes, including name collisions.
  const rateParishes = ["namayumba", "naddangira"].map((name) => singleParish(parishes, [name], name));
  const bugonga = singleParish(parishes, ["bugongo", "bugonga"], "Bugongo/Bugonga");
  const vicariateIds = [...new Set(parishes.map((parish) => parish.vicariate_id).filter(Boolean))];
  const vicariates = vicariateIds.length ? requireData(
    "Read parent vicariate rates",
    await supabase.from("vicariates").select("id,name,monthly_emitemwa_amount").in("id", vicariateIds),
  ) : [];
  const parents = new Map(vicariates.map((vicariate) => [vicariate.id, vicariate]));
  const describe = (parish) => {
    const parent = parents.get(parish.vicariate_id);
    const effectiveMonthly = parish.monthly_emitemwa_amount ?? parent?.monthly_emitemwa_amount ?? null;
    return {
      ...parish,
      vicariate_name: parent?.name ?? null,
      inherited_monthly_amount: parent?.monthly_emitemwa_amount ?? null,
      effective_monthly_amount: effectiveMonthly === null ? null : Number(effectiveMonthly),
      annual_emitemwa_amount: effectiveMonthly === null ? null : Number(effectiveMonthly) * 12,
    };
  };
  const changes = rateParishes.map((parish) => ({ parish, updates: { monthly_emitemwa_amount: monthlyAmount } }));
  changes.push({ parish: bugonga, updates: { name: bugonga.name.trim().replace(/^bugongo/i, "Bugonga") } });
  const pending = changes.filter(({ parish, updates }) => Object.entries(updates).some(
    ([field, value]) => field === "monthly_emitemwa_amount" ? Number(parish[field]) !== value || parish[field] === null : parish[field] !== value,
  ));
  console.log(JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    before: [...rateParishes, bugonga].map(describe),
    pending: pending.map(({ parish, updates }) => ({ id: parish.id, name: parish.name, updates })),
  }, null, 2));
  if (!apply) return;

  for (const { parish, updates } of pending) {
    let update = supabase.from("parishes").update(updates).eq("id", parish.id).eq("name", parish.name);
    if ("monthly_emitemwa_amount" in updates) {
      update = parish.monthly_emitemwa_amount === null
        ? update.is("monthly_emitemwa_amount", null)
        : update.eq("monthly_emitemwa_amount", parish.monthly_emitemwa_amount);
    }
    const updated = requireData(`Update ${parish.name}`, await update.select("id").single());
    if (updated.id !== parish.id) throw new Error(`Update confirmation failed for ${parish.name}.`);
  }

  const verified = requireData("Verify saved parishes", await supabase.from("parishes").select(columns).in("id", changes.map(({ parish }) => parish.id)));
  for (const { parish, updates } of changes) {
    const saved = verified.find((item) => item.id === parish.id);
    if (!saved || Object.entries(updates).some(([field, value]) => (
      field === "monthly_emitemwa_amount" ? Number(saved[field]) !== value || saved[field] === null : saved[field] !== value
    ))) throw new Error(`Saved value verification failed for ${parish.name}.`);
    for (const field of ["code", "archdiocese_id", "deanery_id", "vicariate_id", "good_samaritan_day_amount"]) {
      if (saved[field] !== parish[field]) throw new Error(`Unexpected ${field} change for ${parish.name}.`);
    }
  }
  console.log(JSON.stringify({ verified: true, after: verified.map(describe), updatedParishes: pending.length }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
