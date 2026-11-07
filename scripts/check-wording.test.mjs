// check-wording.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// SPEC Rules 2 ("Code uses only tokens and the words file") and item 4 ("Wording check"), TASKS.md Decided 10. Every word the app shows
// lives in the words file (src/i18n/pl.ts) and a screen reads it by name (`t.settings.title`); this is the standing check that no screen
// writes a word of its own, and that no screen says a word the app has retired. Lifted from Overload's check-wording.test.mjs, which was
// the second half only: the same parser and scanner (`scanSourceFull`, `isScanned`, `looksLikeCode`, `isQueryArgument`, the attribute
// lists, the call-pattern tests, the ALLOWED mechanism and its "no stale entry" test), with the first half added.
//
// Two rules, one scanner (each hit names its rule in `family`)
//   - THE WORDS RULE (the starter's): every text the scanner reads as words, outside src/i18n/, is a hit when it has a letter in it.
//   - THE FORBIDDEN-WORD FAMILIES (FAMILIES below; each app's own, empty in the starter): the words an app has retired. The words
//     file is read for them too: a retired word in pl.ts fails.
//
// What it reads as words (and what it doesn't)
//   - Read: JSX text (the words between tags), and every string literal and template piece in the file, which is where a screen's words
//     live (JSX attributes such as placeholder, aria-label and confirmLabel; constants, object labels, ternaries, returned and thrown
//     messages). console.* messages count too, to keep the rule one rule: a developer-facing message gets an ALLOWED entry.
//   - Not read: comments (they are not parsed as tokens). Code identifiers, routes, table names and query keys, which never appear as JSX
//     text and, as strings, look like code. A string counts as CODE, not words, when it is ONE token (no whitespace) that does not start
//     with a capital: 'tags', 'meso-1', '/clients/:id', 'translateZ(0)', 'signOut'. So is an argument of a query call (.from, .select,
//     .eq, .order, .rpc, ...): a column list such as 'id, name, phone' is names. So is the value of a NON_TEXT_ATTRS attribute (className,
//     id, to, path, type, ...) or a data-* attribute, through a ternary, `??`, `&&`, `+`, parentheses and a template: a class list is
//     written in `className` (a literal, a ternary, a `+`, a template), or one class to a string anywhere else (`cx('flex', 'gap-2')`;
//     `cx('flex gap-2')` is a hit, DECISIONS 64). The same text in JSX text, in a TEXT_ATTRS attribute (placeholder, title, aria-label,
//     alt, label, confirmLabel, ...), or as a capitalised or multi-word string ('Zapisz', 'Nie udało się') is words.
//   - Not read as words either: an import or export path, a type (a string in a type position), text with no letter in it (punctuation,
//     spaces, digits: the "·" of the build line, " *" after a required label, an HTML entity such as &nbsp; or &times; in JSX text).
//   - Not scanned: test files (*.test.ts / *.test.tsx), test support (*.testutil.ts / *.testutil.tsx, src/testing/, __fixtures__ and
//     __tests__ folders) and .d.ts files. src/i18n/ is scanned for the families only, never for the words rule: it is where words live.
//
// The allowlist (ALLOWED below) is the only way a hit passes. Each entry names the file, the rule, the exact text and why, and a test
// fails if an entry no longer matches anything (a stale exception is a hole). Today it holds the developer-facing messages (a console
// message and the missing-environment error: Decided 10) and one ISO currency code. Adding an entry is a visible diff to this file.
//
// What it would not catch (TASKS.md, chunk 5): a word computed at runtime or joined from pieces (`${n} klientów` reads as a number and a
// lone word); a one-token lowercase word ('klient' reads as code by Overload's rule, so do { label: 'klienci' } and `${a} klient`); a
// word placed in the words file under a wrong key (the file is not scanned for the rule); a developer message allowed here that later
// reaches a screen. A capitalised developer token (a key name such as 'Escape' or 'Tab', an ISO code) is a hit and needs an entry.
//
// How it is proven: the tree test sweeps src/ and fails on any hit that is not allowed; the "call patterns" tests run the scanner over
// small sources, one per way a string reaches a screen, each of which must be caught, beside the near-misses it must let through. The
// family tests run with a STAND-IN list (Overload's four families, renamed to neutral words), because the starter's own list is empty
// and the scanner must stay proven against a family that really matches.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// ─── The rules ─────────────────────────────────────────────────────────────────────────────────────────────────────

