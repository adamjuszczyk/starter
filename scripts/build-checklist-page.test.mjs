// build-checklist-page.test.mjs: run with: node --test "scripts/*.test.mjs"
//
// What it proves about docs/new-app-checklist.html (RULES.md "Pages for me"):
//   - it is exactly the markdown rendered: a hand edit to the HTML fails; and every ```cmd block of the markdown is in it verbatim,
//     found by a plain line scan written apart from the generator's parser, so a bug in the parser cannot hide a command
//   - each of the five steps has a tick-box, one Expect box and one Stop if box; each placeholder in a command has its input
//   - the page loads nothing from outside, defines both themes as tokens, labels every input
//   - the facts the steps state are still true of the repo (the variable names, the config file, the image file, CONTEXT.md's labels)
//   - the generator refuses what it cannot render instead of losing it
//   - in a browser (Playwright, as the kit's check uses it): at 390 and 1280 px, in both themes and inside the Artifact tool's skeleton,
//     no element cuts off its content; a copy button puts its command on the clipboard (and selects it where the clipboard refuses);
//     fields fill the commands and refuse a value that could change a command; progress is saved to the artifact database when
//     window.claude is there and to the browser's storage when not, and nothing breaks when storage is blocked
// The browser checks need Playwright and Chromium. Where they are missing they are SKIPPED, visibly, with the reason (CI installs
// neither: `npm run check` runs there); CHECKLIST_REQUIRE_BROWSER=1 turns a skip into a failure.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import { DEFAULT_HTML, DEFAULT_MD, parseChecklist, renderPage, sourceHash } from './build-checklist-page.mjs';
import { readKeys } from './check-signups.mjs';

const SCRIPT = fileURLToPath(new URL('./build-checklist-page.mjs', import.meta.url));
const repo = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const norm = (s) => s.replace(/\r\n/g, '\n');
const markdown = norm(readFileSync(DEFAULT_MD, 'utf8'));
const committed = norm(readFileSync(DEFAULT_HTML, 'utf8'));
const dom = (html) => new JSDOM(html, { virtualConsole: new VirtualConsole() }).window.document;

// -------------------------------------------------------------- plain scans of the markdown, apart from the generator's parser

/** Every fenced block: { lang, code }. */
function fencesOf(md) {
  const out = [];
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^```(\S*)\s*$/.exec(lines[i]);
    if (!m) continue;
    const body = [];
    i += 1;
    while (i < lines.length && !/^```\s*$/.test(lines[i])) { body.push(lines[i]); i += 1; }
    out.push({ lang: m[1], code: body.join('\n') });
  }
  return out;
}

/** The numbered steps: { n, expects, stops }, counting the lines that start a box outside any fence. */
function stepsOf(md) {
  const steps = [];
  let current = null;
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^## (\d+)\. /.exec(line);
    if (m) { current = { n: Number(m[1]), expects: 0, stops: 0 }; steps.push(current); continue; }
    if (/^## /.test(line)) { current = null; continue; }
    if (!current) continue;
    if (/^Expect:/.test(line)) current.expects += 1;
    if (/^Stop if:/.test(line)) current.stops += 1;
  }
  return steps;
}

const blocks = fencesOf(markdown);
const commands = blocks.map((b) => b.code);

// ------------------------------------------------------------------------------------------------------- the page and the record

test('the HTML on disk is exactly the markdown rendered (a hand edit fails)', () => {
  const rendered = renderPage(markdown);
  if (committed === rendered) return;
  const a = committed.split('\n');
  const b = rendered.split('\n');
  const at = a.findIndex((line, k) => line !== b[k]);
  const where = at === -1 ? `the rendered page has ${b.length - a.length} more lines` : `line ${at + 1}: on disk ${JSON.stringify(a[at]).slice(0, 110)}, rendered ${JSON.stringify(b[at]).slice(0, 110)}`;
  assert.fail(`docs/new-app-checklist.html is not docs/new-app-checklist.md rendered (${where}). Edit the markdown, then run: node scripts/build-checklist-page.mjs`);
});

test('every cmd block of the markdown is in the HTML verbatim, in order, with a copy button', () => {
  assert.ok(blocks.length >= 5, 'the checklist has commands');
  assert.deepEqual([...new Set(blocks.map((b) => b.lang))], ['cmd'], 'the only fence in the markdown is cmd');
  for (const code of commands) assert.match(code, /^[\x20-\x7e\n]+$/, `paste-safe ASCII: ${code.slice(0, 40)}`);
  const doc = dom(committed);
  const shown = [...doc.querySelectorAll('.cmd')].map((box) => ({ text: box.querySelector('code').textContent, buttons: box.querySelectorAll('button.copy').length }));
  assert.deepEqual(shown.map((s) => s.text), commands);
  assert.ok(shown.every((s) => s.buttons === 1), 'one copy button per command');
});

