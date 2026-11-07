// check-skills.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// SPEC item 5 and TASKS.md Decided 35: every skill in .claude/skills/ has an exact trigger and never "always". Overload's L9: four plugin
// skills whose descriptions said "ALWAYS invoke" pulled themselves into sessions that had nothing to do with them. Before a session loads a
// skill it sees one thing of it, the front matter's `description`, so the description IS the trigger, and this is the check on it. For each
// `.claude/skills/<folder>/SKILL.md`:
//   - it opens with a front matter that holds `name` (the folder's name) and `description`;
//   - the description is not empty and is valid YAML as it is written: a plain (unquoted) value with ": " or " #" in it is not, and a skill
//     whose front matter does not parse is not loaded, silently. Write the description in double quotes;
//   - the word "always", in any case, is nowhere in the description;
//   - it opens "Use when ", and that first sentence is the trigger. For the starter's own skills the trigger names what the skill is for
//     (TRIGGERS below: stack the two folders `src/` and `supabase/`, estimate `TASKS.md`, prototype `prototype/`); a skill that is not in
//     the table needs only the "Use when" sentence, and a new one adds its line;
//   - a file the skill says is beside it (`reference.md`) is there.
// The tree test runs this over the real .claude/skills/ and also fails when a skill folder has no SKILL.md or when stack or estimate (this
// chunk's two skills) is missing, so "every skill passes" cannot be true of an empty folder. The call-pattern tests run the checker over
// small texts, one per way a skill can be wrong, beside the near-misses it must let through.
//
// What it would not catch (TASKS.md, chunk 7): whether a skill triggers in a session (only use shows; the first app's build is the test);
// whether a lifted rule is right (it was right for Overload; the sort is the judgement); a description that is exact and wrong about what
// the skill holds; "always" in a skill's body (a lifted rule may use the word; only the description decides when a skill loads).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(root, '.claude', 'skills');

// What each starter skill's trigger sentence must name (Decided 35: files under src/ or supabase/; prototype/; the estimate in TASKS.md).
export const TRIGGERS = {
  stack: ['src/', 'supabase/'],
  prototype: ['prototype/'],
  estimate: ['TASKS.md'],
};

// The skills this chunk ships. `prototype` is chunk 8's, so a tree without it passes until then.
export const REQUIRED = ['stack', 'estimate'];

// ─── The front matter ──────────────────────────────────────────────────────────────────────────────────────────────

