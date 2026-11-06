// Run: node --test "scripts/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findEmbeds, probeUrl } from './check-embeds.mjs';

const SCRIPT = new URL('./check-embeds.mjs', import.meta.url).pathname;

test('finds an embed and ignores a select with no embed', () => {
  const src = `a.from('t1').select('id, name')\nb.from('t2').eq('x', 1).select('*, other(id)')`;
  const f = findEmbeds(src, 'f.ts');
  assert.equal(f.length, 1);
  assert.deepEqual([f[0].table, f[0].select, f[0].line], ['t2', '*,other(id)', 2]);
});

test('a select-less query does not swallow the next query (the sessionService.ts:466 case)', () => {
  const src = `await supabase.from('v2_sessions').update({ a: 1 }).eq('id', id)\n` +
    `const { data } = await supabase\n  .from('v2_set_logs')\n  .select('*, exercises(*), v2_sessions(id, status)')`;
  const f = findEmbeds(src, 'f.ts');
  assert.equal(f.length, 1);
  assert.equal(f[0].table, 'v2_set_logs');
  assert.equal(f[0].select, '*,exercises(*),v2_sessions(id,status)');
});

test('a probe is the table at the local PostgREST root with limit=0 (no rows can come back), unfiltered', () => {
  const u = probeUrl('http://10.0.0.2:3000', { table: 'orders', select: '*,customers(id)' });
  assert.equal(u, 'http://10.0.0.2:3000/orders?select=*%2Ccustomers(id)&limit=0');
  assert.doesNotMatch(u, /user_id/);
});

// ---- the script itself: the scan floor (Decided 11) and the exit codes ----------------------------
// Each test runs the real script in a throwaway directory that holds the src/ it needs.

function project(files) {
  const dir = mkdtempSync(join(tmpdir(), 'embeds-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, '..'), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

// Async, so that a fake PostgREST in this process can answer while the script runs.
function runScript(script, dir, ...args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8' }, (err, stdout, stderr) => {
      resolve({ code: err ? err.code : 0, out: String(stdout) + String(stderr) });
    });
  });
}
const run = (dir, ...args) => runScript(SCRIPT, dir, ...args);

const WITH_EMBED = { 'src/a.ts': `export const q = supabase.from('orders').select('id, customers(name)');\n` };
const NO_EMBED = { 'src/a.ts': `export const q = supabase.from('orders').select('id, total');\n` };

test('a missing src/ is exit 2 ("no src/ to scan"), in both modes, never a pass', async () => {
  const dir = project({ 'README.md': 'x' });
  for (const args of [['--list'], ['--local', 'http://127.0.0.1:1']]) {
    const r = await run(dir, ...args);
    assert.equal(r.code, 2, r.out);
    assert.match(r.out, /no src\/ to scan/);
  }
});

test('a src/ with no source file in it is exit 2: the scan read nothing', async () => {
  // Only a markdown file and a test file: neither is scanned.
  const dir = project({ 'src/README.md': 'x', 'src/a.test.ts': `supabase.from('t').select('a(b)')` });
  const r = await run(dir, '--list');
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /no source files under src\/ .* read nothing/);
});

test('zero embeds with at least one file scanned is a pass, listing and probing alike', async () => {
  const dir = project(NO_EMBED);
  const list = await run(dir, '--list');
  assert.equal(list.code, 0, list.out);
  assert.match(list.out, /0 embedding selects in 1 source file\(s\) under src\//);
  // Nothing to probe, so an unreachable target changes nothing.
  const local = await run(dir, '--local', 'http://127.0.0.1:1');
  assert.equal(local.code, 0, local.out);
  assert.match(local.out, /0 embedding selects in 1 source file\(s\).*0 resolve, 0 don't/);
});

test('--list prints each embed with its file, line and table, and probes nothing', async () => {
  const r = await run(project(WITH_EMBED), '--list');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /src\/a\.ts:1 orders id,customers\(name\)/);
  assert.match(r.out, /1 embedding selects in 1 source file\(s\)/);
});

test('no mode, or --local without a URL, is exit 2', async () => {
  const dir = project(WITH_EMBED);
  assert.equal((await run(dir)).code, 2);
  const r = await run(dir, '--local');
  assert.equal(r.code, 2, r.out);
  assert.match(r.out, /no target/);
});

// A fake PostgREST: answers per table, records what it was asked.
function fakePostgrest(answers) {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push(req.url);
    const table = req.url.slice(1).split('?')[0];
    const [status, body] = answers[table] ?? [404, { code: 'PGRST205' }];
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, seen, url: `http://127.0.0.1:${server.address().port}` })));
}

test('--local: an embed PostgREST resolves (200, an array) passes, and the probe is limit=0', async () => {
  const fake = await fakePostgrest({ orders: [200, []] });
  try {
    const r = await run(project(WITH_EMBED), '--local', fake.url);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /OK   200 src\/a\.ts:1 orders/);
    assert.match(r.out, /1 resolve, 0 don't/);
    assert.deepEqual(fake.seen, ['/orders?select=id%2Ccustomers(name)&limit=0']);
  } finally { fake.server.close(); }
});

test('--local: an ambiguous embed (PGRST201) is exit 1, and says which', async () => {
  const fake = await fakePostgrest({ orders: [300, { code: 'PGRST201', message: 'more than one relationship' }] });
  try {
    const r = await run(project(WITH_EMBED), '--local', fake.url);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL 300 PGRST201 src\/a\.ts:1 orders/);
    assert.match(r.out, /0 resolve, 1 don't/);
  } finally { fake.server.close(); }
});

test('--local: a PostgREST that cannot be reached fails the embed (exit 1), never passes it', async () => {
  const r = await run(project(WITH_EMBED), '--local', 'http://127.0.0.1:1');
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /FAIL ERR .*src\/a\.ts:1 orders/);
});

// The wrapper needs Docker, so only its text is tested here (a tripwire); the behaviour was proven on the real
// replay: an embed on a table revoked from anon answers OK 200 when probed as postgres and FAIL 401 42501 as anon,
// and a second foreign key still answers PGRST201 either way.
test('check-embeds-local.sh probes PostgREST as postgres, not anon (own and signed-in tables revoke everything from anon)', () => {
  const sh = readFileSync(new URL('./check-embeds-local.sh', import.meta.url), 'utf8');
  const code = sh.split('\n').filter((l) => !l.trim().startsWith('#')).join('\n');
  assert.match(code, /-e PGRST_DB_ANON_ROLE=postgres\b/);
  assert.doesNotMatch(code, /PGRST_DB_ANON_ROLE=anon\b/);
});

test('a script path with a space still runs main() (a guard comparing raw strings would skip it and exit 0)', async () => {
  const dir = project({ 'src/a.ts': `export {};\n` });
  mkdirSync(join(dir, 'tools dir'));
  const copy = join(dir, 'tools dir', 'check-embeds.mjs');
  copyFileSync(SCRIPT, copy);
  // The summary line proves main() ran (a skipped main() prints nothing and exits 0), and the
  // second run proves it still fails when it should.
  const r = await runScript(copy, dir, '--list');
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /0 embedding selects in 1 source file\(s\)/);
  const none = await runScript(copy, project({ 'README.md': 'x' }), '--list');
  assert.equal(none.code, 2, none.out);
});
