// verify-rls.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// Tests for verify-rls.mjs and replay-tokens.mjs. No database and no Docker: classifyProbe() is pure and takes the
// counts a probe already asked for; the probe functions take their client as a parameter and are tested against a
// mock that records every request (Overload's probeOwnership tests, per kind); run() is tested end to end through
// the real supabase-js against a small stand-in for PostgREST on localhost. What the real PostgREST and the real
// policies answer is the replay's job (scripts/verify-rls-replay.sh --fixture), not this file's.
//
// Importing verify-rls.mjs is safe: everything that does something lives in run(), which the script calls only when
// executed directly (the `import.meta.url` guard at its end).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  PLAN,
  classifyCatalog,
  classifyProbe,
  formatGrants,
  localRootFetch,
  makeClient,
  parseAccess,
  probeForeign,
  probeOwner,
  probePeer,
  probePublic,
  probeSignedOut,
  run,
} from './verify-rls.mjs';
import { TOKEN_LIFETIME_SECONDS, USER_A, USER_B, anonToken, signJwt, userToken } from './replay-tokens.mjs';

const SECRET = 'test-secret-test-secret-test-secret-0123';
const SCRIPT = new URL('./verify-rls.mjs', import.meta.url).pathname;
const permissionDenied = { code: '42501', message: 'permission denied for table t' };

// ---- classifyProbe, per kind ------------------------------------------------------------------------------------
// The same refusal (42501) is a PASS or a FAIL by who is asking and what they are expected to see (Decided 14).

test('own, the owner: 1 or more own rows pass; 0 rows is a FAIL, never a vacuous pass', () => {
  assert.deepEqual(classifyProbe({ probe: 'owner', count: 2 }), { status: 'PASS', detail: '2 own row(s)' });
  const none = classifyProbe({ probe: 'owner', count: 0 });
  assert.equal(none.status, 'FAIL');
  assert.match(none.detail, /0 own rows/);
});

test('own, the owner: a refusal is a FAIL (a missing grant), where the other probes pass it', () => {
  const r = classifyProbe({ probe: 'owner', error: permissionDenied });
  assert.equal(r.status, 'FAIL');
  assert.match(r.detail, /42501/);
  assert.match(r.detail, /missing grant/);
});

test('own, the other user: no foreign row passes, any foreign row is a LEAK', () => {
  assert.deepEqual(classifyProbe({ probe: 'foreign', foreign: 0, total: 1 }), {
    status: 'PASS',
    detail: "1 own row(s), 0 not the caller's",
  });
  assert.deepEqual(classifyProbe({ probe: 'foreign', foreign: 2, total: 3 }), {
    status: 'LEAK',
    detail: "2 of 3 row(s) the caller sees are not the caller's",
  });
  // The count is the server's, so a foreign row past PostgREST's max_rows still counts (Checks that lied #31).
  assert.equal(classifyProbe({ probe: 'foreign', foreign: 3, total: 5000 }).status, 'LEAK');
});

test('own, the other user: a refusal is a PASS, a missing count is a FAIL', () => {
  assert.equal(classifyProbe({ probe: 'foreign', error: permissionDenied }).status, 'PASS');
  assert.equal(classifyProbe({ probe: 'foreign', foreign: null, total: 1 }).status, 'FAIL');
  assert.equal(classifyProbe({ probe: 'foreign', foreign: 0, total: undefined }).status, 'FAIL');
});

test('signed out (own and signed-in): 0 rows or a refusal pass, any row is a LEAK', () => {
  assert.deepEqual(classifyProbe({ probe: 'signed-out', count: 0 }), { status: 'PASS', detail: '0 rows' });
  assert.deepEqual(classifyProbe({ probe: 'signed-out', error: permissionDenied }), {
    status: 'PASS',
    detail: 'permission denied (42501)',
  });
  assert.deepEqual(classifyProbe({ probe: 'signed-out', count: 3 }), {
    status: 'LEAK',
    detail: '3 row(s) visible to a signed-out visitor',
  });
  assert.equal(classifyProbe({ probe: 'signed-out', count: null }).status, 'FAIL');
});

test('signed-in, the other user: sees the owner\'s rows or FAILs; a refusal is a FAIL', () => {
  assert.equal(classifyProbe({ probe: 'peer', count: 2 }).status, 'PASS');
  const none = classifyProbe({ probe: 'peer', count: 0 });
  assert.equal(none.status, 'FAIL');
  assert.match(none.detail, /every signed-in user must see every row/);
  assert.equal(classifyProbe({ probe: 'peer', error: permissionDenied }).status, 'FAIL');
});

