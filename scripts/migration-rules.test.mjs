// migration-rules.test.mjs — run with: node --test "scripts/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classify, splitStatements } from './migration-rules.mjs';

const added = (sql, path = 'supabase/migrations/20260101000000_x.sql') => [{ path, status: 'A', sql }];
const safe = (sql) => assert.equal(classify(added(sql)).safe, true, JSON.stringify(classify(added(sql)).flagged));
const flagged = (sql) => assert.equal(classify(added(sql)).safe, false);

test('no migration changes is safe', () => {
  assert.equal(classify([]).safe, true);
});

test('new table with RLS, policy, index and grant is safe', () => safe(`
  create table public.sessions (id uuid primary key, user_id uuid not null references auth.users on delete cascade);
  alter table public.sessions enable row level security;
  create policy "own rows" on public.sessions for select using (auth.uid() = user_id);
  create unique index sessions_user_idx on sessions (user_id);
  grant select on sessions to authenticated;
  insert into sessions (id, user_id) values ('a', 'b');
`));

test('nullable column on an existing table is safe', () => safe('ALTER TABLE workouts ADD COLUMN notes text;'));
test('NOT NULL with DEFAULT on an existing table is safe', () => safe('alter table workouts add column done boolean not null default false;'));
test('several ADD COLUMNs in one statement are safe', () => safe('alter table workouts add column a text, add column b int default 0;'));
test('new index on an existing table is safe', () => safe('create index if not exists w_idx on workouts (created_at);'));
test('new enum and a new enum value are safe', () => safe(`create type mood as enum ('good','bad'); alter type mood add value 'ok';`));
test('comments and transactions are safe', () => safe(`begin; comment on table workouts is 'drop table x;'; commit;`));

test('NOT NULL without DEFAULT on an existing table is flagged', () => flagged('alter table workouts add column done boolean not null;'));
test('DROP COLUMN is flagged', () => flagged('alter table workouts drop column notes;'));
test('ADD then DROP in one statement is flagged', () => flagged('alter table workouts add column a text, drop column b;'));
test('changing a column type is flagged', () => flagged('alter table workouts alter column reps type smallint;'));
test('DROP TABLE is flagged', () => flagged('drop table workouts;'));
test('unique index on an existing table is flagged', () => flagged('create unique index u on workouts (name);'));
test('policy on an existing table is flagged', () => flagged(`create policy p on workouts for select using (true);`));
test('new function is flagged', () => flagged(`create function f() returns int as $$ select 1; $$ language sql;`));
test('UPDATE is flagged', () => flagged(`update workouts set reps = 0;`));
test('insert into an existing table is flagged', () => flagged(`insert into workouts (id) values (1);`));
test('upsert into a new table is flagged', () => flagged(`create table t (id int); insert into t values (1) on conflict (id) do update set id = 2;`));
test('new FK column with ON DELETE CASCADE on an existing table is flagged',
  () => flagged('alter table workouts add column plan_id uuid references plans on delete cascade;'));
test('unknown statements are flagged', () => flagged('create extension if not exists pg_trgm;'));

test('keywords inside comments do not count', () => safe(`-- drop table workouts;\n/* truncate workouts; */\nalter table workouts add column notes text;`));

test('a dollar-quoted body stays one statement', () => {
  const s = splitStatements(`create function f() returns void as $body$ begin delete from x; end; $body$ language plpgsql; select 1;`);
  assert.equal(s.length, 2);
});

test('a table created in an earlier file of the same branch counts as new', () => {
  const r = classify([
    { path: 'supabase/migrations/1_a.sql', status: 'A', sql: 'create table plans (id uuid primary key);' },
    { path: 'supabase/migrations/2_b.sql', status: 'A', sql: 'alter table plans add constraint c unique (id);' },
  ]);
  assert.equal(r.safe, true);
});

test('editing an existing migration is flagged', () => {
  const r = classify([{ path: 'supabase/migrations/1_a.sql', status: 'M', sql: 'create table x (id int);' }]);
  assert.equal(r.safe, false);
});

test('deleting an existing migration is flagged', () => {
  const r = classify([{ path: 'supabase/migrations/1_a.sql', status: 'D', sql: null }]);
  assert.equal(r.safe, false);
});