// The forbidden-word families: the starter has none. An app that retires a word adds `{ id, re, rule }` here (`re` is tested against
// the trimmed, whitespace-collapsed text of a string or a JSX text, whole words, so write it with \b; `rule` says where the app decided
// it). Overload's were "meso", "run", "tag" and "change the plan", each from its SPEC's Language section.
export const FAMILIES = [];

// The words rule, the starter's own: a text the scanner reads as words and that has a letter in it. Digits, punctuation and spaces are
// not words (the "·" of the build line, a " *" after a required label).
export const WORDS_RULE = {
  id: 'words',
  re: /\p{L}/u,
  rule: 'SPEC Rules 2, TASKS.md Decided 10: a word a person reads comes from the words file (src/i18n/pl.ts) by name, never written in a screen',
};

// Attributes whose value is a name, a path, a class or a style, never words.
const NON_TEXT_ATTRS = new Set([
  'className', 'style', 'id', 'key', 'ref', 'htmlFor', 'name', 'type', 'to', 'href', 'path', 'role', 'rel', 'target',
  'inputMode', 'autoComplete', 'autoCapitalize', 'pattern', 'viewBox', 'd', 'fill', 'stroke', 'xmlns', 'width', 'height', 'src', 'srcSet', 'method',
]);
// Attributes whose value is read by a person (or a screen reader), whatever it looks like. Overload's twelve, then the props of the
// starter's components that carry words (the prototype's overlays, fields and shell): a component whose prop takes a word adds its name.
const TEXT_ATTRS = new Set([
  'placeholder', 'title', 'aria-label', 'aria-description', 'aria-placeholder', 'alt', 'label', 'children', 'description', 'caption', 'message', 'text',
  'confirmLabel', 'cancelLabel', 'closeLabel', 'pendingLabel', 'eyebrow', 'hint', 'error', 'sub', 'header', 'body',
]);

// The allowlist: { file, family, text, reason }. `text` is the whole string as the scanner reads it (trimmed, whitespace collapsed).
// An entry that matches nothing fails the "no stale entry" test.
export const ALLOWED = [
  {
    file: 'src/components/overlay.ts',
    family: 'words',
    text: 'Escape',
    reason: "DECISIONS 67: the value of KeyboardEvent.key that closes the top overlay (`event.key === 'Escape'`); a key name the browser reports, compared and never drawn on a screen",
  },
  {
    file: 'src/components/overlay.ts',
    family: 'words',
    text: 'Tab',
    reason: "DECISIONS 67: the value of KeyboardEvent.key that the overlay's focus ring acts on (`event.key === 'Tab'`); a key name the browser reports, compared and never drawn on a screen",
  },
  {
    file: 'src/features/pwa/useServiceWorker.ts',
    family: 'words',
    text: '[pwa] service worker registration failed, falling back to bare registration',
    reason: "TASKS.md Decided 10: a console message for whoever has the browser's console open (the registration through workbox-window failed and the bare one takes over); developer-facing, never drawn on a screen",
  },
  {
    file: 'src/features/pwa/useServiceWorker.ts',
    family: 'words',
    text: '[pwa] fallback service worker registration also failed',
    reason: "TASKS.md Decided 10: a console message for whoever has the browser's console open (the bare registration failed as well); developer-facing, never drawn on a screen",
  },
  {
    file: 'src/lib/format.ts',
    family: 'words',
    text: 'PLN',
    reason: "the ISO 4217 code handed to Intl.NumberFormat (`currency: 'PLN'`): an argument the browser reads, not a word on a screen; an app for another market changes it beside the locale",
  },
  {
    file: 'src/lib/supabase.ts',
    family: 'words',
    text: 'Missing Supabase env vars. Copy .env.example to .env.local and fill in your project values.',
    reason: "TASKS.md Decided 10 (the first entry): the error thrown when the build has no Supabase URL or key, read by whoever runs the app in development; developer-facing, never drawn on a screen",
  },
];

// ─── Which files ───────────────────────────────────────────────────────────────────────────────────────────────────
const slashed = (relPath) => relPath.split(sep).join('/');

