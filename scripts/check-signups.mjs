// check-signups.mjs
//
// Sign-ups must be off while any table is `signed-in`. With open sign-up a
// stranger could create an account and read a firm's data (SPEC.md, "Shared
// scripts", the sign-ups check; Rule 5: sign-ups are off in every app built from
// the starter, and an app that needs open sign-up has no `signed-in` tables).
//
// It reads two files from the repo root:
//   supabase/config.toml   the declared intent for [auth] and [auth.email]
//   supabase/access.json   the table access list: one key per table or view, the
//                          value its kind, "own" | "signed-in" | "public", or an
//                          object { "kind": "...", "ahead": true }
//
// Fails (exit 1) when
//   1. any table is `signed-in` and `[auth] enable_signup` is not `false`. A
//      missing key means ON (Supabase's default), so it fails too;
//   2. `[auth.email] enable_signup` is `false`, whatever the tables. That key is
//      not a sign-up switch: the CLI maps it to "e-mail provider enabled", and
//      false turned e-mail sign-in off for everyone (Overload, 2026-10-14).
// Anything else passes. `[auth.sms] enable_signup = false` is not a hit: only the
// key in the section named exactly counts. An app whose tables are all `own` may
// have sign-ups on (Rule 5), and the check stays silent about it by design.
//
// The TOML is read by regex, the keys within their [section] headers, as the
// Supabase CLI writes the file (no TOML dependency). Dotted keys (`email.enable_signup`
// under [auth]) and inline tables are not read; a missing [auth] key fails safe (rule 1),
// but a missing [auth.email] key is not a hit (rule 2). `config.toml` does not reach the
// hosted project (the new-app checklist's step 2 does that), and a [remotes.*] block's
// keys are not read: this check guards the declared intent in this file only.
//
// Usage:  node scripts/check-signups.mjs [configPath [accessPath]]
// Exit:   0 = ok; 1 = failed; 2 = couldn't check (treat exactly like 1)

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// "auth.email" from `[ auth . email ]`: whitespace around dots dropped, quotes stripped.
function sectionName(raw) {
  return raw.split('.').map((p) => p.trim().replace(/^(["'])(.*)\1$/, '$2')).join('.');
}

// Every value written for `key` in `[section]`: the raw text after `=`, comment dropped.
// An empty list means the key is not there. A [[table]] array and a key before any
// header never match a plain section.
export function readKeys(toml, section, key) {
  const values = [];
  let current = null;
  for (const raw of toml.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    let m = /^\[\[\s*([^\]]+?)\s*\]\]\s*(?:#.*)?$/.exec(line);
    if (m) { current = `[[${sectionName(m[1])}]]`; continue; }
    m = /^\[\s*([^[\]]+?)\s*\]\s*(?:#.*)?$/.exec(line);
    if (m) { current = sectionName(m[1]); continue; }
    m = /^([A-Za-z0-9_-]+|"[^"]*"|'[^']*')\s*=\s*(.*)$/.exec(line);
    if (m && current === section && m[1] === key) values.push(m[2].replace(/\s*#.*$/, '').trim());
  }
  return values;
}

const kindOf = (value) => (typeof value === 'string' ? value : value?.kind);

// Pure: the config text and the parsed access list in, the verdict out.
export function checkSignups(toml, access) {
  const tables = Object.keys(access);
  const signedIn = tables.filter((t) => kindOf(access[t]) === 'signed-in');
  const authSignup = readKeys(toml, 'auth', 'enable_signup');
  const emailSignup = readKeys(toml, 'auth.email', 'enable_signup');
  const signupsOff = authSignup.length > 0 && authSignup.every((v) => v === 'false');
  const emailOff = emailSignup.some((v) => v === 'false');
  const problems = [];

  if (signedIn.length > 0 && !signupsOff) {
    const names = signedIn.map((t) => `\`${t}\``).join(', ');
    const found = authSignup.length === 0
      ? 'is missing (a missing key means sign-ups are on)'
      : `is ${authSignup.join(' / ')}`;
    problems.push(
      `${names} ${signedIn.length > 1 ? 'are' : 'is'} signed-in, but [auth] enable_signup ${found}: ` +
      `a stranger could sign up and read ${signedIn.length > 1 ? 'their' : 'its'} rows. ` +
      'Set enable_signup = false under [auth] in supabase/config.toml.',
    );
  }
  if (emailOff) {
    problems.push(
      '[auth.email] enable_signup is false: that turns e-mail sign-in off for everyone, it is not the sign-up switch ' +
      '(Overload, 2026-10-14). Set it to true; sign-ups are off through [auth] enable_signup = false.',
    );
  }
  return { ok: problems.length === 0, problems, tables, signedIn, signupsOff, emailOff };
}

function main() {
  const [configPath = 'supabase/config.toml', accessPath = 'supabase/access.json'] = process.argv.slice(2);
  let toml, access;
  try { toml = readFileSync(configPath, 'utf8'); } catch {
    console.error(`check-signups: can't read ${configPath}. Treat as failed.`);
    return 2;
  }
  try { access = JSON.parse(readFileSync(accessPath, 'utf8')); } catch (e) {
    console.error(`check-signups: can't read ${accessPath} as JSON (${String(e.message || e)}). Treat as failed.`);
    return 2;
  }
  if (access === null || typeof access !== 'object' || Array.isArray(access)) {
    console.error(`check-signups: ${accessPath} must be one object, table name to kind. Treat as failed.`);
    return 2;
  }

  const r = checkSignups(toml, access);
  if (!r.ok) {
    console.log('check-signups: FAILED\n');
    for (const p of r.problems) console.log(`- ${p}`);
    return 1;
  }
  const tables = `${r.tables.length} table(s) in the access list`;
  console.log(r.signupsOff
    ? `check-signups: OK — ${tables}, ${r.signedIn.length} signed-in; sign-ups are off ([auth] enable_signup = false); e-mail sign-in is on.`
    : `check-signups: OK — ${tables}, none signed-in; sign-ups are on, which is allowed only while no table is signed-in; e-mail sign-in is on.`);
  return 0;
}

// Run only as a script (the tests import the two functions above).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
