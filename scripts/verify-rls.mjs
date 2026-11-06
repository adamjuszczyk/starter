// verify-rls.mjs
//
// Read-only RLS check, run on the replay (scripts/verify-rls-replay.sh): a real Supabase Postgres, every migration
// applied, PostgREST connected as `authenticator`, and three callers whose tokens scripts/replay-tokens.mjs mints:
// user A, user B and a signed-out visitor. Lifted from Overload's verify-rls.mjs, with its two table lists replaced
// by the access list (supabase/access.json, or the fixture's with --fixture) and each table checked by its kind
// (SPEC, "Objects stored" and "Shared scripts"):
//
//   own        only the user who wrote a row sees it
//                A reads A's rows            PASS at 1 or more; 0 is a FAIL (a table that answers nothing proves nothing)
//                B counts rows not B's       PASS at 0; any is a LEAK (the count is Overload's, taken by the server)
//                signed out reads the table  PASS at 0 rows or a refusal; any row is a LEAK
//   signed-in  every signed-in user sees every row
//                B counts A's rows           PASS at 1 or more; 0 is a FAIL (B cannot see what is shared)
//                signed out reads the table  PASS at 0 rows or a refusal; any row is a LEAK
//   public     anyone sees it, signed out included
//                signed out reads the table  PASS at 1 or more rows; 0 is a FAIL
//                A reads the table           PASS at 1 or more rows: a signed-in user is not `anon`, so a public
//                                            table needs its grant for `authenticated` as well
//   every kind RLS is on and the grants are listed (the catalog, which the wrapper reads with psql: --catalog); an own
//              or a signed-in table also holds nothing for anon, directly or through PUBLIC (Decided 39)
//
// A refusal (Postgres 42501, read from PostgREST's error code, never the HTTP status: 401 for anon, 403 for
// authenticated, Decided 40) means different things to different probes (Decided 14, SPEC "a missing grant can look
// like a passing RLS check"): where the caller is expected to read rows (the owner, B on a shared table, anyone on a
// public one) it is a FAIL, a missing grant; where the caller must not read them (B on someone else's rows, a
// signed-out visitor) it is a PASS, RLS or a grant doing its job. Any other error is a FAIL: "could not ask" is not
// "was refused" (a wrong secret, an unreachable server, a missing table, a missing user_id column: Decided 49).
//
// Result per check: PASS, LEAK (a row a caller must not see) or FAIL (anything else wrong, never a pass).
// The counts are exact counts taken by the server with zero rows fetched (limit 0), so no row content reaches this
// script and PostgREST's max_rows cannot hide a leak (Overload, Checks that lied #31). Only counts, statuses and
// table names are printed: no row, no token, no secret. Reads only: it never inserts, updates, deletes or calls an RPC.
//
// Usage:  node scripts/verify-rls.mjs [--fixture | --access FILE] --local URL --catalog FILE
//   --fixture      the fixture's list (scripts/verify-rls-fixture/access.json) instead of supabase/access.json
//   --access FILE  another list (the tests use it); not with --fixture
//   --local URL    the PostgREST root (the replay serves at the root, not under /rest/v1)
//   --catalog FILE the wrapper's psql dump for the public schema: { table: { relkind, rls, options, grants, anon,
//                  anon_columns } } (anon: what anon holds, by has_table_privilege, so PUBLIC counts; anon_columns:
//                  whether it holds column-level privileges only)
// Env:    RLS_JWT_SECRET  the secret PostgREST was started with (the wrapper sets it)
// Exit:   0 every check passed (or the list is empty); 1 a leak or a failure; 2 could not run (bad arguments,
//         unreadable files, no secret). An empty list passes: the starter has no tables.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { anonToken, userToken, USER_A, USER_B } from './replay-tokens.mjs';

export const KINDS = ['own', 'signed-in', 'public'];
const ACCESS_FILE = 'supabase/access.json';
const FIXTURE_ACCESS_FILE = 'scripts/verify-rls-fixture/access.json';
const USAGE = 'usage: node scripts/verify-rls.mjs [--fixture | --access FILE] --local URL --catalog FILE';

// ---- the access list ------------------------------------------------------------------------------------------

