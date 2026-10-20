/* eslint-disable @typescript-eslint/no-require-imports -- The harness executes server TypeScript with isolated CommonJS dependency stubs. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

// Execute the production TypeScript queries with an in-memory Supabase client.
// Projection is intentional: a missing rate column in SELECT must fail a test.
function loadQueries(tables) {
  const supabase = {
    from(table) {
      assert.ok(Object.hasOwn(tables, table), `Unexpected table: ${table}`);
      let fields = "*";
      let rows = tables[table].map((row) => ({ ...row }));
      let single = false;
      const query = {
        select(columns) { fields = columns; return query; },
        eq(column, value) { rows = rows.filter((row) => row[column] === value); return query; },
        in(column, values) { rows = rows.filter((row) => values.includes(row[column])); return query; },
        order(column, options = {}) {
          rows.sort((a, b) => String(a[column]).localeCompare(String(b[column])) * (options.ascending === false ? -1 : 1));
          return query;
        },
        limit(count) { rows = rows.slice(0, count); return query; },
        maybeSingle() { single = true; return query; },
        then(resolve, reject) {
          const projected = fields === "*" ? rows : rows.map((row) => Object.fromEntries(
            fields.split(",").map((column) => [column.trim(), row[column.trim()]]),
          ));
          return Promise.resolve({ data: single ? projected[0] ?? null : projected, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const modules = new Map();
  const files = {
    "./rates": "src/features/contributions/rates.ts",
    "./calculations": "src/features/contributions/calculations.ts",
    "@/lib/db/queries/hierarchy": "src/lib/db/queries/hierarchy.ts",
    queries: "src/features/contributions/queries.ts",
  };
  function loadModule(id) {
    if (id === "@/lib/supabase/admin") return { createAdminClient: () => supabase };
    if (modules.has(id)) return modules.get(id);
    assert.ok(files[id], `Unexpected import: ${id}`);
    const filename = path.resolve(__dirname, "..", files[id]);
    const source = fs.readFileSync(filename, "utf8");
    const compiled = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const loadedModule = { exports: {} };
    modules.set(id, loadedModule.exports);
    new Function("require", "exports", "module", compiled)(loadModule, loadedModule.exports, loadedModule);
    return loadedModule.exports;
  }
  return { ...loadModule("queries"), ...loadModule("./rates") };
}

function parish(id, overrides = {}) {
  return {
    id, name: id, archdiocese_id: "arch-1", vicariate_id: "vic-1", deanery_id: "dean-1",
    monthly_emitemwa_amount: null, good_samaritan_day_amount: null, ...overrides,
  };
}

function fixture(parishes = [parish("Namayumba", { monthly_emitemwa_amount: "30000", good_samaritan_day_amount: "100000" })]) {
  return {
    archdioceses: [{ id: "arch-1", name: "Archdiocese" }],
    vicariates: [{ id: "vic-1", name: "Vicariate", archdiocese_id: "arch-1", monthly_emitemwa_amount: 50000, good_samaritan_day_amount: 250000 }],
    deaneries: [{ id: "dean-1", name: "Deanery", archdiocese_id: "arch-1", vicariate_id: "vic-1" }],
    parishes,
    emitemwa_payments: [],
    contribution_legacy_opening_balances: [],
    contribution_projects: [],
  };
}

function legacy(parishId, paid = 90000, balance = 510000, surplus = 0) {
  return { parish_id: parishId, source_parish_name: parishId, paid_amount: paid, balance_amount: balance, surplus_amount: surplus, snapshot_year: 2026, imported_at: "2026-01-01" };
}

function payment(parishId, kind, amount) {
  return { id: `${parishId}-${kind}`, parish_id: parishId, payment_kind: kind, amount, contribution_year: 2026, contribution_month: kind === "monthly" ? 1 : null, paid_on: "2026-01-20" };
}

test("rates use parish, vicariate, then defaults; zero is an override and blanks inherit", () => {
  const { resolveContributionRates } = loadQueries(fixture());
  const vicariate = { monthly_emitemwa_amount: "50000", good_samaritan_day_amount: "250000" };
  assert.deepEqual(resolveContributionRates({ monthly_emitemwa_amount: "30000", good_samaritan_day_amount: "100000" }, vicariate), { monthlyRate: 30000, goodSamaritanRate: 100000 });
  assert.deepEqual(resolveContributionRates({ monthly_emitemwa_amount: 0, good_samaritan_day_amount: "0" }, vicariate), { monthlyRate: 0, goodSamaritanRate: 0 });
  assert.deepEqual(resolveContributionRates({ monthly_emitemwa_amount: " ", good_samaritan_day_amount: null }, vicariate), { monthlyRate: 50000, goodSamaritanRate: 250000 });
  assert.deepEqual(resolveContributionRates(null, null), { monthlyRate: 50000, goodSamaritanRate: 250000 });
  assert.deepEqual(resolveContributionRates({ monthly_emitemwa_amount: "invalid", good_samaritan_day_amount: -1 }, {}), { monthlyRate: 50000, goodSamaritanRate: 250000 });
});

test("parish dashboard applies 30,000 monthly / 360,000 annual override and retains legacy credits", async () => {
  const tables = fixture();
  tables.contribution_legacy_opening_balances.push(legacy("Namayumba"));
  tables.emitemwa_payments.push(payment("Namayumba", "monthly", 30000));
  const result = await loadQueries(tables).getParishContributionDashboard("Namayumba", 2026);
  assert.equal(result.monthlyRate, 30000);
  assert.equal(result.monthlyAnnualDue, 360000);
  assert.equal(result.monthlyPaidTotal, 120000);
  assert.equal(result.monthlyAnnualBalance, 240000);
  assert.equal(result.goodSamaritan.due, 100000);
  assert.equal(result.legacyOpeningBalance.paidAmount, 90000);
  assert.ok(result.months.every((month) => month.due === 30000));
  assert.equal(result.months[0].status, "paid");
});

test("inherited annual obligation uses the current monthly rate while retaining imported payment and balance data", async () => {
  const tables = fixture([parish("Inherited")]);
  tables.contribution_legacy_opening_balances.push(legacy("Inherited", 90000, 390000));
  const result = await loadQueries(tables).getParishContributionDashboard("Inherited", 2026);
  assert.equal(result.monthlyRate, 50000);
  assert.equal(result.monthlyAnnualDue, 600000);
  assert.equal(result.monthlyAnnualBalance, 510000);
  assert.equal(result.legacyOpeningBalance.balanceAmount, 390000);
});

test("rollup uses selected parish rates, inherited defaults and zero rates in annual totals", async () => {
  const tables = fixture([
    parish("Namayumba", { monthly_emitemwa_amount: 30000, good_samaritan_day_amount: 100000 }),
    parish("Naddangira", { monthly_emitemwa_amount: "30000" }),
    parish("Inherited"),
    parish("Zero", { monthly_emitemwa_amount: 0, good_samaritan_day_amount: 0 }),
  ]);
  tables.contribution_legacy_opening_balances.push(legacy("Namayumba"), legacy("Zero", 0, 600000));
  tables.emitemwa_payments.push(payment("Namayumba", "monthly", 30000));
  const result = await loadQueries(tables).getContributionRollupReport({ scope: { archdioceseId: "arch-1" }, year: 2026, month: 1 });
  const rows = new Map(result.rows.map((row) => [row.parishName, row]));
  assert.equal(rows.get("Namayumba").monthlyDue, 30000);
  assert.equal(rows.get("Namayumba").annualDue, 360000);
  assert.equal(rows.get("Namayumba").annualBalance, 240000);
  assert.equal(rows.get("Naddangira").annualDue, 360000);
  assert.equal(rows.get("Inherited").annualDue, 600000);
  assert.equal(rows.get("Zero").annualDue, 0);
  assert.equal(rows.get("Zero").goodSamaritanDue, 0);
  assert.equal(result.totals.annualDue, 1320000);
  assert.equal(result.totals.ytdPaid, 120000);
  assert.equal(result.totals.goodSamaritanDue, 600000);
});

test("excess calculation uses parish annual override and includes legacy paid amounts", async () => {
  const tables = fixture();
  tables.contribution_legacy_opening_balances.push(legacy("Namayumba"));
  tables.emitemwa_payments.push(payment("Namayumba", "monthly", 300000), payment("Namayumba", "good_samaritan_day", 100000));
  const results = await loadQueries(tables).getExcessParishes("arch-1", 2026);
  assert.equal(results.length, 1);
  assert.equal(results[0].annualEmitemwaDue, 360000);
  assert.equal(results[0].combinedDue, 460000);
  assert.equal(results[0].totalPaid, 490000);
  assert.equal(results[0].excess, 30000);
});

test("dashboard without parish or vicariate rates uses standard annual defaults", async () => {
  const tables = fixture([parish("Default")]);
  tables.vicariates[0].monthly_emitemwa_amount = null;
  tables.vicariates[0].good_samaritan_day_amount = null;
  const result = await loadQueries(tables).getParishContributionDashboard("Default", 2026);
  assert.equal(result.monthlyAnnualDue, 600000);
  assert.equal(result.goodSamaritan.due, 250000);
});
test("vicariate and deanery scoped reports resolve parent rows by their primary ids", async () => {
  for (const scope of [{ archdioceseId: "arch-1", vicariateId: "vic-1" }, { archdioceseId: "arch-1", deaneryId: "dean-1" }]) {
    const tables = fixture([parish("Inherited")]);
    tables.vicariates[0].monthly_emitemwa_amount = 45000;
    const result = await loadQueries(tables).getContributionRollupReport({ scope, year: 2026, month: 1 });
    assert.equal(result.rows[0].monthlyDue, 45000);
    assert.equal(result.rows[0].annualDue, 540000);
    assert.equal(result.rows[0].vicariateName, "Vicariate");
    assert.equal(result.rows[0].deaneryName, "Deanery");
    assert.equal(result.scopeLabel, scope.vicariateId ? "Vicariate" : "Deanery");
  }
});
test("legacy surplus and monthly excess pay Good Samaritan Day consistently across dashboard and rollup", async () => {
  const tables = fixture();
  tables.contribution_legacy_opening_balances.push(legacy("Namayumba", 300000, 60000, 50000));
  tables.emitemwa_payments.push(payment("Namayumba", "monthly", 80000), payment("Namayumba", "good_samaritan_day", 20000));
  const queries = loadQueries(tables);
  const dashboard = await queries.getParishContributionDashboard("Namayumba", 2026);
  assert.equal(dashboard.monthlyAnnualDue, 360000);
  assert.equal(dashboard.monthlyPaidTotal, 360000);
  assert.equal(dashboard.monthlyAnnualBalance, 0);
  assert.equal(dashboard.goodSamaritan.recordedDirectly, 20000);
  assert.equal(dashboard.goodSamaritan.allocatedFromEmitemwaExcess, 70000);
  assert.equal(dashboard.goodSamaritan.paid, 90000);
  assert.equal(dashboard.goodSamaritan.balance, 10000);
  assert.equal(dashboard.surplus, 0);
  assert.equal(dashboard.legacyOpeningBalance.surplusAmount, 50000);

  const report = await queries.getContributionRollupReport({ scope: { archdioceseId: "arch-1" }, year: 2026, month: 1 });
  const row = report.rows[0];
  assert.equal(row.legacySurplus, 50000);
  assert.equal(row.ytdPaid, 360000);
  assert.equal(row.totalRecorded, 450000);
  assert.equal(row.goodSamaritanRecorded, 20000);
  assert.equal(row.emitemwaExcessAllocated, 70000);
  assert.equal(row.goodSamaritanPaid, 90000);
  assert.equal(row.surplus, 0);
  assert.equal(report.totals.totalRecorded, 450000);
  assert.equal(report.totals.goodSamaritanPaid, 90000);
  assert.equal(report.totals.surplus, 0);
  assert.deepEqual(await queries.getExcessParishes("arch-1", 2026), []);
});

test("all reports retain money beyond mandatory obligations as explicit surplus without inflating applied totals", async () => {
  const tables = fixture();
  tables.contribution_legacy_opening_balances.push(legacy("Namayumba", 300000, 60000, 50000));
  tables.emitemwa_payments.push(payment("Namayumba", "monthly", 100000), payment("Namayumba", "good_samaritan_day", 60000));
  const queries = loadQueries(tables);
  const dashboard = await queries.getParishContributionDashboard("Namayumba", 2026);
  assert.equal(dashboard.monthlyPaidTotal, 360000);
  assert.equal(dashboard.goodSamaritan.paid, 100000);
  assert.equal(dashboard.goodSamaritan.recordedDirectly, 60000);
  assert.equal(dashboard.goodSamaritan.allocatedFromEmitemwaExcess, 40000);
  assert.equal(dashboard.goodSamaritan.cleared, true);
  assert.equal(dashboard.surplus, 50000);

  const report = await queries.getContributionRollupReport({ scope: { archdioceseId: "arch-1" }, year: 2026, month: 1 });
  assert.equal(report.rows[0].totalRecorded, 510000);
  assert.equal(report.rows[0].ytdPaid, 360000);
  assert.equal(report.rows[0].goodSamaritanPaid, 100000);
  assert.equal(report.rows[0].surplus, 50000);
  assert.equal(report.totals.surplus, 50000);
  assert.equal(report.totals.totalRecorded, 510000);
  assert.equal(report.totals.ytdPaid, 360000);
  assert.equal(report.totals.goodSamaritanPaid, 100000);

  const excess = await queries.getExcessParishes("arch-1", 2026);
  assert.equal(excess.length, 1);
  assert.equal(excess[0].annualEmitemwaDue, 360000);
  assert.equal(excess[0].combinedDue, 460000);
  assert.equal(excess[0].totalPaid, 510000);
  assert.equal(excess[0].excess, 50000);
});

test("zero parish rates keep all recorded and legacy surplus funds available as surplus", async () => {
  const tables = fixture([parish("Zero", { monthly_emitemwa_amount: 0, good_samaritan_day_amount: 0 })]);
  tables.contribution_legacy_opening_balances.push(legacy("Zero", 90000, 510000, 10000));
  tables.emitemwa_payments.push(payment("Zero", "monthly", 30000), payment("Zero", "good_samaritan_day", 20000));
  const queries = loadQueries(tables);
  const dashboard = await queries.getParishContributionDashboard("Zero", 2026);
  assert.equal(dashboard.monthlyAnnualDue, 0);
  assert.equal(dashboard.monthlyPaidTotal, 0);
  assert.equal(dashboard.monthlyAnnualBalance, 0);
  assert.equal(dashboard.goodSamaritan.due, 0);
  assert.equal(dashboard.goodSamaritan.paid, 0);
  assert.equal(dashboard.goodSamaritan.cleared, true);
  assert.equal(dashboard.surplus, 150000);
  const report = await queries.getContributionRollupReport({ scope: { archdioceseId: "arch-1" }, year: 2026, month: 1 });
  assert.equal(report.rows[0].legacySurplus, 10000);
  assert.equal(report.totals.totalRecorded, 150000);
  assert.equal(report.totals.ytdPaid, 0);
  assert.equal(report.totals.surplus, 150000);
  const excess = await queries.getExcessParishes("arch-1", 2026);
  assert.equal(excess[0].combinedDue, 0);
  assert.equal(excess[0].totalPaid, 150000);
  assert.equal(excess[0].excess, 150000);
});