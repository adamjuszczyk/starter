// check-tokens.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// SPEC Rules 2 ("Code uses only tokens and the words file") and item 4 ("Tokens check"): src/styles/tokens.css is the one place a
// colour, a text size, a corner radius or a shadow is written down, and everything else names a token (`bg-surface`, `text-sm`,
// `rounded-md`, `var(--accent)`). global.css switches Tailwind's own colours, sizes and radii off, so the named classes can only be
// tokens; what is left is the TYPED-IN value, which still builds, and this check fails on it. Layout widths may be typed in.
//
// What it reads: every .ts, .tsx and .css file under src/ except src/styles/tokens.css (tests and declarations included), and in it
//   - a Tailwind arbitrary value for a colour, a text size, a radius or a shadow, in any string or template piece (or in a CSS
//     `@apply`): `bg-[#f00]`, `text-[#f00]`, `border-[#f00]`, `hover:ring-[rgb(0,0,0)]`, `text-[13px]`, `text-[1.25rem]`, `rounded-[6px]`,
//     `rounded-t-[8px]`, `shadow-[0_1px_2px_#000]`. A colour utility (bg, border, outline, ring, fill, stroke, decoration, accent, caret,
//     divide, placeholder, from, via, to) is a hit when its value IS a colour (a hex, or rgb(), hsl() and the other colour functions);
//     `text`, `rounded` and `shadow` are hits for any value that is not made only of tokens.
//   - an inline `style={{ … }}` whose color / background / backgroundColor / *Color, fontSize, borderRadius (and its corners) or
//     boxShadow is a literal that is not made only of tokens: `{ color: '#f00' }`, `{ fontSize: 13 }`, `{ borderRadius: '50%' }`,
//     `{ background: ok ? '#0a0' : 'red' }` (each literal of a ternary, `??`, `||`, `&&`).
//   - in a CSS file, a declaration of color / background / background-color / fill / stroke / any *-color (`border-color`,
//     `outline-color`, …), font-size, border-radius (and the four corners, physical and logical) or box-shadow / text-shadow whose value
//     is not made only of tokens: `font-size: 13px`, `color: red`, `border-radius: 6px`, `box-shadow: 0 1px 2px black`; `!important` is
//     ignored, a `var()` with a typed fallback is typed. A custom property (`--radius-full: 9999px`, which global.css uses to map a
//     token onto Tailwind) is a definition and not a declaration of use; a name inside parentheses (`@media (min-color: 1)`) is not a
//     declaration; a string in CSS is never read as one.
//   - any hex colour (#abc, #abcd, #aabbcc, #aabbccdd) and any colour function (rgb(, rgba(, hsl(, hsla(, hwb(, lab(, lch(, oklab(,
//     oklch(, color() in a string or a CSS file. In TypeScript a "string" is a string literal or a piece of a template, so a hex in JSX
//     text, in a comment or in a regular expression is not read; CSS is read with its comments cut out.
//   - Passes: anything made of tokens (`var(--…)`, `env(…)`, `calc(…)` around them, `inherit`, `transparent`, `currentColor`, `0`), the
//     named classes (`bg-surface`), and every utility or property that is not a colour, a text size, a radius or a shadow: widths,
//     heights, paddings, margins, gaps, offsets, `z-[70]`, `pt-[calc(56px+env(safe-area-inset-top))]`, `border-[3px]` (a width),
//     percentages, line heights, `background-image` and its size and position.
//
// What it would not catch (TASKS.md, chunk 5): a colour or a size computed at runtime (`style={{ color: v }}`, `size + 'px'`); a style
// object built elsewhere and handed to `style`; a colour NAME in a Tailwind class (`bg-[red]`); the CSS shorthands `border`, `outline`,
// `font` and `text-decoration` with a named colour or a typed size (a hex or a colour function in them is caught as a hex); a typed
// value in a custom property that is not a colour (`--radius-full: 9999px`); line heights, letter spacing and font families; a hex
// inside an SVG or any file that is not .ts, .tsx or .css; a value in a comment (a comment is not rendered), even one Tailwind would
// still read as a class name in a .tsx file. A hex-like name is a hit (`href="#add"`): ALLOWED.
//
// The allowlist (ALLOWED below) is the only way a hit passes, as in check-wording.test.mjs: { file, rule, text, reason }, `text` the
// matched text; a stale entry fails. It is empty: the tree has nothing to allow.
//
// How it is proven: the tree test sweeps src/; the "call patterns" tests run the scanner over small sources, one per way a typed-in
// value reaches a screen, each of which must be caught, beside the near-misses it must let through.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The allowlist: { file, rule, text, reason }. An entry that matches nothing fails the "no stale entry" test.
export const ALLOWED = [];

