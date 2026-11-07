// check-screens-no-db.test.mjs — run with: node --test "scripts/*.test.mjs"
//
// SPEC Rules 4 ("Screens never talk to the database. Reads and writes live in service and hook files"), item 4 ("No database in
// screens"), TASKS.md Decided 7 and Tasks rule 10. Two checks over src/:
//
//   1. NO DATABASE IN SCREENS. A database call, `.from(`, `.rpc(` or `supabase.`, is allowed only in the files Decided 7 names:
//      `src/**/*Service.ts`, the hooks `src/**/use*.ts` and `src/**/use*.tsx`, and `src/lib/supabase.ts`. Every other file under src/ is
//      a "screen file" and fails on one: a component, a page, a shell, a test of a screen. (`useAuth.tsx` reads the session with
//      `supabase.auth`, so hooks in .tsx count.) Reason: the prototype kit swaps exactly those files, and the offline add-on would later
//      slot in behind them.
//   2. NO PROTOTYPE IMPORTS. No file under src/ imports a path containing `prototype/` (an import, an `export … from`, a dynamic
//      `import()`, `require()`, `import x = require()`, an `import()` type, `import.meta.glob()`, or a CSS `@import`), or the
//      `prototype` folder itself. The prototype's data handling (`demo/`, `fakes/`, `useDemo`) never goes into the app.
//
// What it reads: every .ts, .tsx, .js, .jsx, .mjs and .cjs file under src/ (declarations and tests included) for the database
// patterns, and those plus the .css files for the prototype imports. A TypeScript file is read through the TypeScript parser, so what
// counts is CODE: a comment, a string or JSX text that says `supabase.from('x')` is not a call and is not a hit (`supabase.com` in a
// comment is not either). A call is a hit when
//   - it is `.from(` on anything but an array or a buffer (Overload's `(?<!Array|Buffer)` lookbehind: `Array.from(rows)`,
//     `Uint8Array.from(x)` and `Buffer.from(x)` pass, `client.from('x')` and `supabase.storage.from('x')` do not),
//   - it is `.rpc(`, or
//   - it reaches into the client: any member of `supabase` or of something called `supabase` (`supabase.auth`, `this.supabase.x`),
//     written with a dot, with `?.`, with `!`, in parentheses or as `supabase['x']`.
// A "hook file" is `use` and a capital or a digit: `useAuth.tsx`, `useFoo.ts`. Decided 7 writes the glob `use*.ts`, which would also let
// `user.ts`, `userCard.tsx` and `used.ts` talk to the database; the capital closes that.
//
// What it would not catch (TASKS.md, chunk 5): a table name reaching `.from()` through a variable (it is still a hit in a screen;
// verify-rls's list test names the dynamic calls); the client reached under another name (`const db = supabase`, then `db.auth`: only
// the `.from(` and `.rpc(` patterns see through it), or passed on without a dot (`useQuery(supabase)`); a screen that imports the
// client and does nothing with it; a call spelled with a computed name (`supabase[name]`); a database call in a .vue, .svelte or
// .html file, or in a file that is not under src/; `supabase.` in a comment or a string (not read). A test of a service
// (`authService.test.ts`) is a screen file by Decided 7's globs: it names its mock `supabase: { auth }` and its calls `auth.signOut`.
//
// How it is proven: the tree test sweeps src/; the "call patterns" tests run the scanner over small sources, one per way a hit can
// occur, beside the near-misses that must pass.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const slashed = (relPath) => relPath.split(sep).join('/');

// ─── Which files ───────────────────────────────────────────────────────────────────────────────────────────────────
/** A code file under src/: the database patterns are read here. */
export function isCodeFile(relPath) {
  return slashed(relPath).startsWith('src/') && /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(slashed(relPath));
}

/** A file whose imports are read for `prototype/`: code, and CSS. */
export function isImportFile(relPath) {
  return isCodeFile(relPath) || (slashed(relPath).startsWith('src/') && slashed(relPath).endsWith('.css'));
}

/**
 * True for a file Decided 7 lets talk to the database: a service (`*Service.ts`), a hook (`use` + a capital or a digit, .ts or .tsx) or
 * `src/lib/supabase.ts`. Every other file under src/ is a screen file.
 */
export function mayTalkToDatabase(relPath) {
  const p = slashed(relPath);
  return /(?:^|\/)[^/]*Service\.ts$/.test(p) || /(?:^|\/)use[A-Z0-9][^/]*\.tsx?$/.test(p) || p === 'src/lib/supabase.ts';
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
function parse(fileName, text) {
  const kind = /\.tsx$/.test(fileName) ? ts.ScriptKind.TSX : /\.jsx$/.test(fileName) ? ts.ScriptKind.JSX : /\.(?:js|mjs|cjs)$/.test(fileName) ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  return ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, kind);
}