// supabase/access.json: one object, table name to kind, or to { "kind": ..., "ahead": true } for a table created
// before any code reads it (Decided 41). Returns [{ table, kind, ahead }]; throws an Error that names the entry.
// The same reading as check-signups.mjs's, with the entries checked.
export function parseAccess(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('the access list must be one object, table name to kind');
  }
  return Object.entries(value).map(([table, entry]) => {
    // The name goes into a request path: only what a table name is made of.
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) throw new Error(`\`${table}\` is not a table name`);
    const isObject = entry !== null && typeof entry === 'object' && !Array.isArray(entry);
    const kind = typeof entry === 'string' ? entry : isObject ? entry.kind : undefined;
    if (!KINDS.includes(kind)) {
      throw new Error(`\`${table}\`: the kind must be one of ${KINDS.join(', ')} (got ${JSON.stringify(kind)})`);
    }
    if (isObject) {
      const unknown = Object.keys(entry).filter((key) => key !== 'kind' && key !== 'ahead');
      if (unknown.length > 0) throw new Error(`\`${table}\`: unknown key ${unknown.map((k) => `\`${k}\``).join(', ')}`);
      if ('ahead' in entry && entry.ahead !== true) throw new Error(`\`${table}\`: \`ahead\` is true, or left out`);
    }
    return { table, kind, ahead: isObject && entry.ahead === true };
  });
}

// ---- classification (pure: no I/O, so the tests can call it directly) -------------------------------------------

// One probe's verdict, from what was asked and what came back.
//   probe  'owner' | 'foreign' | 'peer' | 'signed-out' | 'public'
//   count  the exact count the server returned (owner, peer, signed-out, public)
//   foreign, total   the two counts of the 'foreign' probe: rows not the caller's, and every row the caller sees
//   error  { code, message } when the request failed
export function classifyProbe({ probe, count, foreign, total, error }) {
  if (error) {
    // Read from PostgREST's error code only (Decided 40). A missing code is "could not ask", never a refusal.
    if (error.code !== '42501') {
      const code = error.code ? ` [${error.code}]` : '';
      return { status: 'FAIL', detail: `error${code}: ${error.message || 'unknown error'}` };
    }
    switch (probe) {
      // The caller is expected to read rows: a refusal is a missing grant (Decided 14), not a passing RLS check.
      case 'owner':
      case 'peer':
      case 'public':
        return { status: 'FAIL', detail: 'permission denied (42501) where rows are expected: a missing grant, not RLS' };
      // The caller must not read these rows: a refusal is RLS or a grant doing its job.
      case 'foreign':
      case 'signed-out':
        return { status: 'PASS', detail: 'permission denied (42501)' };
      default:
        return { status: 'FAIL', detail: `unknown probe ${probe}` };
    }
  }
  const missing = (n) => n === null || n === undefined || !Number.isInteger(n);
  switch (probe) {
    case 'foreign':
      if (missing(foreign) || missing(total)) return { status: 'FAIL', detail: 'no count returned' };
      if (foreign > 0) return { status: 'LEAK', detail: `${foreign} of ${total} row(s) the caller sees are not the caller's` };
      return { status: 'PASS', detail: `${total} own row(s), 0 not the caller's` };
    case 'signed-out':
      if (missing(count)) return { status: 'FAIL', detail: 'no count returned' };
      if (count > 0) return { status: 'LEAK', detail: `${count} row(s) visible to a signed-out visitor` };
      return { status: 'PASS', detail: '0 rows' };
    case 'owner':
      if (missing(count)) return { status: 'FAIL', detail: 'no count returned' };
      if (count === 0) {
        return {
          status: 'FAIL',
          detail: '0 own rows: an owner who sees nothing proves nothing (a policy hiding every row, auth.uid() null, or no row for A in the seed, supabase/verify-rls-seed.sql)',
        };
      }
      return { status: 'PASS', detail: `${count} own row(s)` };
    case 'peer':
      if (missing(count)) return { status: 'FAIL', detail: 'no count returned' };
      if (count === 0) return { status: 'FAIL', detail: "0 of the other user's rows visible: every signed-in user must see every row" };
      return { status: 'PASS', detail: `${count} row(s) of the other user's visible` };
    case 'public':
      if (missing(count)) return { status: 'FAIL', detail: 'no count returned' };
      if (count === 0) return { status: 'FAIL', detail: '0 rows visible: a public table must show its rows to everyone' };
      return { status: 'PASS', detail: `${count} row(s) visible` };
    default:
      return { status: 'FAIL', detail: `unknown probe ${probe}` };
  }
}

