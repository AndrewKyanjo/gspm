import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const SOURCE_LABEL = "legacy_ledger_2026_07_15";
const SNAPSHOT_YEAR = 2026;

const legacyRows = [
  ["Bbiina", 300000, 300000],
  ["Bbuto", 0, 600000],
  ["Bugonga", 0, 600000],
  ["Bujuuko", 0, 360000],
  ["Bulo", 0, 360000],
  ["Buloba", 240000, 520000],
  ["Bunnamwaya", 250000, 350000],
  ["Busega", 200000, 400000],
  ["Buyege", 0, 600000],
  ["Bwayise", 0, 600000],
  ["Bweyogerere", 0, 100000],
  ["Christ the King", 0, 600000],
  ["Ggaba", 600000, 0],
  ["Ggayaaza", 300000, 300000],
  ["Ggoli", 30000, 330000],
  ["Ggombe", 125000, 235000],
  ["Jjanya", 200000, 160000],
  ["Jinja-Kaloli", 600000, 0],
  ["Kabulamuliro", 0, 600000],
  ["Kamuli", 100000, 500000],
  ["Kamwokya", 300000, 300000],
  ["Kankobe", 30000, 330000],
  ["Kansanga", 0, 600000],
  ["Kanyanya", 0, 600000],
  ["Kasenge", 150000, 450000],
  ["Katende", 360000, 0],
  ["Kawanda", 0, 600000],
  ["Kibanga", 0, 360000],
  ["Kibibi", 70000, 290000],
  ["Kibiri", 0, 600000],
  ["Kibuye Makindye", 0, 600000],
  ["Kigoowa", 200000, 400000],
  ["Kireka", 0, 600000],
  ["Kisubi", 0, 600000],
  ["Kitagobwa", 150000, 450000],
  ["Kitakyusa", 90000, 270000],
  ["Kiwatule", 600000, 0],
  ["Kiziba", 150000, 210000],
  ["Kkonge Lukuli", 600000, 0],
  ["Kkonge Mpigi", 80000, 280000],
  ["Kyengera", 600000, 0],
  ["Lubaga", 1720000, 0],
  ["Lweza", 175000, 425000],
  ["Mapeera", 0, 600000],
  ["Masajja", 0, 600000],
  ["Matugga", 160000, 440000],
  ["Mbuya", 0, 600000],
  ["Migadde", 0, 360000],
  ["Mitala Maria", 0, 360000],
  ["Mmengo Kisenyi", 0, 600000],
  ["Mpala", 0, 300000],
  ["Mpigi", 180000, 180000],
  ["Muduuma", 0, 360000],
  ["Mulago", 210000, 390000],
  ["Munyonyo", 0, 600000],
  ["Mutundwe", 0, 600000],
  ["Mwereerwe", 250000, 350000],
  ["Nabbingo", 200000, 400000],
  ["Nabitalo", 300000, 300000],
  ["Naddangira", 0, 600000],
  ["Naggulu", 0, 600000],
  ["Nakawuka", 0, 600000],
  ["Nakulabye", 270000, 330000],
  ["Namasuba", 300000, 300000],
  ["Namayumba", 30000, 330000],
  ["Namugongo", 0, 600000],
  ["Nansana", 600000, 0],
  ["Ndeeba", 0, 600000],
  ["Ndejje", 150000, 450000],
  ["Nkozi", 0, 600000],
  ["Nsambya", 300000, 300000],
  ["Ntinda", 600000, 0],
  ["Old Kampala", 0, 600000],
  ["Salaama", 100000, 500000],
  ["Wakiso", 600000, 0],
];

const aliases = new Map([
  ["bugonga", "bugongo"],
  ["bwayise", "bwayiise"],
  ["jinjakaloli", "jjinjakalooli"],
  ["mapeera", "mapeeranabulagala"],
]);

const missingParishes = [
  ["Kasenge Parish", "PAR-KASENGE", "Nabbingo Deanery"],
  ["Kibibi Parish", "PAR-KIBIBI", "Mitala Maria Deanery"],
  ["Mpigi Parish", "PAR-MPIGI", "Mpigi Deanery"],
  ["Salaama Parish", "PAR-SALAAMA", "Nsambya Deanery"],
];

function loadEnv() {
  for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index > 0) {
      process.env[line.slice(0, index)] = line.slice(index + 1);
    }
  }
}