test('public: rows for everyone pass; 0 rows and a refusal are FAILs', () => {
  assert.deepEqual(classifyProbe({ probe: 'public', count: 3 }), { status: 'PASS', detail: '3 row(s) visible' });
  assert.equal(classifyProbe({ probe: 'public', count: 0 }).status, 'FAIL');
  assert.equal(classifyProbe({ probe: 'public', error: permissionDenied }).status, 'FAIL');
});

test('"could not ask" is never a refusal: any other error is a FAIL for every probe (Decided 40: the code, not the status)', () => {
  for (const probe of ['owner', 'foreign', 'peer', 'signed-out', 'public']) {
    const badSecret = classifyProbe({ probe, error: { code: 'PGRST301', message: 'JWSError JWSInvalidSignature' } });
    assert.equal(badSecret.status, 'FAIL', probe);
    assert.match(badSecret.detail, /\[PGRST301\]/);
    // A message that says "permission denied" with another code, or no code at all (a HEAD answer has no body), is not 42501.
    assert.equal(classifyProbe({ probe, error: { code: '42P01', message: 'permission denied for table t' } }).status, 'FAIL', probe);
    assert.equal(classifyProbe({ probe, error: { code: '', message: '' } }).status, 'FAIL', probe);
    assert.equal(classifyProbe({ probe, error: { code: undefined, message: 'TypeError: fetch failed' } }).status, 'FAIL', probe);
  }
  // A missing user_id column answers 42703: a FAIL where the owner count asks for it (Decided 49).
  const noColumn = classifyProbe({ probe: 'owner', error: { code: '42703', message: 'column t.user_id does not exist' } });
  assert.equal(noColumn.status, 'FAIL');
  assert.match(noColumn.detail, /\[42703\]/);
});

test('an unknown probe is a FAIL, not a pass, whatever it was answered', () => {
  assert.equal(classifyProbe({ probe: 'nope', count: 1 }).status, 'FAIL');
  assert.equal(classifyProbe({ probe: 'nope', count: 0 }).status, 'FAIL');
  assert.equal(classifyProbe({ probe: 'nope', error: permissionDenied }).status, 'FAIL');
});

test('what each kind is asked, and as whom', () => {
  const asked = (kind) => PLAN[kind].map((p) => `${p.who} ${p.ask}`);
  assert.deepEqual(asked('own'), ['A reads own rows', "B counts rows not B's", 'signed out reads rows']);
  assert.deepEqual(asked('signed-in'), ["B counts A's rows", 'signed out reads rows']);
  assert.deepEqual(asked('public'), ['signed out reads rows', 'A reads rows']);
});

// ---- the catalog check: "RLS on", every kind --------------------------------------------------------------------

const table = (extra = {}) => ({ relkind: 'r', rls: true, options: null, grants: { authenticated: ['SELECT'] }, ...extra });

test('catalog: a table with RLS on passes for every kind and lists its grants', () => {
  for (const kind of ['own', 'signed-in', 'public']) {
    assert.deepEqual(classifyCatalog({ kind, entry: table() }), { status: 'PASS', detail: 'RLS on; grants: authenticated=SELECT' });
  }
});

test('catalog: a table with RLS off is a FAIL for every kind, public included', () => {
  for (const kind of ['own', 'signed-in', 'public']) {
    const r = classifyCatalog({ kind, entry: table({ rls: false }) });
    assert.equal(r.status, 'FAIL', kind);
    assert.match(r.detail, /RLS is off/);
  }
});

test('catalog: a table the replay does not have is a FAIL', () => {
  assert.equal(classifyCatalog({ kind: 'own', entry: undefined }).status, 'FAIL');
});

test('catalog: a view has no RLS of its own: security_invoker passes, a view that runs as its owner fails unless public', () => {
  const view = (options) => table({ relkind: 'v', rls: false, options });
  assert.equal(classifyCatalog({ kind: 'own', entry: view(['security_invoker=true']) }).status, 'PASS');
  assert.equal(classifyCatalog({ kind: 'signed-in', entry: view(['security_invoker=on']) }).status, 'PASS');
  const bypass = classifyCatalog({ kind: 'own', entry: view(null) });
  assert.equal(bypass.status, 'FAIL');
  assert.match(bypass.detail, /bypasses RLS/);
  assert.equal(classifyCatalog({ kind: 'public', entry: view(null) }).status, 'PASS');
  assert.equal(classifyCatalog({ kind: 'own', entry: view(['security_invoker=false']) }).status, 'FAIL');
});

test('catalog: a materialized view or foreign table has no RLS at all', () => {
  assert.equal(classifyCatalog({ kind: 'own', entry: table({ relkind: 'm', rls: false }) }).status, 'FAIL');
  assert.equal(classifyCatalog({ kind: 'public', entry: table({ relkind: 'm', rls: false }) }).status, 'PASS');
});

