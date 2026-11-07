// kit.test.mjs — run with: node --test prototype/check/kit.test.mjs   (npm run proto:check runs it before the browser check)
//
// The kit's own guard: what the browser check (check/clipping.mjs) would take twenty states and a minute to find out, or never find out.
//   1. THE KIT RENDERS THE REAL SCREENS. prototype/src holds no copy of a src/components, src/shell or src/styles file, by name or by content
//      (a copy would be a screen that drifts from the real one, which is the one thing the kit exists not to be), no package.json of its own
//      (TASKS.md Decided 20: one lockfile, one install) and no WidthRoot of its own (Decided 45: AppRoutes carries it). The one place a copy of a
//      real file may live is src/overrides/ (override.mjs, LEARNINGS L5), which is left out.
//   2. THE SWAP LIST. vite.config.ts swaps exactly the five modules the starter's screens reach a server through, each real file exists
//      (a rename in src/ would make a swap silently miss: the page would still build and then reach for a network), each fake exists, the
//      overrides list is empty (L5) and the repo path is resolved to its real path (L4). An app that swaps more edits EXPECTED_SWAPS below.
//   3. THE DEMO MENU. It lists twenty states, each with a label, the changes it makes and ONE EXPECTATION, a text or a selector that is not
//      blank (TASKS.md Decided 46): the browser check asserts it after applying the state, and a state without one could pass as any screen.
//
// What it would not catch: that a swap works at run time (the page throws at load without the supabase swap, and the browser check reports
// it); that an expectation is TRUE (the browser check asserts it); a copy of a real file that has been changed and renamed (the browser check's
// pictures and the real screens' own tests are what stand against drift there); the DEMO menu's entries when they are not written as the literal
// array this reads.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, '..');
const root = resolve(kit, '..');
const slashed = (p) => p.split(sep).join('/');

// The modules the kit swaps, as a path inside src/ → the file in prototype/src/fakes/ that takes its place.
export const EXPECTED_SWAPS = {
  'lib/supabase.ts': 'supabase.ts',
  'features/auth/useAuth.tsx': 'useAuth.tsx',
  'features/auth/authService.ts': 'authService.ts',
  'hooks/useOnlineStatus.ts': 'useOnlineStatus.ts',
  'features/settings/useTheme.ts': 'useTheme.ts',
};
export const EXPECTED_STATES = 20;

// ─── Files ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function listFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) listFiles(full, out);
    else out.push(full);
  }
  return out;
}

const isTest = (file) => /\.test\.(?:ts|tsx|mjs)$/.test(file);
/** The text of a file with its whitespace squeezed, so a copy that was only re-indented is still a copy. */
const squeezed = (file) => readFileSync(file, 'utf8').replace(/\s+/g, ' ').trim();

/** The real files the kit must render, never copy: every file of src/components, src/shell and src/styles that is not a test. */
function realFiles() {
  return ['components', 'shell', 'styles'].flatMap((dir) => listFiles(join(root, 'src', dir)).filter((file) => !isTest(file)));
}

/** What is wrong with a set of kit files, as sentences: a copy of a real file by name or by content. `real` and `kitFiles` are absolute paths. */
export function copiesOf(real, kitFiles) {
  const names = new Map(real.map((file) => [basename(file), file]));
  const contents = new Map(real.map((file) => [squeezed(file), file]));
  const problems = [];
  for (const file of kitFiles) {
    const shown = slashed(relative(root, file));
    if (names.has(basename(file))) problems.push(`${shown} has the name of ${slashed(relative(root, names.get(basename(file))))}: the kit renders the real one`);
    else if (contents.has(squeezed(file))) problems.push(`${shown} is a copy of ${slashed(relative(root, contents.get(squeezed(file))))}`);
  }
  return problems;
}

/** The kit's own source files: everything under prototype/src except the overrides folder, which is where a copy of a real file may live. */
const kitSources = () => listFiles(join(kit, 'src')).filter((file) => !slashed(file).includes('/src/overrides/'));

test('prototype/src holds no copy of a src/components, src/shell or src/styles file: the kit renders the real ones', () => {
  const real = realFiles();
  assert.ok(real.length > 10, `expected the real components, shell and styles to be found (found ${real.length})`);
  assert.deepEqual(copiesOf(real, kitSources()), []);
});

