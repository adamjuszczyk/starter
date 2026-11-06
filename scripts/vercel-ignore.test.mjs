// Run: node --test "scripts/*.test.mjs"
//
// vercel.json's ignoreCommand decides whether a push is built. Exit 0 skips the build; any non-zero exit builds. It once compared only
// HEAD^ with HEAD, so a push whose last commit changed only .md files was skipped even when an earlier commit in the same push changed
// code. These tests run the real command from vercel.json, through `sh -c` as Vercel does, in throwaway git repos, with
// VERCEL_GIT_PREVIOUS_SHA set the way Vercel sets it (the last commit that was deployed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { ignoreCommand } = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));

function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'vercel-ignore-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();
  git('init', '-q', '-b', 'main');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 't');
  git('config', 'commit.gpgsign', 'false');
  const commit = (file, text) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), text + Math.random());
    git('add', '-A');
    git('commit', '-q', '-m', `${file}`);
    return git('rev-parse', 'HEAD');
  };
  return { dir, git, commit };
}

// Exit code of the ignoreCommand with the given previous-deploy SHA (undefined = variable unset).
function run(dir, previousSha) {
  const env = { ...process.env };
  delete env.VERCEL_GIT_PREVIOUS_SHA;
  if (previousSha !== undefined) env.VERCEL_GIT_PREVIOUS_SHA = previousSha;
  return spawnSync('sh', ['-c', ignoreCommand], { cwd: dir, env }).status;
}

test('the command fits Vercel’s 256-character limit', () => {
  assert.ok(ignoreCommand.length <= 256, `ignoreCommand is ${ignoreCommand.length} characters`);
});