test('the five steps each have a tick-box, one Expect box and one Stop if box, in the markdown and in the HTML', () => {
  const steps = stepsOf(markdown);
  assert.deepEqual(steps.map((s) => s.n), [1, 2, 3, 4, 5], 'SPEC item 8 has five steps');
  for (const s of steps) {
    assert.equal(s.expects, 1, `step ${s.n} has one Expect: in the markdown`);
    assert.equal(s.stops, 1, `step ${s.n} has one Stop if: in the markdown`);
  }
  const sections = [...dom(committed).querySelectorAll('section.step')];
  assert.equal(sections.length, 5);
  sections.forEach((sec, k) => {
    assert.equal(sec.getAttribute('data-step'), String(k + 1));
    assert.equal(sec.querySelectorAll('input[type="checkbox"][data-step]').length, 1, `step ${k + 1} has its tick-box`);
    for (const cls of ['expect', 'stopif']) {
      const boxes = sec.querySelectorAll(`.box.${cls}`);
      assert.equal(boxes.length, 1, `step ${k + 1} has one ${cls} box`);
      assert.ok(boxes[0].querySelector('.box-body').textContent.trim().length > 10, `step ${k + 1}'s ${cls} box says something`);
    }
  });
});

test('each placeholder in a command has its input, and the two fields SPEC names are there', () => {
  const placeholders = new Set(commands.flatMap((code) => [...code.matchAll(/<([a-z][a-z0-9-]*)>/g)].map((m) => m[1])));
  assert.ok(placeholders.has('project-ref') && placeholders.has('vercel-url'));
  const doc = dom(committed);
  const inputs = new Set([...doc.querySelectorAll('input[data-field]')].map((i) => i.getAttribute('data-field')));
  assert.deepEqual([...inputs].sort(), [...placeholders].sort(), 'inputs and placeholders are the same set');
  for (const code of doc.querySelectorAll('.cmd code')) {
    for (const span of code.querySelectorAll('.ph')) assert.ok(inputs.has(span.getAttribute('data-ph')));
  }
});

