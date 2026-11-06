// verify-rls-list.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// verify-rls.mjs probes the tables in the access list (supabase/access.json), so a table the app reads that is not
// in the list is silently unchecked, and a key that nothing uses is a table checked for nothing. This test keeps the
// list, the code and the migrations in step, in every direction (Overload's verify-rls-tables.test.mjs and
// verify-rls-ahead.test.mjs, as one file):
//   - every literal .from('x') in src/ has a key
//   - every key without the `ahead` marker is used by a .from() or an embed in an app file of src/
//   - every key with `ahead` is used by nothing yet, and the test fails once a .from() or an embed names it, until the
//     marker goes (Decided 41): a table created before any code reads it, not a way to leave a key unused
//   - every `create table` / `create view` in supabase/migrations/ has a key, and every key is created there (SPEC
//     Rule 6: the key comes with the migration)
//   - dynamic .from(variable) calls are only the ones listed in KNOWN_DYNAMIC, by name: a table name the scan cannot
//     see needs a human to check what it can be given (Overload lists two; the starter has none)
//   - the fixture's own list and migration (scripts/verify-rls-fixture/) agree the same way
//
// S3 (TASKS.md): Overload's tests assumed twenty-odd tables and `.from()` calls; the starter has none (and, until the
// first app adds a screen, no `.from()` in src/ at all). So the tests assert the consistency (zero keys, zero
// .from(), zero create table, all at once), and every scanner is proven on fixture sources below: with everything
// empty, "zero" must not mean "the scanner is broken". A missing src/ reads as no files (the scanners below still
// run on their own sources); an src/ that has files is scanned.
//
// Embeds (Overload's parser, read from each app file's syntax tree so a comment never counts, and a test or a test
// utility never counts either) only ever keep a key alive: a string that holds `name(` is taken as a use of `name`,
// whatever it is, so the scan can excuse an unused key but never demand a key. Overload's `v2_apply_ops` op shapes
// are not lifted (the starter has no such RPC).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parseAccess } from './verify-rls.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

// Dynamic .from(variable) calls the test has been told about, as `file: .from(argument)`. None in the starter. An app
// that adds one writes it here after reading what the variable can hold (Overload: a union type that has literal
// .from() calls elsewhere, a queue item's table).
const KNOWN_DYNAMIC = [];

// ---- the scanners -----------------------------------------------------------------------------------------------