test('grants are listed by role, sorted; a role holding every table privilege prints ALL; none prints none', () => {
  assert.equal(formatGrants({}), 'none');
  assert.equal(formatGrants(undefined), 'none');
  assert.equal(formatGrants({ authenticated: ['SELECT'], anon: ['SELECT', 'INSERT'] }), 'anon=SELECT,INSERT authenticated=SELECT');
  const all = ['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE'];
  assert.equal(formatGrants({ anon: all, service_role: ['SELECT'] }), 'anon=ALL service_role=SELECT');
});

// ---- the access list --------------------------------------------------------------------------------------------

test('the access list: a bare kind, or { kind, ahead: true }', () => {
  assert.deepEqual(parseAccess({ a: 'own', b: { kind: 'signed-in', ahead: true }, c: { kind: 'public' } }), [
    { table: 'a', kind: 'own', ahead: false },
    { table: 'b', kind: 'signed-in', ahead: true },
    { table: 'c', kind: 'public', ahead: false },
  ]);
  assert.deepEqual(parseAccess({}), []);
});

test('the access list: anything else is refused with the entry named', () => {
  assert.throws(() => parseAccess({ a: 'mine' }), /`a`: the kind must be one of own, signed-in, public \(got "mine"\)/);
  assert.throws(() => parseAccess({ a: { ahead: true } }), /`a`: the kind must be/);
  assert.throws(() => parseAccess({ a: { kind: 'own', ahead: false } }), /`a`: `ahead` is true, or left out/);
  assert.throws(() => parseAccess({ a: { kind: 'own', note: 1 } }), /`a`: unknown key `note`/);
  assert.throws(() => parseAccess({ 'a; drop table b': 'own' }), /is not a table name/);
  assert.throws(() => parseAccess({ a: ['own'] }), /the kind must be/);
  for (const bad of [null, [], 'own', 3]) assert.throws(() => parseAccess(bad), /must be one object/);
});

// ---- the probes, against a mock client that records every request -----------------------------------------------

// from(table).select(column, opts) returns a builder that takes .eq() / .or() and ends in .limit(n), which answers.
function mockClient(answers) {
  const calls = [];
  let next = 0;
  const client = {
    from(tableName) {
      return {
        select(column, opts) {
          const call = { table: tableName, column, opts, filters: [], limit: undefined };
          const answer = answers[next++];
          const builder = {
            eq(col, value) { call.filters.push(['eq', col, value]); return builder; },
            or(expr) { call.filters.push(['or', expr]); return builder; },
            limit(n) {
              call.limit = n;
              calls.push(call);
              return answer.throws ? Promise.reject(new Error(answer.throws)) : Promise.resolve(answer);
            },
          };
          return builder;
        },
      };
    },
  };
  return { client, calls };
}

test('the owner probe: one exact count of the owner\'s rows, zero rows fetched', async () => {
  const { client, calls } = mockClient([{ count: 2, error: null }]);
  assert.deepEqual(await probeOwner(client, 'orders', USER_A), { status: 'PASS', detail: '2 own row(s)' });
  assert.deepEqual(calls, [
    { table: 'orders', column: 'user_id', opts: { count: 'exact' }, filters: [['eq', 'user_id', USER_A]], limit: 0 },
  ]);
});

test('the other-user probe: the count of rows not the caller\'s (a null user_id too), then the total; never rows', async () => {
  const { client, calls } = mockClient([{ count: 2, error: null }, { count: 3, error: null }]);
  assert.deepEqual(await probeForeign(client, 'orders', USER_B), {
    status: 'LEAK',
    detail: "2 of 3 row(s) the caller sees are not the caller's",
  });
  assert.deepEqual(calls, [
    { table: 'orders', column: 'user_id', opts: { count: 'exact' }, filters: [['or', `user_id.neq.${USER_B},user_id.is.null`]], limit: 0 },
    { table: 'orders', column: 'user_id', opts: { count: 'exact' }, filters: [], limit: 0 },
  ]);
});

test('the peer probe counts the owner\'s rows; the signed-out and public probes count the whole table', async () => {
  const peer = mockClient([{ count: 2, error: null }]);
  assert.equal((await probePeer(peer.client, 'orders', USER_A)).status, 'PASS');
  assert.deepEqual(peer.calls[0].filters, [['eq', 'user_id', USER_A]]);
  const out = mockClient([{ count: 0, error: null }]);
  assert.equal((await probeSignedOut(out.client, 'orders')).status, 'PASS');
  assert.deepEqual(out.calls[0], { table: 'orders', column: '*', opts: { count: 'exact' }, filters: [], limit: 0 });
  const pub = mockClient([{ count: 3, error: null }]);
  assert.equal((await probePublic(pub.client, 'orders')).status, 'PASS');
});