test('the page loads nothing from outside: one inline script, one inline style, links only to https', () => {
  const doc = dom(committed);
  assert.equal(doc.querySelectorAll('link, img, iframe, object, embed, video, audio, source, track, base').length, 0);
  assert.deepEqual([...doc.querySelectorAll('script')].map((s) => s.getAttribute('src')), [null]);
  assert.equal(doc.querySelectorAll('style').length, 1);
  assert.doesNotMatch(doc.querySelector('style').textContent, /@import|url\s*\(/i);
  for (const a of doc.querySelectorAll('a[href]')) assert.match(a.getAttribute('href'), /^https:\/\//);
  assert.doesNotMatch(committed.replace(/<a href="https:[^"]*"[^>]*>/g, ''), /(?:src|href|action)\s*=\s*["']?(?:https?:)?\/\//i);
  assert.match(doc.querySelector('title').textContent, /^\S+(?: \S+){1,3}$/, 'a name of two to four words');
});

/** The text of the CSS block that opens at `header`, braces matched. */
function cssBlock(css, header) {
  const start = css.indexOf(header);
  assert.notEqual(start, -1, `${header} is in the CSS`);
  let depth = 0;
  for (let i = css.indexOf('{', start); i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') { depth -= 1; if (depth === 0) return { start, end: i + 1, text: css.slice(css.indexOf('{', start) + 1, i) }; }
  }
  return assert.fail(`${header} is never closed`);
}
const tokensIn = (text) => Object.fromEntries([...text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

test('both themes are tokens: :root holds every token, the two dark blocks only redefine, and nothing else names a colour', () => {
  const css = dom(committed).querySelector('style').textContent;
  const root = cssBlock(css, ':root {');
  const media = cssBlock(css, '@media (prefers-color-scheme: dark)');
  const mediaRoot = cssBlock(media.text, ':root:not([data-theme="light"]) {');
  const attr = cssBlock(css, ':root[data-theme="dark"] {');
  const light = tokensIn(root.text);
  assert.ok(Object.keys(light).length >= 20);
  assert.equal(light['color-scheme'], undefined);
  assert.match(root.text, /color-scheme: light/);
  assert.match(mediaRoot.text, /color-scheme: dark/);
  assert.match(attr.text, /color-scheme: dark/);
  const dark = tokensIn(mediaRoot.text);
  assert.deepEqual(tokensIn(attr.text), dark, 'the toggle and the OS setting give the same dark values');
  for (const name of Object.keys(dark)) assert.ok(name in light, `${name} is first defined on bare :root`);
  const rest = [root, media, attr].sort((a, b) => b.start - a.start).reduce((s, b) => s.slice(0, b.start) + s.slice(b.end), css);
  assert.doesNotMatch(rest, /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i, 'a rule outside the token blocks names a colour');
  assert.match(rest, /body \{[^}]*background: var\(--base\)/, 'body has an explicit token background');
});

test('every input has a label', () => {
  const doc = dom(committed);
  const inputs = [...doc.querySelectorAll('input')];
  assert.ok(inputs.length >= 10);
  for (const input of inputs) {
    assert.ok(input.id, 'an input without an id');
    assert.ok(doc.querySelector(`label[for="${input.id}"]`) || input.closest('label'), `#${input.id} has no label`);
  }
});

test('the facts the steps state are still true of the repo', () => {
  const env = readFileSync(repo('.env.example'), 'utf8');
  const client = readFileSync(repo('src/lib/supabase.ts'), 'utf8');
  for (const name of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) {
    assert.ok(markdown.includes(`\`${name}\``), `the checklist names ${name}`);
    assert.ok(env.includes(`${name}=`), `.env.example has ${name}`);
    assert.ok(client.includes(name), `src/lib/supabase.ts reads ${name}`);
  }
  const toml = readFileSync(repo('supabase/config.toml'), 'utf8');
  assert.deepEqual(readKeys(toml, 'auth', 'enable_signup'), ['false'], 'config.toml says sign-ups off');
  assert.deepEqual(readKeys(toml, 'auth.email', 'enable_signup'), ['true'], 'config.toml leaves e-mail sign-in on');
  assert.ok(markdown.includes('`supabase/config.toml` already says sign-ups off'));
  assert.match(readFileSync(repo('supabase/postgres-image'), 'utf8').trim(), /^supabase\/postgres:\d+(?:\.\d+)+$/, 'the image file is one supabase/postgres tag');
  assert.ok(markdown.includes('`supabase/postgres-image`') && markdown.includes('`supabase/postgres:<number>`'));
  assert.ok(existsSync(repo('app.config.ts')) && markdown.includes('`app.config.ts`'));
  assert.ok(existsSync(repo('supabase/migrations')) && markdown.includes('`supabase/migrations`'));
  const context = readFileSync(repo('CONTEXT.md'), 'utf8');
  for (const label of ['Base branch:', 'Default branch:', 'Staging:']) {
    assert.ok(markdown.includes(`\`${label}\``), `the hand-off names ${label}`);
    assert.match(context, new RegExp(`^- ${label}`, 'm'), `CONTEXT.md "Repo facts" has ${label}`);
  }
  assert.ok(markdown.includes('SPEC item 8'));
});

test('step 1 says what public and private mean, in SPEC item 8 step 1\'s words', (t) => {
  const spec = readFileSync(repo('SPEC.md'), 'utf8').replace(/\s+/g, ' '); // SPEC.md wraps its lines
  // An app made from the template replaces SPEC.md with its own; then there is no item 8 to compare with.
  if (!spec.includes('New-app checklist page')) { t.skip('SPEC.md is the app\'s own: it no longer holds the starter\'s item 8'); return; }
  for (const words of [
    'GitHub\'s required checks on a private repo need a paid GitHub plan (about $4 a month)',
    'a public repo shows the app\'s code, never its data, to anyone',
    'the demo\'s spec decides its repo',
  ]) {
    assert.ok(spec.includes(words), `SPEC.md says: ${words}`);
    assert.ok(markdown.includes(words), `the checklist says: ${words}`);
  }
});

// ---------------------------------------------------------------------------------------------- the generator refuses, never loses

const FIXTURE = `# Fixture page

*A lede.*

---

## 1. First step

Do the thing in \`<name>\`.

Field \`<name>\`: A name.

\`\`\`cmd
echo <name>
\`\`\`

Expect: it prints the name.

Stop if: it does not.
`;
const without = (text, part) => { assert.ok(text.includes(part), `fixture has ${part}`); return text.replace(part, ''); };

test('the generator renders a small page, and refuses what it cannot render', () => {
  const html = renderPage(FIXTURE);
  assert.match(html, /<title>Fixture page<\/title>/);
  assert.match(html, /<code>echo <span class="ph" data-ph="name">&lt;name&gt;<\/span><\/code>/);
  const bad = (md, pattern) => assert.throws(() => renderPage(md), pattern);
  bad(without(FIXTURE, 'Stop if: it does not.\n'), /step 1 needs exactly one Stop if: box \(it has 0\)/);
  bad(without(FIXTURE, 'Expect: it prints the name.\n\n'), /step 1 needs exactly one Expect: box/);
  bad(FIXTURE.replace('## 1. First step', '## 2. First step'), /numbered 1, 2, 3 in order \(found 2 where 1 belongs\)/);
  bad(FIXTURE.replace('Field `<name>`: A name.\n\n', ''), /<name> in a command has no Field line/);
  bad(FIXTURE.replace('echo <name>', 'echo hello').replace('Do the thing in `<name>`.', 'Do the thing.'), /never used in a command or a code span/);
  bad(FIXTURE.replace('Do the thing in `<name>`.', 'Do the thing.').replace('echo <name>', 'echo hi <other>'), /<other> in a command has no Field line/);
  bad(FIXTURE.replace('echo <name>', 'echo \u201csmart\u201d <name>'), /plain ASCII/);
  bad(FIXTURE.replace('echo <name>', 'echo <name> '), /trailing space/);
  bad(FIXTURE.replace('echo <name>', 'echo a\n\necho <name>'), /blank line inside a cmd block/);
  bad(FIXTURE.replace('```cmd\necho', '```text\necho'), /only cmd fences/);
  bad(`${FIXTURE}\n| a | b |\n|---|---|\n`, /tables are not supported/);
  bad(`${FIXTURE}\n- one\n  - nested\n`, /nested lists/);
  bad(`${FIXTURE}\nSee [this](http://example.com).\n`, /https:\/\//);
  bad(`${FIXTURE}\n# A second title\n`, /only one # heading/);
  bad(FIXTURE.replace('# Fixture page\n', ''), /needs one # heading/);
  bad(`${FIXTURE}\nField \`<name>\`: Again.\n`, /declared twice/);
});

test('text from the markdown is escaped, $ is literal, and CRLF renders like LF', () => {
  const md = FIXTURE.replace('Do the thing in `<name>`.', () => 'Costs $& and $1 for <script>alert(1)</script> and `<name>`.');
  const html = renderPage(md);
  assert.match(html, /Costs \$&amp; and \$1 for &lt;script&gt;alert\(1\)&lt;\/script&gt; and /);
  assert.doesNotMatch(html, /<script>alert/);
  assert.equal(renderPage(md.replace(/\n/g, '\r\n')), html);
  assert.equal(sourceHash(md.replace(/\n/g, '\r\n')), sourceHash(md));
  assert.equal(parseChecklist(md).source, sourceHash(md));
  assert.ok(committed.includes(`data-source="${sourceHash(markdown)}"`), 'the page carries the hash of its markdown');
});

test('the script writes the page, and --check tells a hand edit from a fresh page', () => {
  const dir = mkdtempSync(join(tmpdir(), 'checklist-'));
  const md = join(dir, 'c.md');
  const html = join(dir, 'c.html');
  writeFileSync(md, FIXTURE);
  const run = (...args) => {
    try { return { status: 0, out: execFileSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), err: '' }; } catch (e) { return { status: e.status, out: String(e.stdout), err: String(e.stderr) }; }
  };
  assert.equal(run(md, html).status, 0);
  assert.equal(readFileSync(html, 'utf8'), renderPage(FIXTURE));
  assert.equal(run('--check', md, html).status, 0);
  writeFileSync(html, readFileSync(html, 'utf8').replace('echo ', 'echo x'));
  const stale = run('--check', md, html);
  assert.equal(stale.status, 1);
  assert.match(stale.err, /Run: node scripts\/build-checklist-page\.mjs/);
  writeFileSync(md, FIXTURE.replace('Stop if: it does not.\n', ''));
  const broken = run(md, html);
  assert.equal(broken.status, 1);
  assert.match(broken.err, /Stop if/);
  assert.equal(run(join(dir, 'missing.md'), html).status, 2);
  assert.equal(run('--check').status, 0, 'the committed page is up to date');
});

// ----------------------------------------------------------------------------------------------------------------- in a browser

const require = createRequire(import.meta.url);
const loadPlaywright = () => {
  for (const id of ['playwright', process.env.PLAYWRIGHT_PATH ?? '/opt/npm-tools/node_modules/playwright/index.js']) {
    try { return require(id); } catch { /* try the next */ }
  }
  return null;
};
const playwright = loadPlaywright();
let browser = null;
let whySkipped = 'Playwright is not installed here, so the browser checks cannot run (the build\'s cloud session has it; set PLAYWRIGHT_PATH to its index.js).';

before(async () => {
  if (playwright) {
    try { browser = await playwright.chromium.launch(); } catch (e) { whySkipped = `Chromium would not start, so the browser checks cannot run (${String(e.message).split('\n')[0]}).`; }
  }
  if (!browser && process.env.CHECKLIST_REQUIRE_BROWSER === '1') throw new Error(whySkipped);
});
after(async () => { if (browser) await browser.close(); });

const browserTest = (name, fn) => test(name, async (t) => {
  if (!browser) { t.skip(whySkipped); return; }
  await fn(t);
});

// Copied from prototype/check/clipped.mjs (`findClipped`, which Overload's prototype/check/clipping.mjs held first); copied, not imported:
// chunk 8 rewrote that check in the same batch as this one (TASKS.md, Decided 44). It runs in the page and reports any
// element that cuts off its own content, any squeezed flex child, and a sideways scroll of the page itself.
const findClipped = () => {
  const out = []
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px`)
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || el.closest('[data-demo-menu]') || el.classList.contains('sr-only')) continue // sr-only: clipped on purpose (screen readers)
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) continue
    const clipsY = ['hidden', 'clip'].includes(cs.overflowY)
    const clipsX = ['hidden', 'clip'].includes(cs.overflowX)
    const tallY = el.scrollHeight > el.clientHeight + 1
    const wideX = el.scrollWidth > el.clientWidth + 1
    const parent = el.parentElement && getComputedStyle(el.parentElement)
    const squeezed = parent && parent.display.includes('flex') && parent.flexDirection.startsWith('column') && !['auto', 'scroll'].includes(cs.overflowY) && !el.style.height && cs.flexShrink !== '0' && el.scrollHeight > r.height + 1
    if ((clipsY && tallY) || (clipsX && wideX && !el.className.toString().includes('truncate')) || squeezed) {
      out.push(`${el.tagName.toLowerCase()}.${el.className.toString().split(' ').slice(0, 3).join('.')} "${(el.textContent || '').trim().slice(0, 40)}" box ${Math.round(r.height)}x${Math.round(r.width)} content ${el.scrollHeight}x${el.scrollWidth}`)
    }
  }
  return out.slice(0, 6)
}

// The Artifact tool wraps a published page in a skeleton: charset and viewport metas and a small reset (light colour-scheme, the phone's
// safe-area padding on :root, zero body margin and a 14px system font, img max-width, [hidden]). This is that skeleton as its
// description gives it, not the platform's exact text, around the page as the file holds it.
const inArtifactSkeleton = (page) => `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>${page}</body></html>`;

/** Serves `html` at http://127.0.0.1 (a secure context, so the Clipboard API exists) and opens it in a fresh browser context. */
async function open(html, { width = 1280, height = 800, colorScheme = 'light', permissions = [], init = null, initArg = undefined } = {}) {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push(req.url);
    if (req.url !== '/') { res.statusCode = 404; res.end(); return; }
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(html);
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const context = await browser.newContext({ viewport: { width, height }, colorScheme });
  if (permissions.length) await context.grantPermissions(permissions, { origin: new URL(url).origin });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
  if (init) await page.addInitScript(init, initArg);
  await page.goto(url);
  return {
    page, errors, requests,
    close: async () => { await context.close(); await new Promise((ok) => server.close(ok)); },
  };
}
async function withPage(html, options, fn) {
  const s = await open(html, options);
  try { await fn(s); assert.deepEqual(s.errors, [], 'no script error in the page'); } finally { await s.close(); }
}

for (const [width, height] of [[390, 844], [1280, 800]]) {
  for (const colorScheme of ['light', 'dark']) {
    browserTest(`no element cuts off its content at ${width} px, ${colorScheme}, on the page and inside the Artifact skeleton`, async () => {
      for (const html of [committed, inArtifactSkeleton(committed)]) {
        await withPage(html, { width, height, colorScheme }, async ({ page, requests }) => {
          const clipped = await page.evaluate(findClipped);
          assert.deepEqual(clipped, [], `clipped: ${clipped.join(' | ')}`);
          assert.deepEqual(requests.filter((u) => u !== '/favicon.ico'), ['/'], 'the page asked for nothing but itself');
        });
      }
    });
  }
}

browserTest('findClipped does report a box that cuts off its content (the check can fail)', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.setContent(`<div style="width:120px;overflow:hidden"><span style="white-space:nowrap">a command that does not fit in its box at all</span></div><pre>${'x'.repeat(200)}</pre>`);
    const clipped = await page.evaluate(findClipped);
    assert.ok(clipped.some((c) => c.startsWith('page scrolls sideways')), `the long line widens the page: ${clipped}`);
    assert.ok(clipped.some((c) => c.startsWith('div.')), `the hidden overflow is reported: ${clipped}`);
  } finally { await context.close(); }
});

browserTest('both themes follow the OS setting and the viewer\'s explicit choice', async () => {
  const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  for (const html of [committed, inArtifactSkeleton(committed)]) {
    await withPage(html, { colorScheme: 'light' }, async ({ page }) => {
      assert.equal(await bg(page), 'rgb(245, 246, 248)');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      assert.equal(await bg(page), 'rgb(12, 15, 20)');
    });
    await withPage(html, { colorScheme: 'dark' }, async ({ page }) => {
      assert.equal(await bg(page), 'rgb(12, 15, 20)');
      await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
      assert.equal(await bg(page), 'rgb(245, 246, 248)');
    });
  }
});

const CLIPBOARD = ['clipboard-read', 'clipboard-write'];
const copyLabel = (page, i) => page.locator('.cmd button.copy').nth(i).textContent();

browserTest('every copy button puts its own command on the clipboard; the fields fill the commands first', async () => {
  await withPage(committed, { permissions: CLIPBOARD }, async ({ page }) => {
    // A button reads "Copy" until it has been used, and says what happened for a moment after: wait for that, then read the clipboard.
    const copy = async (i) => {
      await page.locator('.cmd button.copy').nth(i).click();
      await page.waitForFunction((n) => document.querySelectorAll('.cmd button.copy')[n].textContent !== 'Copy', i);
      return page.evaluate(() => navigator.clipboard.readText());
    };
    for (let i = 0; i < commands.length; i += 1) {
      assert.equal(await copy(i), commands[i], `command ${i + 1}`);
      assert.equal(await copyLabel(page, i), /<[a-z-]+>/.test(commands[i]) ? 'Copied (field empty)' : 'Copied');
    }
    await page.waitForFunction(() => [...document.querySelectorAll('.cmd button.copy')].every((b) => b.textContent === 'Copy'));
    const values = { 'project-ref': 'abcdefghijklmnopqrst', 'vercel-url': 'my-app.vercel.app', owner: 'adamjuszczyk', repo: 'installer-demo', 'repos-folder': 'C:\\Users\\adam\\my repos' };
    for (const [name, value] of Object.entries(values)) await page.fill(`#field-${name}`, value);
    const filled = (code) => Object.entries(values).reduce((s, [name, value]) => s.replaceAll(`<${name}>`, value), code);
    for (let i = 0; i < commands.length; i += 1) {
      assert.equal(await copy(i), filled(commands[i]), `command ${i + 1} with the fields filled`);
      assert.equal(await copyLabel(page, i), 'Copied');
      assert.equal(await page.locator('.cmd code').nth(i).textContent(), filled(commands[i]), 'the command on the page shows the values');
    }
    assert.equal(await page.locator('.ph:not(.filled)').count(), 0);
  });
});

browserTest('where the Clipboard API refuses, the copy button selects the command', async () => {
  const refuse = () => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) }, configurable: true }); };
  await withPage(committed, { init: refuse }, async ({ page }) => {
    await page.locator('.cmd button.copy').first().click();
    await page.waitForFunction(() => document.querySelector('.cmd button.copy').textContent !== 'Copy');
    assert.equal(norm(await page.evaluate(() => window.getSelection().toString())), commands[0]);
    // Selected, and copied the old way where the browser allows it (the fields are empty here, so a copy says so).
    assert.match(await copyLabel(page, 0), /^(?:Copied \(field empty\)|Press Ctrl\+C)$/);
  });
});