// ─── Which files ───────────────────────────────────────────────────────────────────────────────────────────────────
const TOKENS_FILE = 'src/styles/tokens.css';
const slashed = (relPath) => relPath.split(sep).join('/');

/** True for a file the scan reads: a .ts, .tsx or .css under src/, tokens.css (where the values are written) excepted. */
export function isScanned(relPath) {
  const p = slashed(relPath);
  return p.startsWith('src/') && /\.(?:ts|tsx|css)$/.test(p) && p !== TOKENS_FILE;
}

function listFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) listFiles(full, out);
    else out.push(full);
  }
  return out;
}

// ─── What a typed-in value is ──────────────────────────────────────────────────────────────────────────────────────
/**
 * A value that is not made only of tokens: what is left of it, once `var(--x)`, `env(x)`, the keywords and the punctuation go, is not
 * zero. In a `calc()` a number with no unit is a factor (`calc(var(--fs-base) * 1.1)`), not a typed-in size; `calc(… + 2px)` is.
 */
function typed(value) {
  let rest = String(value)
    .replace(/var\(--[\w-]+\)|env\([\w-]+\)/g, '')
    .replace(/\b(?:calc|inherit|initial|unset|revert|none|transparent|currentColor|length|color)\b/gi, '');
  if (/calc\(/i.test(value)) rest = rest.replace(/(?<![\w.])\d+(?:\.\d+)?(?![\w.%])/g, '');
  return !/^0*$/.test(rest.replace(/[\s_():,.+*/-]/g, ''));
}

// A colour written out: a hex, or a colour function, after an optional `color:` type hint.
const COLOUR_VALUE = /^(?:color:)?(?:#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\()/i;

// A Tailwind arbitrary value on a utility that sets a colour, a text size, a radius or a shadow: `hover:bg-[#f00]`, `rounded-t-[6px]`.
// The utility is read whole (the lookbehind keeps `max-w-[400px]` from being read as a `w`), then judged by what it sets.
const CLASS_RE = /(?<![\w-])(text-shadow|inset-shadow|drop-shadow|shadow|text|rounded(?:-(?:ss|se|ee|es|tl|tr|br|bl|s|e|t|r|b|l))?|bg|border(?:-(?:x|y|s|e|t|r|b|l))?|outline|ring-offset|ring|fill|stroke|decoration|accent|caret|divide|placeholder|from|via|to)-\[([^\]\s]*)\]/g;

function classRule(utility, value) {
  if (utility === 'text') return typed(value) ? (COLOUR_VALUE.test(value) ? 'colour' : 'text-size') : null;
  if (utility.startsWith('rounded')) return typed(value) ? 'radius' : null;
  if (utility.endsWith('shadow')) return typed(value) ? 'shadow' : null;
  return COLOUR_VALUE.test(value) ? 'colour' : null;
}

// A hex colour: 3, 4, 6 or 8 digits, not the start of a longer word or id, not after a letter or digit (the fragment of a URL) or an `&`
// (an entity). An underscore before it is Tailwind's space (`border-[3px_solid_#f00]`), so it does not stop it.
const HEX = /(?<![A-Za-z0-9&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![A-Za-z0-9-])/gi;
const COLOUR_FN = /(?<![\w-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/gi;

/** Every typed-in colour, text size, radius or shadow in one text (a string's value, or a line of CSS). */
export function valueHits(value) {
  const hits = [];
  let rest = value;
  for (const m of value.matchAll(CLASS_RE)) {
    const rule = classRule(m[1], m[2]);
    if (!rule) continue;
    hits.push({ rule, text: m[0] });
    rest = rest.slice(0, m.index) + ' '.repeat(m[0].length) + rest.slice(m.index + m[0].length); // its hex is not reported again
  }
  for (const m of rest.matchAll(HEX)) hits.push({ rule: 'hex', text: m[0] });
  for (const m of rest.matchAll(COLOUR_FN)) hits.push({ rule: 'colour-function', text: m[0] });
  return hits;
}

// ─── The scanner ───────────────────────────────────────────────────────────────────────────────────────────────────
/** The family of an inline style property, or null for one the check does not read (width, padding, transform, ...). */
function styleFamily(name) {
  if (/^(?:color|background|fill|stroke)$|Color$/.test(name)) return 'colour';
  if (name === 'fontSize') return 'text-size';
  if (/^border(?:(?:Top|Bottom)(?:Left|Right)|(?:Start|End)(?:Start|End))?Radius$/.test(name)) return 'radius';
  if (name === 'boxShadow' || name === 'textShadow') return 'shadow';
  return null;
}

const unwrap = (e) => {
  while (ts.isParenthesizedExpression(e) || ts.isAsExpression(e) || ts.isNonNullExpression(e)) e = e.expression;
  return e;
};
const LOGICAL = new Set([ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.AmpersandAmpersandToken]);

/** The literals a style value can be: through a ternary and `??` / `||` / `&&`. Anything computed (a name, a `+`, a call) is none. */
function literalLeaves(expr) {
  expr = unwrap(expr);
  if (ts.isConditionalExpression(expr)) return [...literalLeaves(expr.whenTrue), ...literalLeaves(expr.whenFalse)];
  if (ts.isBinaryExpression(expr) && LOGICAL.has(expr.operatorToken.kind)) return [...literalLeaves(expr.left), ...literalLeaves(expr.right)];
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr) || ts.isNumericLiteral(expr)) return [{ node: expr, value: expr.text }];
  if (ts.isPrefixUnaryExpression(expr) && ts.isNumericLiteral(expr.operand)) return [{ node: expr, value: `-${expr.operand.text}` }];
  return [];
}

const inModuleSpecifier = (p) => ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isModuleDeclaration(p);

// A CSS declaration: a property, a colon and a value up to `;`, `}` or the end, at the start of a block or after another declaration. A
// custom property (`--name: …`) is a definition, not a use (global.css maps tokens onto Tailwind through them, and `--radius-full: 9999px`
// there is the `rounded-full` token), and a name inside parentheses (a media feature, `@supports (color: red)`) is not a declaration.
const DECLARATION = /(?<=^|[;{}])(\s*)(?!--)(-?[a-z][a-z-]*)\s*:\s*([^;{}]+)/gi;

/** The family of a CSS property, or null for one the check does not read (width, padding, line-height, background-image, ...). */
function cssFamily(name) {
  if (/^(?:color|background|background-color|fill|stroke)$|-color$/.test(name)) return 'colour';
  if (name === 'font-size') return 'text-size';
  if (/^border(?:-(?:top|bottom)-(?:left|right)|-(?:start|end)-(?:start|end))?-radius$/.test(name)) return 'radius';
  if (name === 'box-shadow' || name === 'text-shadow') return 'shadow';
  return null;
}

/** A CSS string made blank (the quotes stay), so a `;` or a property name inside one is not read as a declaration. */
const blankStrings = (css) => css.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) => m[0] + ' '.repeat(m.length - 2) + m[m.length - 1]);
const blankOut = (s) => s.replace(/[^\n]/g, ' ');