const unwrap = (e) => {
  while (ts.isParenthesizedExpression(e) || ts.isNonNullExpression(e) || ts.isAsExpression(e)) e = e.expression;
  return e;
};
const oneLine = (s) => s.replace(/\s+/g, ' ').trim().replace(/ \./g, '.');

/** The Supabase client: `supabase`, or a member called `supabase` (`this.supabase`, `deps.supabase`). */
function isClient(expr) {
  const e = unwrap(expr);
  return (ts.isIdentifier(e) && e.text === 'supabase') || (ts.isPropertyAccessExpression(e) && e.name.text === 'supabase');
}

/** The name a member access reads: `x.name`, or `x['name']`; null for a computed one. */
function memberName(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  return ts.isStringLiteralLike(node.argumentExpression) ? node.argumentExpression.text : null;
}

/** Every database call in a code file's syntax: `{ line, rule, text }`, rule one of `.from(`, `.rpc(`, `supabase.`. */
export function scanDatabase(fileName, text) {
  const sf = parse(fileName, text);
  const hits = [];
  const visit = (node) => {
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      const name = memberName(node);
      const called = ts.isCallExpression(node.parent) && node.parent.expression === node;
      let rule = null;
      // Overload's lookbehind, `(?<!Array|Buffer)\.from\(`: what comes right before `.from(` must not end in Array or Buffer.
      if (called && name === 'from' && !/(?:Array|Buffer)$/.test(unwrap(node.expression).getText(sf))) rule = '.from(';
      else if (called && name === 'rpc') rule = '.rpc(';
      else if (isClient(node.expression)) rule = 'supabase.';
      if (rule) hits.push({ line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, rule, text: oneLine(node.getText(sf)) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

/** A module path that points into the prototype: one containing `prototype/`, or ending at the `prototype` folder itself. */
export const isPrototypePath = (spec) => spec.includes('prototype/') || /(?:^|\/)prototype$/.test(spec);

/** Every import of a path into the prototype: `{ line, rule: 'prototype-import', text: <the path> }`. */
export function scanPrototypeImports(fileName, text) {
  const hits = [];
  if (fileName.endsWith('.css')) {
    const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')); // keeps the line numbers
    withoutComments.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1/g)) {
        if (isPrototypePath(m[2])) hits.push({ line: i + 1, rule: 'prototype-import', text: m[2] });
      }
    });
    return hits;
  }
  const sf = parse(fileName, text);
  const add = (at, literal) => {
    if (literal && ts.isStringLiteralLike(literal) && isPrototypePath(literal.text)) {
      hits.push({ line: sf.getLineAndCharacterOfPosition(at.getStart(sf)).line + 1, rule: 'prototype-import', text: literal.text });
    }
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node)) add(node, node.moduleSpecifier);
    else if (ts.isExportDeclaration(node)) add(node, node.moduleSpecifier);
    else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) add(node, node.moduleReference.expression);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) add(node, node.argument.literal);
    else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require')) add(node, node.arguments[0]);
      else if (ts.isPropertyAccessExpression(callee) && callee.name.text.startsWith('glob') && ts.isMetaProperty(callee.expression)) {
        const first = node.arguments[0];
        if (first && ts.isArrayLiteralExpression(first)) first.elements.forEach((element) => add(node, element));
        else add(node, first);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

/** What is wrong in one file: a database call in a screen file, an import of the prototype in any file. */
export function scanFile(relPath, text) {
  const hits = [];
  if (isCodeFile(relPath) && !mayTalkToDatabase(relPath)) hits.push(...scanDatabase(relPath, text));
  if (isImportFile(relPath)) hits.push(...scanPrototypeImports(relPath, text));
  return hits;
}

/** Scan a tree: every hit, the files read, and which of them are screen files. */
export function scanTree(rootDir = root) {
  const files = listFiles(join(rootDir, 'src')).map((f) => relative(rootDir, f).split(sep).join('/')).filter(isImportFile).sort();
  const found = [];
  for (const file of files) {
    for (const hit of scanFile(file, readFileSync(join(rootDir, file), 'utf8'))) found.push({ file, ...hit });
  }
  const screens = files.filter((f) => isCodeFile(f) && !mayTalkToDatabase(f));
  return { files, screens, found };
}

// ─── The tree ──────────────────────────────────────────────────────────────────────────────────────────────────────
const tree = scanTree();
const lineOf = (h) => `${h.file}:${h.line} [${h.rule}] ${JSON.stringify(h.text)}`;

test('no screen file talks to the database: .from(, .rpc( and supabase. are in service and hook files only (Decided 7)', () => {
  const lines = tree.found.filter((h) => h.rule !== 'prototype-import').map(lineOf);
  assert.equal(lines.length, 0, `${lines.length} database call(s) in a screen file: move them into a *Service.ts or a use*.ts(x) file:\n  ${lines.join('\n  ')}`);
});

test('no file under src/ imports from prototype/ (Tasks rule 10)', () => {
  const lines = tree.found.filter((h) => h.rule === 'prototype-import').map(lineOf);
  assert.equal(lines.length, 0, `${lines.length} import(s) of the prototype: the app never imports from prototype/:\n  ${lines.join('\n  ')}`);
});

test('the scan really read the tree: the app\'s screens and its one client file are in it', () => {
  for (const f of ['src/App.tsx', 'src/main.tsx', 'src/lib/supabase.ts', 'src/lib/format.ts', 'src/styles/global.css']) assert.ok(tree.files.includes(f), `${f} is scanned`);
  assert.ok(tree.files.length >= 5, `${tree.files.length} files scanned`);
  assert.ok(tree.screens.length >= 3, `${tree.screens.length} screen files read (the files that may not talk to the database)`);
  assert.ok(tree.screens.includes('src/App.tsx') && !tree.screens.includes('src/lib/supabase.ts'), 'App.tsx is a screen file, the client file is not');
});

test('which files may talk to the database: services, hooks and the client file (Decided 7)', () => {
  const may = [
    'src/features/auth/authService.ts', 'src/features/clients/clientsService.ts', 'src/Service.ts',
    'src/features/clients/useClients.ts', 'src/features/auth/useAuth.tsx', 'src/features/settings/useTheme.ts', 'src/features/auth/useAuth.signOut.test.tsx',
    'src/hooks/useOnlineStatus.ts', 'src/lib/supabase.ts',
  ];
  const mayNot = [
    'src/App.tsx', 'src/features/clients/ClientsScreen.tsx', 'src/features/clients/foo.ts', 'src/lib/format.ts', 'src/shell/AppShell.tsx',
    'src/features/auth/authService.test.ts', 'src/features/auth/authService.tsx', 'src/features/auth/ServiceHelper.ts',
    'src/features/users/userCard.tsx', 'src/lib/user.ts', 'src/lib/used.ts', 'src/features/x/Useless.tsx', 'src/features/x/use.ts', 'src/features/x/usefoo.ts',
    'src/lib/supabase.test.ts', 'src/lib/supabase.tsx', 'src/features/x/lib/supabase.ts', 'src/supabase.ts',
  ];
  for (const p of may) assert.equal(mayTalkToDatabase(p), true, p);
  for (const p of mayNot) assert.equal(mayTalkToDatabase(p), false, p);
});

test('which files are read: code under src/ for the database, code and CSS for the prototype imports; nothing outside src/', () => {
  for (const p of ['src/App.tsx', 'src/lib/x.ts', 'src/lib/x.test.ts', 'src/vite-env.d.ts', 'src/lib/x.js', 'src/lib/x.mjs']) assert.equal(isCodeFile(p), true, p);
  for (const p of ['src/styles/global.css', 'src/data.json', 'src/assets/a.svg', 'scripts/a.mjs', 'prototype/src/a.tsx', 'supabase/a.ts', 'app.config.ts']) assert.equal(isCodeFile(p), false, p);
  assert.equal(isImportFile('src/styles/global.css'), true);
  assert.equal(isImportFile('prototype/src/index.css'), false);
});

test('the tree scan finds a planted file by its path: a call in a screen, none in a service, an import of the prototype anywhere', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nodb-'));
  const put = (rel, text) => {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  };
  put('src/features/x/Screen.tsx', "export const Screen = () => { supabase.from('x'); return null; };\n");
  put('src/features/x/xService.ts', "export const load = () => supabase.from('x').select('*');\n");
  put('src/features/x/useX.ts', "import x from '../../../prototype/src/demo/demoStore';\nexport const useX = () => supabase.auth.getSession();\n");
  put('src/styles/global.css', "@import '../../prototype/src/index.css';\n");
  try {
    const planted = scanTree(dir);
    assert.deepEqual(planted.found.map((h) => `${h.file}:${h.line} ${h.rule} ${h.text}`), [
      'src/features/x/Screen.tsx:1 .from( supabase.from',
      'src/features/x/useX.ts:1 prototype-import ../../../prototype/src/demo/demoStore',
      'src/styles/global.css:1 prototype-import ../../prototype/src/index.css',
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ─── The call patterns: one source per way a hit can occur, beside the near-misses ───────────────────────────────────
const hitsIn = (relPath, code) => scanFile(relPath, code).map((h) => `${h.rule}:${h.text}`);

test('.from( in a screen file is a hit, in a .tsx and in a .ts, however it is written', () => {
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', "const A = () => { supabase.from('x'); return null }"), ['.from(:supabase.from']);
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = () => supabase.from('x').select('*')"), ['.from(:supabase.from']);
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = () => db.from('x')"), ['.from(:db.from'], 'any receiver but an array or a buffer');
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = () => supabase.storage.from('files')"), ['.from(:supabase.storage.from', 'supabase.:supabase.storage'], 'the outer access first');
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = async () => await supabase\n  .from('x')\n  .select('*')"), ['.from(:supabase.from'], 'across lines');
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = () => supabase?.from('x')"), ['.from(:supabase?.from']);
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = () => (supabase as Client).from('x')"), ['.from(:(supabase as Client).from']);
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = () => supabase['from']('x')"), ['.from(:supabase[\'from\']']);
  assert.deepEqual(hitsIn('src/features/x/foo.ts', "export const q = () => Observable.from([1])"), ['.from(:Observable.from'], 'only arrays and buffers are exempt');
});

test('.rpc( and supabase. in a screen file are hits', () => {
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', "const A = () => { client.rpc('apply_ops', {}); return null }"), ['.rpc(:client.rpc']);
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', 'const A = () => { supabase.auth.signOut(); return null }'), ['supabase.:supabase.auth']);
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', 'const A = () => { supabase.channel("x"); return null }'), ['supabase.:supabase.channel']);
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', 'const A = () => { supabase!.auth.getUser(); return null }'), ['supabase.:supabase!.auth']);
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', "const A = (p: P) => { p.supabase.auth.getUser(); this.supabase.x; return null }"), ['supabase.:p.supabase.auth', 'supabase.:this.supabase.x'], 'a member called supabase');
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', "const A = () => { supabase['auth'].getUser(); return null }"), ["supabase.:supabase['auth']"]);
  assert.deepEqual(hitsIn('src/features/x/Screen.jsx', "export const A = () => { supabase.auth.getUser(); return null }"), ['supabase.:supabase.auth'], 'a .jsx file is read too');
});

test('the near-misses pass: Array.from, Buffer.from, a comment, a string, JSX text, a word that only contains supabase', () => {
  const screen = [
    'const rows = Array.from(items); const six = Array.from({ length: 6 }, (_, i) => i)',
    'const bytes = Uint8Array.from(x); const buf = Buffer.from(x); const set = new Set(Array.from(a))',
    "// supabase.from('x') and supabase.auth.getSession() are in the service",
    "/* supabase.rpc('x'); see https://supabase.com/docs */",
    "const text = 'supabase.from'; const more = `supabase.rpc('x') ${rows.length}`; const url = 'https://supabase.com/docs'",
    'const A = () => <p>supabase.com and supabase.from(x)</p>',
    "import { createClient } from '@supabase/supabase-js'",
    "import { supabase } from '../../lib/supabase'",
    'const supabaseUrl = env.VITE_SUPABASE_URL.trim(); const mySupabase = { auth: 1 }; mySupabase.auth',
    'const { from } = range; const f = range.from; const g = Object.fromEntries(pairs)',
  ];
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', screen.join('\n')), []);
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', 'const A = () => <ul>{Array.from({ length: 6 }, (_, i) => <li key={i} />)}</ul>'), [], 'Array.from in a .tsx');
});

test('the same calls pass in a service, a hook and the client file', () => {
  const calls = "export const f = async () => { const a = await supabase.auth.getSession(); const b = await supabase.from('x').select('*'); return supabase.rpc('y', {}) }";
  assert.deepEqual(hitsIn('src/features/auth/useAuth.tsx', 'export function useAuth() { return supabase.auth.getSession() }'), [], 'supabase.auth.getSession() in useAuth.tsx');
  assert.deepEqual(hitsIn('src/features/clients/fooService.ts', calls), []);
  assert.deepEqual(hitsIn('src/features/clients/useFoo.ts', calls), []);
  assert.deepEqual(hitsIn('src/features/clients/useFoo.tsx', calls), []);
  assert.deepEqual(hitsIn('src/lib/supabase.ts', "export const supabase = createClient(url, key); supabase.auth.getSession()"), []);
  assert.deepEqual(hitsIn('src/features/clients/Foo.tsx', calls).length, 3, 'and the same text in a component is three hits');
  assert.deepEqual(hitsIn('src/features/users/userCard.tsx', calls).length, 3, 'a file that only starts with "use" is not a hook');
  assert.deepEqual(hitsIn('src/features/auth/authService.test.ts', "expect(supabase.auth.signOut).toHaveBeenCalled()"), ['supabase.:supabase.auth'], 'a service\'s test is a screen file');
});

test('an import of a path into the prototype is a hit, in every kind of file and every way to import', () => {
  const at = (code, file = 'src/features/x/Screen.tsx') => hitsIn(file, code);
  assert.deepEqual(at("import x from '../../prototype/src/demo/demoStore'"), ['prototype-import:../../prototype/src/demo/demoStore']);
  assert.deepEqual(at("import { a } from '../prototype/src/fakes/supabase'"), ['prototype-import:../prototype/src/fakes/supabase']);
  assert.deepEqual(at("import '../../prototype/src/index.css'"), ['prototype-import:../../prototype/src/index.css'], 'a side-effect import');
  assert.deepEqual(at("import type { T } from '../../prototype/src/x'"), ['prototype-import:../../prototype/src/x']);
  assert.deepEqual(at("export * from '../prototype/src/x'"), ['prototype-import:../prototype/src/x']);
  assert.deepEqual(at("export { a } from '../../prototype/b'"), ['prototype-import:../../prototype/b']);
  assert.deepEqual(at("const m = await import('../../prototype/src/x')"), ['prototype-import:../../prototype/src/x'], 'a dynamic import');
  assert.deepEqual(at("const m = require('../../prototype/src/x')"), ['prototype-import:../../prototype/src/x']);
  assert.deepEqual(at("import x = require('../../prototype/src/x')", 'src/features/x/foo.ts'), ['prototype-import:../../prototype/src/x']);
  assert.deepEqual(at("export type T = import('../../prototype/src/x').T", 'src/features/x/foo.ts'), ['prototype-import:../../prototype/src/x'], 'an import type');
  assert.deepEqual(at("const all = import.meta.glob('../../prototype/src/*.tsx')"), ['prototype-import:../../prototype/src/*.tsx']);
  assert.deepEqual(at("const all = import.meta.glob(['./a/*.ts', '../../prototype/src/*.tsx'])"), ['prototype-import:../../prototype/src/*.tsx']);
  assert.deepEqual(at("import x from 'prototype/src/x'"), ['prototype-import:prototype/src/x'], 'a bare path');
  assert.deepEqual(at("import x from '../../prototype'"), ['prototype-import:../../prototype'], 'the folder itself');
  assert.deepEqual(at("import x from '../../prototype/src/x'", 'src/features/x/useX.ts'), ['prototype-import:../../prototype/src/x'], 'a hook may talk to the database, not to the prototype');
  assert.deepEqual(at("import x from '../../prototype/src/x'", 'src/lib/supabase.ts'), ['prototype-import:../../prototype/src/x']);
  assert.deepEqual(at("@import '../../prototype/src/index.css';", 'src/styles/global.css'), ['prototype-import:../../prototype/src/index.css'], 'a CSS @import');
  assert.deepEqual(at('@import url("../prototype/src/x.css");', 'src/styles/global.css'), ['prototype-import:../prototype/src/x.css']);
});

test('the prototype near-misses pass: other paths, a comment, a string, an unrelated word, an import of the app\'s own code', () => {
  const ok = [
    "import a from './prototypes/a'; import b from './myprototype'; import c from '../lib/prototype-helpers'; import d from '../lib/prototypeStore'",
    "import e from './Button'; import { f } from '../../components/Panel'; import './styles/tokens.css'; import '@fontsource-variable/archivo'",
    "// import x from '../../prototype/src/demo/demoStore'",
    "/* the kit lives in prototype/src/demo */",
    "const note = 'see prototype/ for the demo'; const route = '/prototype/'",
    "export type Kind = 'prototype/'",
  ];
  assert.deepEqual(hitsIn('src/features/x/Screen.tsx', ok.join('\n')), []);
  assert.deepEqual(hitsIn('src/styles/global.css', "@import '@fontsource-variable/archivo';\n@import \"tailwindcss\" source(\"..\");\n/* @import '../../prototype/x.css'; */"), [], 'a CSS comment is not an import');
  assert.deepEqual(hitsIn('src/styles/global.css', "@import '../prototypes/x.css';"), []);
});