test('no probe ever fetches rows or uses HEAD: every request is an exact count with limit 0', async () => {
  const clients = [
    [probeOwner, [{ count: 1 }], [USER_A]],
    [probeForeign, [{ count: 0 }, { count: 1 }], [USER_B]],
    [probePeer, [{ count: 1 }], [USER_A]],
    [probeSignedOut, [{ count: 0 }], []],
    [probePublic, [{ count: 1 }], []],
  ];
  for (const [probe, answers, args] of clients) {
    const { client, calls } = mockClient(answers);
    await probe(client, 'orders', ...args);
    for (const call of calls) {
      assert.equal(call.limit, 0, probe.name);
      assert.equal(call.opts.count, 'exact', probe.name);
      assert.equal(call.opts.head, undefined, `${probe.name}: HEAD hides the error code`);
    }
  }
});

test('a request that fails is classified by its code; one that throws is a FAIL', async () => {
  const denied = mockClient([{ count: null, error: permissionDenied }]);
  assert.equal((await probeOwner(denied.client, 'orders', USER_A)).status, 'FAIL');
  const deniedForeign = mockClient([{ count: null, error: permissionDenied }]);
  assert.equal((await probeForeign(deniedForeign.client, 'orders', USER_B)).status, 'PASS');
  assert.equal(deniedForeign.calls.length, 1, 'the total is not asked once the first count was refused');
  const threw = mockClient([{ throws: 'boom' }]);
  const r = await probeSignedOut(threw.client, 'orders');
  assert.equal(r.status, 'FAIL');
  assert.match(r.detail, /threw: boom/);
});

test('a user id that is not a UUID is refused before any request reaches the client', async () => {
  const { client, calls } = mockClient([]);
  for (const probe of [probeOwner, probeForeign, probePeer]) {
    const r = await probe(client, 'orders', 'x; drop table orders;--');
    assert.equal(r.status, 'FAIL');
    assert.match(r.detail, /not a UUID/);
  }
  assert.equal(calls.length, 0);
});

// ---- the clients ------------------------------------------------------------------------------------------------

test('localRootFetch drops supabase-js\'s /rest/v1 prefix (a bare PostgREST serves at the root) and nothing else', async () => {
  const seen = [];
  const fetchStub = async (url, init) => { seen.push([String(url), init]); return 'response'; };
  const f = localRootFetch(fetchStub);
  assert.equal(await f('http://10.0.0.2:3000/rest/v1/orders?select=user_id&limit=0', { method: 'GET' }), 'response');
  await f('http://10.0.0.2:3000/other/rest/v1/orders');
  await f(new URL('http://10.0.0.2:3000/rest/v1/'));
  assert.deepEqual(seen.map(([url]) => url), [
    'http://10.0.0.2:3000/orders?select=user_id&limit=0',
    'http://10.0.0.2:3000/other/rest/v1/orders',
    'http://10.0.0.2:3000/',
  ]);
  assert.deepEqual(seen[0][1], { method: 'GET' });
  assert.throws(() => f(new Request('http://10.0.0.2:3000/rest/v1/orders')), /unexpected fetch input/);
});

test('makeClient: the user\'s token goes in global.headers as Authorization and apikey; the visitor has the anon key only; no session is kept', () => {
  const calls = [];
  const create = (url, key, options) => { calls.push({ url, key, options }); return {}; };
  makeClient(create, 'http://10.0.0.2:3000', 'ANON.JWT', 'USER.JWT', fetch);
  makeClient(create, 'http://10.0.0.2:3000', 'ANON.JWT', null, fetch);
  assert.equal(calls[0].key, 'ANON.JWT');
  assert.deepEqual(calls[0].options.global.headers, { Authorization: 'Bearer USER.JWT', apikey: 'USER.JWT' });
  assert.deepEqual(calls[1].options.global.headers, {});
  for (const c of calls) {
    assert.deepEqual(c.options.auth, { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false });
    assert.equal(typeof c.options.global.fetch, 'function');
  }
});

// ---- replay-tokens.mjs ------------------------------------------------------------------------------------------

const decode = (part) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