const SELECT_PRIVILEGES = ['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE'];

// "authenticated=SELECT anon=SELECT": the API roles' grants as the catalog lists them; ALL when a role holds every one.
export function formatGrants(grants) {
  const roles = Object.keys(grants ?? {}).sort();
  if (roles.length === 0) return 'none';
  return roles
    .map((role) => {
      const held = grants[role];
      return `${role}=${SELECT_PRIVILEGES.every((p) => held.includes(p)) ? 'ALL' : held.join(',')}`;
    })
    .join(' ');
}

// What the catalog says anon holds on a table, as text: '' for nothing, else "ALL" or the privileges, with a note when
// some are column-level only; null when the catalog does not say (the entry has no `anon`: a stale or hand-made dump).
// `anon` is what has_table_privilege('anon', …) answers, so it counts what anon holds through PUBLIC as well as what
// is granted to it by name (information_schema.role_table_grants shows neither PUBLIC nor column-level grants).
function anonHolds(entry) {
  if (!Array.isArray(entry.anon)) return null;
  const parts = [];
  if (entry.anon.length > 0) parts.push(SELECT_PRIVILEGES.every((p) => entry.anon.includes(p)) ? 'ALL' : entry.anon.join(','));
  if (entry.anon_columns === true) parts.push('column-level privileges');
  return parts.join(' and ');
}

// The catalog check, every kind. entry is the catalog's row for the table (undefined when the replayed database
// has none): RLS on, and, for an own or a signed-in table, nothing held by anon (Decided 39).
// RLS: a table has `relrowsecurity`; a view has none, so its rows are protected by the tables under it only when it
// runs with the caller's rights (security_invoker), not its owner's; a materialized view or foreign table has no RLS.
// anon: Supabase's default privileges give anon ALL on every new table, so one wrong policy on a table anon can read
// leaks to the public. After `revoke all … from anon` a signed-out request is refused (42501) whatever the policies say,
// and a `using (true)` mistake reaches signed-in users only. A migration that leans on the defaults (or on PUBLIC)
// passes every probe that has no wrong policy to find, and this is the check that fails it. A public table is meant
// to be read by anon, so it is not judged here.
export function classifyCatalog({ kind, entry }) {
  if (!entry) return { status: 'FAIL', detail: 'not in the replayed database: no migration creates it' };
  const problems = [];
  const facts = [];
  if (entry.relkind === 'r' || entry.relkind === 'p') {
    if (entry.rls) facts.push('RLS on');
    else problems.push('RLS is off: every row is open to any role with a grant');
  } else if (entry.relkind === 'v' && (entry.options ?? []).some((option) => /^security_invoker=(true|on)$/i.test(option))) {
    facts.push('a view with security_invoker on: the tables under it enforce RLS');
  } else if (kind === 'public') {
    facts.push(`not a table (relkind ${entry.relkind}), public by design`);
  } else {
    problems.push(
      entry.relkind === 'v'
        ? "a view without security_invoker runs with its owner's rights and bypasses RLS"
        : `not a table (relkind ${entry.relkind}): it has no RLS`,
    );
  }
  if (kind !== 'public') {
    const held = anonHolds(entry);
    if (held === null) problems.push('the catalog does not say what anon holds (run through scripts/verify-rls-replay.sh)');
    else if (held !== '') {
      problems.push(
        `anon holds ${held} on this ${kind} table, directly or through PUBLIC: Decided 39 revokes everything from anon in the migration that creates it, then grants what is needed`,
      );
    } else facts.push('anon holds nothing');
  }
  const grants = `grants: ${formatGrants(entry.grants)}`;
  return problems.length > 0
    ? { status: 'FAIL', detail: `${problems.join('; ')}; ${grants}` }
    : { status: 'PASS', detail: `${facts.join('; ')}; ${grants}` };
}

// ---- the requests -----------------------------------------------------------------------------------------------