test('a push of code then a docs-only commit is built (the bug)', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('app.ts', 'v2'); // code, pushed together with...
    r.commit('NOTES.md', 'docs'); // ...a docs-only last commit
    assert.notEqual(run(r.dir, deployed), 0, 'must build: exit non-zero');
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('a push that changed only .md files since the last deploy is skipped', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('NOTES.md', 'one');
    r.commit('notes/more.md', 'two');
    assert.equal(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('a code-only push is built', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('app.ts', 'v2');
    assert.notEqual(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('a docs-only commit after an earlier skipped docs commit and a deployed code commit is skipped', () => {
  const r = repo();
  try {
    r.commit('app.ts', 'v1');
    r.commit('NOTES.md', 'skipped earlier'); // never deployed, so not the previous SHA
    const deployed = r.git('rev-parse', 'HEAD~1');
    r.commit('NOTES.md', 'now');
    assert.equal(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('no previous deploy SHA (first deploy, or a new branch): build', () => {
  const r = repo();
  try {
    r.commit('app.ts', 'v1');
    r.commit('NOTES.md', 'docs');
    assert.notEqual(run(r.dir, undefined), 0);
    assert.notEqual(run(r.dir, ''), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('a previous SHA that is not in the clone (shallow clone, old deploy): build', () => {
  const r = repo();
  try {
    r.commit('app.ts', 'v1');
    r.commit('NOTES.md', 'docs');
    assert.notEqual(run(r.dir, 'f'.repeat(40)), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

// Vercel runs the same command for every branch, and VERCEL_GIT_PREVIOUS_SHA is the last deployment of the SAME branch, so a docs-only
// push to any branch is skipped exactly as on main.
test('the command reads no branch name, so every branch is treated like main', () => {
  assert.doesNotMatch(ignoreCommand, /VERCEL_GIT_COMMIT_REF|VERCEL_ENV|\b(main|master|staging)\b/);
});

test('a docs-only push on another branch, after that branch\'s own last deploy, is skipped', () => {
  const r = repo();
  try {
    r.git('checkout', '-q', '-b', 'preview');
    const deployed = r.commit('app.ts', 'v1');
    r.commit('CONTEXT.md', 'docs');
    assert.equal(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('renaming a build doc (.md to .md, any folder) is skipped', () => {
  const r = repo();
  try {
    r.commit('BUILD.md', 'process');
    const deployed = r.commit('app.ts', 'v1');
    mkdirSync(join(r.dir, 'notes/build'), { recursive: true });
    r.git('mv', 'BUILD.md', 'notes/build/BUILD-0.1.md');
    r.git('commit', '-q', '-m', 'rename');
    assert.equal(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

// prototype/ is the clickable prototype, not the app. Every file in it is a .ts, .tsx, .json or .css, so ':(exclude)*.md' alone built the
// app for each prototype edit. The folder at the repo root is excluded; nothing else is.
test('a push that changed only files under prototype/ is skipped, whatever their type', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('prototype/src/App.tsx', 'one');
    r.commit('prototype/package.json', 'two');
    r.commit('prototype/src/demo/seed.ts', 'three');
    assert.equal(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('a prototype edit pushed with an app edit, or a design image, is built', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('prototype/src/App.tsx', 'prototype');
    r.commit('app.ts', 'v2'); // the app changed too
    assert.notEqual(run(r.dir, deployed), 0, 'an app edit among prototype edits builds');
    const deployed2 = r.git('rev-parse', 'HEAD');
    r.commit('prototype/src/App.tsx', 'prototype again');
    r.commit('design/0.1/built/state.png', 'image');
    assert.notEqual(run(r.dir, deployed2), 0, 'a design image among prototype edits builds');
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('only the prototype/ folder at the repo root is excluded: a nested prototype folder, a longer name and a root file are built', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('src/prototype/thing.ts', 'nested');
    assert.notEqual(run(r.dir, deployed), 0, 'src/prototype/ is app code');
    const d2 = r.git('rev-parse', 'HEAD');
    r.commit('prototypes/thing.ts', 'longer name');
    assert.notEqual(run(r.dir, d2), 0, 'prototypes/ is not prototype/');
    const d3 = r.git('rev-parse', 'HEAD');
    r.commit('prototype.ts', 'root file');
    assert.notEqual(run(r.dir, d3), 0, 'a root file named prototype.ts is not under prototype/');
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

// docs/ holds the pages and procedures the agents write (a checklist as .html, its data as .json) and .claude/ the agent definitions, skills
// and launch settings: neither is the app, and neither is only .md. Both are excluded at the repo root, as prototype/ is.
test('a push that changed only files under docs/ or .claude/ is skipped, whatever their type', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('docs/new-app-checklist.html', 'one');
    r.commit('docs/steps/state.json', 'two');
    r.commit('.claude/launch.json', 'three');
    r.commit('.claude/skills/stack/rules.txt', 'four');
    assert.equal(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('a docs/ or .claude/ edit pushed with an app edit is built', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('docs/new-app-checklist.html', 'page');
    r.commit('app.ts', 'v2'); // the app changed too
    assert.notEqual(run(r.dir, deployed), 0, 'an app edit among docs/ edits builds');
    const deployed2 = r.git('rev-parse', 'HEAD');
    r.commit('.claude/launch.json', 'launch');
    r.commit('index.html', 'page');
    assert.notEqual(run(r.dir, deployed2), 0, 'an app file among .claude/ edits builds');
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('only the docs/ and .claude/ folders at the repo root are excluded: nested folders, longer names and root files are built', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('src/docs/thing.ts', 'nested docs');
    assert.notEqual(run(r.dir, deployed), 0, 'src/docs/ is app code');
    const d2 = r.git('rev-parse', 'HEAD');
    r.commit('docs-old/thing.ts', 'longer name');
    assert.notEqual(run(r.dir, d2), 0, 'docs-old/ is not docs/');
    const d3 = r.git('rev-parse', 'HEAD');
    r.commit('docs.ts', 'root file');
    assert.notEqual(run(r.dir, d3), 0, 'a root file named docs.ts is not under docs/');
    const d4 = r.git('rev-parse', 'HEAD');
    r.commit('src/.claude/thing.ts', 'nested .claude');
    assert.notEqual(run(r.dir, d4), 0, 'src/.claude/ is app code');
    const d5 = r.git('rev-parse', 'HEAD');
    r.commit('.claude-extra/thing.ts', 'longer name');
    assert.notEqual(run(r.dir, d5), 0, '.claude-extra/ is not .claude/');
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('the .md exclude still holds beside the prototype, docs and .claude ones, in all places', () => {
  const r = repo();
  try {
    const deployed = r.commit('app.ts', 'v1');
    r.commit('prototype/README.md', 'prototype doc');
    r.commit('docs/notes.md', 'doc');
    r.commit('.claude/agents/builder.md', 'agent');
    r.commit('prototype/src/App.tsx', 'prototype code');
    r.commit('docs/page.html', 'page');
    assert.equal(run(r.dir, deployed), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});

test('a doc renamed to a non-.md name, or a design image, is built', () => {
  const r = repo();
  try {
    r.commit('BUILD.md', 'process');
    const deployed = r.commit('app.ts', 'v1');
    r.git('mv', 'BUILD.md', 'BUILD.txt');
    r.git('commit', '-q', '-m', 'rename');
    assert.notEqual(run(r.dir, deployed), 0);
    const deployed2 = r.git('rev-parse', 'HEAD');
    r.commit('design/0.1/prototype/Main.png', 'image');
    assert.notEqual(run(r.dir, deployed2), 0);
  } finally {
    rmSync(r.dir, { recursive: true, force: true });
  }
});