function key(value) {
  return String(value)
    .toLowerCase()
    .replace(/\bparish\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function requireNoError(label, result) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function main() {
  loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase URL or service role key in .env.local");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const vicariates = requireNoError(
    "Load vicariates",
    await supabase.from("vicariates").select("id,name,monthly_emitemwa_amount,good_samaritan_day_amount"),
  );

  for (const vicariate of vicariates) {
    const isMitala = key(vicariate.name).includes("mitalamaria") || key(vicariate.name).includes("mitlaamaria");
    const expectedMonthly = isMitala ? 30000 : 50000;
    const expectedGoodSamaritan = isMitala ? 150000 : 250000;

    if (
      Number(vicariate.monthly_emitemwa_amount) !== expectedMonthly ||
      Number(vicariate.good_samaritan_day_amount) !== expectedGoodSamaritan
    ) {
      requireNoError(
        `Update ${vicariate.name} rates`,
        await supabase
          .from("vicariates")
          .update({
            monthly_emitemwa_amount: expectedMonthly,
            good_samaritan_day_amount: expectedGoodSamaritan,
          })
          .eq("id", vicariate.id),
      );
    }
  }

  const archdioceses = requireNoError(
    "Load archdioceses",
    await supabase.from("archdioceses").select("id,name").order("name").limit(1),
  );
  const archdiocese = archdioceses[0];
  if (!archdiocese) {
    throw new Error("No archdiocese record found");
  }

  const deaneries = requireNoError(
    "Load deaneries",
    await supabase.from("deaneries").select("id,name,vicariate_id"),
  );
  const deaneryByName = new Map(deaneries.map((deanery) => [deanery.name, deanery]));

  let parishes = requireNoError(
    "Load parishes",
    await supabase.from("parishes").select("id,name,vicariate_id,deanery_id,archdiocese_id"),
  );

  const existingParishKeys = new Set(parishes.map((parish) => key(parish.name)));
  const parishesToInsert = [];
  for (const [name, code, deaneryName] of missingParishes) {
    if (existingParishKeys.has(key(name))) {
      continue;
    }

    const deanery = deaneryByName.get(deaneryName);
    if (!deanery) {
      throw new Error(`Missing deanery needed for ${name}: ${deaneryName}`);
    }

    parishesToInsert.push({
      archdiocese_id: archdiocese.id,
      vicariate_id: deanery.vicariate_id,
      deanery_id: deanery.id,
      name,
      code,
      status: "active",
    });
  }

  if (parishesToInsert.length > 0) {
    requireNoError("Insert missing parishes", await supabase.from("parishes").insert(parishesToInsert));
    parishes = requireNoError(
      "Reload parishes",
      await supabase.from("parishes").select("id,name,vicariate_id,deanery_id,archdiocese_id"),
    );
  }

  const parishByKey = new Map();
  for (const parish of parishes) {
    parishByKey.set(key(parish.name), parish);
  }

  const matched = [];
  const reviewRows = [];
  const unmatched = [];

  for (const [sourceName, paidAmount, balanceAmount] of legacyRows) {
    const sourceKey = key(sourceName);
    const parish = parishByKey.get(aliases.get(sourceKey) ?? sourceKey);

    if (!parish) {
      unmatched.push(sourceName);
      reviewRows.push({
        source_parish_name: sourceName,
        snapshot_year: SNAPSHOT_YEAR,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        source_label: SOURCE_LABEL,
        review_status: "needs_review",
      });
      continue;
    }

    matched.push({
      parish_id: parish.id,
      source_parish_name: sourceName,
      snapshot_year: SNAPSHOT_YEAR,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      currency: "UGX",
      source_label: SOURCE_LABEL,
    });

    reviewRows.push({
      source_parish_name: sourceName,
      snapshot_year: SNAPSHOT_YEAR,
      paid_amount: paidAmount,
      balance_amount: balanceAmount,
      source_label: SOURCE_LABEL,
      suggested_parish_id: parish.id,
      suggested_parish_name: parish.name,
      similarity_score: 1,
      review_status: "linked",
    });
  }

  if (matched.length > 0) {
    requireNoError(
      "Upsert legacy opening balances",
      await supabase.from("contribution_legacy_opening_balances").upsert(matched, {
        onConflict: "parish_id,source_label",
      }),
    );
  }

  if (reviewRows.length > 0) {
    requireNoError(
      "Upsert legacy import review rows",
      await supabase.from("contribution_legacy_import_review").upsert(reviewRows, {
        onConflict: "source_parish_name,source_label",
      }),
    );
  }

  const legacyCountResult = await supabase
    .from("contribution_legacy_opening_balances")
    .select("id", { count: "exact", head: true })
    .eq("source_label", SOURCE_LABEL);
  requireNoError("Count legacy opening balances", legacyCountResult);

  console.log(
    JSON.stringify(
      {
        updatedRates: true,
        insertedMissingParishes: parishesToInsert.map((parish) => parish.name),
        matchedLegacyRows: matched.length,
        unmatchedLegacyRows: unmatched,
        totalLegacyOpeningRows: legacyCountResult.count,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