/** True for a file the scan reads: a .ts / .tsx under src/ that is not a test, test support or a declaration. */
export function isScanned(relPath) {
  const p = slashed(relPath);
  if (!p.startsWith('src/')) return false;
  if (!/\.tsx?$/.test(p) || /\.d\.ts$/.test(p)) return false;
  if (p.startsWith('src/testing/')) return false;
  if (/\.test\.tsx?$/.test(p) || /\.testutil\.tsx?$/.test(p)) return false;
  if (/(^|\/)(__fixtures__|__tests__)\//.test(p)) return false;
  return true;
}

/** The words rule is not applied to the words file itself (src/i18n/): it is where the words live. The families still read it. */
export function wordsRuleApplies(relPath) {
  return !slashed(relPath).startsWith('src/i18n/');
}

function listFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) listFiles(full, out);
    else out.push(full);
  }
  return out;
}

// ─── The scanner ───────────────────────────────────────────────────────────────────────────────────────────────────
// What a string's value is the value OF, looking up through these: a ternary, `??`/`&&`/`+`, parentheses, `as`, `!`, and a template
// literal with its pieces and substitutions (so `className={`flex ${on ? 'a b' : 'c d'} gap-2`}` is the className's value).
const TRANSPARENT = new Set([
  ts.SyntaxKind.ParenthesizedExpression, ts.SyntaxKind.JsxExpression, ts.SyntaxKind.ConditionalExpression,
  ts.SyntaxKind.BinaryExpression, ts.SyntaxKind.AsExpression, ts.SyntaxKind.NonNullExpression,
  ts.SyntaxKind.TemplateExpression, ts.SyntaxKind.TemplateSpan,
]);

/** The name of the JSX attribute this string is the value of (through a ternary, `??`, `&&`, `+`, parentheses, a template), or null. */
function attributeNameOf(node) {
  let p = node.parent;
  while (p && TRANSPARENT.has(p.kind)) p = p.parent;
  return p && ts.isJsxAttribute(p) ? p.name.getText() : null;
}

/** One token that doesn't start with a capital: a field, key, route, table, class or id, not words. */
function looksLikeCode(text) {
  return !/\s/.test(text) && !/^[A-Z]/.test(text);
}

// A query's column list or filter is a name, not words: .select('id, name, phone'), .eq('owner_id', id), .rpc('apply_ops').
const QUERY_CALLS = new Set([
  'from', 'select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'is', 'like', 'ilike', 'not', 'or', 'filter', 'match',
  'order', 'contains', 'containedBy', 'overlaps', 'textSearch', 'rpc',
]);
function isQueryArgument(node) {
  const call = node.parent;
  return ts.isCallExpression(call) && call.arguments.includes(node) && ts.isPropertyAccessExpression(call.expression) && QUERY_CALLS.has(call.expression.name.text);
}

// An HTML entity in JSX text (&nbsp; &times; &#8226;) is one character, not a word.
const ENTITY = /&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi;

/** A string in a type position (`type Kind = 'own' | 'shared'`, `import('x')`, a template literal type) is a type, not text. */
const inTypePosition = (p) => ts.isLiteralTypeNode(p) || ts.isTemplateLiteralTypeNode(p) || ts.isTemplateLiteralTypeSpan(p);
/** A module name: `import … from 'x'`, `export … from 'x'`, `import x = require('x')`, `declare module 'x'`. */
const inModuleSpecifier = (p) => ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isModuleDeclaration(p);

/**
 * Every place a file's source breaks a rule, and how many strings and texts were read.
 * `families` is the forbidden-word list (the starter's own is FAMILIES); `words: false` leaves the words rule out (the words file).
 * @returns {{ hits: { line: number, family: string, text: string }[], tokens: number }}
 */
export function scanSourceFull(fileName, text, { families = FAMILIES, words = true } = {}) {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  const rules = words ? [WORDS_RULE, ...families] : families;
  const hits = [];
  let tokens = 0;

  const consider = (node, raw, isJsxText) => {
    const said = (isJsxText ? raw.replace(ENTITY, ' ') : raw).replace(/\s+/g, ' ').trim();
    if (said === '') return;
    tokens++;
    if (!isJsxText) {
      if (isQueryArgument(node)) return;
      const attr = attributeNameOf(node);
      if (attr !== null && (NON_TEXT_ATTRS.has(attr) || attr.startsWith('data-'))) return;
      const forced = attr !== null && TEXT_ATTRS.has(attr);
      if (!forced && looksLikeCode(said)) return;
    }
    for (const rule of rules) {
      if (rule.re.test(said)) {
        hits.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, family: rule.id, text: said });
      }
    }
  };

  const visit = (node) => {
    if (node.kind === ts.SyntaxKind.JsxText) consider(node, node.text, true);
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const p = node.parent;
      if (!inTypePosition(p) && !inModuleSpecifier(p)) consider(node, node.text, false);
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      if (!inTypePosition(node.parent)) consider(node, node.text, false);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return { hits, tokens };
}

