// check-signups.test.mjs — run with: node --test "scripts/*.test.mjs"
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkSignups, readKeys } from './check-signups.mjs';

const SCRIPT = new URL('./check-signups.mjs', import.meta.url).pathname;
const REAL_CONFIG = new URL('../supabase/config.toml', import.meta.url).pathname;
const REAL_ACCESS = new URL('../supabase/access.json', import.meta.url).pathname;

// A config with the two sections the check reads; each value is a line or null to leave it out.
const config = ({ auth = 'enable_signup = false', email = 'enable_signup = true', sms = 'enable_signup = false' } = {}) => `
project_id = "t"
[auth]
enabled = true
${auth ?? ''}
[auth.email]
${email ?? ''}
double_confirm_changes = true
[auth.sms]
${sms ?? ''}
enable_confirmations = false
`;

// ---------------------------------------------------------------- readKeys

test('readKeys reads a key inside the section named exactly, and only there', () => {
  const toml = `[auth]\nenable_signup = false\n[auth.email]\nenable_signup = true\n[auth.sms]\nenable_signup = false\n[remotes.x.auth]\nenable_signup = true\n`;
  assert.deepEqual(readKeys(toml, 'auth', 'enable_signup'), ['false']);
  assert.deepEqual(readKeys(toml, 'auth.email', 'enable_signup'), ['true']);
  assert.deepEqual(readKeys(toml, 'auth.sms', 'enable_signup'), ['false']);
  assert.deepEqual(readKeys(toml, 'remotes.x.auth', 'enable_signup'), ['true']);
  assert.deepEqual(readKeys(toml, 'auth.phone', 'enable_signup'), []);
});

test('readKeys: a commented-out key does not count, an end-of-line comment is dropped', () => {
  assert.deepEqual(readKeys(`[auth]\n# enable_signup = true\n  # enable_signup = true\n`, 'auth', 'enable_signup'), []);
  assert.deepEqual(readKeys(`[auth]\nenable_signup = false # off, SPEC Rule 5\n`, 'auth', 'enable_signup'), ['false']);
  assert.deepEqual(readKeys(`[auth] # the auth section\nenable_signup=false\n`, 'auth', 'enable_signup'), ['false']);
});

test('readKeys: headers with spaces or quotes, CRLF line ends and a leading BOM', () => {
  assert.deepEqual(readKeys('[ auth . email ]\r\nenable_signup = false\r\n', 'auth.email', 'enable_signup'), ['false']);
  assert.deepEqual(readKeys('[auth."email"]\nenable_signup = false\n', 'auth.email', 'enable_signup'), ['false']);
  assert.deepEqual(readKeys('﻿[auth]\nenable_signup = false\n', 'auth', 'enable_signup'), ['false']);
});

test('readKeys: a key before any header, and a [[table]] array, are not a plain section', () => {
  assert.deepEqual(readKeys('enable_signup = true\n[auth]\nx = 1\n', 'auth', 'enable_signup'), []);
  assert.deepEqual(readKeys('[[auth]]\nenable_signup = true\n', 'auth', 'enable_signup'), []);
});

test('readKeys keeps every occurrence, so a repeated key cannot hide behind the first', () => {
  assert.deepEqual(readKeys('[auth]\nenable_signup = false\nenable_signup = true\n', 'auth', 'enable_signup'), ['false', 'true']);
});

// ---------------------------------------------------------------- the rules

test('rule 1: a signed-in table with sign-ups on fails, and names the table', () => {
  const r = checkSignups(config({ auth: 'enable_signup = true' }), { units: 'signed-in', notes: 'own' });
  assert.equal(r.ok, false);
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /`units` is signed-in, but \[auth\] enable_signup is true/);
  assert.doesNotMatch(r.problems[0], /notes/);
});

test('rule 1: the [auth] enable_signup line missing means on, so it fails too', () => {
  const r = checkSignups(config({ auth: null }), { units: 'signed-in' });
  assert.equal(r.ok, false);
  assert.match(r.problems[0], /enable_signup is missing \(a missing key means sign-ups are on\)/);
});

test('rule 1: the near-miss, [auth.sms] enable_signup = false alone, is not the [auth] switch', () => {
  // No [auth] key, only the sms one (and e-mail on): a signed-in table still fails, once, on [auth].
  const r = checkSignups(config({ auth: null }), { units: 'signed-in' });
  assert.equal(r.signupsOff, false);
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /\[auth\] enable_signup/);
  // And a [remotes.*.auth] block does not stand in for [auth] either.
  const remote = checkSignups(`[auth]\nenabled = true\n[remotes.prod.auth]\nenable_signup = false\n[auth.email]\nenable_signup = true\n`, { units: 'signed-in' });
  assert.equal(remote.ok, false);
});

test('rule 1: the [auth.sms] key alone, with no signed-in table, passes (it is not a hit)', () => {
  const r = checkSignups(config({ auth: null, email: null }), {});
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.equal(r.emailOff, false);
});

test('rule 1: sign-ups off with a signed-in table passes, the object form of a kind counts the same', () => {
  assert.equal(checkSignups(config(), { units: 'signed-in' }).ok, true);
  assert.equal(checkSignups(config({ auth: 'enable_signup = true' }), { units: { kind: 'signed-in', ahead: true } }).ok, false);
  assert.equal(checkSignups(config(), { units: { kind: 'signed-in', ahead: true } }).ok, true);
});

test('rule 1: several signed-in tables are all named; own and public tables are not', () => {
  const r = checkSignups(config({ auth: 'enable_signup = true' }), { a: 'signed-in', b: { kind: 'signed-in' }, c: 'own', d: 'public' });
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /`a`, `b` are signed-in/);
  assert.doesNotMatch(r.problems[0], /`c`|`d`/);
});