browserTest('a value that could change a command is refused, in a field and when it comes from a store', async () => {
  await withPage(committed, {}, async ({ page }) => {
    await page.fill('#field-owner', 'adamjuszczyk');
    assert.match(await page.locator('.cmd code').first().textContent(), /github\.com\/adamjuszczyk\/<repo>\.git/);
    for (const bad of ['x & del /q *', 'a|b', 'a"b', 'a%TEMP%b', 'a^b', 'a<b', '$(x)', 'a(b)']) {
      await page.fill('#field-owner', bad);
      assert.equal(await page.getAttribute('#field-owner', 'aria-invalid'), 'true', bad);
      assert.equal(await page.isVisible('#field-owner-error'), true, bad);
      assert.match(await page.locator('.cmd code').first().textContent(), /github\.com\/adamjuszczyk\/<repo>\.git/, `${bad} did not reach the command`);
    }
    await page.fill('#field-owner', 'acme-co');
    assert.equal(await page.getAttribute('#field-owner', 'aria-invalid'), 'false');
    assert.equal(await page.isVisible('#field-owner-error'), false);
    assert.match(await page.locator('.cmd code').first().textContent(), /github\.com\/acme-co\/<repo>\.git/);
  });
});

// ------------------------------------------------------------------------------------------- saving progress: the browser's storage