/** Every place a file's source breaks a rule. */
export function scanSource(fileName, text, options) {
  return scanSourceFull(fileName, text, options).hits;
}

/**
 * Scan a tree: every hit that is not allowlisted, every allowlist entry that was used, and how much was read.
 * `allowed` and `families` default to the real lists; a test hands in its own with a temporary tree.
 */
export function scanTree(rootDir = root, { allowed = ALLOWED, families = FAMILIES } = {}) {
  const files = listFiles(join(rootDir, 'src')).map((f) => relative(rootDir, f).split(sep).join('/')).filter(isScanned).sort();
  const found = [];
  const used = new Set();
  let tokens = 0;
  for (const file of files) {
    const scanned = scanSourceFull(file, readFileSync(join(rootDir, file), 'utf8'), { families, words: wordsRuleApplies(file) });
    tokens += scanned.tokens;
    for (const hit of scanned.hits) {
      const index = allowed.findIndex((a) => a.file === file && a.family === hit.family && a.text === hit.text);
      if (index !== -1) used.add(index);
      else found.push({ file, ...hit });
    }
  }
  return { files, found, used, tokens };
}

// ─── The tree ──────────────────────────────────────────────────────────────────────────────────────────────────────
const tree = scanTree();
const lineOf = (h) => `${h.file}:${h.line} [${h.family}] ${JSON.stringify(h.text)}`;

test('no screen shows a word that is not from the words file (the sweep over src/: tests and src/i18n/ excepted)', () => {
  const lines = tree.found.filter((h) => h.family === WORDS_RULE.id).map(lineOf);
  assert.equal(lines.length, 0, `${lines.length} text(s) are written in a screen, not read from src/i18n/pl.ts (or allowed in ALLOWED with a reason):\n  ${lines.join('\n  ')}`);
});

test('no screen says a word the app has retired (the families are the app\'s own: none in the starter)', () => {
  const lines = tree.found.filter((h) => h.family !== WORDS_RULE.id).map(lineOf);
  assert.equal(lines.length, 0, `${lines.length} user-visible string(s) say a retired word:\n  ${lines.join('\n  ')}`);
});

test('each family an app lists has an id, a regular expression and the rule it comes from', () => {
  for (const family of FAMILIES) {
    assert.ok(typeof family.id === 'string' && family.id !== WORDS_RULE.id, 'a family has its own id');
    assert.ok(family.re instanceof RegExp && !family.re.global && !family.re.sticky, `${family.id}: a plain regular expression (a global one remembers its last match)`);
    assert.ok(typeof family.rule === 'string' && family.rule.length > 20, `${family.id}: says where the app decided the word is retired`);
  }
});

test('the scan really read the tree: the app\'s code is in it, tests, declarations and the words file rule are not', () => {
  for (const f of ['src/App.tsx', 'src/main.tsx', 'src/lib/supabase.ts', 'src/lib/format.ts', 'src/features/pwa/useServiceWorker.ts']) assert.ok(tree.files.includes(f), `${f} is scanned`);
  assert.ok(!tree.files.some((f) => /\.test\.|\.testutil\./.test(f)), 'no test file is scanned');
  assert.ok(!tree.files.some((f) => f.endsWith('.d.ts')), 'no declaration file is scanned');
  assert.ok(tree.files.length >= 5, `${tree.files.length} files scanned`);
  assert.ok(tree.tokens >= 30, `${tree.tokens} strings and texts read: the parser found the words`);
});

test('every allowlist entry still matches something and says why', () => {
  ALLOWED.forEach((entry, i) => {
    assert.ok(tree.used.has(i), `allowlist entry for ${entry.file} ${JSON.stringify(entry.text)} matches nothing: remove it`);
    assert.ok(entry.reason.length > 40, `allowlist entry ${i} gives its reason`);
    assert.ok(entry.family === WORDS_RULE.id || FAMILIES.some((f) => f.id === entry.family), `allowlist entry ${i} names a rule that exists`);
  });
});