// A UUID's shape, checked before an id is interpolated into the `.or()` filter below: enough to refuse anything that
// is not hex and dashes, so nothing else can reach that string (Overload's).
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// How many rows does `client` see in `table`, among those `narrow` keeps? An exact count taken by the server with
// zero rows fetched. A GET with limit 0, not Overload's HEAD: PostgREST sends no body on HEAD, so a refusal arrives
// without its code (supabase-js answers error { message: '' }) and could not be told from "could not ask".
// Returns { count } or { error: { code, message } }; it never throws.
async function ask(client, table, column, narrow) {
  try {
    let query = client.from(table).select(column, { count: 'exact' });
    if (narrow) query = narrow(query);
    const { count, error } = await query.limit(0);
    return error ? { error: { code: error.code, message: error.message } } : { count };
  } catch (err) {
    return { error: { code: undefined, message: `threw: ${err instanceof Error ? err.message : String(err)}` } };
  }
}

const isUuid = (id) => typeof id === 'string' && UUID_RE.test(id);
const REFUSED_ID = { status: 'FAIL', detail: 'user id is not a UUID, refusing to query' };

// own, as the owner: how many rows of the owner's does the owner see?
export async function probeOwner(client, table, ownerId) {
  if (!isUuid(ownerId)) return REFUSED_ID;
  const own = await ask(client, table, 'user_id', (q) => q.eq('user_id', ownerId));
  return classifyProbe({ probe: 'owner', ...own });
}

// own, as the other user: two counts, never rows. How many rows the caller sees that are not the caller's (a null
// user_id counts as not theirs), and how many it sees in all, for the detail.
export async function probeForeign(client, table, callerId) {
  if (!isUuid(callerId)) return REFUSED_ID;
  const foreign = await ask(client, table, 'user_id', (q) => q.or(`user_id.neq.${callerId},user_id.is.null`));
  if (foreign.error) return classifyProbe({ probe: 'foreign', error: foreign.error });
  const total = await ask(client, table, 'user_id');
  if (total.error) return classifyProbe({ probe: 'foreign', error: total.error });
  return classifyProbe({ probe: 'foreign', foreign: foreign.count, total: total.count });
}

// signed-in, as the other user: how many of the owner's rows does the caller see?
export async function probePeer(client, table, ownerId) {
  if (!isUuid(ownerId)) return REFUSED_ID;
  const peer = await ask(client, table, 'user_id', (q) => q.eq('user_id', ownerId));
  return classifyProbe({ probe: 'peer', ...peer });
}

// every kind, signed out: how many rows does a visitor see?
export async function probeSignedOut(client, table) {
  return classifyProbe({ probe: 'signed-out', ...(await ask(client, table, '*')) });
}

// public: how many rows does the caller see? (the visitor, and a signed-in user)
export async function probePublic(client, table) {
  return classifyProbe({ probe: 'public', ...(await ask(client, table, '*')) });
}

// What each kind is asked, as whom. `c` holds the three clients: c.anon, c.a, c.b.
export const PLAN = {
  own: [
    { who: 'A', ask: 'reads own rows', run: (c, t) => probeOwner(c.a, t, USER_A) },
    { who: 'B', ask: 'counts rows not B\'s', run: (c, t) => probeForeign(c.b, t, USER_B) },
    { who: 'signed out', ask: 'reads rows', run: (c, t) => probeSignedOut(c.anon, t) },
  ],
  'signed-in': [
    { who: 'B', ask: 'counts A\'s rows', run: (c, t) => probePeer(c.b, t, USER_A) },
    { who: 'signed out', ask: 'reads rows', run: (c, t) => probeSignedOut(c.anon, t) },
  ],
  public: [
    { who: 'signed out', ask: 'reads rows', run: (c, t) => probePublic(c.anon, t) },
    { who: 'A', ask: 'reads rows', run: (c, t) => probePublic(c.a, t) },
  ],
};

// ---- the clients ------------------------------------------------------------------------------------------------

// supabase-js asks for <url>/rest/v1/<table>; a bare PostgREST serves <url>/<table>. This fetch drops the prefix
// (check-embeds.mjs does the same to its URL). baseFetch is a parameter so a test can stand in for the network.
export function localRootFetch(baseFetch = fetch) {
  return (input, init) => {
    if (typeof input !== 'string' && !(input instanceof URL)) throw new Error('verify-rls: unexpected fetch input');
    const url = new URL(String(input));
    url.pathname = url.pathname.replace(/^\/rest\/v1(?=\/)/, '');
    return baseFetch(url, init);
  };
}

