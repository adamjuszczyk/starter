// check-migration-order.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// Each test builds a throwaway git repo: a base branch with some migrations,
// then a feature branch that adds files, and runs the real script in it.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SCRIPT = new URL('./check-migration-order.mjs', import.meta.url).pathname;

function repo(baseFiles, branchFiles) {
  const dir = mkdtempSync(join(tmpdir(), 'mig-order-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' });
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
  mkdirSync(join(dir, 'supabase/migrations'), { recursive: true });
  writeFileSync(join(dir, 'README'), 'x');
  for (const f of baseFiles) writeFileSync(join(dir, 'supabase/migrations', f), 'select 1;');
  git('add', '-A'); git('commit', '-q', '-m', 'base');
  git('checkout', '-q', '-b', 'feature');
  for (const f of branchFiles) writeFileSync(join(dir, 'supabase/migrations', f), 'select 1;');
  git('add', '-A'); git('commit', '-q', '--allow-empty', '-m', 'feature');
  return dir;
}

function run(dir, base = 'main') {
  try {
    return { code: 0, out: execFileSync(process.execPath, [SCRIPT, base], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) {
    return { code: e.status, out: String(e.stdout) + String(e.stderr) };
  }
}

const BASE = ['001_a.sql', '002_b.sql', '026_z.sql'];

test('the next number passes', () => {
  const r = run(repo(BASE, ['027_planner.sql']));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /1 new on this branch, all after 026/);
});

test('no new migration passes', () => {
  assert.equal(run(repo(BASE, [])).code, 0);
});

test('a gap is allowed (only order matters)', () => {
  assert.equal(run(repo(BASE, ['030_x.sql'])).code, 0);
});

test('a reused number fails', () => {
  const r = run(repo([...BASE, '027_planner.sql'], ['027_other.sql']));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /version 027 is used by 2 files/);
  assert.match(r.out, /027_other\.sql: version 027 is not after 027/);
});

test('a number below the highest on base fails', () => {
  const r = run(repo(BASE, ['025_late.sql']));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /025_late\.sql: version 025 is not after 026.*next free number is 027/);
});

test('two new files with the same number fail', () => {
  const r = run(repo(BASE, ['027_a.sql', '027_b.sql']));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /version 027 is used by 2 files/);
});

test('names that are not NNN_name.sql fail', () => {
  for (const bad of ['27_short.sql', '20261005120000_timestamp.sql', '027-dash.sql', '027_note.txt', '027_.sql']) {
    const r = run(repo(BASE, [bad]));
    assert.equal(r.code, 1, `${bad}: ${r.out}`);
    assert.match(r.out, /not NNN_name\.sql/);
  }
});

test('no file name is exempt from the order: a late 000_ file fails like any other', () => {
  // Overload exempts 000_v1_baseline.sql; the starter has no baseline to exempt.
  for (const late of ['000_v1_baseline.sql', '000_other.sql']) {
    const r = run(repo(BASE, [late]));
    assert.equal(r.code, 1, `${late}: ${r.out}`);
    assert.match(r.out, new RegExp(`${late.replace('.', '\\.')}: version 000 is not after 026`));
  }
});

test('an empty migrations folder holding only .gitkeep passes with zero files', () => {
  // The folder is kept on main by a .gitkeep, which is no migration and no "not NNN_name.sql".
  const r = run(repo(['.gitkeep'], []));
  assert.equal(r.code, 0, r.out);
  assert.match(r.out, /0 migration file\(s\), versions unique; 0 new on this branch, all after \(none on base\)/);
});

test('a .gitkeep added on the branch is not a new migration, and the first migration after it passes', () => {
  const none = run(repo([], ['.gitkeep']));
  assert.equal(none.code, 0, none.out);
  assert.match(none.out, /0 new on this branch/);
  const first = run(repo(['.gitkeep'], ['001_first.sql']));
  assert.equal(first.code, 0, first.out);
  assert.match(first.out, /1 migration file\(s\).*1 new on this branch/);
});

test('other dotfiles are ignored too, and a bad name beside them is still flagged', () => {
  assert.equal(run(repo(BASE, ['.keep', '.DS_Store', '027_ok.sql'])).code, 0);
  const r = run(repo(BASE, ['.gitkeep', '27_short.sql']));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /27_short\.sql: not NNN_name\.sql/);
  assert.doesNotMatch(r.out, /\.gitkeep/);
});

test('two files sharing 002_ are flagged even when only one is new', () => {
  const r = run(repo(BASE, ['002_c.sql']));
  assert.equal(r.code, 1, r.out);
  assert.match(r.out, /version 002 is used by 2 files \(002_b\.sql, 002_c\.sql\)/);
});

test('an unknown base ref exits 2, never 0', () => {
  const r = run(repo(BASE, ['027_x.sql']), 'origin/nope');
  assert.equal(r.code, 2, r.out);
});

test('no migrations folder exits 2', () => {
  const dir = mkdtempSync(join(tmpdir(), 'mig-order-empty-'));
  const r = run(dir);
  assert.equal(r.code, 2, r.out);
});