test('which files are scanned: src/ code only, never tests, test support or declarations; the words file is read for families only', () => {
  const yes = ['src/App.tsx', 'src/features/auth/authService.ts', 'src/features/settings/SettingsPage.tsx', 'src/lib/db.ts', 'src/i18n/pl.ts'];
  const no = [
    'src/features/auth/LoginPage.test.tsx', 'src/lib/format.test.ts', 'src/features/pwa/fakeRegistration.testutil.ts', 'src/testing/captureRender.ts',
    'src/features/x/__fixtures__/w1.html', 'src/features/x/__tests__/a.ts', 'api/x.ts', 'scripts/check-wording.test.mjs', 'src/vite-env.d.ts',
    'src/styles/global.css', 'prototype/src/i18n/pl.ts',
  ];
  for (const p of yes) assert.equal(isScanned(p), true, p);
  for (const p of no) assert.equal(isScanned(p), false, p);
  assert.equal(wordsRuleApplies('src/i18n/pl.ts'), false);
  assert.equal(wordsRuleApplies('src/i18n/en.ts'), false);
  assert.equal(wordsRuleApplies('src/App.tsx'), true);
  assert.equal(wordsRuleApplies('src/features/i18n/Thing.tsx'), true, 'only src/i18n/ itself is the words file');
});

test('the tree scan finds a planted file by its path, spares the words file, tests and an allowed text, and reports a stale entry', () => {
  const dir = mkdtempSync(join(tmpdir(), 'wording-'));
  const put = (rel, text) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  put('src/features/x/Screen.tsx', 'export const Screen = () => <p>Zapisz</p>;\n');
  put('src/i18n/pl.ts', "export const pl = { a: { b: 'Zapisz' } };\n");
  put('src/features/x/Screen.test.tsx', 'export const T = () => <p>Zapisz</p>;\n');
  put('src/lib/supabase.ts', "throw new Error('Missing the thing, sorry');\n");
  const allowed = [
    { file: 'src/lib/supabase.ts', family: 'words', text: 'Missing the thing, sorry', reason: 'a stand-in entry that matches the planted file above' },
    { file: 'src/lib/gone.ts', family: 'words', text: 'Not there any more', reason: 'a stand-in entry that matches nothing: a stale one' },
  ];
  try {
    const planted = scanTree(dir, { allowed });
    assert.deepEqual(planted.found.map((h) => `${h.file}:${h.line} ${h.text}`), ['src/features/x/Screen.tsx:1 Zapisz']);
    assert.deepEqual([...planted.used], [0], 'the matching entry was used, the other was not (the stale-entry test would fail on it)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── The call patterns: one source per way a string reaches a screen ──────────────────────────────────────────────────
// The words rule, with no families: what a screen may not write, beside what it may.
const wordsOf = (name, code) => scanSource(name, code, { families: [] }).map((h) => h.text);

test('words: JSX text with a letter is a hit, including the words after an element and lowercase words; text with no letter is not', () => {
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <p>Zapisz</p>'), ['Zapisz']);
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <p>Usuń <b>{n}</b> klientów</p>'), ['Usuń', 'klientów'], 'the text after an element is read');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <span>klient</span>'), ['klient'], 'a lowercase word between tags is still words');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <p>12 zł</p>'), ['12 zł']);
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <p>·</p>'), [], 'punctuation only');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <label>{label}<span className="text-ink-4"> *</span></label>'), [], 'the asterisk after a required label');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <td>1 234</td>'), [], 'digits and spaces only');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <p>{t.settings.title}</p>'), [], 'a word read from the words file');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <p>{t.settings.buildLine(v, h, time)}</p>'), [], 'a words-file function');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <span>&nbsp;</span>'), [], 'an entity is a character');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <button>&times;</button>'), [], 'an entity is a character');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <span>&#8226;</span>'), [], 'a numeric entity is a character');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <span>&nbsp;Zapisz</span>'), ['Zapisz'], 'the word beside an entity is still a word');
});