// A plain scalar may not start with a YAML indicator, and may not hold ": " or " #".
const PLAIN_START = /^[[\]{}!&*|>%@`'",#?]|^[-?:]\s/;

/** One value as YAML reads it: { value } or { problem }. `block` holds the indented lines that follow the key. */
function readValue(key, raw, block) {
  const v = raw.trim();
  if (v === '' && block.length === 0) return { value: '' };
  if (/^[>|][+-]?$/.test(v)) return { value: block.map((l) => l.trim()).join(v[0] === '>' ? ' ' : '\n').trim() };
  if (v === '') return { value: block.map((l) => l.trim()).join(' ') }; // a plain value continued on the next lines
  if (v.startsWith('"')) {
    try {
      const value = JSON.parse(v);
      if (typeof value === 'string') return { value };
    } catch {
      // falls through to the problem below
    }
    return { problem: `${key}: a double-quoted value that does not parse (an inner double quote needs a backslash)` };
  }
  if (v.startsWith("'")) {
    if (v.length < 2 || !v.endsWith("'") || /(?<!')'(?!')/.test(v.slice(1, -1).replace(/''/g, ''))) {
      return { problem: `${key}: a single-quoted value that does not parse (an inner quote is written twice)` };
    }
    return { value: v.slice(1, -1).replace(/''/g, "'") };
  }
  if (PLAIN_START.test(v)) return { problem: `${key}: a plain value cannot start with "${v[0]}": put it in double quotes` };
  if (/: |\s#/.test(v)) return { problem: `${key}: a plain value with ": " or " #" in it is not valid YAML, so the skill would not load: put it in double quotes` };
  return { value: v };
}

/** The front matter of a SKILL.md: { keys, problems } or { error } when there is none. */
export function parseFrontMatter(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  if (lines[0] !== '---') return { error: 'SKILL.md does not open with a "---" front matter line' };
  const end = lines.indexOf('---', 1);
  if (end === -1) return { error: 'the front matter is never closed with a "---" line' };
  const keys = {};
  const problems = [];
  for (let i = 1; i < end; i++) {
    const m = /^([A-Za-z][\w-]*):(.*)$/.exec(lines[i]);
    if (!m) {
      if (lines[i].trim() !== '' && !lines[i].startsWith('#') && !/^\s/.test(lines[i])) problems.push(`front matter line ${i} is not "key: value": ${lines[i]}`);
      continue;
    }
    const block = [];
    while (i + 1 < end && /^\s+\S/.test(lines[i + 1])) block.push(lines[++i]);
    const read = readValue(m[1], m[2], block);
    if (read.problem) problems.push(read.problem);
    else keys[m[1]] = read.value;
  }
  return { keys, problems };
}

// ─── The checker ───────────────────────────────────────────────────────────────────────────────────────────────────

/** The trigger: the description's first sentence (a "." ends it only before a space or the end, so TASKS.md and src/ stay whole). */
export const triggerOf = (description) => description.split(/\.(?:\s|$)/)[0];

/**
 * Everything wrong with one skill, as sentences ([] when nothing is). `folder` is the skill's folder name; `has(file)` says whether a file
 * is beside SKILL.md.
 */
export function checkSkill(folder, text, { has = () => true } = {}) {
  const fm = parseFrontMatter(text);
  if (fm.error) return [fm.error];
  const problems = [...fm.problems];
  if (fm.keys.name !== folder) problems.push(`name is ${JSON.stringify(fm.keys.name)}, and the folder is ${folder}`);
  const description = fm.keys.description;
  if (description === undefined || description.trim() === '') {
    problems.push('no description: it is the trigger, and a skill without one has none');
  } else {
    if (/\balways\b/i.test(description)) problems.push('the description says "always": a skill is loaded by its trigger, never by "always" (L9)');
    if (!description.startsWith('Use when ')) problems.push('the description does not open with "Use when ": its first sentence is the trigger');
    const trigger = triggerOf(description);
    for (const name of TRIGGERS[folder] ?? []) {
      if (!trigger.includes(name)) problems.push(`the trigger (the first sentence) does not name ${name}`);
    }
  }
  if (/\breference\.md\b/.test(text) && !has('reference.md')) problems.push('SKILL.md points to reference.md, which is not beside it');
  return problems;
}

// ─── The tree ──────────────────────────────────────────────────────────────────────────────────────────────────────

test('every skill in .claude/skills/ passes, and the two this chunk ships are there', () => {
  assert.ok(existsSync(SKILLS_DIR), '.claude/skills/ is missing');
  const folders = readdirSync(SKILLS_DIR).filter((name) => statSync(join(SKILLS_DIR, name)).isDirectory()).sort();
  for (const name of REQUIRED) assert.ok(folders.includes(name), `.claude/skills/${name}/ is missing`);
  const failures = [];
  for (const folder of folders) {
    const file = join(SKILLS_DIR, folder, 'SKILL.md');
    if (!existsSync(file)) {
      failures.push(`${folder}: no SKILL.md`);
      continue;
    }
    const has = (name) => existsSync(join(SKILLS_DIR, folder, name));
    for (const problem of checkSkill(folder, readFileSync(file, 'utf8'), { has })) failures.push(`${folder}: ${problem}`);
  }
  assert.deepEqual(failures, [], `skills that fail:\n  ${failures.join('\n  ')}`);
});

// ─── The call patterns ─────────────────────────────────────────────────────────────────────────────────────────────

const STACK = 'Use when writing or changing files under `src/` or `supabase/`, and for no other work. The starter conventions.';
const skill = (lines, body = 'Body.') => ['---', ...lines, '---', '', body, ''].join('\n');
const quoted = (name, description) => skill([`name: ${name}`, `description: ${JSON.stringify(description)}`]);
const said = (problems, pattern) => problems.some((p) => pattern.test(p));

test('a skill with its name, a "Use when" trigger that names its files and no "always" passes', () => {
  assert.deepEqual(checkSkill('stack', quoted('stack', STACK)), []);
  assert.deepEqual(checkSkill('estimate', quoted('estimate', 'Use when writing the estimate section of TASKS.md, and for no other work.')), []);
  assert.deepEqual(checkSkill('prototype', quoted('prototype', 'Use when building or changing anything under `prototype/`.')), []);
});

test('"always" in a description fails, in any case and as any part of a phrase', () => {
  for (const description of [
    'ALWAYS invoke this skill when writing code under `src/` or `supabase/`.',
    `${STACK} Always load it first.`,
    'Use when writing `src/` or `supabase/` files, and always before a commit.',
    'Use when writing `src/` or `supabase/` files: an always-on guide.',
  ]) {
    assert.ok(said(checkSkill('stack', quoted('stack', description)), /always/), description);
  }
  // Near-miss: the word is whole. A description that only holds letters of it is fine.
  assert.deepEqual(checkSkill('stack', quoted('stack', 'Use when writing or changing files under `src/` or `supabase/` (alwaysx is not a word).')), []);
});

test('a SKILL.md with no front matter, or one never closed, fails', () => {
  assert.ok(said(checkSkill('stack', 'Use when writing src/ and supabase/.\n'), /front matter/));
  assert.ok(said(checkSkill('stack', `---\nname: stack\ndescription: "${STACK}"\n`), /never closed/));
});

test('a missing, empty or blank description fails', () => {
  assert.ok(said(checkSkill('stack', skill(['name: stack'])), /no description/));
  assert.ok(said(checkSkill('stack', skill(['name: stack', 'description:'])), /no description/));
  assert.ok(said(checkSkill('stack', skill(['name: stack', 'description: ""'])), /no description/));
  assert.ok(said(checkSkill('stack', skill(['name: stack', 'description: "   "'])), /no description/));
});

test('a name that is not the folder fails', () => {
  assert.ok(said(checkSkill('stack', quoted('stacks', STACK)), /name is "stacks"/));
  assert.ok(said(checkSkill('stack', skill([`description: ${JSON.stringify(STACK)}`])), /name is undefined/));
});

test('a description that does not open "Use when" fails: the first sentence is the trigger', () => {
  assert.ok(said(checkSkill('stack', quoted('stack', 'The conventions of code under `src/` and `supabase/`.')), /Use when/));
  // Near-miss: other sentences may say what the skill holds.
  assert.deepEqual(checkSkill('stack', quoted('stack', 'Use when writing or changing files under `src/` or `supabase/`. Holds the conventions, each with its source.')), []);
});

test('a starter skill whose trigger does not name its files fails, and a name after the first sentence does not count', () => {
  assert.ok(said(checkSkill('stack', quoted('stack', 'Use when writing code.')), /does not name src\//));
  assert.ok(said(checkSkill('stack', quoted('stack', 'Use when writing files under `src/`.')), /does not name supabase\//));
  assert.ok(said(checkSkill('stack', quoted('stack', 'Use when writing code. It covers `src/` and `supabase/`.')), /does not name src\//));
  assert.ok(said(checkSkill('estimate', quoted('estimate', 'Use when planning a build.')), /does not name TASKS\.md/));
  assert.ok(said(checkSkill('prototype', quoted('prototype', 'Use when drawing screens.')), /does not name prototype\//));
  // Near-miss: a skill that is not in the table needs the "Use when" sentence only.
  assert.deepEqual(checkSkill('notes', quoted('notes', 'Use when taking notes.')), []);
});

test('a plain description with ": " or " #" in it is not YAML and fails; the same words in quotes pass', () => {
  assert.ok(said(checkSkill('stack', skill(['name: stack', 'description: Use when writing src/ and supabase/: nothing else.'])), /not valid YAML/));
  assert.ok(said(checkSkill('stack', skill(['name: stack', 'description: Use when writing src/ and supabase/ #files.'])), /not valid YAML/));
  assert.ok(said(checkSkill('stack', skill(['name: stack', 'description: `src/` and `supabase/` files.'])), /cannot start with/));
  assert.deepEqual(checkSkill('stack', quoted('stack', 'Use when writing src/ and supabase/: nothing else.')), []);
  // Near-miss: a plain description with neither is valid YAML, and "TASKS.md" and "src/" do not end the sentence.
  assert.deepEqual(checkSkill('stack', skill(['name: stack', 'description: Use when writing under src/ or supabase/.'])), []);
});

test('a double or single quote that does not parse fails', () => {
  assert.ok(said(checkSkill('stack', skill(['name: stack', 'description: "Use when writing src/ and "supabase/" files."'])), /does not parse/));
  assert.ok(said(checkSkill('stack', skill(['name: stack', "description: 'Use when writing src/ and supabase/ files, don't stop'"])), /does not parse/));
  assert.deepEqual(checkSkill('stack', skill(['name: stack', "description: 'Use when writing src/ and supabase/ files, don''t stop'"])), []);
});

test('a folded or literal block description is read, so a block cannot hide an "always"', () => {
  const folded = skill(['name: stack', 'description: >-', '  Use when writing or changing files under `src/`', '  or `supabase/`.']);
  assert.deepEqual(checkSkill('stack', folded), []);
  const hidden = skill(['name: stack', 'description: >-', '  Use when writing or changing files under `src/` or `supabase/`,', '  and always before a commit.']);
  assert.ok(said(checkSkill('stack', hidden), /always/));
  assert.equal(parseFrontMatter(folded).keys.description, 'Use when writing or changing files under `src/` or `supabase/`.');
});

test('a skill that points to reference.md needs the file beside it', () => {
  const text = quoted('stack', STACK) + '\nSee reference.md for the long rules.\n';
  assert.ok(said(checkSkill('stack', text, { has: () => false }), /reference\.md/));
  assert.deepEqual(checkSkill('stack', text, { has: (name) => name === 'reference.md' }), []);
  // Near-miss: a skill that never mentions it needs no such file.
  assert.deepEqual(checkSkill('stack', quoted('stack', STACK), { has: () => false }), []);
});

test('the trigger is the first sentence: a period inside a file name does not end it', () => {
  assert.equal(triggerOf('Use when writing the estimate section of TASKS.md, and for no other work. More.'), 'Use when writing the estimate section of TASKS.md, and for no other work');
  assert.equal(triggerOf('Use when editing `.claude/` files'), 'Use when editing `.claude/` files');
});
