// check-agents.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// SPEC item 6 and TASKS.md Decided 29: the agent definitions in .claude/agents/ are general. They are lifted from Overload's, and what made
// them Overload's is gone: the build's name, the base branch, the default branch and whether the app has staging are read from CONTEXT.md
// "Repo facts" (three lines with fixed labels, `Base branch:`, `Default branch:` and `Staging:`), never written into a definition. An app built
// from the starter inherits these files and this test, so the test is what keeps a definition from naming what is true of one app only. For
// each `.claude/agents/*.md`:
//   - it opens with a front matter that holds `name` (the file's name), `description`, `model` and `effort`, and the description parses as
//     YAML as written (a plain value with ": " in it does not; double-quote it), as check-skills.test.mjs asks of a skill;
//   - it names none of the things TASKS.md chunk 9 drops: "1.2.1", `master`, an Overload-only script (`check-frozen-code`,
//     `check-program-exercise-reads`, `probe-live-columns`, `textOnAccent`, `check-sheet-overflow`, the parity tests of chunk 58a) and the
//     "Verification and process" group of Overload's RULES.md, which the starter's RULES.md does not have;
//   - it names the three labels it reads its branches from, and never writes the two branches' own names in (`main` in backticks, `origin/main`,
//     with the values read from the real CONTEXT.md, so the check follows an app whose branches are called something else);
//   - every line that names staging sits under a `Staging: yes` condition. A line is under it when the line itself holds it, or the bullet or
//     paragraph the line belongs to opens with it (its first line), or the heading above the line holds it (until the next heading). The labels
//     `Staging: yes`, `Staging: no` and `Staging:` are not themselves a mention, so a definition can say how it reads the label;
//   - every RULES.md section it cites, in the form `RULES.md "Usage"` or `RULES.md, "Usage"`, is a section RULES.md has (the "Verification and
//     process" group was cited by Overload's builder.md and the starter's RULES.md has no such group: a citation that went stale).
// And CONTEXT.md's "Repo facts" holds the three labelled lines once each, with a value, `Staging:` saying yes or no: the other half of "each reads
// its branches from CONTEXT.md's labels, which exist".
//
// The tree tests run this over the real .claude/agents/, CONTEXT.md and RULES.md, and fail when one of the three definitions is missing, so "every
// definition passes" cannot be true of an empty folder. The call-pattern tests run each checker over small texts, one per way a definition can be
// wrong, beside the near-misses it must let through.
//
// What it would not catch (TASKS.md, chunk 9): whether the definitions produce good builds (the first app's build shows); a definition that
// names something Overload-only this list does not know (a new Overload script name, an Overload file path); a staging step phrased without the
// word "staging"; a general rule wrongly sorted into RULES.md instead of the stack skill (the appendix's "Doubtful" list is the reviewer's checklist).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AGENTS_DIR = join(root, '.claude', 'agents');
const read = (...parts) => readFileSync(join(root, ...parts), 'utf8');

// The three definitions this chunk ships, and the three labels CONTEXT.md "Repo facts" carries for them (Decided 29).
export const REQUIRED = ['builder', 'reviewer-data', 'reviewer-light'];
export const LABELS = ['Base branch', 'Default branch', 'Staging'];
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];

// What no definition names. Each has the reason a hit prints.
export const BANNED = [
  { token: '1.2.1', re: /1\.2\.1(?!\d)/, why: "Overload's version: the build is the one CONTEXT.md names" },
  { token: 'master', re: /\bmaster\b/i, why: "Overload's default branch: the default branch is read from CONTEXT.md's `Default branch:`" },
  { token: 'check-frozen-code', re: /check-frozen-code/, why: "an Overload-only script" },
  { token: 'check-program-exercise-reads', re: /check-program-exercise-reads/, why: "an Overload-only script" },
  { token: 'probe-live-columns', re: /probe-live-columns|probe-specs/, why: "an Overload-only script (the app's own probe is named by its chunk)" },
  { token: 'staging-guard', re: /staging-guard/, why: "an Overload-only script" },
  { token: 'textOnAccent', re: /textOnAccent/, why: "an Overload-only test (the starter's tokens check is check-tokens.test.mjs)" },
  { token: 'check-sheet-overflow', re: /check-sheet-overflow/, why: "an Overload-only script (the kit's `npm run proto:check` measures clipping)" },
  { token: '58a', re: /\b58a\b/, why: "Overload's chunk 58a" },
  { token: 'parity tests', re: /\bparity tests?\b/i, why: "chunk 58a's parity tests are Overload's" },
  { token: 'Verification and process', re: /Verification and process/, why: "a group of Overload's RULES.md that the starter's RULES.md does not have" },
  { token: 'Coach', re: /\bCoach\b/, why: "an Overload feature" },
  { token: 'Northstar', re: /\bNorthstar\b/, why: "Overload's shared project" },
  { token: 'meso', re: /\bmeso(?:s|cycles?)?\b/i, why: "Overload's domain word" },
];