test('tokens: HS256, signed over "header.payload" with the secret, claims as PostgREST and auth.uid() read them', () => {
  const now = Date.UTC(2026, 10, 6, 12, 0, 0);
  const iat = now / 1000;
  const token = userToken(SECRET, USER_A, now);
  const [head, body, sig] = token.split('.');
  assert.deepEqual(decode(head), { alg: 'HS256', typ: 'JWT' });
  assert.deepEqual(decode(body), { role: 'authenticated', sub: USER_A, aud: 'authenticated', iat, exp: iat + 3600 });
  assert.equal(sig, createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url'));
  assert.equal(TOKEN_LIFETIME_SECONDS, 3600);
  assert.doesNotMatch(token, /[=+/]/, 'base64url, no padding');
});

test('tokens: the anon token has role anon and no user; every token expires in one hour', () => {
  const now = Date.UTC(2026, 10, 6, 12, 0, 0);
  const claims = decode(anonToken(SECRET, now).split('.')[1]);
  assert.deepEqual(claims, { role: 'anon', iat: now / 1000, exp: now / 1000 + 3600 });
  const live = decode(anonToken(SECRET).split('.')[1]);
  assert.equal(live.exp - live.iat, 3600);
  assert.ok(Math.abs(live.iat - Date.now() / 1000) < 5);
});

test('tokens: one per user id, signed with the secret it was given (a different secret is a different signature)', () => {
  const a = userToken(SECRET, USER_A);
  const b = userToken(SECRET, USER_B);
  assert.equal(decode(a.split('.')[1]).sub, USER_A);
  assert.equal(decode(b.split('.')[1]).sub, USER_B);
  assert.notEqual(a, b);
  assert.notEqual(userToken(SECRET, USER_A, 0).split('.')[2], userToken('another-secret-another-secret-0000', USER_A, 0).split('.')[2]);
});

test('tokens: no secret and a user id that is not a UUID are refused', () => {
  assert.throws(() => signJwt({ role: 'anon' }, ''), /no JWT secret/);
  assert.throws(() => anonToken(undefined), /no JWT secret/);
  assert.throws(() => userToken(SECRET, 'not-a-uuid'), /must be a UUID/);
  assert.throws(() => userToken(SECRET, undefined), /must be a UUID/);
});

test('the two test users are the two auth.users rows the fixture seeds, and no others', () => {
  const seed = readFileSync(new URL('./verify-rls-fixture/seed.sql', import.meta.url), 'utf8');
  const ids = new Set(seed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi));
  assert.deepEqual([...ids].sort(), [USER_A, USER_B].sort());
});

// ---- run(), end to end through supabase-js, against a stand-in for PostgREST ------------------------------------
// The stand-in answers the way PostgREST does for these requests: it reads the token (a signature made with another
// secret is PGRST301), asks the table's `see(role, sub)` which rows that caller may see, or 'denied' for a refusal
// (401 for anon, 403 for authenticated, 42501 either way), applies the user_id filters, and answers a limit-0 count
// as `Content-Range: */N` with no rows (206 when there are some).

const rowsOf = (...ids) => ids.map((user_id) => ({ user_id }));
const ROWS = rowsOf(USER_A, USER_A, USER_B);
const signedIn = (role) => role === 'authenticated';

// The three kinds as the fixture builds them.
const goodWorld = () => ({
  fx_own: { see: (role, sub) => (signedIn(role) ? ROWS.filter((r) => r.user_id === sub) : 'denied') },
  fx_shared: { see: (role) => (signedIn(role) ? ROWS : 'denied') },
  fx_public: { see: () => ROWS },
});
const goodCatalog = () => ({
  fx_own: table(),
  fx_shared: table(),
  fx_public: table({ grants: { anon: ['SELECT'], authenticated: ['SELECT'] } }),
});
const FIXTURE_LIST = { fx_own: 'own', fx_shared: 'signed-in', fx_public: 'public' };

function verifyJwt(token, secret) {
  const [head, body, sig] = token.split('.');
  if (!sig || createHmac('sha256', secret).update(`${head}.${body}`).digest('base64url') !== sig) return null;
  return decode(body);
}

function fakePostgrest(tables, secret) {
  const sendJson = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json', ...headers });
    res.end(JSON.stringify(body));
  };
  return createServer((req, res) => {
    const url = new URL(req.url, 'http://stand-in');
    const claims = verifyJwt((req.headers.authorization ?? '').replace(/^Bearer /, ''), secret);
    if (!claims) return sendJson(res, 401, { code: 'PGRST301', message: 'JWSError JWSInvalidSignature' });
    const name = url.pathname.slice(1);
    if (!tables[name]) return sendJson(res, 404, { code: '42P01', message: `relation "public.${name}" does not exist` });
    const seen = tables[name].see(claims.role, claims.sub);
    if (seen === 'denied') {
      return sendJson(res, claims.role === 'anon' ? 401 : 403, { code: '42501', message: `permission denied for table ${name}` });
    }
    let rows = seen;
    const eq = url.searchParams.get('user_id');
    if (eq) rows = rows.filter((r) => r.user_id === eq.replace(/^eq\./, ''));
    const or = /^\(user_id\.neq\.([^,]+),user_id\.is\.null\)$/.exec(url.searchParams.get('or') ?? '');
    if (or) rows = rows.filter((r) => r.user_id !== or[1]);
    if (url.searchParams.get('limit') !== '0') return sendJson(res, 400, { code: 'TEST', message: 'a probe asked for rows' });
    return sendJson(res, rows.length > 0 ? 206 : 200, [], { 'content-range': `*/${rows.length}` });
  });
}