// .from('name'), .from("name") or .from(`name`), whitespace and newlines allowed. Array.from and Buffer.from take
// strings that are not tables, so they are excluded. (A call inside a comment counts, as in Overload.)
const LITERAL_FROM = /(?<!Array|Buffer)\.from\(\s*(['"`])([A-Za-z0-9_]+)\1\s*\)/g;
// .from(someIdentifier): the table name is not visible at the call site.
const DYNAMIC_FROM = /(?<!Array|Buffer)\.from\(\s*([A-Za-z_$][\w$.]*)\s*\)/g;
// PostgREST's resource embedding in a select string: `name(` or `name!hint(`, the name at the start of the string or
// after a space, a comma, a colon (an alias) or an opening parenthesis.
const EMBED = /(?:^|[\s,(:])([A-Za-z0-9_]+)\s*(?:!\s*[A-Za-z0-9_]+\s*)?\(/g;

const literalFroms = (text) => [...text.matchAll(LITERAL_FROM)].map((m) => m[2]);
const dynamicFroms = (text) => [...text.matchAll(DYNAMIC_FROM)].map((m) => m[1]);

// Every embedded table name in the string literals of one source file, read from its syntax tree.
function embedsIn(fileName, text) {
  const found = [];
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, false);
  const visit = (node) => {
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      for (const m of node.text.matchAll(EMBED)) found.push(m[1]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

// A test or a test utility is never an app file: a stand-in that names a table is not a use.
const isAppFile = (rel) => !/\.(test|testutil)\.|(^|[\\/])testing[\\/]/.test(rel);

// The tables and views a migration creates in the public schema (comments dropped first, so one that mentions
// `create table` does not count). Not temporary ones, and not another schema's (`create table auth.x`). An unquoted
// name is folded to lower case, as Postgres does.
const CREATE_RELATION =
  /\bcreate\s+(?:or\s+replace\s+)?(?:unlogged\s+)?(?:materialized\s+|recursive\s+)?(?:table|view)\s+(?:if\s+not\s+exists\s+)?(?:"?public"?\s*\.\s*)?(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*)\b)(?!\s*\.)/gi;
function createdRelations(sql) {
  const code = sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, '');
  return [...code.matchAll(CREATE_RELATION)].map((m) => m[1] ?? m[2].toLowerCase());
}

// ---- the check, as one function of what it is given -------------------------------------------------------------

const add = (map, key, value) => map.set(key, (map.get(key) ?? new Set()).add(value));

// access: parseAccess's entries; sources and migrations: [{ rel, text }]. Returns the problems, each tagged with the
// rule it breaks and phrased as what to do, plus what the scan found.
function checkList({ access, sources, migrations, knownDynamic = [] }) {
  const keys = new Map(access.map((entry) => [entry.table, entry]));
  const literal = new Map(); // table -> files with a literal .from() naming it (every source file, tests included)
  const embedded = new Map(); // table -> app files whose select strings embed it
  const dynamic = [];
  for (const { rel, text } of sources) {
    for (const name of literalFroms(text)) add(literal, name, rel);
    for (const arg of dynamicFroms(text)) dynamic.push(`${rel}: .from(${arg})`);
    if (isAppFile(rel)) for (const name of embedsIn(rel, text)) add(embedded, name, rel);
  }
  const created = new Map(); // table -> migrations creating it
  for (const { rel, text } of migrations) for (const name of createdRelations(text)) add(created, name, rel);

  const usedBy = (table) => [...(literal.get(table) ?? []), ...[...(embedded.get(table) ?? [])].map((f) => `${f} (embed)`)];
  const problems = [];
  const problem = (rule, message) => problems.push({ rule, message });

  for (const table of [...literal.keys()].sort()) {
    if (!keys.has(table)) {
      problem('from-without-key', `.from('${table}') in ${[...literal.get(table)].join(', ')} has no key in the access list: add "${table}": "own" | "signed-in" | "public"`);
    }
  }
  for (const [table, entry] of keys) {
    const uses = usedBy(table);
    if (!entry.ahead && uses.length === 0) {
      problem('key-unused', `"${table}" is in the access list but no .from() or embed in src/ uses it: remove the key, or mark it { "kind": "${entry.kind}", "ahead": true } if a migration creates it before any code reads it`);
    }
    if (entry.ahead && uses.length > 0) {
      problem('ahead-used', `"${table}" is marked ahead but ${uses.join(', ')} uses it: remove the ahead marker (Decided 41)`);
    }
    if (!created.has(table)) {
      problem('key-not-created', `"${table}" is in the access list but no migration creates it: add its \`create table\` (or \`create view\`) to supabase/migrations/, or remove the key`);
    }
  }
  for (const table of [...created.keys()].sort()) {
    if (!keys.has(table)) {
      problem('created-without-key', `${[...created.get(table)].join(', ')} creates "${table}", which has no key in the access list (SPEC Rule 6): add "${table}": "own" | "signed-in" | "public"`);
    }
  }
  for (const call of dynamic.filter((d) => !knownDynamic.includes(d)).sort()) {
    problem('dynamic-unknown', `${call}: a dynamic .from() hides its table name; check what the variable can be, then list the call in KNOWN_DYNAMIC`);
  }
  for (const call of knownDynamic.filter((d) => !dynamic.includes(d))) {
    problem('dynamic-stale', `KNOWN_DYNAMIC lists ${call}, which is no longer in src/: remove it`);
  }
  return { problems, keys, literal, embedded, created, dynamic };
}

const messages = (result, ...rules) => result.problems.filter((p) => rules.includes(p.rule)).map((p) => p.message);

// ---- the real tree ----------------------------------------------------------------------------------------------

function* walk(dir) {
  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) { if (entry !== 'node_modules') yield* walk(full); }
    else if (SOURCE_EXT.test(entry)) yield full;
  }
}
const readSources = (dir) => (existsSync(dir) ? [...walk(dir)] : []).map((file) => ({ rel: relative(root, file), text: readFileSync(file, 'utf8') }));
const readMigrations = (dir) =>
  (existsSync(dir) ? readdirSync(dir) : []).filter((f) => f.endsWith('.sql')).sort().map((f) => ({ rel: relative(root, join(dir, f)), text: readFileSync(join(dir, f), 'utf8') }));
const readAccess = (file) => parseAccess(JSON.parse(readFileSync(file, 'utf8')));

const appAccess = readAccess(join(root, 'supabase', 'access.json'));
const appSources = readSources(join(root, 'src'));
const appMigrations = readMigrations(join(root, 'supabase', 'migrations'));
const app = checkList({ access: appAccess, sources: appSources, migrations: appMigrations, knownDynamic: KNOWN_DYNAMIC });

test('the scan reads the source files of src/ when there is a src/', () => {
  // Guards against every check below passing because the walk found nothing (a wrong extension, a wrong folder).
  if (existsSync(join(root, 'src'))) assert.ok(appSources.length > 0, 'src/ exists but the scan read no source file');
  assert.ok(appSources.every((f) => f.rel.startsWith('src/')));
});

test('every table or view the app reads through .from() has a key in supabase/access.json', () => {
  assert.deepEqual(messages(app, 'from-without-key'), []);
});

test('every key without `ahead` is used by a .from() or an embed in src/', () => {
  assert.deepEqual(messages(app, 'key-unused'), []);
});

test('every key with `ahead` is used by nothing yet (Decided 41)', () => {
  assert.deepEqual(messages(app, 'ahead-used'), []);
});

test('every create table / create view in supabase/migrations/ has a key, and every key is created there', () => {
  assert.deepEqual(messages(app, 'created-without-key'), []);
  assert.deepEqual(messages(app, 'key-not-created'), []);
});

test('dynamic .from(variable) calls are only the known ones', () => {
  assert.deepEqual(messages(app, 'dynamic-unknown', 'dynamic-stale'), []);
});

test('the starter\'s counts agree with each other: zero keys, zero .from(), zero create table, all at once', (t) => {
  const counts = { keys: app.keys.size, from: app.literal.size, created: app.created.size, dynamic: app.dynamic.length };
  t.diagnostic(`keys ${counts.keys}, .from() names ${counts.from}, embedded names ${app.embedded.size}, created ${counts.created}, dynamic ${counts.dynamic}`);
  assert.deepEqual(app.problems, []);
  // Every key is created by a migration, and every table a migration creates has a key: the two counts are one.
  assert.equal(counts.keys, counts.created);
  // Nothing is read that is not listed.
  assert.ok(counts.from <= counts.keys, 'a .from() names a table with no key');
  // Zero keys means zero of everything else.
  if (counts.keys === 0) assert.deepEqual(counts, { keys: 0, from: 0, created: 0, dynamic: 0 });
});

test('the access lists are well formed: the app\'s and the fixture\'s', () => {
  assert.doesNotThrow(() => readAccess(join(root, 'supabase', 'access.json')));
  assert.doesNotThrow(() => readAccess(join(root, 'scripts', 'verify-rls-fixture', 'access.json')));
});

const fixtureAccess = readAccess(join(root, 'scripts', 'verify-rls-fixture', 'access.json'));
const fixtureMigrations = readMigrations(join(root, 'scripts', 'verify-rls-fixture', 'migrations'));

test('the fixture: every key is created by its migration and every table it creates has a key', () => {
  assert.ok(fixtureMigrations.length > 0, 'the fixture has no migration');
  // No src/ here: only the migration side of the check applies (the keys are "unused" because nothing reads them).
  const fixture = checkList({ access: fixtureAccess, sources: [], migrations: fixtureMigrations });
  assert.deepEqual(messages(fixture, 'created-without-key', 'key-not-created'), []);
});

test('the fixture: three tables, one per kind', () => {
  assert.deepEqual(fixtureAccess.map((e) => `${e.table}:${e.kind}`), ['fx_own:own', 'fx_shared:signed-in', 'fx_public:public']);
  const created = checkList({ access: fixtureAccess, sources: [], migrations: fixtureMigrations }).created;
  assert.deepEqual([...created.keys()].sort(), ['fx_own', 'fx_public', 'fx_shared']);
});

// ---- the scanners prove themselves on fixture sources (S3) ------------------------------------------------------

test('.from(): a quoted literal, with the whitespace and newlines real code has, and never Array.from or Buffer.from', () => {
  assert.deepEqual(literalFroms(`supabase.from('a').select('*')`), ['a']);
  assert.deepEqual(literalFroms(`supabase.from("b_2")`), ['b_2']);
  assert.deepEqual(literalFroms('supabase.from(`c`)'), ['c']);
  assert.deepEqual(literalFroms(`supabase\n  .from(\n    'd'\n  )\n  .select('*')`), ['d']);
  assert.deepEqual(literalFroms(`Array.from('abc'); Buffer.from('abc'); Uint8Array.from('1')`), []);
  assert.deepEqual(literalFroms(`supabase.from(table)`), []);
  assert.deepEqual(literalFroms(`supabase.from('a b')`), [], 'a name with a space is not a table');
  assert.deepEqual(literalFroms(`x.from('a'); y.from('b'); x.from('a')`), ['a', 'b', 'a']);
  // As in Overload, the text is scanned as it is: a call in a comment counts.
  assert.deepEqual(literalFroms(`// supabase.from('e')`), ['e']);
});

test('.from(variable): the call sites that hide their table name, never the literal ones or Array.from', () => {
  assert.deepEqual(dynamicFroms(`supabase.from(table)`), ['table']);
  assert.deepEqual(dynamicFroms(`supabase.from( item.table )`), ['item.table']);
  assert.deepEqual(dynamicFroms(`supabase.from('a'); Array.from(items); Buffer.from(bytes)`), []);
});

test('embeds: the names inside a select string, read from the syntax tree', () => {
  const uses = (text, name = 'x.ts') => embedsIn(name, text).sort();
  assert.deepEqual(uses(`supabase.from('a').select('*, b(*), alias:c!c_fk(id, d(*))')`), ['b', 'c', 'd']);
  assert.deepEqual(uses('const s = `id, e(*)`'), ['e']);
  assert.deepEqual(uses(`supabase.from('a').select('id, f(*)')`, 'x.tsx'), ['f']);
  // Never an embed: a comment, a plain string, a builder call given an object.
  assert.deepEqual(uses(`// g(…) and h!fk( in a comment\n/* i(*) */`), []);
  assert.deepEqual(uses(`toast('Saved the o set')`), []);
  assert.deepEqual(uses(`supabase.from('a').update({ n: 1 }).eq('id', id)`), []);
  // A string that holds `name(` is taken as a use of `name`, whatever it is: an embed only ever excuses an unused key.
  assert.deepEqual(uses(`select('count()')`), ['count']);
});

test('what is an app file: never a test, a test utility or a testing/ folder', () => {
  assert.deepEqual(
    ['src/a.test.ts', 'src/b.testutil.ts', 'src/testing/c.ts', 'src/features/d.ts', 'src/lib/latest.ts'].map(isAppFile),
    [false, false, false, true, true],
  );
});

test('create table / create view: the public schema, with the spellings migrations use, and never a comment', () => {
  const made = (sql) => createdRelations(sql);
  assert.deepEqual(made('create table orders (id int);'), ['orders']);
  assert.deepEqual(made('CREATE TABLE IF NOT EXISTS public.Orders (id int);'), ['orders'], 'folded like Postgres');
  assert.deepEqual(made('create table "public"."Orders" (id int);'), ['Orders'], 'quoted names keep their case');
  assert.deepEqual(made('create unlogged table log (id int);'), ['log']);
  assert.deepEqual(made('create view v_orders as select 1; create or replace view v_two as select 2;'), ['v_orders', 'v_two']);
  assert.deepEqual(made('create materialized view m_orders as select 1;'), ['m_orders']);
  assert.deepEqual(made('create table a (id int);\ncreate table b (id int);'), ['a', 'b']);
  assert.deepEqual(made('create\n  table\n  spaced (id int);'), ['spaced']);
  // Not the public schema's: another schema, a temporary table, a comment, or something else that is created.
  assert.deepEqual(made('create table auth.users (id int); create table storage."objects" (id int);'), []);
  assert.deepEqual(made('create temp table t (id int); create temporary table u (id int);'), []);
  assert.deepEqual(made('-- create table commented (id int);\n/* create table blocked (id int); */ select 1;'), []);
  assert.deepEqual(made('create index orders_i on orders (id); create policy p on orders for all using (true);'), []);
  assert.deepEqual(made('alter table orders enable row level security;'), []);
});

// ---- the check itself, on made-up worlds: each rule fails where it should and only there ------------------------

const src = (rel, text) => ({ rel, text });
const mig = (rel, text) => ({ rel, text });
const keysOf = (spec) => parseAccess(spec);
const rulesOf = (result) => result.problems.map((p) => p.rule).sort();

test('checkList: a world where the list, the code and the migrations agree has no problem', () => {
  const r = checkList({
    access: keysOf({ orders: 'own', customers: 'signed-in', plans: { kind: 'public', ahead: true } }),
    sources: [
      src('src/orders.ts', `supabase.from('orders').select('*, customers(name)')`),
      src('src/customers.ts', `supabase.from('customers').select('*')`),
    ],
    migrations: [mig('supabase/migrations/001.sql', 'create table orders (id int); create table customers (id int); create table plans (id int);')],
  });
  assert.deepEqual(r.problems, []);
  assert.deepEqual([r.keys.size, r.literal.size, r.created.size, r.dynamic.length], [3, 2, 3, 0]);
});

test('checkList: with everything empty there are no problems and every count is zero', () => {
  const r = checkList({ access: keysOf({}), sources: [], migrations: [] });
  assert.deepEqual(r.problems, []);
  assert.deepEqual([r.keys.size, r.literal.size, r.embedded.size, r.created.size, r.dynamic.length], [0, 0, 0, 0, 0]);
});

test('checkList: a .from() with no key fails, naming the file and the fix (break proof 7\'s rule)', () => {
  const r = checkList({
    access: keysOf({}),
    sources: [src('src/scratch.ts', `supabase.from('x').select('*')`)],
    migrations: [],
  });
  assert.deepEqual(rulesOf(r), ['from-without-key']);
  assert.match(r.problems[0].message, /\.from\('x'\) in src\/scratch\.ts has no key/);
});

test('checkList: a key no migration creates fails (break proof 6\'s rule)', () => {
  const r = checkList({
    access: keysOf({ ghost: { kind: 'own', ahead: true } }),
    sources: [],
    migrations: [mig('supabase/migrations/001.sql', 'select 1;')],
  });
  assert.deepEqual(rulesOf(r), ['key-not-created']);
  assert.match(r.problems[0].message, /"ghost" is in the access list but no migration creates it/);
});

test('checkList: a table a migration creates with no key fails', () => {
  const r = checkList({ access: keysOf({}), sources: [], migrations: [mig('supabase/migrations/001.sql', 'create table orders (id int);')] });
  assert.deepEqual(rulesOf(r), ['created-without-key']);
  assert.match(r.problems[0].message, /001\.sql creates "orders", which has no key/);
});

test('checkList: a key nothing uses fails unless it is marked ahead', () => {
  const migrations = [mig('supabase/migrations/001.sql', 'create table orders (id int);')];
  assert.deepEqual(rulesOf(checkList({ access: keysOf({ orders: 'own' }), sources: [], migrations })), ['key-unused']);
  assert.deepEqual(rulesOf(checkList({ access: keysOf({ orders: { kind: 'own', ahead: true } }), sources: [], migrations })), []);
});

test('checkList: an ahead key fails once a .from() or an embed names it, until the marker goes (Decided 41)', () => {
  const access = keysOf({ orders: { kind: 'own', ahead: true } });
  const migrations = [mig('supabase/migrations/001.sql', 'create table orders (id int);')];
  const fromUse = checkList({ access, sources: [src('src/a.ts', `supabase.from('orders').select('*')`)], migrations });
  assert.deepEqual(rulesOf(fromUse), ['ahead-used']);
  assert.match(fromUse.problems[0].message, /remove the ahead marker/);
  const embedUse = checkList({ access, sources: [src('src/a.ts', `supabase.from('other').select('*, orders(id)')`)], migrations });
  assert.ok(rulesOf(embedUse).includes('ahead-used'));
  // With the marker gone it is an ordinary key, and used.
  const gone = checkList({ access: keysOf({ orders: 'own' }), sources: [src('src/a.ts', `supabase.from('orders').select('*')`)], migrations });
  assert.deepEqual(rulesOf(gone), []);
});

test('checkList: an embed keeps a key alive but never demands one; a test file\'s embed keeps nothing alive', () => {
  const migrations = [mig('supabase/migrations/001.sql', 'create table a (id int); create table b (id int);')];
  const embedOnly = checkList({
    access: keysOf({ a: 'own', b: 'own' }),
    sources: [src('src/a.ts', `supabase.from('a').select('*, b(*), unlisted(*)')`)],
    migrations,
  });
  assert.deepEqual(rulesOf(embedOnly), [], 'b is used by the embed; `unlisted` demands no key');
  const testOnly = checkList({
    access: keysOf({ a: 'own', b: 'own' }),
    sources: [src('src/a.ts', `supabase.from('a').select('*')`), src('src/a.test.ts', `select('*, b(*)')`)],
    migrations,
  });
  assert.deepEqual(rulesOf(testOnly), ['key-unused'], 'a stand-in in a test is not a use');
});

test('checkList: a dynamic .from(variable) fails unless it is known; a known one that went away fails too', () => {
  const sources = [src('src/dyn.ts', `supabase.from(table).select('*')`)];
  const unknown = checkList({ access: keysOf({}), sources, migrations: [] });
  assert.deepEqual(rulesOf(unknown), ['dynamic-unknown']);
  assert.match(unknown.problems[0].message, /src\/dyn\.ts: \.from\(table\)/);
  assert.deepEqual(rulesOf(checkList({ access: keysOf({}), sources, migrations: [], knownDynamic: ['src/dyn.ts: .from(table)'] })), []);
  assert.deepEqual(rulesOf(checkList({ access: keysOf({}), sources: [], migrations: [], knownDynamic: ['src/dyn.ts: .from(table)'] })), ['dynamic-stale']);
});

test('checkList: a test file\'s .from() still needs a key, as in Overload (a literal call anywhere in src/)', () => {
  const r = checkList({ access: keysOf({}), sources: [src('src/a.test.ts', `supabase.from('x')`)], migrations: [] });
  assert.deepEqual(rulesOf(r), ['from-without-key']);
});