browserTest('without window.claude, ticks and fields are saved in the browser and come back', async () => {
  await withPage(committed, {}, async ({ page }) => {
    assert.equal(await page.textContent('#progress-text'), '0 of 5 steps done');
    await page.check('#tick-2');
    await page.fill('#field-project-ref', 'abcdefghijklmnopqrst');
    await page.waitForFunction(() => { try { const v = JSON.parse(localStorage.getItem('new-app-checklist')); return v && v.ticks['2'] === true && v.fields['project-ref'] === 'abcdefghijklmnopqrst'; } catch { return false; } });
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('new-app-checklist')));
    assert.equal(stored.v, 1);
    assert.equal(stored.steps, 5);
    assert.equal(stored.done, 1);
    assert.equal(stored.source, sourceHash(markdown));
    assert.deepEqual(Object.keys(stored.ticks), ['1', '2', '3', '4', '5']);
    assert.match(await page.textContent('#save-status'), /this browser only/);
    await page.reload();
    assert.equal(await page.isChecked('#tick-2'), true);
    assert.equal(await page.isChecked('#tick-1'), false);
    assert.equal(await page.inputValue('#field-project-ref'), 'abcdefghijklmnopqrst');
    assert.match(await page.locator('.cmd code').nth(2).textContent(), /^curl -s https:\/\/abcdefghijklmnopqrst\.supabase\.co\/auth\/v1\/settings /);
    assert.equal(await page.textContent('#progress-text'), '1 of 5 steps done');
    assert.equal(await page.evaluate(() => document.getElementById('step-2').classList.contains('done')), true);
    for (const n of [1, 3, 4, 5]) await page.check(`#tick-${n}`);
    assert.match(await page.textContent('#progress-text'), /^All 5 steps done/);
  });
});