test('words: an attribute a person reads is read, one that is a name, a path or a class is not', () => {
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <input placeholder="Szukaj" />'), ['Szukaj']);
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <input placeholder="szukaj" />'), ['szukaj'], 'a one-word placeholder is words');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <Dialog confirmLabel="Usuń" />'), ['Usuń']);
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <Dialog confirmLabel="usuń" cancelLabel="anuluj" closeLabel="zamknij" pendingLabel="usuwam" />'), ['usuń', 'anuluj', 'zamknij', 'usuwam'], 'the components\' own label props');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <button aria-label="zamknij" title={x ? "ok" : "nie"} />'), ['zamknij', 'ok', 'nie'], 'aria-label and title are words, whatever they look like');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <img alt="logo" />'), ['logo']);
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <input placeholder={`szukaj ${x}`} />'), ['szukaj'], 'a template in a text attribute is that attribute\'s value');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <input placeholder={t.common.search} />'), [], 'a word from the words file');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <Dialog confirmLabel={t.a.b} cancelLabel={t.common.cancel} />'), [], 'the near-miss: a label prop given a word by name');
  assert.deepEqual(wordsOf('a.tsx', 'const A = () => <div id="main" key="a" to="/klienci" path="/klienci/:id" role="dialog" type="submit" data-testid="Zapisz klienta" data-layout={wide ? "desktop" : "phone"} />'), []);
});

test('words: a class list is a className (a literal, a ternary, a +, a template), or one class to a string', () => {
  const ok = [
    'const A = () => <div className="flex gap-2 text-sm" />',
    "const A = ({ wide }: { wide: boolean }) => <div className={wide ? 'm-auto w-full max-w-[400px]' : 'flex w-full flex-col'} />",
    "const A = ({ wide }: { wide: boolean }) => <div className={'flex flex-col gap-5 ' + (wide ? 'rounded-lg border p-7' : '')} />",
    "const A = ({ x }: { x: boolean }) => <div className={`flex gap-2 ${x ? 'p-4 m-2' : ''} text-sm`} />",
    "const A = ({ on }: { on: boolean }) => <div className={cx('flex', 'gap-2', on ? 'bg-accent' : 'bg-raised')} />",
    "const BASE = ['inline-flex', 'items-center', 'justify-center', 'disabled:opacity-50', 'hover:bg-raised']",
  ];
  assert.deepEqual(wordsOf('a.tsx', ok.join('\n')), []);
  // ...but a class list with a space in it, handed to anything else, is words (DECISIONS 64: one class to a string)
  assert.deepEqual(wordsOf('a.tsx', "const A = () => <div className={cx('flex gap-2')} />"), ['flex gap-2'], 'cx(\'a b c\') with a multi-word string is a hit');
  assert.deepEqual(wordsOf('a.tsx', "const BASE = ['inline-flex items-center']"), ['inline-flex items-center']);
  assert.deepEqual(wordsOf('a.tsx', "const A = () => <NavLink className={({ isActive }) => (isActive ? 'bg-accent text-on-accent' : 'text-ink')} />"), ['bg-accent text-on-accent'], 'a className given by a function is not read as a className');
  assert.deepEqual(wordsOf('a.tsx', "const A = () => <div style={{ transition: 'opacity 0.2s ease' }} />"), ['opacity 0.2s ease'], 'a style value with a space is not a className either');
});