function scanCss(text) {
  const clean = text.replace(/\/\*[\s\S]*?\*\//g, blankOut); // comments cut out, the line numbers kept
  const hits = [];
  let rest = clean;
  for (const m of blankStrings(clean).matchAll(DECLARATION)) {
    const name = m[2].toLowerCase();
    if (!cssFamily(name)) continue;
    const start = m.index + m[1].length;
    const end = m.index + m[0].length;
    const value = clean.slice(end - m[3].length, end).replace(/!\s*important\s*$/i, '').replace(/\s+/g, ' ').trim();
    if (!typed(value)) continue;
    hits.push({ line: clean.slice(0, start).split('\n').length, rule: 'css-declaration', text: `${name}: ${value}` });
    rest = rest.slice(0, start) + blankOut(clean.slice(start, end)) + rest.slice(end); // its hex is not reported again
  }
  rest.split('\n').forEach((line, i) => {
    for (const h of valueHits(line)) hits.push({ line: i + 1, ...h });
  });
  return hits.sort((a, b) => a.line - b.line);
}

/**
 * Every typed-in colour, text size, radius or shadow in a file: `{ line, rule, text }`, rule one of colour, text-size, radius, shadow,
 * inline-style, css-declaration, hex, colour-function. A CSS file is read with its comments cut out; a .ts / .tsx file through the
 * TypeScript parser, so comments and JSX text are never read.
 */
export function scanSource(fileName, text) {
  if (fileName.endsWith('.css')) return scanCss(text);
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sf = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
  const hits = [];
  const flagged = new Set(); // literals the style rule reported: the string rules do not report them a second time
  const lineOf = (node) => sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

  const readStyle = (attribute) => {
    const expression = attribute.initializer && ts.isJsxExpression(attribute.initializer) ? attribute.initializer.expression : undefined;
    const object = expression && unwrap(expression);
    if (!object || !ts.isObjectLiteralExpression(object)) return;
    for (const prop of object.properties) {
      if (!ts.isPropertyAssignment(prop) || !(ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) continue;
      if (!styleFamily(prop.name.text)) continue;
      for (const { node, value } of literalLeaves(prop.initializer)) {
        if (!typed(value)) continue;
        hits.push({ line: lineOf(node), rule: 'inline-style', text: `${prop.name.text}: ${value}` });
        flagged.add(node);
      }
    }
  };

  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(sf) === 'style') readStyle(node);
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!flagged.has(node) && !inModuleSpecifier(node.parent)) for (const h of valueHits(node.text)) hits.push({ line: lineOf(node), ...h });
    } else if (ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      for (const h of valueHits(node.text)) hits.push({ line: lineOf(node), ...h });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

/** Scan a tree: every hit that is not allowlisted, every allowlist entry that was used, and the files read. `allowed` defaults to ALLOWED. */
export function scanTree(rootDir = root, { allowed = ALLOWED } = {}) {
  const files = listFiles(join(rootDir, 'src')).map((f) => relative(rootDir, f).split(sep).join('/')).filter(isScanned).sort();
  const found = [];
  const used = new Set();
  for (const file of files) {
    for (const hit of scanSource(file, readFileSync(join(rootDir, file), 'utf8'))) {
      const index = allowed.findIndex((a) => a.file === file && a.rule === hit.rule && a.text === hit.text);
      if (index !== -1) used.add(index);
      else found.push({ file, ...hit });
    }
  }
  return { files, found, used };
}

// ─── The tree ──────────────────────────────────────────────────────────────────────────────────────────────────────
const tree = scanTree();

test('src/ holds no typed-in colour, text size, radius or shadow (the sweep over .ts, .tsx and .css, tokens.css excepted)', () => {
  const lines = tree.found.map((h) => `${h.file}:${h.line} [${h.rule}] ${JSON.stringify(h.text)}`);
  assert.equal(lines.length, 0, `${lines.length} typed-in value(s): use a token (src/styles/tokens.css), or allow it in ALLOWED with a reason:\n  ${lines.join('\n  ')}`);
});

test('the scan really read the tree: the app\'s code and global.css are in it, tokens.css is not', () => {
  for (const f of ['src/App.tsx', 'src/main.tsx', 'src/lib/format.ts', 'src/styles/global.css']) assert.ok(tree.files.includes(f), `${f} is scanned`);
  assert.ok(!tree.files.includes(TOKENS_FILE), 'tokens.css is where the values are written: not scanned');
  assert.ok(tree.files.length >= 5, `${tree.files.length} files scanned`);
});

test('every allowlist entry still matches something and says why', () => {
  ALLOWED.forEach((entry, i) => {
    assert.ok(tree.used.has(i), `allowlist entry for ${entry.file} ${JSON.stringify(entry.text)} matches nothing: remove it`);
    assert.ok(entry.reason.length > 40, `allowlist entry ${i} gives its reason`);
  });
});

test('which files are scanned: .ts, .tsx and .css under src/, never tokens.css, other file types or other folders', () => {
  const yes = ['src/App.tsx', 'src/lib/format.ts', 'src/styles/global.css', 'src/features/auth/LoginPage.test.tsx', 'src/vite-env.d.ts', 'src/components/Button.tsx'];
  const no = ['src/styles/tokens.css', 'prototype/src/styles/tokens.css', 'scripts/check-tokens.test.mjs', 'src/assets/logo.svg', 'src/data.json', 'docs/a.css', 'app.config.ts', 'src/lib/x.js'];
  for (const p of yes) assert.equal(isScanned(p), true, p);
  for (const p of no) assert.equal(isScanned(p), false, p);
});

test('the tree scan finds a planted file by its path, spares tokens.css and an allowed value, and reports a stale entry', () => {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-'));
  const put = (rel, text) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  put('src/features/x/Screen.tsx', 'export const Screen = () => <p className="text-[13px]" />;\n');
  put('src/styles/global.css', '.a {\n  color: #f00;\n  font-size: 13px;\n}\n');
  put('src/styles/tokens.css', ':root { --a: #f00; --b: rgba(0, 0, 0, 0.4); }\n');
  put('src/lib/ok.ts', "export const ACCENT = '#2453bd';\n");
  const allowed = [
    { file: 'src/lib/ok.ts', rule: 'hex', text: '#2453bd', reason: 'a stand-in entry that matches the planted file above' },
    { file: 'src/lib/gone.ts', rule: 'hex', text: '#000', reason: 'a stand-in entry that matches nothing: a stale one' },
  ];
  try {
    const planted = scanTree(dir, { allowed });
    assert.deepEqual(planted.found.map((h) => `${h.file}:${h.line} ${h.rule} ${h.text}`), ['src/features/x/Screen.tsx:1 text-size text-[13px]', 'src/styles/global.css:2 css-declaration color: #f00', 'src/styles/global.css:3 css-declaration font-size: 13px']);
    assert.deepEqual([...planted.used], [0], 'the matching entry was used, the other was not (the stale-entry test would fail on it)');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── The call patterns: one source per way a typed-in value reaches a screen ─────────────────────────────────────────
// Class hits come first, then hex, then colour functions; an inline style's own hits are in source order.
const hitsOf = (name, code) => scanSource(name, code).map((h) => `${h.rule}:${h.text}`);

test('a Tailwind arbitrary value for a text size is a hit', () => {
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="text-[13px]" />'), ['text-size:text-[13px]']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="text-[1.25rem] font-bold" />'), ['text-size:text-[1.25rem]']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="md:text-[calc(1rem+2px)]" />'), ['text-size:text-[calc(1rem+2px)]'], 'a calc of typed lengths is still typed');
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="text-[length:13px]" />'), ['text-size:text-[length:13px]']);
});

test('a Tailwind arbitrary value for a colour is a hit, beside a hex only once', () => {
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="bg-[#f00]" />'), ['colour:bg-[#f00]'], 'one hit for the class, not one more for its hex');
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="text-[#f00]" />'), ['colour:text-[#f00]']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="border-[#e5e5e5] hover:bg-[#fff]/50 !ring-[#00ff00]" />'), ['colour:border-[#e5e5e5]', 'colour:bg-[#fff]', 'colour:ring-[#00ff00]']);
  assert.equal(hitsOf('a.tsx', 'const A = () => <p className="border-t-[#f00] outline-[#f00] fill-[#f00] stroke-[#f00] decoration-[#f00] caret-[#f00] divide-[#f00] from-[#f00] via-[#0f0] to-[#00f]" />').length, 10, 'every colour utility');
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="bg-[rgb(1,2,3)] bg-[hsl(10_20%_30%)] bg-[color:#f00] text-[oklch(0.5_0.1_20)]" />'), ['colour:bg-[rgb(1,2,3)]', 'colour:bg-[hsl(10_20%_30%)]', 'colour:bg-[color:#f00]', 'colour:text-[oklch(0.5_0.1_20)]']);
});

test('a Tailwind arbitrary value for a radius or a shadow is a hit, whatever its value, unless it is made of tokens', () => {
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="rounded-[6px] rounded-t-[8px] md:rounded-tl-[50%] rounded-[1rem]" />'), ['radius:rounded-[6px]', 'radius:rounded-t-[8px]', 'radius:rounded-tl-[50%]', 'radius:rounded-[1rem]']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="shadow-[0_1px_2px_#000] drop-shadow-[0_0_4px_black]" />'), ['shadow:shadow-[0_1px_2px_#000]', 'shadow:drop-shadow-[0_0_4px_black]']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p className="shadow-[0_0_0_1px_var(--wire)]" />'), ['shadow:shadow-[0_0_0_1px_var(--wire)]'], 'a typed offset beside a token is typed');
});

test('the arbitrary value is read wherever the class is written: a ternary, a +, a template, cx(), an array, a variant, a CSS @apply', () => {
  assert.deepEqual(hitsOf('a.tsx', "const A = ({ on }: { on: boolean }) => <p className={on ? 'p-2' : 'bg-[#f00]'} />"), ['colour:bg-[#f00]']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p className={'flex ' + 'text-[13px]'} />"), ['text-size:text-[13px]']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = ({ x }: { x: string }) => <p className={`flex ${x} rounded-[6px]`} />'), ['radius:rounded-[6px]']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p className={cx('flex', 'bg-[#f00]')} />"), ['colour:bg-[#f00]']);
  assert.deepEqual(hitsOf('a.ts', "export const BASE = ['inline-flex', 'text-[13px]']"), ['text-size:text-[13px]']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p className=\"[&>p]:text-[13px] data-[state=open]:bg-[#f00] group-hover/item:rounded-[6px]\" />"), ['text-size:text-[13px]', 'colour:bg-[#f00]', 'radius:rounded-[6px]']);
  assert.deepEqual(hitsOf('a.css', '.a { @apply text-[13px] rounded-[6px]; }\n.b { @apply bg-[#f00]; }'), ['text-size:text-[13px]', 'radius:rounded-[6px]', 'colour:bg-[#f00]']);
});

test('an inline style with a colour, a size, a radius or a shadow that is typed in is a hit', () => {
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p style={{ color: '#f00' }} />"), ['inline-style:color: #f00'], 'one hit for the style, not one more for its hex');
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <p style={{ fontSize: 13 }} />'), ['inline-style:fontSize: 13']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p style={{ fontSize: '13px', borderRadius: 6 }} />"), ['inline-style:fontSize: 13px', 'inline-style:borderRadius: 6']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p style={{ borderRadius: '50%', borderTopLeftRadius: 4 }} />"), ['inline-style:borderRadius: 50%', 'inline-style:borderTopLeftRadius: 4']);
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p style={{ background: 'red', backgroundColor: 'rebeccapurple', borderColor: 'blue', fill: 'green' }} />"), ['inline-style:background: red', 'inline-style:backgroundColor: rebeccapurple', 'inline-style:borderColor: blue', 'inline-style:fill: green'], 'a colour name is typed in too');
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p style={{ boxShadow: '0 1px 2px black' }} />"), ['inline-style:boxShadow: 0 1px 2px black']);
  assert.deepEqual(hitsOf('a.tsx', "const A = ({ ok }: { ok: boolean }) => <p style={{ backgroundColor: ok ? '#0a0' : '#f00' }} />"), ['inline-style:backgroundColor: #0a0', 'inline-style:backgroundColor: #f00'], 'each literal of a ternary');
  assert.deepEqual(hitsOf('a.tsx', "const A = ({ c }: { c?: string }) => <p style={{ ...base, color: c ?? 'red', 'font-size': 4 }} />"), ['inline-style:color: red'], 'a spread is skipped, a ?? is read, a kebab-case key is not a React style key');
});

test('a CSS declaration with a typed-in text size, radius, colour or shadow is a hit, once, wherever it is written', () => {
  // text size
  assert.deepEqual(hitsOf('a.css', 'body { font-size: 13px; }'), ['css-declaration:font-size: 13px']);
  assert.deepEqual(
    hitsOf('a.css', '.a { font-size: 1.25rem }\n.b{font-size:100%}\n.c { font-size: larger; }\n.d { font-size: calc(1rem + 2px); }\n.e { font-size: var(--fs-base, 13px); }'),
    ['css-declaration:font-size: 1.25rem', 'css-declaration:font-size: 100%', 'css-declaration:font-size: larger', 'css-declaration:font-size: calc(1rem + 2px)', 'css-declaration:font-size: var(--fs-base, 13px)'],
    'the last declaration needs no semicolon, a size keyword is a size, a typed fallback is typed in',
  );
  // radius, and the four corners, physical and logical
  assert.deepEqual(
    hitsOf('a.css', '.a { border-radius: 6px; }\n.b { border-radius: 4px 8px; }\n.c { border-top-left-radius: 4px; border-end-end-radius: 1rem; }\n.d { border-start-end-radius: 50% }'),
    ['css-declaration:border-radius: 6px', 'css-declaration:border-radius: 4px 8px', 'css-declaration:border-top-left-radius: 4px', 'css-declaration:border-end-end-radius: 1rem', 'css-declaration:border-start-end-radius: 50%'],
  );
  // colour: a name is typed in too, and a hex or a function is one hit for the declaration, not a second for itself
  assert.deepEqual(
    hitsOf('a.css', '.a { color: red; }\n.b { background: #f00; }\n.c { background-color: rgb(1 2 3); }\n.d { border-color: blue; outline-color: green; }'),
    ['css-declaration:color: red', 'css-declaration:background: #f00', 'css-declaration:background-color: rgb(1 2 3)', 'css-declaration:border-color: blue', 'css-declaration:outline-color: green'],
  );
  assert.deepEqual(
    hitsOf('a.css', '.a { fill: #fff; stroke: black; -webkit-tap-highlight-color: rgba(0, 0, 0, 0.1); text-decoration-color: red; caret-color: blue; accent-color: red; }'),
    ['css-declaration:fill: #fff', 'css-declaration:stroke: black', 'css-declaration:-webkit-tap-highlight-color: rgba(0, 0, 0, 0.1)', 'css-declaration:text-decoration-color: red', 'css-declaration:caret-color: blue', 'css-declaration:accent-color: red'],
    'fill, stroke and every *-color property, vendor prefixes included',
  );
  assert.deepEqual(hitsOf('a.css', '.a { background: linear-gradient(#f00, #00f); }'), ['css-declaration:background: linear-gradient(#f00, #00f)'], 'one hit, not one more for each hex');
  // shadow: a typed offset or width is typed in even beside a token colour
  assert.deepEqual(
    hitsOf('a.css', '.a { box-shadow: 0 1px 2px black; }\n.b { box-shadow: 0 0 0 2px var(--accent); }\n.c { text-shadow: 0 1px #fff; }'),
    ['css-declaration:box-shadow: 0 1px 2px black', 'css-declaration:box-shadow: 0 0 0 2px var(--accent)', 'css-declaration:text-shadow: 0 1px #fff'],
  );
  // how it is written: !important, upper case, a value across lines, inside an at-rule, on its own line number
  assert.deepEqual(hitsOf('a.css', '.a { font-size: 13px !important; }'), ['css-declaration:font-size: 13px']);
  assert.deepEqual(hitsOf('a.css', '.a { FONT-SIZE: 13px; Color: Red }'), ['css-declaration:font-size: 13px', 'css-declaration:color: Red'], 'a property name is not case sensitive');
  assert.deepEqual(hitsOf('a.css', '.a {\n  box-shadow:\n    0 1px 2px black,\n    0 2px 4px black;\n}'), ['css-declaration:box-shadow: 0 1px 2px black, 0 2px 4px black'], 'a value across lines');
  assert.equal(scanSource('a.css', '.a {\n  color: var(--x);\n  box-shadow:\n    0 1px 2px black;\n}')[0].line, 3, 'on the line of its property');
  assert.deepEqual(
    hitsOf('a.css', '@media (min-width: 900px) { .a { border-radius: 6px; } }\n@layer base { body { color: red } }'),
    ['css-declaration:border-radius: 6px', 'css-declaration:color: red'],
    'inside an at-rule',
  );
});

test('CSS declarations made of tokens or keywords, and every property that is not a colour, size, radius or shadow, pass', () => {
  const ok = [
    // tokens
    'body { font-size: var(--fs-base); border-radius: var(--radius-md); color: var(--text-primary); background: var(--base); }',
    '.a { background-color: var(--surface); border-color: var(--border); box-shadow: var(--shadow-panel); text-shadow: none; }',
    '.d { font-size: calc(var(--fs-base) * 1.1); color: var(--x) !important; }',
    // keywords and zero
    '.b { color: inherit; color: currentColor; background: transparent; background: none; border-color: transparent; box-shadow: none; }',
    '.c { border-radius: 0; font-size: inherit; font-size: initial; fill: currentColor; stroke: none; }',
    // properties that are not read: layout, line height, spacing, the other background parts, the shorthands without a typed colour
    '.e { width: 232px; max-width: 400px; height: 100%; min-height: 40px; padding: 8px 16px; margin: 0 auto; gap: 10px; top: 3px; z-index: 70; }',
    '.f { line-height: 1.5; letter-spacing: 0.02em; font-weight: 600; font-family: var(--font-sans); font-size-adjust: 0.5; transition: opacity 0.2s ease; }',
    '.g { outline: 2px solid var(--accent); outline-offset: 2px; border: 1px solid var(--border); border-width: 1px; cursor: pointer; transform: translateZ(0); }',
    '.h { background-image: url(/x.png); background-size: 20px 20px; background-position: 0 0; color-scheme: light dark; }',
    // a custom property is a definition (global.css maps the tokens onto Tailwind's theme with them)
    ':root { --radius-full: 9999px; --fs-xs: 12px; --shadow-x: 0 1px 2px var(--wire); }',
    '@theme inline { --color-*: initial; --color-bg: var(--base); --radius-*: initial; --radius-full: 9999px; --text-xs: var(--fs-xs); }',
    // a name that is not a declaration: a media feature, a selector with a pseudo-class
    '@media (min-color: 1) { .i { color: var(--x); } }\n@media (prefers-color-scheme: dark) { .i { color: var(--x); } }\n@supports (color: red) { .i { color: var(--x); } }',
    'button:disabled { cursor: not-allowed; }\na:hover, a:focus-visible { color: var(--x); }\ninput:not(:disabled) { cursor: pointer; }',
    // a comment, and a string that says a declaration
    '/* font-size: 13px; color: red; border-radius: 6px */ .j::before { content: "font-size: 13px; color: red"; }',
  ];
  for (const css of ok) assert.deepEqual(hitsOf('a.css', css), [], css);
});

test('a hex colour or a colour function in a string, a template piece or a CSS file is a hit', () => {
  assert.deepEqual(hitsOf('a.ts', "export const ACCENT = '#2453bd'"), ['hex:#2453bd']);
  assert.deepEqual(hitsOf('a.tsx', 'const A = () => <svg><path fill="#fff" stroke="#ABCDEF" /></svg>'), ['hex:#fff', 'hex:#ABCDEF']);
  assert.deepEqual(hitsOf('a.ts', "export const C = ['#abcd', '#aabbccdd', `x ${y} #f0f`]"), ['hex:#abcd', 'hex:#aabbccdd', 'hex:#f0f']);
  assert.deepEqual(hitsOf('a.ts', "export const C = ['rgb(0 0 0)', 'rgba(0,0,0,.5)', 'hsl(1 2% 3%)', 'hsla(1,2%,3%,.5)', 'oklch(0.5 0.1 20)', 'color(display-p3 1 0 0)']"), ['colour-function:rgb(', 'colour-function:rgba(', 'colour-function:hsl(', 'colour-function:hsla(', 'colour-function:oklch(', 'colour-function:color(']);
  assert.deepEqual(hitsOf('a.css', '.a { border: 1px solid #ABC; }\n.b { filter: drop-shadow(0 0 2px rgb(0 0 0)); }\n.c { --accent: #f00; }'), ['hex:#ABC', 'colour-function:rgb(', 'hex:#f00'], 'in a shorthand and a custom property, which the declaration rule below does not read');
  assert.deepEqual(hitsOf('a.tsx', "const A = () => <p className=\"border-[3px_solid_#f00]\" />"), ['hex:#f00'], 'a typed colour inside a value that is not a colour utility\'s');
});

test('widths, heights, paddings, margins, gaps, offsets and percentages may be typed in', () => {
  const ok = [
    'const A = () => <aside className="w-[232px] max-w-[400px] min-h-[40px] h-[3rem] w-[50%] size-[18px]" />',
    'const A = () => <div className="gap-[10px] p-[8px] px-[1.5rem] m-[-4px] mt-[3px] top-[3px] inset-[0] -translate-x-[10px] basis-[200px]" />',
    'const A = () => <div className="pt-[calc(56px+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)] w-[calc(100%-8px)]" />',
    'const A = () => <div className="z-[70] grid-cols-[1fr_2fr] aspect-[4/3] duration-[250ms] opacity-[0.5] leading-[1.2] tracking-[0.02em]" />',
    'const A = () => <div className="border-[3px] ring-[2px] outline-[2px] stroke-[2px] decoration-[3px] ring-offset-[2px] divide-[1px]" />',
    "const A = () => <div style={{ width: '50%', height: 12, padding: 8, margin: '0 auto', transform: 'translateZ(0)', zIndex: 70, minHeight: '3rem' }} />",
  ];
  assert.deepEqual(hitsOf('a.tsx', ok.join('\n')), []);
});

test('tokens pass: var(--…), env(…), calc around them, keywords, zero and the named token classes', () => {
  const ok = [
    'const A = () => <p className="bg-surface text-ink text-sm rounded-md shadow-panel border-wire bg-accent-ghost text-on-accent" />',
    'const A = () => <p className="bg-[var(--accent)] text-[var(--fs-sm)] text-[length:var(--fs-sm)] text-[color:var(--accent)] border-[var(--border)]" />',
    'const A = () => <p className="rounded-[var(--radius-md)] rounded-[0] shadow-[var(--shadow-panel)] bg-(--accent) rounded-(--radius-md) text-(--fs-sm)" />',
    "const A = () => <p style={{ color: 'var(--accent)', fontSize: 'var(--fs-sm)', borderRadius: 'var(--radius-md)', background: 'transparent', boxShadow: 'var(--shadow-panel)' }} />",
    "const A = () => <p style={{ color: 'inherit', backgroundColor: 'currentColor', fontSize: 0, borderRadius: 0, boxShadow: 'none' }} />",
    "const A = () => <p style={{ fontSize: 'calc(var(--fs-base) * 1.1)', color: 'var(--text-primary)' }} />",
  ];
  assert.deepEqual(hitsOf('a.tsx', ok.join('\n')), []);
  assert.deepEqual(hitsOf('a.css', 'body { background-color: var(--base); color: var(--text-primary); font-size: var(--fs-base); }\n:focus-visible { outline: 2px solid var(--accent); }\n@theme inline { --color-*: initial; --color-bg: var(--base); --radius-full: 9999px; }'), []);
});

test('a value that is computed at runtime, a comment, JSX text, a URL fragment, an entity and a module path are not read', () => {
  const ok = [
    'const A = ({ v, size }: { v: string; size: number }) => <p style={{ color: v, fontSize: size + "px", borderRadius: size }} />',
    "const A = () => <p style={style} />",
    '// text-[13px] bg-[#f00] #f00 rgb(0,0,0)',
    "/* <p style={{ color: '#f00' }} className=\"rounded-[6px]\" /> */",
    'const A = () => <p>#f00 and rgb(0,0,0) and #abc</p>',
    "const href = 'https://example.com/page#abc'; const id = '#root'; const hash = '#fade-in'; const entity = '&#123;'; const long = '#12345'",
    "import thing from '#abc'",
  ];
  assert.deepEqual(hitsOf('a.tsx', ok.join('\n')), []);
  assert.deepEqual(hitsOf('a.css', '/* a typed-in value such as text-[13px] or bg-[#f00] still builds; #f00 and rgb(1,2,3) are what this check fails on */\n.a { color: var(--x); }'), [], 'a CSS comment is cut out (global.css\'s own says so)');
  assert.deepEqual(hitsOf('a.css', '/* one\n   two */ .a { color: #f00; }'), ['css-declaration:color: #f00'], 'and the line numbers are kept');
  assert.equal(scanSource('a.css', '/* one\n   two */\n.a { color: #f00; }')[0].line, 3);
});