browserTest('clearing the ticks and fields asks first, then clears what was saved', async () => {
  await withPage(committed, {}, async ({ page }) => {
    await page.check('#tick-1');
    await page.fill('#field-repo', 'installer-demo');
    await page.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('new-app-checklist')).ticks['1'] === true; } catch { return false; } });
    assert.equal(await page.isVisible('#reset-confirm'), false);
    await page.click('#reset-open');
    assert.equal(await page.isVisible('#reset-confirm'), true);
    await page.click('#reset-no');
    assert.equal(await page.isChecked('#tick-1'), true, 'keeping them keeps them');
    assert.equal(await page.inputValue('#field-repo'), 'installer-demo');
    await page.click('#reset-open');
    await page.click('#reset-yes');
    assert.equal(await page.isChecked('#tick-1'), false);
    assert.equal(await page.inputValue('#field-repo'), '');
    assert.equal(await page.textContent('#progress-text'), '0 of 5 steps done');
    await page.waitForFunction(() => { try { const v = JSON.parse(localStorage.getItem('new-app-checklist')); return v.done === 0 && v.fields.repo === ''; } catch { return false; } });
  });
});

browserTest('blocked browser storage does not break the page', async () => {
  const blocked = () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); }, configurable: true }); };
  await withPage(committed, { init: blocked }, async ({ page }) => {
    await page.check('#tick-1');
    await page.fill('#field-owner', 'adamjuszczyk');
    assert.equal(await page.textContent('#progress-text'), '1 of 5 steps done');
    await page.waitForFunction(() => /blocks storage/.test(document.getElementById('save-status').textContent));
    assert.match(await page.locator('.cmd code').first().textContent(), /github\.com\/adamjuszczyk\//);
  });
});

