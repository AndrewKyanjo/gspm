/* eslint-disable @typescript-eslint/no-require-imports -- The harness executes server TypeScript with isolated CommonJS dependency stubs. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const ids = {
  arch: "11111111-1111-4111-8111-111111111111",
  otherArch: "22222222-2222-4222-8222-222222222222",
  parish: "33333333-3333-4333-8333-333333333333",
  deanery: "44444444-4444-4444-8444-444444444444",
  otherDeanery: "55555555-5555-4555-8555-555555555555",
  vicariate: "66666666-6666-4666-8666-666666666666",
  otherVicariate: "77777777-7777-4777-8777-777777777777",
};

function fixture() {
  return {
    archdioceses: [{ id: ids.arch, status: "active" }, { id: ids.otherArch, status: "active" }],
    vicariates: [
      { id: ids.vicariate, archdiocese_id: ids.arch, status: "active" },
      { id: ids.otherVicariate, archdiocese_id: ids.otherArch, status: "active" },
    ],
    deaneries: [
      { id: ids.deanery, archdiocese_id: ids.arch, vicariate_id: ids.vicariate, status: "active" },
      { id: ids.otherDeanery, archdiocese_id: ids.otherArch, vicariate_id: ids.otherVicariate, status: "active" },
    ],
    parishes: [{ id: ids.parish, name: "Bugongo", archdiocese_id: ids.arch, vicariate_id: ids.vicariate, deanery_id: ids.deanery }],
  };
}

function access(overrides = {}) {
  return { role: "archdiocese_admin", level: "archdiocese", archdioceseId: ids.arch, approved: true, active: true, ...overrides };
}

function form(overrides = {}) {
  const data = new FormData();
  for (const [field, value] of Object.entries({
    parishId: ids.parish, name: " Bugonga ", archdioceseId: ids.arch, deaneryId: ids.deanery,
    monthlyEmitemwaAmount: "30000", goodSamaritanDayAmount: "", ...overrides,
  })) {
    if (value !== undefined) data.set(field, value);
  }
  return data;
}

function assertWriteValues(actual, expected) {
  const { updated_at: updatedAt, ...values } = actual;
  assert.ok(Number.isFinite(Date.parse(updatedAt)), "A save must set a valid update timestamp");
  assert.deepEqual(values, expected);
}
function harness({ tables = fixture(), context = access(), beforeUpdate, writeError, readiness = { data: true, error: null } } = {}) {
  const writes = [];
  const authCalls = [];
  const revalidations = [];
  const rpcCalls = [];
  let databaseCalls = 0;
  const supabase = {
    rpc(functionName, args) {
      assert.equal(functionName, "parish_hierarchy_transfer_ready");
      rpcCalls.push({ functionName, args });
      return Promise.resolve(readiness);
    },
    from(table) {
      databaseCalls++;
      assert.ok(Object.hasOwn(tables, table), `Unexpected table: ${table}`);
      const filters = [];
      let updates = null;
      let fields = "*";
      let single = false;
      const query = {
        select(columns) { fields = columns; return query; },
        eq(column, value) { filters.push([column, value]); return query; },
        update(values) { updates = values; return query; },
        maybeSingle() { single = true; return query; },
        then(resolve, reject) {
          if (updates && beforeUpdate) beforeUpdate(tables);
          if (updates && writeError) return Promise.resolve({ data: null, error: writeError }).then(resolve, reject);
          const rows = tables[table].filter((row) => filters.every(([column, value]) => row[column] === value));
          if (updates) {
            for (const row of rows) {
              writes.push({ table, values: { ...updates }, filters: [...filters] });
              Object.assign(row, updates);
            }
          }
          const projected = fields === "*" ? rows : rows.map((row) => Object.fromEntries(fields.split(",").map((column) => [column.trim(), row[column.trim()]])));
          return Promise.resolve({ data: single ? projected[0] ?? null : projected, error: null }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const modules = new Map();
  const files = {
    management: "src/features/archdiocese/parish-management.ts",
    parishActions: "src/features/archdiocese/parish-actions.ts",
    contributionActions: "src/features/contributions/actions.ts",
    "./rates": "src/features/contributions/rates.ts",
    "./calculations": "src/features/contributions/calculations.ts",
  };
  function loadModule(id) {
    if (id === "./parish-management" || id === "@/features/archdiocese/parish-management") id = "management";
    if (id === "server-only") return {};
    if (id === "@/lib/supabase/admin") return { createAdminClient: () => supabase };
    if (id === "@/lib/auth/requireAuth") return { requireAuth: async (options) => { authCalls.push(options); return context; } };
    if (id === "next/cache") return { revalidatePath: (...args) => revalidations.push(args) };
    if (id === "next/navigation") return { redirect: (url) => { const error = new Error("redirect"); error.destination = url; throw error; } };
    if (id === "@/lib/permissions/access") return { canProxyEnterForScope: () => { throw new Error("Unexpected contribution permission check"); } };
    if (modules.has(id)) return modules.get(id);
    assert.ok(files[id], `Unexpected import: ${id}`);
    const filename = path.resolve(__dirname, "..", files[id]);
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const loadedModule = { exports: {} };
    modules.set(id, loadedModule.exports);
    new Function("require", "exports", "module", compiled)(loadModule, loadedModule.exports, loadedModule);
    return loadedModule.exports;
  }
  return { tables, context, writes, authCalls, revalidations, rpcCalls, databaseCalls: () => databaseCalls, ...loadModule("management"), ...loadModule("parishActions"), ...loadModule("contributionActions") };
}

test("parish edits reject disallowed roles, lower levels, unapproved/inactive and missing scope before any database call", async () => {
  for (const overrides of [
    { role: "archdiocese_data_entry" }, { role: "parish_head" }, { level: "deanery" },
    { approved: false }, { active: false }, { archdioceseId: null },
  ]) {
    const state = harness({ context: access(overrides) });
    assert.match((await state.saveParishDetails(state.context, form())).error, /permission/);
    assert.equal(state.databaseCalls(), 0);
  }
});

test("parish and destination UUIDs and invalid numeric rates are rejected without mutation", async () => {
  for (const overrides of [
    { parishId: "not-a-uuid" }, { parishId: "" }, { archdioceseId: "not-a-uuid" }, { deaneryId: "bad" },
    ...["-1", "1e3", "Infinity", "NaN", "10000000000", "1.001", "12,000"].map((monthlyEmitemwaAmount) => ({ monthlyEmitemwaAmount })),
    { monthlyEmitemwaAmount: undefined }, { goodSamaritanDayAmount: "-1" },
  ]) {
    const state = harness();
    assert.ok((await state.saveParishDetails(state.context, form(overrides))).error, JSON.stringify(overrides));
    assert.equal(state.writes.length, 0);
  }
});

test("source parish must belong to the administrator's current archdiocese, including super administrators", async () => {
  for (const role of ["archdiocese_admin", "super_admin"]) {
    const state = harness({ context: access({ role, archdioceseId: ids.otherArch }) });
    assert.match((await state.saveParishDetails(state.context, form())).error, /not found in your archdiocese/);
    assert.equal(state.writes.length, 0);
  }
});

test("ordinary administrator cannot transfer a parish to another archdiocese", async () => {
  const state = harness();
  const result = await state.saveParishDetails(state.context, form({ archdioceseId: ids.otherArch, deaneryId: ids.otherDeanery }));
  assert.match(result.error, /Only a super administrator/);
  assert.equal(state.writes.length, 0);
});

test("super administrator still cannot choose a deanery or vicariate belonging to another archdiocese", async () => {
  const state = harness({ context: access({ role: "super_admin" }) });
  assert.match((await state.saveParishDetails(state.context, form({ archdioceseId: ids.otherArch, deaneryId: ids.deanery }))).error, /deanery must belong/);
  state.tables.deaneries[1].vicariate_id = ids.vicariate;
  assert.match((await state.saveParishDetails(state.context, form({ archdioceseId: ids.otherArch, deaneryId: ids.otherDeanery }))).error, /invalid vicariate/);
  assert.equal(state.writes.length, 0);
});

test("valid transfer derives the vicariate from the selected deanery and ignores forged submitted hierarchy data", async () => {
  const state = harness({ context: access({ role: "super_admin" }) });
  const result = await state.saveParishDetails(state.context, form({
    archdioceseId: ids.otherArch, deaneryId: ids.otherDeanery, vicariateId: ids.vicariate, role: "super_admin",
  }));
  assert.equal(result.error, null);
  assert.equal(result.archdioceseId, ids.otherArch);
  assertWriteValues(state.writes[0].values, {
    name: "Bugonga", archdiocese_id: ids.otherArch, vicariate_id: ids.otherVicariate, deanery_id: ids.otherDeanery,
    monthly_emitemwa_amount: 30000, good_samaritan_day_amount: null,
  });
});

test("transfers reject any inactive destination hierarchy entity", async () => {
  for (const table of ["archdioceses", "vicariates", "deaneries"]) {
    const tables = fixture();
    tables[table][1].status = "inactive";
    const state = harness({ tables, context: access({ role: "super_admin" }) });
    const result = await state.saveParishDetails(state.context, form({ archdioceseId: ids.otherArch, deaneryId: ids.otherDeanery }));
    assert.match(result.error, /active archdiocese, vicariate and deanery/);
    assert.equal(state.writes.length, 0);
  }
});

test("rates-only path accepts zero, blank inheritance and the largest numeric(12,2) value without changing name or hierarchy", async () => {
  const state = harness();
  assert.equal((await state.saveParishDetails(state.context, form({ monthlyEmitemwaAmount: "0", goodSamaritanDayAmount: " " }), true)).error, null);
  assertWriteValues(state.writes[0].values, { monthly_emitemwa_amount: 0, good_samaritan_day_amount: null });
  assert.equal(state.tables.parishes[0].name, "Bugongo");
  assert.equal((await state.saveParishDetails(state.context, form({ monthlyEmitemwaAmount: "", goodSamaritanDayAmount: "9999999999.99" }), true)).error, null);
  assertWriteValues(state.writes[1].values, { monthly_emitemwa_amount: null, good_samaritan_day_amount: 9999999999.99 });
});

test("a concurrent hierarchy change cannot return a successful update", async () => {
  const state = harness({ beforeUpdate: (tables) => { tables.parishes[0].deanery_id = ids.otherDeanery; } });
  const result = await state.saveParishDetails(state.context, form());
  assert.match(result.error, /changed while you were editing/);
  assert.equal(state.writes.length, 0);
  assert.equal(state.tables.parishes[0].name, "Bugongo");
});

test("duplicate and other database errors return bounded user messages without raw database details", async () => {
  for (const [code, expected] of [["23505", /already exists/], ["XX000", /Could not save/]]) {
    const state = harness({ writeError: { code, message: "sensitive database details" } });
    const result = await state.saveParishDetails(state.context, form());
    assert.match(result.error, expected);
    assert.doesNotMatch(result.error, /sensitive/);
    assert.equal(state.writes.length, 0);
  }
});

test("new editor and existing rates action both authenticate and use the same scoped save path", async () => {
  for (const action of ["updateParish", "updateParishContributionRates"]) {
    const state = harness();
    const result = await state[action]({}, form());
    assert.deepEqual(state.authCalls, [{ roles: ["super_admin", "archdiocese_admin"] }]);
    assert.equal(state.writes.length, 1);
    assert.deepEqual(state.revalidations[0], ["/dashboard", "layout"]);
    if (action === "updateParish") assert.equal(result.status, "success");
    else assert.equal(result.error, null);

    const denied = harness({ context: access({ archdioceseId: ids.otherArch }) });
    const deniedResult = await denied[action]({}, form());
    assert.equal(denied.writes.length, 0);
    assert.equal(denied.revalidations.length, 0);
    if (action === "updateParish") assert.equal(deniedResult.status, "error");
    else assert.ok(deniedResult.error);
  }
});

test("a completed cross-archdiocese move redirects the editor away from the old detail page", async () => {
  const state = harness({ context: access({ role: "super_admin" }) });
  await assert.rejects(state.updateParish({}, form({ archdioceseId: ids.otherArch, deaneryId: ids.otherDeanery })),
    (error) => error.destination === "/dashboard/archdiocese/parishes");
  assert.equal(state.writes.length, 1);
});
test("hierarchy transfers require an installed, verifiable database migration before any mutation", async () => {
  for (const readiness of [
    { data: false, error: null },
    { data: null, error: null },
    { data: null, error: { message: "RPC unavailable" } },
  ]) {
    for (const crossArchdiocese of [true, false]) {
      const tables = fixture();
      if (!crossArchdiocese) {
        tables.deaneries[1].archdiocese_id = ids.arch;
        tables.deaneries[1].vicariate_id = ids.vicariate;
      }
      const state = harness({ tables, context: access({ role: "super_admin" }), readiness });
      const result = await state.saveParishDetails(state.context, form({
        archdioceseId: crossArchdiocese ? ids.otherArch : ids.arch, deaneryId: ids.otherDeanery,
      }));
      assert.match(result.error, /database update/);
      assert.equal(state.rpcCalls.length, 1);
      assert.equal(state.writes.length, 0);
      assert.equal(state.tables.parishes[0].name, "Bugongo");
      assert.equal(state.tables.parishes[0].deanery_id, ids.deanery);
    }
  }
});

test("name and rate edits do not depend on the hierarchy migration readiness function", async () => {
  for (const ratesOnly of [true, false]) {
    const state = harness({ readiness: { data: null, error: { message: "RPC unavailable" } } });
    const result = await state.saveParishDetails(state.context, form(), ratesOnly);
    assert.equal(result.error, null);
    assert.equal(state.writes.length, 1);
    assert.equal(state.rpcCalls.length, 0);
  }
});