// ─── The front matter ──────────────────────────────────────────────────────────────────────────────────────────────

/** The front matter of a definition: { keys, problems }, or { error } when there is none. A value is read as YAML reads it. */
export function parseFrontMatter(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  if (lines[0] !== '---') return { error: 'does not open with a "---" front matter line' };
  const end = lines.indexOf('---', 1);
  if (end === -1) return { error: 'the front matter is never closed with a "---" line' };
  const keys = {};
  const problems = [];
  for (let i = 1; i < end; i++) {
    const m = /^([A-Za-z][\w-]*):(.*)$/.exec(lines[i]);
    if (!m) {
      if (lines[i].trim() !== '' && !/^\s/.test(lines[i])) problems.push(`front matter line ${i + 1} is not "key: value": ${lines[i]}`);
      continue;
    }
    const v = m[2].trim();
    if (v.startsWith('"')) {
      try {
        keys[m[1]] = JSON.parse(v);
      } catch {
        problems.push(`${m[1]}: a double-quoted value that does not parse (an inner double quote needs a backslash)`);
      }
    } else if (/^[[\]{}!&*|>%@`'#?]/.test(v) || /: |\s#/.test(v)) {
      problems.push(`${m[1]}: a plain value cannot start with an indicator or hold ": " or " #", and would not parse as YAML: put it in double quotes`);
    } else {
      keys[m[1]] = v;
    }
  }
  return { keys, problems };
}

/** Everything wrong with one definition's front matter, as sentences. `name` is the file's name without ".md". */
export function frontMatterProblems(name, text) {
  const fm = parseFrontMatter(text);
  if (fm.error) return [fm.error];
  const problems = [...fm.problems];
  if (fm.keys.name !== name) problems.push(`name is ${JSON.stringify(fm.keys.name)}, and the file is ${name}.md`);
  for (const key of ['description', 'model', 'effort']) {
    if (fm.keys[key] === undefined || fm.keys[key].trim() === '') problems.push(`front matter has no ${key}`);
  }
  if (fm.keys.effort !== undefined && !EFFORTS.includes(fm.keys.effort)) problems.push(`effort is "${fm.keys.effort}", not one of ${EFFORTS.join(', ')}`);
  return problems;
}

// ─── What a definition may not name ────────────────────────────────────────────────────────────────────────────────

/** Every banned name the text holds, as sentences. */
export function bannedProblems(text) {
  return BANNED.filter(({ re }) => re.test(text)).map(({ token, why }) => `names ${token}: ${why}`);
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/** The two branches' own names, written into the text (backticked, or as `origin/<name>`): they come from CONTEXT.md, not from here. */
export function writtenInProblems(text, { base, def }) {
  const problems = [];
  for (const name of new Set([base, def].filter(Boolean))) {
    if (new RegExp('`' + escape(name) + '`').test(text) || new RegExp('origin/' + escape(name) + '(?![\\w/-])').test(text)) {
      problems.push(`writes the branch ${name} in: read it from CONTEXT.md's "Repo facts" labels`);
    }
  }
  return problems;
}

/** The labels the text does not name. */
export function labelProblems(text) {
  return LABELS.filter((label) => !text.includes(`${label}:`)).map((label) => `never names the label "${label}:" it reads from CONTEXT.md "Repo facts"`);
}

// ─── Staging only under its condition ──────────────────────────────────────────────────────────────────────────────

const CONDITION = /Staging: yes\b/;
// The label and its two values are how a definition says it reads the line: not a mention of staging.
const LABEL_TOKEN = /Staging:(?: (?:yes|no)\b)?/g;
const mentionsStaging = (line) => /staging/i.test(line.replace(LABEL_TOKEN, ''));

/**
 * The lines that name staging with no `Staging: yes` over them, as sentences. Over a line: the line itself holds the condition, or the top-level
 * bullet or paragraph it belongs to opens with it (a blank line, a heading or the next top-level bullet ends the block), or the heading above it
 * holds it (until the next heading). Each front matter line stands alone.
 */
export function stagingProblems(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const problems = [];
  const flag = (i) => problems.push(`line ${i + 1} names staging outside a \`Staging: yes\` condition: ${lines[i].trim().slice(0, 100)}`);
  let i = 0;
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    for (i = 1; end !== -1 && i < end; i++) if (mentionsStaging(lines[i]) && !CONDITION.test(lines[i])) flag(i);
    if (end !== -1) i = end + 1;
  }
  let blockOpens = false; // the current top-level block's first line holds the condition
  let sectionHolds = false; // the heading above holds it
  let startsBlock = true; // the next unindented, unbulleted line opens a paragraph
  for (; i < lines.length; i++) {
    const line = lines[i];
    const holds = CONDITION.test(line);
    if (line.trim() === '') {
      blockOpens = false;
      startsBlock = true;
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      sectionHolds = holds;
      blockOpens = holds;
      startsBlock = true;
    } else if (/^(?:[-*+]|\d+[.)])\s/.test(line)) {
      blockOpens = holds;
      startsBlock = false;
    } else if (!/^\s/.test(line)) {
      if (startsBlock) blockOpens = holds;
      startsBlock = false;
    }
    if (mentionsStaging(line) && !(holds || blockOpens || sectionHolds)) flag(i);
  }
  return problems;
}