test('sign-ups on with no signed-in table passes: own and public only, or an empty list (Rule 5 allows it)', () => {
  assert.equal(checkSignups(config({ auth: 'enable_signup = true' }), {}).ok, true);
  assert.equal(checkSignups(config({ auth: 'enable_signup = true' }), { notes: 'own', news: 'public' }).ok, true);
  assert.equal(checkSignups(config({ auth: null }), { notes: 'own' }).ok, true);
});

test('rule 2: [auth.email] enable_signup = false fails whatever the tables', () => {
  for (const access of [{}, { notes: 'own' }, { units: 'signed-in' }, { news: 'public' }]) {
    const r = checkSignups(config({ email: 'enable_signup = false' }), access);
    assert.equal(r.ok, false, JSON.stringify(access));
    assert.equal(r.emailOff, true);
    assert.match(r.problems.at(-1), /\[auth\.email\] enable_signup is false: that turns e-mail sign-in off for everyone/);
  }
});

test('rule 2: true, or the key missing, is not a hit; the sms false beside it is not either', () => {
  assert.equal(checkSignups(config({ email: 'enable_signup = true' }), {}).ok, true);
  assert.equal(checkSignups(config({ email: null }), {}).ok, true);
  assert.equal(checkSignups(config({ email: 'enable_signup = true', sms: 'enable_signup = false' }), {}).ok, true);
  assert.equal(checkSignups(config({ email: null, sms: 'enable_signup = false' }), {}).emailOff, false);
});

test('both rules at once give two problems', () => {
  const r = checkSignups(config({ auth: 'enable_signup = true', email: 'enable_signup = false' }), { units: 'signed-in' });
  assert.equal(r.problems.length, 2);
});

// ---------------------------------------------------------------- the script

function project(configText, accessText) {
  const dir = mkdtempSync(join(tmpdir(), 'signups-'));
  mkdirSync(join(dir, 'supabase'));
  if (configText !== null) writeFileSync(join(dir, 'supabase/config.toml'), configText);
  if (accessText !== null) writeFileSync(join(dir, 'supabase/access.json'), accessText);
  return dir;
}

function run(dir, ...args) {
  try {
    return { code: 0, out: execFileSync(process.execPath, [SCRIPT, ...args], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { code: e.status, out: String(e.stdout) + String(e.stderr) };
  }
}

test('script: reads supabase/config.toml and supabase/access.json from the cwd, exit 0 with a summary', () => {
  const r = run(project(config(), '{ "units": "signed-in" }'));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /check-signups: OK — 1 table\(s\) in the access list, 1 signed-in; sign-ups are off/);
  const empty = run(project(config({ auth: 'enable_signup = true' }), '{}'));
  assert.equal(empty.code, 0, empty.out);
  assert.match(empty.out, /0 table\(s\) in the access list, none signed-in; sign-ups are on/);
});

test('script: a signed-in table with sign-ups on is exit 1, FAILED, with the table and the fix', () => {
  const r = run(project(config({ auth: 'enable_signup = true' }), '{ "units": "signed-in" }'));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /^check-signups: FAILED/);
  assert.match(r.out, /- `units` is signed-in, but \[auth\] enable_signup is true/);
  assert.match(r.out, /Set enable_signup = false under \[auth\]/);
});

test('script: [auth.email] enable_signup = false is exit 1 with an empty access list', () => {
  const r = run(project(config({ email: 'enable_signup = false' }), '{}'));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /- \[auth\.email\] enable_signup is false/);
});

test('script: explicit paths override the defaults', () => {
  const dir = project(config(), '{}');
  writeFileSync(join(dir, 'other.toml'), config({ email: 'enable_signup = false' }));
  assert.equal(run(dir, 'other.toml').code, 1);
  assert.equal(run(dir, 'other.toml', 'supabase/access.json').code, 1);
  assert.equal(run(dir, 'supabase/config.toml', 'supabase/access.json').code, 0);
});

test('script: a missing or unreadable file, bad JSON, or a list that is not one object is exit 2, never 0', () => {
  assert.equal(run(project(null, '{}')).code, 2);
  assert.equal(run(project(config(), null)).code, 2);
  assert.equal(run(project(config(), '{ not json')).code, 2);
  for (const bad of ['[]', 'null', '"own"', '3']) {
    const r = run(project(config(), bad));
    assert.equal(r.code, 2, `${bad}: ${r.out}`);
    assert.match(r.out, /must be one object/);
  }
});

// ---------------------------------------------------------------- the files this repo ships

test('the shipped config and access list pass, and would pass with a signed-in table added', () => {
  const toml = readFileSync(REAL_CONFIG, 'utf8');
  const access = JSON.parse(readFileSync(REAL_ACCESS, 'utf8'));
  const r = checkSignups(toml, access);
  assert.equal(r.ok, true, JSON.stringify(r.problems));
  assert.equal(checkSignups(toml, { ...access, units: 'signed-in' }).ok, true);
});

test('the starter ships sign-ups off and e-mail sign-in on (a derived app that changes this edits this test)', () => {
  const toml = readFileSync(REAL_CONFIG, 'utf8');
  assert.deepEqual(readKeys(toml, 'auth', 'enable_signup'), ['false']);
  assert.deepEqual(readKeys(toml, 'auth.email', 'enable_signup'), ['true']);
  assert.deepEqual(readKeys(toml, 'auth.sms', 'enable_signup'), ['false']);
  assert.deepEqual(readKeys(toml, 'db', 'major_version'), ['17']);
  assert.deepEqual(readKeys(toml, 'db.seed', 'enabled'), ['false']);
  assert.doesNotMatch(toml, /^\s*\[remotes/m);
  assert.match(toml, /^project_id = "starter"$/m);
});