test('the copy check sees a copy by name and by content (re-indented, under another name), and lets the kit\'s own files and the overrides folder through', () => {
  const real = realFiles();
  const dir = mkdtempSync(join(tmpdir(), 'kit-copies-'));
  try {
    const original = readFileSync(join(root, 'src/components/Badge.tsx'), 'utf8');
    writeFileSync(join(dir, 'Pill.tsx'), original.replace(/\n/g, '\n\n    ')); // the same text, re-indented, under another name
    writeFileSync(join(dir, 'Button.tsx'), 'export const Button = () => null\n'); // another text, under a real file's name
    writeFileSync(join(dir, 'Other.tsx'), 'export const Other = () => null\n'); // neither
    const found = copiesOf(real, [join(dir, 'Pill.tsx'), join(dir, 'Button.tsx'), join(dir, 'Other.tsx')]);
    assert.equal(found.length, 2, found.join('\n'));
    assert.match(found[0], /Pill\.tsx is a copy of src\/components\/Badge\.tsx/);
    assert.match(found[1], /Button\.tsx has the name of src\/components\/Button\.tsx/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  // The kit's own files are not copies, and the overrides folder is left out of what is read.
  assert.deepEqual(copiesOf(real, [join(kit, 'src/App.tsx'), join(kit, 'src/demo/DemoMenu.tsx')]), []);
  assert.ok(!kitSources().some((file) => slashed(file).includes('/src/overrides/')));
});

/** Whether a source imports or draws `WidthRoot` (a comment that names it does not count). */
function drawsWidthRoot(text) {
  const source = ts.createSourceFile('x.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found = false;
  const visit = (node) => {
    if (ts.isImportSpecifier(node) && node.name.text === 'WidthRoot') found = true;
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'WidthRoot') found = true;
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

test('prototype/ has no package.json or lockfile of its own (one lockfile, one install) and draws no frame of its own (AppRoutes has the WidthRoot)', () => {
  for (const name of ['package.json', 'package-lock.json']) assert.ok(!existsSync(join(kit, name)), `prototype/${name} exists: the kit uses the root node_modules (Decided 20)`);
  const own = kitSources().filter((file) => /\.tsx?$/.test(file) && drawsWidthRoot(readFileSync(file, 'utf8')));
  assert.deepEqual(own.map((file) => slashed(relative(root, file))), [], 'a second WidthRoot (Decided 45)');
  // The reader sees an import and a JSX element, and lets a comment that names it through.
  assert.ok(drawsWidthRoot("import { WidthRoot } from '@app/lib/useWide'"));
  assert.ok(drawsWidthRoot('const a = <WidthRoot className="x">y</WidthRoot>'));
  assert.ok(!drawsWidthRoot('// AppRoutes carries its own WidthRoot (Decided 45)\nexport const a = 1'));
});

// ─── The swap list ─────────────────────────────────────────────────────────────────────────────────────────────────

const parse = (file) =>
  ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

/** The initializer of the top-level `const <name> = ...` in a source file, or undefined. */
function constInitializer(source, name) {
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) if (ts.isIdentifier(decl.name) && decl.name.text === name) return decl.initializer;
  }
  return undefined;
}

const stringOf = (node) => (node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined);

/** `{ 'a/b.ts': 'c.ts' }` as an object: the swap list written in a config's source. */
export function swapsOf(configSource) {
  const source = ts.createSourceFile('vite.config.ts', configSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let literal = constInitializer(source, 'SWAPS');
  if (literal && ts.isAsExpression(literal)) literal = literal.expression;
  if (!literal || !ts.isObjectLiteralExpression(literal)) return null;
  const swaps = {};
  for (const prop of literal.properties) {
    if (!ts.isPropertyAssignment(prop)) return null;
    const key = ts.isIdentifier(prop.name) ? prop.name.text : stringOf(prop.name);
    swaps[key] = stringOf(prop.initializer);
  }
  return swaps;
}

const configText = () => readFileSync(join(kit, 'vite.config.ts'), 'utf8');

test('the swap list names exactly the five modules, each real file and each fake exists, and no override is listed', () => {
  const swaps = swapsOf(configText());
  assert.ok(swaps, 'vite.config.ts has no `const SWAPS = { ... }` object literal this can read');
  assert.deepEqual(swaps, EXPECTED_SWAPS);
  for (const [real, fake] of Object.entries(swaps)) {
    assert.ok(existsSync(join(root, 'src', real)), `src/${real} does not exist: the swap would silently miss (a module that was renamed or moved)`);
    assert.ok(existsSync(join(kit, 'src/fakes', fake)), `prototype/src/fakes/${fake} does not exist`);
  }
  const source = ts.createSourceFile('vite.config.ts', configText(), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const overridden = constInitializer(source, 'OVERRIDDEN');
  assert.ok(overridden && ts.isArrayLiteralExpression(overridden), 'vite.config.ts has no `const OVERRIDDEN = [ ... ]`');
  assert.equal(overridden.elements.length, 0, 'OVERRIDDEN is not empty: each spec chat starts it empty (L5)');
});

test('the repo path is resolved to its real path (L4: a swap keyed by a path through a symlink never matches)', () => {
  assert.match(configText(), /const REPO = fs\.realpathSync\(/);
});

test('the swap reader sees a removed swap, an added swap and an unreadable list (the near-misses the real list must not trip)', () => {
  const text = configText();
  assert.equal(Object.keys(swapsOf(text)).length, 5);
  assert.equal(Object.keys(swapsOf(text.replace(/^ {2}'lib\/supabase\.ts': 'supabase\.ts',\n/m, ''))).length, 4, 'a removed swap is seen');
  assert.equal(Object.keys(swapsOf(text.replace("'hooks/useOnlineStatus.ts': 'useOnlineStatus.ts',", "'hooks/useOnlineStatus.ts': 'useOnlineStatus.ts',\n  'hooks/useClock.ts': 'useClock.ts',"))).length, 6, 'an added swap is seen');
  assert.equal(swapsOf('export default {}'), null, 'a config with no SWAPS reads as null');
});

// ─── The DEMO menu ─────────────────────────────────────────────────────────────────────────────────────────────────

/** The properties of an object literal by name (an identifier or a string). */
function props(literal) {
  const out = new Map();
  if (!literal || !ts.isObjectLiteralExpression(literal)) return out;
  for (const prop of literal.properties) {
    if (ts.isPropertyAssignment(prop) && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) out.set(prop.name.text, prop.initializer);
  }
  return out;
}

/** Why an `expect` is not a real expectation, or null: it must be an object literal with a `text` or a `selector` that is not blank. */
function blankExpect(node) {
  if (!node || !ts.isObjectLiteralExpression(node)) return 'it is not an object literal ({ text } or { selector })';
  const fields = props(node);
  const named = ['text', 'selector'].filter((name) => fields.has(name));
  if (named.length === 0) return 'it has neither a text nor a selector';
  for (const name of named) {
    const value = stringOf(fields.get(name));
    if (value !== undefined && value.trim() === '') return `its ${name} is blank`;
  }
  return null;
}

/** Every state of the DEMO menu's ENTRIES, with what is wrong with it: [{ screen, label, problems }]. */
export function statesOf(menuSource) {
  const source = ts.createSourceFile('DemoMenu.tsx', menuSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const entries = constInitializer(source, 'ENTRIES');
  if (!entries || !ts.isArrayLiteralExpression(entries)) return null;
  const out = [];
  for (const entry of entries.elements) {
    const entryProps = props(entry);
    const states = entryProps.get('states');
    if (!states || !ts.isArrayLiteralExpression(states)) return null;
    for (const state of states.elements) {
      const fields = props(state);
      const label = stringOf(fields.get('label'));
      const problems = [];
      if (!label) problems.push('no label');
      if (!fields.has('patch')) problems.push('no patch (what the state changes)');
      if (!fields.has('expect')) problems.push('no expect');
      else {
        const why = blankExpect(fields.get('expect'));
        if (why) problems.push(`its expect is not an expectation: ${why}`);
      }
      out.push({ screen: stringOf(entryProps.get('screen')) ?? '?', label: label ?? '?', problems });
    }
  }
  return out;
}

const menuText = () => readFileSync(join(kit, 'src/demo/DemoMenu.tsx'), 'utf8');

test(`the DEMO menu lists ${EXPECTED_STATES} states and every one has an expectation that is not blank`, () => {
  const states = statesOf(menuText());
  assert.ok(states, 'DemoMenu.tsx has no `const ENTRIES = [ { states: [ ... ] } ]` literal this can read');
  assert.equal(states.length, EXPECTED_STATES);
  const bad = states.filter((s) => s.problems.length).map((s) => `${s.screen} · ${s.label}: ${s.problems.join('; ')}`);
  assert.deepEqual(bad, []);
  const names = states.map((s) => `${s.screen} · ${s.label}`);
  assert.equal(new Set(names).size, names.length, 'two states have the same name (their screenshots would overwrite each other)');
});

test('the state reader sees a blanked expect, a missing expect, one with neither text nor selector, and a state removed', () => {
  const text = menuText();
  const blanked = text.replace("expect: { text: w.clients.empty }", "expect: { text: '' }");
  assert.notEqual(blanked, text);
  assert.match(statesOf(blanked).find((s) => s.label === 'Empty').problems.join(), /blank/);
  const missing = text.replace(", expect: { text: w.clients.empty }", '');
  assert.notEqual(missing, text);
  assert.match(statesOf(missing).find((s) => s.label === 'Empty').problems.join(), /no expect/);
  const neither = text.replace("expect: { text: w.clients.empty }", 'expect: { count: 3 }');
  assert.match(statesOf(neither).find((s) => s.label === 'Empty').problems.join(), /neither/);
  const removed = text.replace(/^ {6}\{ label: 'Empty', .*\n/m, '');
  assert.equal(statesOf(removed).length, EXPECTED_STATES - 1);
  // Near-misses: an expectation written with a selector, or a text built from the words file, is fine.
  assert.deepEqual(statesOf(text).filter((s) => s.problems.length), []);
  assert.equal(statesOf('const ENTRIES = 3'), null);
});