test('words: a string in an expression is read: ternary, ??, object label, array, return, template, thrown message, toast, console', () => {
  assert.deepEqual(wordsOf('a.tsx', "const A = () => <p>{saving ? 'Zapisywanie…' : 'Zapisz'}</p>"), ['Zapisywanie…', 'Zapisz']);
  assert.deepEqual(wordsOf('a.tsx', "const A = () => <p>{s.title ?? 'Brak danych'}</p>"), ['Brak danych']);
  assert.deepEqual(wordsOf('a.ts', "toast.show('Zapisano')"), ['Zapisano']);
  assert.deepEqual(wordsOf('a.ts', "export const COLUMNS = [{ key: 'name', label: 'Klienci' }]"), ['Klienci'], "the key 'name' is code; the label is words");
  assert.deepEqual(wordsOf('a.ts', "export const f = (n: number) => n === 0 ? 'Brak klientów' : 'Jest klient'"), ['Brak klientów', 'Jest klient']);
  assert.deepEqual(wordsOf('a.ts', 'export const f = (n: number) => `Zapisano ${n} rekordów w tej wersji`'), ['Zapisano', 'rekordów w tej wersji'], 'the pieces of a template are read');
  assert.deepEqual(wordsOf('a.ts', "export function f() { throw new RangeError('Nie udało się zapisać') }"), ['Nie udało się zapisać'], 'a thrown message');
  assert.deepEqual(wordsOf('a.ts', "console.error('[pwa] registration failed', error)"), ['[pwa] registration failed'], 'a console message (the ALLOWED entries are for these)');
  assert.deepEqual(wordsOf('a.ts', "export const CODE = 'PLN'"), ['PLN'], 'a capitalised token is not code by Overload\'s rule');
  assert.deepEqual(wordsOf('a.ts', "export const g = () => `Usuń`"), ['Usuń']);
  // what it would not catch, pinned so a change to it is a decision: a lone lowercase word reads as code
  assert.deepEqual(wordsOf('a.ts', "export const COLUMNS = [{ key: 'name', label: 'klienci' }]"), [], 'a one-token lowercase word reads as code');
  assert.deepEqual(wordsOf('a.ts', 'export const f = (n: number) => `${n} klientów`'), [], 'a number and a lone lowercase word joined in a template');
});

test('words: names, keys, routes, tables, types, imports, empty text and comments are not words', () => {
  const code = [
    "import { useClients } from './useClients'",
    "import type { Client } from '../../types'",
    "export { thing } from './Some Thing'",
    "export type Kind = 'Own' | 'signed in' | `data-${string}` | `Klient ${string} Nowak`",
    "const KEYS = ['clients', 'theme', 'translateZ(0)', '#root']",
    "const q = supabase.from('clients').select('id, name, phone').eq('owner_id', id).order('created_at', { ascending: false })",
    "const route = `/clients/${id}/edit`; const r2 = '/clients/:clientId/edit'",
    "const fixture = { id: 'c1', kind: 'own', source: 'import' }",
    'const css = { transform: "translateZ(0)", color: "var(--accent)" }',
    "document.documentElement.setAttribute('data-theme', 'dark')",
    '// Zapisz   Usuń   Szukaj klienta',
    '/* Anuluj  zmiany */',
    "const empty = ''; const space = ' '; const dots = '…'; const joined = `${a}: ${b}.`; const digits = '12 345'",
  ];
  assert.deepEqual(wordsOf('a.ts', code.join('\n')), [], 'every name, key, route, query column list, type, import, empty text and comment passes');
  // ...but the same list handed to anything that is not a query is words
  assert.deepEqual(wordsOf('a.ts', "show('id, name, phone')"), ['id, name, phone']);
  assert.deepEqual(wordsOf('a.ts', "const kind = { a: 'kind: own' }"), ['kind: own']);
});

// The family rule, with the stand-in list: what the scanner's lifted call patterns still prove.
const STAND_IN_FAMILIES = [
  { id: 'widget', re: /\bwidgets?\b/i, rule: 'stand-in: one whole word and its plural' },
  { id: 'run', re: /\bruns?\b/i, rule: 'stand-in: a short word that "running" must not match' },
  { id: 'tag', re: /\b(?:un)?tag(?:s|ged|ging)?\b/i, rule: 'stand-in: a word with its prefix and endings' },
  { id: 'change-the-plan', re: /\bchange\s+(?:the\s+)?plan\b/i, rule: 'stand-in: a phrase, not a word' },
];
const hitsOf = (name, code) => scanSource(name, code, { families: STAND_IN_FAMILIES, words: false }).map((h) => `${h.family}:${h.text}`);

test('families: JSX text is read, including the words after an element on the same paragraph', () => {
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p>NO WIDGET</p>'), ['widget:NO WIDGET']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p>This deletes <b>{name}</b>'s plan, no longer linked to this widget.</p>"), ["widget:'s plan, no longer linked to this widget."]);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <button>END RUN</button>'), ['run:END RUN']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <span>EDIT TAGS</span>'), ['tag:EDIT TAGS']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <span>tags</span>'), ['tag:tags'], 'a lowercase word between tags is still words');
});

test('families: an attribute a person reads is read, one that is a name or a path is not', () => {
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <input placeholder="Search sessions or widgets…" />'), ['widget:Search sessions or widgets…']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <button aria-label="tags" title={x ? "widget" : "ok"} />'), ['tag:tags', 'widget:widget'], 'a one-word aria-label or title is words');
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <div className="widget-card tag" data-testid="widget-card" id="run" to="/widget/x" path="/widget/:id" />'), []);
});