// A client that is the caller whose token it is given: the anon key stays the project key and the user's token goes
// in global.headers, as Authorization and apikey (Decided 13). With no user token it is the signed-out visitor, the
// anon token in both headers (supabase-js's default). No session is kept, nothing refreshes.
export function makeClient(create, url, anonJwt, userJwt, baseFetch) {
  return create(url, anonJwt, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: localRootFetch(baseFetch),
      headers: userJwt ? { Authorization: `Bearer ${userJwt}`, apikey: userJwt } : {},
    },
  });
}

// ---- the run ----------------------------------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { fixture: false, access: null, local: null, catalog: null };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--fixture') args.fixture = true;
    else if (flag === '--access' || flag === '--local' || flag === '--catalog') {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) throw new Error(`${flag} needs a value`);
      args[flag.slice(2)] = value;
      i += 1;
    } else throw new Error(`unknown argument ${flag}`);
  }
  if (args.fixture && args.access) throw new Error('--fixture and --access cannot be used together');
  if (!args.local) throw new Error('no --local URL');
  if (!args.catalog) throw new Error('no --catalog FILE');
  return args;
}

function readJson(path, what) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    throw new Error(`can't read ${what} ${path} as JSON (${err instanceof Error ? err.message : String(err)})`);
  }
}

// Returns the exit code. `create` and `baseFetch` are parameters for the tests; `out` and `err` take the lines.
export async function run(argv, env, { out = console.log, err = console.error, create = createClient, baseFetch = fetch } = {}) {
  let args, entries, catalog, secret;
  try {
    args = parseArgs(argv);
    if (!/^https?:\/\/[^/\s]+/.test(args.local)) throw new Error(`--local ${args.local} is not an http(s) URL`);
    const accessPath = args.fixture ? FIXTURE_ACCESS_FILE : (args.access ?? ACCESS_FILE);
    entries = parseAccess(readJson(accessPath, 'the access list'));
    catalog = readJson(args.catalog, 'the catalog');
    if (catalog === null || typeof catalog !== 'object' || Array.isArray(catalog)) throw new Error('the catalog must be one object');
    secret = env.RLS_JWT_SECRET;
    if (!secret) throw new Error('RLS_JWT_SECRET is not set (scripts/verify-rls-replay.sh sets it)');
    if (entries.length === 0) {
      out(`verify-rls: 0 tables: the access list (${accessPath}) is empty, so there is nothing to probe.`);
      return 0;
    }
  } catch (e) {
    err(`verify-rls: ${e instanceof Error ? e.message : String(e)}`);
    err(USAGE);
    return 2;
  }

  const url = args.local.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  const anonJwt = anonToken(secret);
  const clients = {
    anon: makeClient(create, url, anonJwt, null, baseFetch),
    a: makeClient(create, url, anonJwt, userToken(secret, USER_A), baseFetch),
    b: makeClient(create, url, anonJwt, userToken(secret, USER_B), baseFetch),
  };

  const pad = Math.max(...entries.map((e) => e.table.length));
  const results = [];
  for (const { table, kind, ahead } of entries) {
    const checks = [{ label: 'catalog', ...classifyCatalog({ kind, entry: catalog[table] }) }];
    for (const probe of PLAN[kind]) {
      checks.push({ label: `${probe.who} ${probe.ask}`, ...(await probe.run(clients, table)) });
    }
    results.push(...checks);
    const width = Math.max(...checks.map((c) => c.label.length));
    out(`${table.padEnd(pad)}  ${kind}${ahead ? ' (ahead)' : ''}`);
    for (const c of checks) out(`${' '.repeat(pad)}  ${c.label.padEnd(width)}  ${c.status.padEnd(4)}  ${c.detail}`);
  }

  const leaks = results.filter((r) => r.status === 'LEAK').length;
  const fails = results.filter((r) => r.status === 'FAIL').length;
  out(
    `\nverify-rls: ${entries.length} tables, ${results.length} checks — ` +
      `${results.length - leaks - fails} pass, ${leaks} leak, ${fails} fail`,
  );
  if (leaks > 0 || fails > 0) {
    out('verify-rls: FAILED');
    return 1;
  }
  out('verify-rls: ok');
  return 0;
}

// Run only as a script (the tests import the functions above). pathToFileURL, not a string built from argv: a path
// with a space or a non-ASCII letter would otherwise skip main and exit 0.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run(process.argv.slice(2), process.env).then(
    (code) => process.exit(code),
    (e) => {
      console.error(`verify-rls: unexpected error: ${e instanceof Error ? e.message : String(e)}`);
      process.exit(1);
    },
  );
}