// Runs verify-rls against the stand-in: { code, text }. `secret` is what the tokens are signed with.
async function runAgainst({ world, list = FIXTURE_LIST, catalog = goodCatalog(), secret = SECRET, serverSecret = SECRET, extra = [] }) {
  const dir = mkdtempSync(join(tmpdir(), 'verify-rls-'));
  writeFileSync(join(dir, 'access.json'), JSON.stringify(list));
  writeFileSync(join(dir, 'catalog.json'), JSON.stringify(catalog));
  const server = fakePostgrest(world, serverSecret);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const lines = [];
  try {
    const code = await run(
      ['--access', join(dir, 'access.json'), '--local', `http://127.0.0.1:${server.address().port}`, '--catalog', join(dir, 'catalog.json'), ...extra],
      { RLS_JWT_SECRET: secret },
      { out: (line) => lines.push(line), err: (line) => lines.push(line) },
    );
    return { code, text: lines.join('\n') };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

const line = (text, label, table) => {
  const rows = text.split('\n');
  const start = rows.findIndex((r) => r.startsWith(table));
  return rows.slice(start + 1).find((r) => r.trim().startsWith(label));
};

test('run: the three kinds as the fixture builds them pass every check (exit 0)', async () => {
  const { code, text } = await runAgainst({ world: goodWorld() });
  assert.equal(code, 0, text);
  assert.match(text, /verify-rls: 3 tables, 10 checks — 10 pass, 0 leak, 0 fail/);
  assert.match(text, /verify-rls: ok/);
  assert.match(line(text, 'catalog', 'fx_own'), /PASS  RLS on; grants: authenticated=SELECT/);
  assert.match(line(text, 'A reads own rows', 'fx_own'), /PASS  2 own row\(s\)/);
  assert.match(line(text, 'signed out reads rows', 'fx_own'), /PASS  permission denied \(42501\)/);
  assert.match(line(text, 'B counts A', 'fx_shared'), /PASS  2 row\(s\) of the other user's visible/);
  assert.match(line(text, 'signed out reads rows', 'fx_public'), /PASS  3 row\(s\) visible/);
  assert.doesNotMatch(text, /eyJ|Bearer|secret/i, 'no token and no secret is printed');
});

test('run: an own table that shows B everything is a LEAK (exit 1)', async () => {
  const world = goodWorld();
  world.fx_own.see = (role) => (signedIn(role) ? ROWS : 'denied'); // RLS off, or `using (true)`
  const { code, text } = await runAgainst({ world });
  assert.equal(code, 1);
  assert.match(line(text, "B counts rows not B's", 'fx_own'), /LEAK  2 of 3 row\(s\) the caller sees are not the caller's/);
  assert.match(text, /1 leak/);
});

test('run: a signed-out visitor who reads rows is a LEAK, on an own table and on a signed-in one', async () => {
  const world = goodWorld();
  world.fx_own.see = () => ROWS;
  world.fx_shared.see = () => ROWS;
  const { code, text } = await runAgainst({ world });
  assert.equal(code, 1);
  assert.match(line(text, 'signed out reads rows', 'fx_own'), /LEAK  3 row\(s\) visible to a signed-out visitor/);
  assert.match(line(text, 'signed out reads rows', 'fx_shared'), /LEAK/);
});

test('run: a refusal for the owner is a FAIL (a missing grant), never a pass', async () => {
  const world = goodWorld();
  world.fx_own.see = () => 'denied'; // `revoke select ... from authenticated`
  const { code, text } = await runAgainst({ world });
  assert.equal(code, 1);
  assert.match(line(text, 'A reads own rows', 'fx_own'), /FAIL  permission denied \(42501\) where rows are expected/);
  assert.match(line(text, "B counts rows not B's", 'fx_own'), /PASS  permission denied/);
});

test('run: an own table that answers nothing to anyone (auth.uid() null) fails the owner, not the rest', async () => {
  const world = goodWorld();
  world.fx_own.see = (role) => (signedIn(role) ? [] : 'denied');
  const { code, text } = await runAgainst({ world });
  assert.equal(code, 1);
  assert.match(line(text, 'A reads own rows', 'fx_own'), /FAIL  0 own rows/);
  assert.match(line(text, "B counts rows not B's", 'fx_own'), /PASS  0 own row\(s\), 0 not the caller's/);
  assert.match(text, /1 fail/);
});

test('run: a signed-in table B cannot read, and a public table with no grant for anon, are FAILs', async () => {
  const world = goodWorld();
  world.fx_shared.see = (role, sub) => (signedIn(role) ? ROWS.filter((r) => r.user_id === sub) : 'denied'); // the own policy
  world.fx_public.see = (role) => (role === 'anon' ? 'denied' : ROWS);
  const { code, text } = await runAgainst({ world });
  assert.equal(code, 1);
  assert.match(line(text, "B counts A's rows", 'fx_shared'), /FAIL  0 of the other user's rows visible/);
  assert.match(line(text, 'signed out reads rows', 'fx_public'), /FAIL  permission denied \(42501\) where rows are expected/);
  assert.match(line(text, 'A reads rows', 'fx_public'), /PASS/);
});

test('run: tokens signed with another secret fail every probe, none pass (PGRST301)', async () => {
  const { code, text } = await runAgainst({ world: goodWorld(), secret: 'another-secret-another-secret-another-00' });
  assert.equal(code, 1);
  const probes = text.split('\n').filter((l) => / (A|B|signed out) /.test(l) && /(PASS|FAIL|LEAK)/.test(l));
  assert.equal(probes.length, 7);
  for (const l of probes) assert.match(l, /FAIL  error \[PGRST301\]/);
  assert.match(text, /7 fail/);
});

test('run: a table the database does not have fails the catalog check and every probe', async () => {
  const { code, text } = await runAgainst({ world: { fx_own: goodWorld().fx_own }, list: { fx_own: 'own', ghost: 'own' }, catalog: { fx_own: table() } });
  assert.equal(code, 1);
  assert.match(line(text, 'catalog', 'ghost'), /FAIL  not in the replayed database/);
  assert.match(line(text, 'A reads own rows', 'ghost'), /FAIL  error \[42P01\]/);
});

test('run: a table with RLS off fails the catalog check even when every probe passes', async () => {
  const catalog = goodCatalog();
  catalog.fx_shared.rls = false;
  const { code, text } = await runAgainst({ world: goodWorld(), catalog });
  assert.equal(code, 1);
  assert.match(line(text, 'catalog', 'fx_shared'), /FAIL  RLS is off/);
  assert.match(text, /0 leak, 1 fail/);
});

test('run: an empty list passes and says so (the starter has no tables)', async () => {
  const { code, text } = await runAgainst({ world: {}, list: {}, catalog: {} });
  assert.equal(code, 0);
  assert.match(text, /verify-rls: 0 tables: the access list \(.*access\.json\) is empty, so there is nothing to probe\./);
});

test('run: a table marked ahead is probed like any other', async () => {
  const { code, text } = await runAgainst({ world: goodWorld(), list: { fx_own: { kind: 'own', ahead: true } }, catalog: { fx_own: table() } });
  assert.equal(code, 0, text);
  assert.match(text, /fx_own\s+own \(ahead\)/);
});

test('run: bad arguments, an unreadable list or catalog, a bad list and no secret are exit 2, never a pass', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'verify-rls-'));
  const ok = (name, text) => { const p = join(dir, name); writeFileSync(p, text); return p; };
  const list = ok('access.json', JSON.stringify(FIXTURE_LIST));
  const catalog = ok('catalog.json', '{}');
  const quiet = { out: () => {}, err: () => {} };
  const env = { RLS_JWT_SECRET: SECRET };
  const cases = [
    [[], env],
    [['--local', 'http://x'], env],
    [['--local', 'http://x', '--catalog', catalog, '--bogus'], env],
    [['--local', 'http://x', '--catalog', catalog, '--fixture', '--access', list], env],
    [['--local', 'not-a-url', '--catalog', catalog, '--access', list], env],
    [['--local', 'http://x', '--catalog', join(dir, 'missing.json'), '--access', list], env],
    [['--local', 'http://x', '--catalog', catalog, '--access', join(dir, 'missing.json')], env],
    [['--local', 'http://x', '--catalog', catalog, '--access', ok('bad.json', '{"t": "mine"}')], env],
    [['--local', 'http://x', '--catalog', catalog, '--access', ok('notjson.json', 'nope')], env],
    [['--local', 'http://x', '--catalog', ok('arr.json', '[]'), '--access', list], env],
    [['--local', 'http://x', '--catalog', catalog, '--access', list], {}],
  ];
  for (const [argv, e] of cases) assert.equal(await run(argv, e, quiet), 2, argv.join(' '));
});

// Runs a program in `cwd` and answers { code, out } (stdout and stderr together).
const exec = (program, args, cwd) =>
  new Promise((resolve) => {
    execFile(program, args, { encoding: 'utf8', cwd }, (err, stdout, stderr) => {
      resolve({ code: err ? err.code : 0, out: String(stdout) + String(stderr) });
    });
  });

test('the script itself: no arguments is exit 2 with the usage line', async () => {
  const result = await exec(process.execPath, [SCRIPT]);
  assert.equal(result.code, 2);
  assert.match(result.out, /usage: node scripts\/verify-rls\.mjs/);
});

// ---- the wrapper and the workflow --------------------------------------------------------------------------------
// scripts/verify-rls-replay.sh needs Docker, so what can be tested without it is: the refusals before Docker, and
// its text (a tripwire, as check-embeds.test.mjs does for check-embeds-local.sh). The behaviour was proven on the
// real replay: the fixture's ten checks pass, and each break proof in TASKS.md (chunk 3) fails the right probe.

const text = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const codeOf = (path) => text(path).split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');

test('verify-rls-replay.sh refuses an argument it does not know, and a missing node_modules, with exit 2 before any Docker', async () => {
  const wrapper = new URL('./verify-rls-replay.sh', import.meta.url).pathname;
  const bad = await exec('bash', [wrapper, '--bogus']);
  assert.equal(bad.code, 2);
  assert.match(bad.out, /usage: bash scripts\/verify-rls-replay\.sh \[--fixture\]/);
  const empty = mkdtempSync(join(tmpdir(), 'verify-rls-'));
  const noModules = await exec('bash', [wrapper], empty);
  assert.equal(noModules.code, 2);
  assert.match(noModules.out, /node_modules\/@supabase\/supabase-js is missing: run npm ci first/);
});

test('verify-rls-replay.sh runs PostgREST as a hosted project does: connecting as authenticator, the signed-out caller the real anon', () => {
  const code = codeOf('./verify-rls-replay.sh');
  assert.match(code, /PGRST_DB_URI="postgres:\/\/authenticator:/);
  assert.doesNotMatch(code, /postgres:\/\/postgres:/, 'connecting as postgres loads no safeupdate');
  assert.match(code, /-e PGRST_DB_ANON_ROLE=anon\b/);
  assert.doesNotMatch(code, /PGRST_DB_ANON_ROLE=postgres\b/, 'check-embeds-local.sh probes as postgres; this one must not');
  assert.match(code, /-e PGRST_DB_SCHEMAS=public\b/);
  assert.match(code, /alter role authenticator with password/);
  assert.match(code, /postgrest\/postgrest:v12\.2\.3/);
});

test('verify-rls-replay.sh proves the session is authenticator\'s before it probes, and removes both containers', () => {
  const code = codeOf('./verify-rls-replay.sh');
  const at = (needle) => code.indexOf(needle);
  assert.ok(at('bash scripts/replay-migrations.sh --keep') >= 0);
  assert.ok(at('alter role authenticator') > at('replay-migrations.sh'), 'the password is set on the replayed database');
  assert.ok(at('pg_stat_activity') > at('docker run -d'), 'the sessions are read once PostgREST is up');
  assert.ok(at('delete from pg_catalog.pg_database') > at('pg_stat_activity'));
  assert.ok(at('node scripts/verify-rls.mjs') > at('delete from pg_catalog.pg_database'), 'the probes come after the proof');
  assert.match(code, /--catalog "\$tmp\/catalog\.json"/);
  assert.match(code, /docker rm -f "\$api" "\$db"/);
  assert.match(code, /trap cleanup EXIT/);
});

test('replay-migrations.sh --fixture replays the fixture after the app\'s migrations, the seed last', () => {
  const code = codeOf('./replay-migrations.sh');
  assert.match(code, /--fixture\) fixture=1; shift ;;/);
  assert.ok(code.indexOf('for f in "${fixture_files[@]}"') > code.indexOf('for f in "${files[@]}"'));
  assert.match(code, /fixture_files\+=\(seed\.sql\)/);
  assert.match(code, /FIXTURE_DIR="scripts\/verify-rls-fixture"/);
});

test('the migration-replay workflow runs the sign-ups check, then the self-test and the app\'s list once npm ci has run', () => {
  const runs = [...text('../.github/workflows/migration-replay.yml').matchAll(/^\s+run: (.+)$/gm)].map((m) => m[1].trim());
  const step = (command) => {
    assert.ok(runs.includes(command), `the workflow has no step \`${command}\``);
    return runs.indexOf(command);
  };
  assert.ok(step('node scripts/check-signups.mjs') >= 0);
  assert.ok(step('npm ci') < step('bash scripts/verify-rls-replay.sh --fixture'));
  assert.ok(step('bash scripts/verify-rls-replay.sh --fixture') < step('bash scripts/verify-rls-replay.sh'));
});