// ----------------------------------------------------------------------- saving progress: the artifact database (window.claude)

// The artifact runtime as its type definitions describe it (artifact-capabilities, db.d.ts): `window.claude.use("db")` resolves a store
// whose doc(path) has get / set / onSnapshot, or null. This stand-in keeps its documents in localStorage under another key (so a reload
// keeps them), records every write in window.__writes, and lets a test act as another viewer (window.__remote) or refuse writes
// (window.__failWrites), or refuse the read (failRead: the error code the snapshot listener gets). Whether the real runtime does the same
// is the one thing this cannot show: the coordinator's first publish does.
function installFakeClaude({ db, delay = 0, seed = null, failRead = null }) {
  const PREFIX = '__fakedb__:';
  const listeners = {};
  const read = (path) => { const s = localStorage.getItem(PREFIX + path); return s ? JSON.parse(s) : undefined; };
  const snap = (path) => { const data = read(path); return { id: path.split('/').pop(), exists: data !== undefined, data: () => data, metadata: { fromCache: false, hasPendingWrites: false } }; };
  const notify = (path) => (listeners[path] || []).forEach((fn) => setTimeout(() => fn(snap(path)), 0));
  if (seed) localStorage.setItem(PREFIX + seed.path, JSON.stringify(seed.data));
  window.__writes = [];
  window.__failWrites = null;
  window.__remote = (path, data) => { localStorage.setItem(PREFIX + path, JSON.stringify(data)); notify(path); };
  const store = {
    doc(path) {
      if (!/^[^/]+\/[^/]+$/.test(path)) throw new TypeError('a document path has an even number of segments');
      return {
        path,
        get: async () => snap(path),
        set: async (data) => {
          if (window.__failWrites) throw { code: window.__failWrites, message: 'refused' };
          window.__writes.push({ path, data: JSON.parse(JSON.stringify(data)) });
          localStorage.setItem(PREFIX + path, JSON.stringify(data));
          notify(path);
        },
        onSnapshot: (next, error) => {
          if (failRead) { setTimeout(() => error && error({ code: failRead, message: 'refused' }), 0); return () => {}; }
          (listeners[path] = listeners[path] || []).push(next);
          setTimeout(() => next(snap(path)), 0);
          return () => {};
        },
      };
    },
  };
  window.claude = { use: async (name) => { if (delay) await new Promise((r) => setTimeout(r, delay)); return name === 'db' && db ? store : null; } };
}
const writes = (page) => page.evaluate(() => window.__writes);
const status = (page) => page.textContent('#save-status');

