// check-build.mjs
//
// Checks the built app in dist/ for what lets it open offline and keeps a new version from leaving a half-updated page (TASKS.md,
// Decided 4 and 16). A build can pass and still have lost any of these, and nothing else would notice:
//   1. sw.js takes over by itself: it calls self.skipWaiting() and clientsClaim(), and the workbox runtime it loads claims clients on
//      activate (vite.config.ts sets both; without them a new worker waits until every tab of the app is closed).
//   2. Every woff2 file in dist is in the precache (sw.js's manifest), and each bundled font family (the @fontsource packages in
//      package.json) has one there, its latin-ext file (the Polish letters) among them: the app opens offline with its fonts.
//   3. No Google font host anywhere in dist: loading fonts from Google sends every visitor's address to Google.
//   4. No dynamic chunk but workbox-window: an old page that is still open never fetches a chunk the new precache dropped. Only an
//      import() with a string literal can make a chunk, so only those are counted (supabase-js has one with a variable, for OpenTelemetry).
//
// Usage: node scripts/check-build.mjs [dist folder]   (after `npm run build`; the folder defaults to dist/ at the repo root, and its
//        package.json is the one beside it)
// Exit:  0 = every check holds, 1 = a check failed (all of them are listed), 2 = no dist/ folder, sw.js or package.json to read

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(process.argv[2] ?? join(root, 'dist'));
const packageJsonPath = join(dist, '..', 'package.json');

function stop(message) {
  console.error(`check-build: ${message}`);
  process.exit(2);
}

if (!existsSync(join(dist, 'sw.js'))) stop(`no sw.js in ${dist}. Run \`npm run build\` first.`);
if (!existsSync(packageJsonPath)) stop(`no package.json beside ${dist}.`);

function filesIn(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesIn(join(dir, entry.name)) : [join(dir, entry.name)],
  );
}
const all = filesIn(dist).map((file) => relative(dist, file).split(sep).join('/'));
const read = (file) => readFileSync(join(dist, file), 'utf8');

const results = [];
const check = (name, ok, whenFailed) => results.push({ name, ok, whenFailed });

// 1. The worker takes over by itself.
const sw = read('sw.js');
const runtimeFile = sw.match(/["']\.\/(workbox-[\w.-]+)["']/)?.[1];
const runtime = runtimeFile && all.includes(`${runtimeFile}.js`) ? read(`${runtimeFile}.js`) : '';
check('sw.js calls self.skipWaiting()', /self\.skipWaiting\(\)/.test(sw), 'workbox.skipWaiting is not set in vite.config.ts: a new worker would wait until every tab is closed');
check('sw.js calls clientsClaim()', /\bclientsClaim\(\)/.test(sw), 'workbox.clientsClaim is not set in vite.config.ts: a new worker would not control the open tab');
check('the workbox runtime sw.js loads claims clients (clients.claim)', /clients\.claim\(\)/.test(runtime), `no clients.claim() in ${runtimeFile ?? 'a workbox runtime'}, which sw.js should load`);

// 2. The fonts are in the precache.
const precache = new Set([...sw.matchAll(/\burl\s*:\s*(["'])(.*?)\1/g)].map((match) => match[2]));
const fonts = all.filter((file) => file.endsWith('.woff2'));
const unprecached = fonts.filter((file) => !precache.has(file));
check(`every woff2 file in dist is in the precache (${fonts.length} files)`, unprecached.length === 0, `not in the precache: ${unprecached.join(', ')}`);

const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const families = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
  .filter((name) => /^@fontsource(-variable)?\//.test(name))
  .map((name) => name.split('/')[1]);
check('package.json bundles at least one @fontsource font family', families.length > 0, 'no @fontsource package in package.json: the fonts would come from somewhere else');
for (const family of families) {
  const own = [...precache].filter((url) => url.endsWith('.woff2') && basename(url).startsWith(`${family}-`));
  check(`${family}: a woff2 file is in the precache`, own.length > 0, `no ${family}-*.woff2 in sw.js's precache: is its @fontsource import in src/styles/global.css?`);
  check(
    `${family}: its latin-ext woff2 file (the Polish letters) is in the precache`,
    own.some((url) => basename(url).startsWith(`${family}-latin-ext-`)),
    `no ${family}-latin-ext-*.woff2 in sw.js's precache (a subset under Vite's 4 KiB asset limit is inlined into the CSS instead of emitted)`,
  );
}

// 3. No Google font host.
const GOOGLE_FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
const googleHits = all
  .filter((file) => /\.(html|css|m?js|json|webmanifest|svg|txt|xml|map)$/.test(file))
  .flatMap((file) => GOOGLE_FONT_HOSTS.filter((host) => read(file).includes(host)).map((host) => `${file} (${host})`));
check('no Google font host anywhere in dist', googleHits.length === 0, `found in ${googleHits.join(', ')}`);

// 4. No dynamic chunk but workbox-window.
const DYNAMIC_IMPORT = /\bimport\(\s*(["'`])([^"'`]+)\1\s*\)/g;
const dynamicImports = all
  .filter((file) => file.endsWith('.js'))
  .flatMap((file) => [...read(file).matchAll(DYNAMIC_IMPORT)].map((match) => ({ file, specifier: match[2] })));
const extraChunks = dynamicImports.filter(({ specifier }) => !basename(specifier).startsWith('workbox-window'));
check(
  'no dynamic chunk but workbox-window',
  extraChunks.length === 0,
  `import("${extraChunks[0]?.specifier}") in ${extraChunks[0]?.file}${extraChunks.length > 1 ? ` and ${extraChunks.length - 1} more` : ''}: a lazy route or lazy component makes a chunk the precache may drop`,
);

// Report.
for (const { name, ok, whenFailed } of results) console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` — ${whenFailed}`}`);
const failed = results.filter(({ ok }) => !ok).length;
if (failed > 0) {
  console.log(`check-build: FAIL — ${failed} of ${results.length} checks failed in ${relative(process.cwd(), dist) || '.'}.`);
  process.exit(1);
}
console.log(`check-build: ok — ${results.length} checks hold in ${relative(process.cwd(), dist) || '.'} (${fonts.length} woff2 files, ${dynamicImports.length} dynamic import${dynamicImports.length === 1 ? '' : 's'}).`);