test('families: a string in an expression is read: ternary, ??, object label, array, return, template and thrown message', () => {
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p>{s.widgetName ?? 'NO WIDGET'}</p>"), ['widget:NO WIDGET']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p>{ok ? 'Create a program' : 'Start a widget to begin'}</p>"), ['widget:Start a widget to begin']);
  assert.deepEqual(hitsOf('a.ts', "export const TABS = [{ id: 'widget', label: 'WIDGET OVERVIEW' }]"), ['widget:WIDGET OVERVIEW'], "the id 'widget' is code; the label is words");
  assert.deepEqual(hitsOf('a.ts', "export const f = (n: number) => n === 0 ? 'No runs yet' : 'A run'"), ['run:No runs yet', 'run:A run']);
  assert.deepEqual(hitsOf('a.ts', 'export const f = (n: number) => `${n} sets in the active run`'), ['run:sets in the active run']);
  assert.deepEqual(hitsOf('a.ts', "export function f() { throw new RangeError(\"the draft's workouts must be the run's workouts\") }"), ["run:the draft's workouts must be the run's workouts"]);
  assert.deepEqual(hitsOf('a.ts', "export const g = () => 'completed run'"), ['run:completed run']);
  assert.deepEqual(hitsOf('a.ts', "export const g = () => 'CHANGE THE PLAN'"), ['change-the-plan:CHANGE THE PLAN']);
  assert.deepEqual(hitsOf('a.ts', 'export const g = () => `Change plan`'), ['change-the-plan:Change plan']);
});

test('families: names, keys, routes, tables, types, imports and comments are not words', () => {
  const code = [
    "import { useWidgets } from '../programs/useWidgets'",
    "import type { Widget } from '../../types'",
    "export type Tab = 'exercise' | 'widget' | 'run' | 'tags'",
    "const KEYS = ['widgets', 'widget', 'tags', 'run']",
    "const q = supabase.from('v2_widgets').select('id, tags, widget_id').eq('widget_id', widgetId)",
    "const route = `/widget/${id}/priorities`; const r2 = '/widget/:widgetId/priorities'",
    "const fixture = { widgetId: 'widget-1', kind: 'run', source: 'tags' }",
    'const css = { color: "var(--run)" }',
    '// NO WIDGET   END RUN   EDIT TAGS',
    '/* DELETE WIDGET?  the run  tags */',
    'const widgetService = runService(tags, widgetId)',
    "const stage = 'STAGE'; const s = 'stages'; const running = 'Running'; const ok = 'Programs'; const cues = 'CUES'",
  ];
  assert.deepEqual(hitsOf('a.ts', code.join('\n')), [], 'every name, key, route, query column list, type, import and comment passes');
  // ...but the same list handed to anything that is not a query is words
  assert.deepEqual(hitsOf('a.ts', "show('id, tags, widget_id')"), ['tag:id, tags, widget_id']);
});

test('families: "change the program", "cues", "program" and STAGE say nothing wrong', () => {
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <div><button>CHANGE THE PROGRAM</button><p>CUES</p><p>NO CURRENT PROGRAM</p><p>STAGE</p><p>Start a program in Plan → Programs</p></div>'), []);
});

test('families and the words rule are separate rules over the same text, and the words file is read for the families only', () => {
  const both = scanSource('a.tsx', 'const A = () => <p>Nowy widget</p>', { families: STAND_IN_FAMILIES }).map((h) => `${h.family}:${h.text}`);
  assert.deepEqual(both, ['words:Nowy widget', 'widget:Nowy widget']);
  const wordsFile = "export const pl = { list: { title: 'Nowy widget', other: 'Zapisz' } }";
  const asScanned = (file) => scanSource(file, wordsFile, { families: STAND_IN_FAMILIES, words: wordsRuleApplies(file) }).map((h) => `${h.family}:${h.text}`);
  assert.deepEqual(asScanned('src/i18n/pl.ts'), ['widget:Nowy widget'], 'a retired word in the words file fails; the words in it are what it is for');
  assert.deepEqual(asScanned('src/features/x/Screen.ts'), ['words:Nowy widget', 'widget:Nowy widget', 'words:Zapisz']);
});
