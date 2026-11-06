// check-embeds.mjs
//
// Every app query that embeds a related table (`.select('…, other(…)')`) must
// still resolve after a migration. A new foreign key between two tables that
// already had one makes an un-hinted embed ambiguous, and PostgREST answers
// PGRST201 instead of rows (Overload's migration 027 did exactly that to
// v2_mesocycles → v2_programs and the app showed no mesocycles, 2026-10-04).
// The migration replay can't see it: it is PostgREST's relationship resolution,
// not SQL.
//
// This script finds every `.from('t') … .select('…(…)…')` in src/ and asks a
// PostgREST server to resolve it with limit=0, so no rows can come back.
//
// What counts as a pass: the scan must have read at least one source file under
// src/. A missing src/ is exit 2 ("no src/ to scan"), and so is a src/ with no
// source file in it (the scan read nothing). Zero embeds in the files it did
// read is a pass: a fresh app has none. (Overload fails on zero embeds because
// it has many; here the unit tests of findEmbeds guard "the pattern is broken".)
//
// Usage:  node scripts/check-embeds.mjs --local URL   a local PostgREST (scripts/check-embeds-local.sh)
//         node scripts/check-embeds.mjs --list        print what it found, probe nothing
// Exit:   0 = every embed resolves, or there are none; 1 = any doesn't; 2 = couldn't run.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = 'src';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== 'node_modules') walk(p, out); }
    else if (/\.(ts|tsx)$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

// One `.from('table')` followed, before the next `.from(`, by a `.select('literal')`
// whose literal contains a parenthesis (an embed).
export function findEmbeds(source, file = '') {
  const found = [];
  // The gap may not cross another `.from(`: otherwise a select-less query would
  // stretch into the next one and swallow it (found 2026-10-04 on sessionService.ts).
  const re = /\.from\(\s*(['"`])([a-z0-9_]+)\1\s*\)((?:(?!\.from\()[\s\S]){0,600}?)\.select\(\s*(['"`])([\s\S]*?)\4/g;
  let m;
  while ((m = re.exec(source))) {
    const select = m[5].replace(/\s+/g, '');
    if (!select.includes('(')) continue;
    found.push({ file, line: source.slice(0, m.index).split('\n').length, table: m[2], select });
  }
  return found;
}

// A local PostgREST serves at the root, so the table follows the base directly.
export function probeUrl(base, e) {
  return `${base}/${e.table}?select=${encodeURIComponent(e.select)}&limit=0`;
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] !== '--list' && args[0] !== '--local') {
    console.error('check-embeds: usage: node scripts/check-embeds.mjs --local URL | --list');
    process.exit(2);
  }
  if (!existsSync(SRC) || !statSync(SRC).isDirectory()) {
    console.error(`check-embeds: no ${SRC}/ to scan. Treat as failed.`);
    process.exit(2);
  }
  const files = walk(SRC);
  if (files.length === 0) {
    console.error(`check-embeds: no source files under ${SRC}/ — the scan read nothing. Treat as failed.`);
    process.exit(2);
  }
  const embeds = files.flatMap((f) => findEmbeds(readFileSync(f, 'utf8'), f));
  const scanned = `${embeds.length} embedding selects in ${files.length} source file(s) under ${SRC}/`;
  if (args[0] === '--list') {
    for (const e of embeds) console.log(`${e.file}:${e.line} ${e.table} ${e.select}`);
    console.log(`check-embeds: ${scanned}.`);
    return;
  }
  // A local PostgREST serves at the root, not under /rest/v1.
  const base = (args[1] ?? '').replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  if (!base) { console.error('check-embeds: no target (--local URL).'); process.exit(2); }
  let bad = 0;
  for (const e of embeds) {
    let status, body;
    try {
      const res = await fetch(probeUrl(base, e));
      status = res.status; body = await res.json().catch(() => null);
    } catch (err) { status = 'ERR'; body = { code: String(err.message || err) }; }
    const ok = status === 200 && Array.isArray(body);
    if (!ok) bad++;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${status} ${ok ? '' : (body?.code ?? '') + ' '}${e.file}:${e.line} ${e.table}`);
  }
  console.log(`check-embeds: ${scanned}; ${embeds.length - bad} resolve, ${bad} don't (local ${base}).`);
  process.exit(bad ? 1 : 0);
}

// Run only as a script (the tests import findEmbeds). pathToFileURL, not a string built
// from argv: a path with a space or a non-ASCII letter would otherwise skip main() and exit 0.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