// ─── RULES.md sections ─────────────────────────────────────────────────────────────────────────────────────────────

/** The "## " section names of a RULES.md. */
export const sectionNames = (rules) => [...rules.matchAll(/^## (.+?)\s*$/gm)].map((m) => m[1]);

/** The RULES.md sections the text cites, as `RULES.md "Name"` or `RULES.md, "Name"`, that RULES.md has no section of (a prefix up to a space counts). */
export function sectionProblems(text, headings) {
  const cited = [...text.matchAll(/RULES\.md,? "([^"\n]+)"/g)].map((m) => m[1]);
  return cited
    .filter((name) => !headings.some((h) => h === name || h.startsWith(`${name} `)))
    .map((name) => `cites RULES.md "${name}", and RULES.md has no section of that name`);
}

// ─── CONTEXT.md's labels ───────────────────────────────────────────────────────────────────────────────────────────

/** CONTEXT.md "Repo facts": { facts: { base, def, staging }, problems }. Each label is a bullet `- Label: value`, once, in that section. */
export function repoFacts(context) {
  const lines = context.split(/\r?\n/);
  const at = lines.findIndex((l) => /^## Repo facts\b/.test(l));
  if (at === -1) return { facts: {}, problems: ['CONTEXT.md has no "Repo facts" section'] };
  const section = [];
  for (const l of lines.slice(at + 1)) {
    if (/^## /.test(l)) break;
    section.push(l);
  }
  const problems = [];
  const value = {};
  for (const label of LABELS) {
    const found = section.map((l) => new RegExp(`^\\s*[-*]\\s*${label}:\\s*(.*?)\\s*$`).exec(l)).filter(Boolean);
    if (found.length === 0) problems.push(`CONTEXT.md "Repo facts" has no "${label}:" line`);
    else if (found.length > 1) problems.push(`CONTEXT.md "Repo facts" has "${label}:" ${found.length} times`);
    else if (found[0][1].replace(/`/g, '') === '') problems.push(`CONTEXT.md "Repo facts": "${label}:" has no value`);
    else value[label] = found[0][1].replace(/`/g, '').split(/\s+/)[0];
  }
  if (value.Staging !== undefined && !/^(yes|no)$/i.test(value.Staging)) {
    problems.push(`CONTEXT.md "Repo facts": "Staging:" says "${value.Staging}", and it must say yes or no`);
  }
  return { facts: { base: value['Base branch'], def: value['Default branch'], staging: value.Staging?.toLowerCase() }, problems };
}

// ─── One definition ────────────────────────────────────────────────────────────────────────────────────────────────

/** Everything wrong with one definition (all the checkers above), as sentences. `ctx` is { facts, headings }. */
export function checkDefinition(name, text, ctx) {
  return [
    ...frontMatterProblems(name, text),
    ...bannedProblems(text),
    ...labelProblems(text),
    ...writtenInProblems(text, ctx.facts),
    ...stagingProblems(text),
    ...sectionProblems(text, ctx.headings),
  ];
}

// ─── The real tree ─────────────────────────────────────────────────────────────────────────────────────────────────

const files = existsSync(AGENTS_DIR) ? readdirSync(AGENTS_DIR).filter((f) => f.endsWith('.md')).sort() : [];
const context = read('CONTEXT.md');
const headings = sectionNames(read('RULES.md'));
const { facts, problems: factProblems } = repoFacts(context);

/** The problems of every definition on disk, each with its file. */
const everyDefinition = (check) =>
  files.flatMap((f) => check(f.replace(/\.md$/, ''), read('.claude', 'agents', f)).map((p) => `${f}: ${p}`));

test('the three definitions are in .claude/agents/', () => {
  for (const name of REQUIRED) assert.ok(files.includes(`${name}.md`), `.claude/agents/${name}.md is missing`);
});

test('every definition opens with a front matter holding its name, description, model and effort', () => {
  assert.deepEqual(everyDefinition(frontMatterProblems), []);
});

test('no definition names 1.2.1, master, an Overload-only script or a group RULES.md does not have', () => {
  assert.deepEqual(everyDefinition((_, text) => bannedProblems(text)), []);
});

test("every definition reads its branches from CONTEXT.md's labels and writes neither branch in", () => {
  assert.deepEqual(everyDefinition((_, text) => [...labelProblems(text), ...writtenInProblems(text, facts)]), []);
});

test('CONTEXT.md "Repo facts" holds the three labels the definitions read, once each, with a value', () => {
  assert.deepEqual(factProblems, []);
});

test('no definition names staging outside a `Staging: yes` condition', () => {
  assert.deepEqual(everyDefinition((_, text) => stagingProblems(text)), []);
});

test('every RULES.md section a definition cites is a section RULES.md has', () => {
  assert.deepEqual(everyDefinition((_, text) => sectionProblems(text, headings)), []);
});

// ─── The call patterns ─────────────────────────────────────────────────────────────────────────────────────────────

const FM = '---\nname: builder\ndescription: Builds one chunk.\nmodel: claude-sonnet-5-5\neffort: max\n---\n';
const LABELLED = 'Read `Base branch:`, `Default branch:` and `Staging:` from CONTEXT.md.\n';

test('frontMatterProblems: a front matter that holds the four keys and the file name passes; each way to lose one is named', () => {
  assert.deepEqual(frontMatterProblems('builder', FM), []);
  assert.deepEqual(frontMatterProblems('builder', FM.replace('description: Builds one chunk.', 'description: "Builds: one chunk."')), []);
  assert.match(frontMatterProblems('builder', 'Builds one chunk.\n')[0], /does not open with/);
  assert.match(frontMatterProblems('builder', '---\nname: builder\n')[0], /never closed/);
  assert.match(frontMatterProblems('reviewer-data', FM)[0], /name is "builder", and the file is reviewer-data\.md/);
  for (const key of ['description', 'model', 'effort']) {
    const without = FM.split('\n').filter((l) => !l.startsWith(`${key}:`)).join('\n');
    assert.deepEqual(frontMatterProblems('builder', without), [`front matter has no ${key}`]);
  }
  assert.match(frontMatterProblems('builder', FM.replace('effort: max', 'effort: huge'))[0], /effort is "huge"/);
});

test('frontMatterProblems: a plain description with ": " in it would not load as YAML, a quoted one would', () => {
  assert.match(frontMatterProblems('builder', FM.replace('Builds one chunk.', 'Builds one chunk (step 4): fresh.'))[0], /put it in double quotes/);
  assert.match(frontMatterProblems('builder', FM.replace('Builds one chunk.', '"Builds one chunk.')).join(' '), /does not parse/);
  assert.deepEqual(frontMatterProblems('builder', FM.replace('Builds one chunk.', 'Builds one chunk (step 4); fresh.')), []);
});

test('bannedProblems: each name is a hit, and the near-misses are not', () => {
  for (const { token } of BANNED) {
    const sample = token === 'master' ? 'never touch master' : token === 'meso' ? 'a meso week' : `names ${token} here`;
    assert.equal(bannedProblems(sample).length, 1, `${token} should be a hit`);
  }
  assert.equal(bannedProblems('the 1.2.1 build').length, 1);
  assert.equal(bannedProblems('never touch `master`').length, 1);
  assert.equal(bannedProblems('Master branch').length, 1);
  assert.equal(bannedProblems('chunk 58a is Overload\'s').length, 1);
  assert.deepEqual(bannedProblems('the main checkout, mastering the stack, version 1.2.10, chunk 58, a mesocarp, the Coaching tab'), []);
  assert.deepEqual(bannedProblems('Overload is named without a hit; Verification by chunk type; `check-context-size.mjs`'), []);
});

test('writtenInProblems: the two branches\' own names, backticked or as origin/<name>, are a hit; the words and the placeholders are not', () => {
  const both = { base: 'main', def: 'main' };
  assert.equal(writtenInProblems('Branch off `main`.', both).length, 1);
  assert.equal(writtenInProblems('Diff against origin/main.', both).length, 1);
  assert.deepEqual(writtenInProblems('Never switch branches in the main checkout; branch off `origin/<Base branch>`, `<Base branch>`.', both), []);
  assert.deepEqual(writtenInProblems('Diff against origin/maintenance.', both), []);
  const apart = { base: 'develop', def: 'trunk' };
  assert.equal(writtenInProblems('Merge into `develop` and never `trunk`.', apart).length, 2);
  assert.deepEqual(writtenInProblems('Branch off `main`.', apart), []);
  assert.deepEqual(writtenInProblems('Branch off `main`.', {}), []);
});

test('labelProblems: a definition that names all three labels passes, and each missing one is named', () => {
  assert.deepEqual(labelProblems(LABELLED), []);
  for (const label of LABELS) assert.deepEqual(labelProblems(LABELLED.replace(`${label}:`, `${label} line`)).length, 1);
  assert.equal(labelProblems('Read CONTEXT.md.').length, 3);
});

test('stagingProblems: a line that names staging with no condition over it is a hit', () => {
  assert.equal(stagingProblems('- Run the staging smoke.').length, 1);
  assert.equal(stagingProblems('Without staging, branch off the default branch.').length, 1);
  assert.equal(stagingProblems('- Re-seed Staging after the merge.').length, 1);
  assert.equal(stagingProblems('- Run `STAGING_URL` checks.').length, 1);
  assert.match(stagingProblems('intro\n- Run the staging smoke.')[0], /^line 2 names staging outside a `Staging: yes` condition: - Run the staging smoke\.$/);
});

test('stagingProblems: the condition covers its own line, its block (a bullet, a paragraph) and its heading, and no more', () => {
  assert.deepEqual(stagingProblems('- **Only when `Staging: yes`:** run the staging smoke.'), []);
  assert.deepEqual(stagingProblems('- Run the staging smoke when `Staging: yes`.'), []);
  assert.deepEqual(stagingProblems('- When `Staging: yes`:\n  run the staging smoke,\n  then re-seed it.'), []);
  assert.deepEqual(stagingProblems('- When `Staging: yes`:\n  - run the staging smoke\n  - re-seed staging'), []);
  assert.deepEqual(stagingProblems('1. When `Staging: yes`, run the staging smoke\n   and re-seed staging.'), []);
  assert.deepEqual(stagingProblems('When `Staging: yes` the build also\nruns the staging smoke.'), []);
  assert.deepEqual(stagingProblems('## When `Staging: yes`\n- Run the staging smoke.\n- Re-seed staging.\n\nMore about staging.'), []);
  // the next bullet, the next paragraph and the next heading are not covered
  assert.equal(stagingProblems('- When `Staging: yes`, run the staging smoke.\n- Re-seed staging.').length, 1);
  assert.equal(stagingProblems('When `Staging: yes` the build runs the staging smoke.\n\nRe-seed staging.').length, 1);
  assert.equal(stagingProblems('## When `Staging: yes`\n- Run the staging smoke.\n## Always\n- Re-seed staging.').length, 1);
  assert.equal(stagingProblems('- Run the staging smoke.\n  When `Staging: yes`, re-seed staging.').length, 1);
});

test('stagingProblems: the label and its two values are how a definition reads the line, not a mention of staging', () => {
  assert.deepEqual(stagingProblems('Read `Base branch:`, `Default branch:` and `Staging:` (`Staging: yes` or `Staging: no`).'), []);
  assert.deepEqual(stagingProblems('- When `Staging: no`, the base branch is the default branch.'), []);
  assert.deepEqual(stagingProblems('Nothing is staged; the stages stay.'), []);
});

test('stagingProblems: a front matter that opens the text is read line by line, and a heading after it still covers its bullets', () => {
  assert.equal(stagingProblems('---\nname: builder\ndescription: Builds off staging.\n---\n').length, 1);
  assert.deepEqual(stagingProblems('---\nname: builder\ndescription: Builds off staging when Staging: yes.\n---\n'), []);
  assert.deepEqual(stagingProblems('---\ndescription: d\n---\n## When `Staging: yes`\n- Run the staging smoke.\n'), []);
  assert.equal(stagingProblems('---\ndescription: d\n---\n- Run the staging smoke.\n').length, 1);
});

test('sectionProblems: a citation of a section RULES.md has passes (a prefix up to a space counts), and one it has not is named', () => {
  const rules = '# RULES.md\n\n## Index\n## Escalation — bring these to Adam, don\'t decide them\n## Usage\n## The build loop (BUILD.md 2.1, step 4)\n### Not a section\n';
  const names = sectionNames(rules);
  assert.deepEqual(names, ['Index', 'Escalation — bring these to Adam, don\'t decide them', 'Usage', 'The build loop (BUILD.md 2.1, step 4)']);
  assert.deepEqual(sectionProblems('(RULES.md, "Usage") and RULES.md "Escalation" and RULES.md, "The build loop"', names), []);
  assert.deepEqual(sectionProblems('the "Verification and process" group, the section "Nothing" and Usage', names), []);
  assert.deepEqual(sectionProblems('(RULES.md, "Verification and process")', names), ['cites RULES.md "Verification and process", and RULES.md has no section of that name']);
  assert.equal(sectionProblems('RULES.md "Usag" and RULES.md "Not a section"', names).length, 2);
});

const FACTS = '## Repo facts\n- Base branch: main\n- Default branch: main\n- Staging: no\n- Something else: x\n\n## Next\n- Base branch: elsewhere\n';

test('repoFacts: three labelled bullets in "Repo facts", once each, with a value, Staging yes or no, are read; every other shape is named', () => {
  assert.deepEqual(repoFacts(FACTS), { facts: { base: 'main', def: 'main', staging: 'no' }, problems: [] });
  assert.deepEqual(repoFacts(FACTS.replace('Staging: no', 'Staging: yes (an app with users)')).facts.staging, 'yes');
  assert.deepEqual(repoFacts(FACTS.replace('main\n- Default', '`staging`\n- Default')).facts.base, 'staging');
  for (const label of LABELS) {
    const without = FACTS.split('\n').filter((l) => !l.startsWith(`- ${label}:`)).join('\n');
    assert.deepEqual(repoFacts(without).problems, [`CONTEXT.md "Repo facts" has no "${label}:" line`]);
  }
  assert.deepEqual(repoFacts(FACTS.replace('- Something else: x', '- Staging: no')).problems, ['CONTEXT.md "Repo facts" has "Staging:" 2 times']);
  assert.deepEqual(repoFacts(FACTS.replace('- Base branch: main', '- Base branch:')).problems, ['CONTEXT.md "Repo facts": "Base branch:" has no value']);
  assert.deepEqual(repoFacts(FACTS.replace('Staging: no', 'Staging: maybe')).problems, ['CONTEXT.md "Repo facts": "Staging:" says "maybe", and it must say yes or no']);
  assert.deepEqual(repoFacts(FACTS.replace('## Repo facts', '## Elsewhere')).problems, ['CONTEXT.md has no "Repo facts" section']);
  // a label in another section is not the one the definitions read
  assert.deepEqual(repoFacts('## Repo facts\n- Default branch: main\n- Staging: no\n## Next\n- Base branch: main\n').problems, ['CONTEXT.md "Repo facts" has no "Base branch:" line']);
});

test('checkDefinition: a definition that is general passes, and each way to stop being one is named', () => {
  const ctx = { facts: { base: 'main', def: 'main', staging: 'no' }, headings: ['Usage', 'Decision cards'] };
  const general = `${FM}${LABELLED}- When \`Staging: yes\`, run the staging smoke (RULES.md, "Usage").\n- Branch off \`origin/<Base branch>\`.\n`;
  assert.deepEqual(checkDefinition('builder', general, ctx), []);
  assert.equal(checkDefinition('builder', `${general}- Never touch master.\n`, ctx).length, 1);
  assert.equal(checkDefinition('builder', `${general}- Run the staging smoke.\n`, ctx).length, 1);
  assert.equal(checkDefinition('builder', `${general}- Branch off \`main\`.\n`, ctx).length, 1);
  assert.equal(checkDefinition('builder', `${general}- RULES.md, "Nothing"\n`, ctx).length, 1);
  assert.equal(checkDefinition('builder', general.replace('`Default branch:`', ''), ctx).length, 1);
  assert.equal(checkDefinition('builder', general.replace('model: claude-sonnet-5-5\n', ''), ctx).length, 1);
});