browserTest('as a published artifact the progress goes to the artifact database, once per pause, and not to the browser', async () => {
  await withPage(committed, { init: installFakeClaude, initArg: { db: true } }, async ({ page }) => {
    await page.waitForFunction(() => /page's record/.test(document.getElementById('save-status').textContent));
    await page.check('#tick-1');
    await page.fill('#field-owner', 'adamjuszczyk');
    await page.waitForFunction(() => window.__writes.length >= 1);
    await page.waitForTimeout(900);
    const done = await writes(page);
    assert.equal(done.length, 1, 'a burst of changes is one write');
    assert.equal(done[0].path, 'checklist/progress');
    assert.equal(done[0].data.v, 1);
    assert.equal(done[0].data.steps, 5);
    assert.equal(done[0].data.done, 1);
    assert.equal(done[0].data.source, sourceHash(markdown));
    assert.equal(done[0].data.ticks['1'], true);
    assert.equal(done[0].data.ticks['2'], false);
    assert.equal(done[0].data.fields.owner, 'adamjuszczyk');
    assert.equal(typeof done[0].data.updatedAt, 'string');
    assert.equal(await page.evaluate(() => localStorage.getItem('new-app-checklist')), null, 'the browser store is not used while the database is');
    assert.match(await status(page), /page's record/);
    await page.reload();
    await page.waitForFunction(() => document.getElementById('tick-1').checked);
    assert.equal(await page.inputValue('#field-owner'), 'adamjuszczyk');
    assert.match(await page.locator('.cmd code').first().textContent(), /github\.com\/adamjuszczyk\//);
    await page.waitForTimeout(900);
    assert.deepEqual(await writes(page), [], 'opening the page writes nothing');
  });
});

browserTest('another viewer\'s change reaches the page live, and an unsafe value from the store is dropped', async () => {
  await withPage(committed, { init: installFakeClaude, initArg: { db: true } }, async ({ page }) => {
    await page.waitForFunction(() => /page's record/.test(document.getElementById('save-status').textContent));
    await page.evaluate(() => window.__remote('checklist/progress', { ticks: { 3: true, 4: 'yes' }, fields: { 'vercel-url': 'my-app.vercel.app', owner: 'x & calc', repo: 7 } }));
    await page.waitForFunction(() => document.getElementById('tick-3').checked);
    assert.equal(await page.isChecked('#tick-4'), false, 'only true counts as a tick');
    assert.equal(await page.inputValue('#field-vercel-url'), 'my-app.vercel.app');
    assert.equal(await page.inputValue('#field-owner'), '');
    assert.equal(await page.inputValue('#field-repo'), '');
    assert.match(await page.locator('.cmd code').nth(4).textContent(), /^curl -s -o NUL .* https:\/\/my-app\.vercel\.app\/$/);
    assert.deepEqual(await writes(page), [], 'adopting what arrives writes nothing back');
  });
});

browserTest('a change made before the database answers is kept and merged into what it holds', async () => {
  const seed = { path: 'checklist/progress', data: { ticks: { 1: true }, fields: { 'project-ref': 'abcdefghijklmnopqrst' } } };
  await withPage(committed, { init: installFakeClaude, initArg: { db: true, delay: 900, seed } }, async ({ page }) => {
    await page.check('#tick-4');
    assert.match(await status(page), /Loading saved progress/);
    await page.waitForFunction(() => window.__writes.length >= 1, null, { timeout: 8000 });
    const [w] = await writes(page);
    assert.equal(w.data.ticks['1'], true, 'what the database held is kept');
    assert.equal(w.data.ticks['4'], true, 'what was ticked meanwhile is added');
    assert.equal(w.data.fields['project-ref'], 'abcdefghijklmnopqrst');
    assert.equal(w.data.done, 2);
    assert.equal(await page.isChecked('#tick-1'), true);
    assert.equal(await page.isChecked('#tick-4'), true);
  });
});

browserTest('a viewer who refuses the database gets the browser\'s storage, and nothing goes to the database', async () => {
  await withPage(committed, { init: installFakeClaude, initArg: { db: true, failRead: 'not_granted' } }, async ({ page }) => {
    await page.waitForFunction(() => /this browser only/.test(document.getElementById('save-status').textContent));
    await page.check('#tick-2');
    await page.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('new-app-checklist')).ticks['2'] === true; } catch { return false; } });
    assert.deepEqual(await writes(page), []);
  });
});

browserTest('a refused write is said so and kept in the browser; no database means the browser\'s storage', async () => {
  await withPage(committed, { init: installFakeClaude, initArg: { db: true } }, async ({ page }) => {
    await page.waitForFunction(() => /page's record/.test(document.getElementById('save-status').textContent));
    await page.evaluate(() => { window.__failWrites = 'quota_exceeded'; });
    await page.check('#tick-5');
    await page.waitForFunction(() => /Not saved \(quota_exceeded\)/.test(document.getElementById('save-status').textContent));
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('new-app-checklist')).ticks['5']), true);
    assert.equal(await page.isChecked('#tick-5'), true);
    await page.evaluate(() => { window.__failWrites = null; });
    await page.check('#tick-3');
    await page.waitForFunction(() => window.__writes.length === 1);
    assert.equal((await writes(page))[0].data.ticks['5'], true, 'the next change saves everything, the refused tick included');
  });
  await withPage(committed, { init: installFakeClaude, initArg: { db: false } }, async ({ page }) => {
    await page.check('#tick-2');
    await page.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('new-app-checklist')).ticks['2'] === true; } catch { return false; } });
    assert.match(await status(page), /this browser only/);
    assert.deepEqual(await writes(page), []);
  });
});