// A revoke is safe only on a table this batch creates, as a grant is: nobody has rights on a new table yet, so nothing is taken away. Decided 39
// asks for `revoke all … from public, anon, …` in the migration that creates an own or signed-in table, and DECISIONS 69 added the case.
test('revoke on a table created in the same batch is safe, written any way a migration writes it', () => {
  for (const revoke of [
    'revoke all on table sessions from public, anon, authenticated, service_role',
    'revoke all on sessions from anon',
    'REVOKE ALL PRIVILEGES ON TABLE public.sessions FROM ANON CASCADE',
    'revoke select (id), update (id) on table sessions from anon',
    'revoke grant option for select on sessions from anon',
  ]) {
    safe(`create table sessions (id uuid primary key); ${revoke};`);
  }
});

test('one revoke may name several tables, and each must be created in the batch', () => {
  safe('create table public.a (id int); create table public.b (id int); revoke all on table public.a, public.b from anon;');
  safe('create table a (id int); create table b (id int); revoke all on table a,public.b from anon;');
});

test('unquoted names are lower case and quoted ones are exact, as in Postgres', () => {
  safe('create table Plans (id int); revoke all on table plans from anon;');
  safe('create table "Plans" (id int); revoke all on table "Plans" from anon;');
  flagged('create table "Plans" (id int); revoke all on table plans from anon;');
  flagged('create table app.plans (id int); revoke all on table plans from anon;');
});

test('revoke on a table that already exists is flagged, whatever it takes away and from whom', () => {
  flagged('revoke select on workouts from anon;');
  flagged('revoke all on table public.workouts from public, anon, authenticated, service_role;');
  flagged('revoke select (id) on workouts from anon;');
  // a table the batch creates does not excuse a revoke on another one
  flagged('create table sessions (id int); revoke select on workouts from anon;');
});

test('a revoke is flagged when any table it names is not created earlier in the batch', () => {
  flagged('create table a (id int); revoke all on table a, workouts from anon;');
  flagged('create table a (id int); revoke all on table workouts, a from anon;');
  flagged('create table a (id int); revoke all on table a, public.b from anon;');
  // the revoke comes before the create
  flagged('revoke all on table plans from anon; create table plans (id int);');
});

test('a revoke in a later file of the same branch counts the tables of an earlier file; one that sorts before it does not', () => {
  const create = { path: 'supabase/migrations/001_a.sql', status: 'A', sql: 'create table plans (id uuid primary key);' };
  const revoke = { path: 'supabase/migrations/002_b.sql', status: 'A', sql: 'revoke all on table plans from anon;' };
  assert.equal(classify([create, revoke]).safe, true);
  assert.equal(classify([{ ...create, path: 'supabase/migrations/002_a.sql' }, { ...revoke, path: 'supabase/migrations/001_b.sql' }]).safe, false);
});

test('a revoke that is not on a table is still flagged: a schema, a function, every table of a schema, a role, default privileges', () => {
  for (const sql of [
    'revoke all on schema public from anon',
    'revoke execute on function f() from public',
    'revoke all on all tables in schema public from anon',
    'revoke some_role from other_role',
    'alter default privileges in schema public revoke all on tables from anon',
  ]) {
    flagged(`create table sessions (id int); ${sql};`);
  }
});

// Chunk 3's fixture migration is written the way the stack skill says a table's migration is written (RLS, the policies of its kind, then
// `revoke all` and the grants). The check built for migrations has to pass it: a migration that follows Decided 39 and is flagged for doing so
// would stop every table of every app at a decision card. This runs the real classifier on the real file. Its control names one more table in
// the revoke, which this migration does not create: the verdict must turn on that revoke.
test("chunk 3's fixture migration (policies, then revoke all and the grants) is safe", () => {
  const sql = readFileSync(new URL('./verify-rls-fixture/migrations/001_fixture.sql', import.meta.url), 'utf8');
  assert.match(sql, /^revoke all on table /m, 'the fixture no longer revokes: this test would prove nothing');
  const path = 'supabase/migrations/001_fixture.sql';
  const r = classify(added(sql, path));
  assert.equal(r.safe, true, JSON.stringify(r.flagged));
  const control = classify(added(sql.replace(/^(revoke all on table [^\n]*?)( from )/m, '$1, public.not_in_this_batch$2'), path));
  assert.equal(control.safe, false);
  assert.deepEqual(control.flagged.map((f) => f.reason), ['revoke on an existing table']);
});
