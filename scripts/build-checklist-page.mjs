// build-checklist-page.mjs: renders docs/new-app-checklist.md into docs/new-app-checklist.html, the page Adam works from.
//
//   node scripts/build-checklist-page.mjs                  write docs/new-app-checklist.html from docs/new-app-checklist.md
//   node scripts/build-checklist-page.mjs --check          exit 1 when the HTML on disk is not the markdown rendered
//   node scripts/build-checklist-page.mjs IN.md OUT.html   other paths (the tests use this)
//   exit 0 done, 1 the markdown cannot be rendered (or --check found the HTML stale), 2 a file cannot be read
//
// RULES.md "Pages for me": the markdown is the record, the page is built from it. Every command is copied from the markdown by this
// script, never retyped; scripts/build-checklist-page.test.mjs fails when the HTML is not exactly what this script makes from the markdown.
//
// The markdown subset the script reads (anything else is an error naming the line, so a page can never quietly lose content):
//   # Title                      once, first: the page's name and heading
//   ## 1. Title                  a step, numbered 1, 2, 3 in order: a tick-box, and exactly one Expect box and one Stop if box
//   ## Title                     any other section (the hand-off): the same blocks, no tick-box
//   ### Title                    a sub-heading
//   paragraphs, "- " lists, "1. " lists, a line of --- (ignored)
//   *whole paragraph italic*     the lede; **whole paragraph bold** a warning
//   ```cmd ... ```               a command box with a copy button (the only fence allowed: plain ASCII, one command per line)
//   Expect: / Stop if:           a box; text after the colon and/or a list under it
//   Field `<name>`: label        an input whose value replaces <name> in every command and code span on the page
// Inline: `code`, **bold**, *italic*, [text](https://...). Raw HTML is shown as text.
//
// The page is one static file: tokens inline (the starter's light and dark values, copied here so that an app restyling its own
// tokens.css does not stale it), no external resource. Progress (ticks and field values) is saved to the artifact database when the
// page runs as a published artifact (window.claude present) and to the browser's storage otherwise, every access in try/catch.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_MD = fileURLToPath(new URL('../docs/new-app-checklist.md', import.meta.url));
export const DEFAULT_HTML = fileURLToPath(new URL('../docs/new-app-checklist.html', import.meta.url));

const normalize = (s) => String(s).replace(/\r\n?/g, '\n');
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);
const PLACEHOLDER = /<([a-z][a-z0-9-]*)>/g;
const FIELD_LINE = /^Field `<([a-z][a-z0-9-]*)>`:\s*(\S.*)$/;

/** The first 12 hex characters of the markdown's SHA-256 (line endings normalised): the page says which text it was built from. */
export function sourceHash(markdown) {
  return createHash('sha256').update(normalize(markdown)).digest('hex').slice(0, 12);
}

// ------------------------------------------------------------------------------------------------------------------ parsing

const startsList = (l) => /^(?:- |\d+\. )/.test(l);
const isBoundary = (l) => l.trim() === '' || /^```/.test(l) || /^#{1,6} /.test(l) || /^-{3,}\s*$/.test(l);

function kindOf(line) {
  if (/^(?:Expect|Stop if):/.test(line)) return 'box';
  if (line.startsWith('Field `')) return 'field';
  if (startsList(line)) return 'list';
  return 'para';
}

/** Parses the lines of one list (or the list under an Expect / Stop if line) into { ordered, start, items }. */
function parseItems(lines, at, fail) {
  const items = [];
  let ordered = null;
  let start = 1;
  lines.forEach((line, k) => {
    const um = /^- (\S.*)$/.exec(line);
    const om = /^(\d+)\. (\S.*)$/.exec(line);
    if (um || om) {
      if (ordered !== null && ordered !== Boolean(om)) fail(at + k, 'a list mixes "- " and "1." items');
      if (ordered === null) { ordered = Boolean(om); if (om) start = Number(om[1]); }
      items.push((um ? um[1] : om[2]).trim());
    } else if (/^\s+(?:- |\d+\. )/.test(line)) {
      fail(at + k, 'nested lists are not supported');
    } else if (items.length === 0) {
      fail(at + k, 'text inside a list before its first item');
    } else {
      items[items.length - 1] += ` ${line.trim()}`;
    }
  });
  return { ordered: ordered === true, start, items };
}

/** A cmd block is pasted into a Windows console: ASCII only, no tabs, no trailing space, no blank line. */
function checkCmd(body, at, fail) {
  if (body.length === 0) fail(at, 'an empty cmd block');
  body.forEach((l, k) => {
    if (l.trim() === '') fail(at + 1 + k, 'a blank line inside a cmd block');
    if (!/^[\x20-\x7e]*$/.test(l)) fail(at + 1 + k, 'a cmd block holds only plain ASCII (no tab, smart quote or dash): the console would garble it');
    if (/\s$/.test(l)) fail(at + 1 + k, 'a trailing space in a cmd block');
  });
}

const codeSpans = (text) => [...String(text).matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const placeholdersIn = (raw) => [...String(raw).matchAll(PLACEHOLDER)].map((m) => m[1]);

export function parseChecklist(markdown) {
  const lines = normalize(markdown).split('\n');
  const fail = (at, msg) => { throw new Error(`new-app checklist, line ${at + 1}: ${msg}`); };
  const intro = [];
  const sections = [];
  let title = null;
  let target = intro;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i += 1; continue; }

    let m = /^```(\S*)\s*$/.exec(line);
    if (m) {
      const at = i;
      const body = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) body.push(lines[i++]);
      if (i >= lines.length) fail(at, 'a code fence is never closed');
      i += 1;
      if (m[1] !== 'cmd') fail(at, `only cmd fences are supported (this one is "${m[1] || 'without a language'}")`);
      checkCmd(body, at, fail);
      target.push({ t: 'cmd', code: body.join('\n'), at });
      continue;
    }

    m = /^(#{1,6}) (\S.*?)\s*$/.exec(line);
    if (m) {
      const level = m[1].length;
      if (level === 1) {
        if (title !== null) fail(i, 'only one # heading');
        if (intro.length > 0 || sections.length > 0) fail(i, 'the # heading comes first');
        title = m[2];
      } else if (level === 2) {
        const sm = /^(\d+)\. (\S.*)$/.exec(m[2]);
        const section = sm
          ? { kind: 'step', n: Number(sm[1]), title: sm[2], blocks: [], at: i }
          : { kind: 'plain', n: null, title: m[2], blocks: [], at: i };
        sections.push(section);
        target = section.blocks;
      } else if (level === 3) {
        target.push({ t: 'h3', text: m[2], at: i });
      } else {
        fail(i, 'headings go down to ### only');
      }
      i += 1;
      continue;
    }

    if (/^-{3,}\s*$/.test(line)) { i += 1; continue; }

    const at = i;
    const kind = kindOf(line);
    const block = [line];
    i += 1;
    while (i < lines.length && !isBoundary(lines[i])) {
      const next = lines[i];
      const nextKind = kindOf(next);
      if (kind === 'para' && (/^(?:- |1\. )/.test(next) || nextKind === 'box' || nextKind === 'field')) break;
      if ((kind === 'list' || kind === 'box') && (nextKind === 'box' || nextKind === 'field')) break;
      if (kind === 'field' && nextKind !== 'field') break;
      block.push(next);
      i += 1;
    }

    if (kind === 'field') {
      block.forEach((l, k) => {
        const fm = FIELD_LINE.exec(l);
        if (!fm) fail(at + k, 'a field line reads: Field `<name>`: what to enter');
        target.push({ t: 'field', name: fm[1], label: fm[2].trim(), at: at + k });
      });
    } else if (kind === 'box') {
      const bm = /^(Expect|Stop if):\s*(.*)$/.exec(block[0]);
      const head = bm[2] ? [bm[2].trim()] : [];
      let k = 1;
      while (k < block.length && !startsList(block[k])) head.push(block[k++].trim());
      const list = parseItems(block.slice(k), at + k, fail);
      if (head.length === 0 && list.items.length === 0) fail(at, `${bm[1]}: has nothing after it`);
      target.push({ t: bm[1] === 'Expect' ? 'expect' : 'stop', head: head.join(' '), ordered: list.ordered, start: list.start, items: list.items, at });
    } else if (kind === 'list') {
      const list = parseItems(block, at, fail);
      target.push({ t: list.ordered ? 'ol' : 'ul', start: list.start, items: list.items, at });
    } else {
      if (block.some((l) => l.startsWith('|'))) fail(at, 'tables are not supported');
      target.push({ t: 'p', text: block.map((l) => l.trim()).join(' '), at });
    }
  }

  if (title === null) fail(0, 'the file needs one # heading');

  const allBlocks = [...intro, ...sections.flatMap((s) => s.blocks)];
  const textsOf = (b) => (b.t === 'p' ? [b.text] : b.t === 'ul' || b.t === 'ol' ? b.items : b.t === 'expect' || b.t === 'stop' ? [b.head, ...b.items] : []);

  for (const b of allBlocks) {
    for (const text of textsOf(b)) {
      if (/\]\((?!https:\/\/)/.test(text)) fail(b.at, 'links must be https:// addresses');
    }
  }

  const fields = [];
  for (const b of allBlocks) {
    if (b.t !== 'field') continue;
    if (fields.some((f) => f.name === b.name)) fail(b.at, `the field <${b.name}> is declared twice`);
    fields.push({ name: b.name, label: b.label, at: b.at });
  }
  const names = new Set(fields.map((f) => f.name));

  const used = new Set();
  for (const b of allBlocks) {
    if (b.t === 'cmd') {
      for (const name of placeholdersIn(b.code)) {
        if (!names.has(name)) fail(b.at, `<${name}> in a command has no Field line`);
        used.add(name);
      }
    }
    for (const text of textsOf(b)) for (const span of codeSpans(text)) for (const name of placeholdersIn(span)) if (names.has(name)) used.add(name);
  }
  for (const f of fields) if (!used.has(f.name)) fail(f.at, `the field <${f.name}> is never used in a command or a code span`);

  const steps = sections.filter((s) => s.kind === 'step');
  steps.forEach((s, k) => {
    if (s.n !== k + 1) fail(s.at, `steps are numbered 1, 2, 3 in order (found ${s.n} where ${k + 1} belongs)`);
    for (const [t, label] of [['expect', 'Expect:'], ['stop', 'Stop if:']]) {
      const n = s.blocks.filter((b) => b.t === t).length;
      if (n !== 1) fail(s.at, `step ${s.n} needs exactly one ${label} box (it has ${n})`);
    }
  });

  return { title, intro, sections, fields, steps, source: sourceHash(markdown) };
}

// ----------------------------------------------------------------------------------------------------------------- rendering

/** Raw text to HTML, with each declared <name> as a span the page script fills with the field's value. */
function withPlaceholders(raw, names) {
  let out = '';
  let last = 0;
  for (const m of String(raw).matchAll(PLACEHOLDER)) {
    if (!names.has(m[1])) continue;
    out += esc(raw.slice(last, m.index)) + `<span class="ph" data-ph="${m[1]}">&lt;${m[1]}&gt;</span>`;
    last = m.index + m[0].length;
  }
  return out + esc(raw.slice(last));
}

function inline(text, names) {
  const codes = [];
  let s = String(text).replace(/`([^`]+)`/g, (_, c) => { codes.push(c); return `\u0000${codes.length - 1}\u0000`; });
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (_, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, t) => `<strong>${t}</strong>`);
  s = s.replace(/(^|[\s(])\*([^*\s][^*]*?)\*(?=$|[\s).,;:!?])/g, (_, lead, t) => `${lead}<em>${t}</em>`);
  return s.replace(/\u0000(\d+)\u0000/g, (_, n) => `<code>${withPlaceholders(codes[Number(n)], names)}</code>`);
}

const list = (tag, items, names, attrs = '') => `<${tag}${attrs}>${items.map((it) => `<li>${inline(it, names)}</li>`).join('')}</${tag}>`;

function renderBlock(b, names, inIntro) {
  switch (b.t) {
    case 'p': {
      const italic = /^\*(?!\*)(.+)\*$/.exec(b.text);
      if (inIntro && italic) return `<p class="lede">${inline(italic[1], names)}</p>`;
      if (/^\*\*(?:(?!\*\*).)+\*\*$/.test(b.text)) return `<p class="warn">${inline(b.text, names)}</p>`;
      return `<p>${inline(b.text, names)}</p>`;
    }
    case 'ul': return list('ul', b.items, names, inIntro ? ' class="notes"' : '');
    case 'ol': return list('ol', b.items, names, b.start !== 1 ? ` start="${b.start}"` : '');
    case 'h3': return `<h3>${inline(b.text, names)}</h3>`;
    case 'cmd':
      return `<div class="cmd"><div class="cmd-head"><span class="cmd-label">cmd</span><button type="button" class="copy" aria-label="Copy command">Copy</button></div>`
        + `<pre class="cmd-body" tabindex="0" role="region" aria-label="Command"><code>${withPlaceholders(b.code, names)}</code></pre></div>`;
    case 'fields':
      return `<div class="fields">${b.fields.map((f) => `<div class="field"><label for="field-${f.name}"><span class="field-name">&lt;${f.name}&gt;</span> ${inline(f.label, new Set())}</label>`
        + `<input type="text" id="field-${f.name}" data-field="${f.name}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="field-${f.name}-error">`
        + `<p class="field-error" id="field-${f.name}-error" hidden>Only letters, digits, spaces and . _ - : / \\ are allowed here (the value goes into a command).</p></div>`).join('')}</div>`;
    case 'expect':
    case 'stop': {
      const label = b.t === 'expect' ? 'Expect' : 'Stop if';
      const body = (b.head ? `<p>${inline(b.head, names)}</p>` : '') + (b.items.length ? list(b.ordered ? 'ol' : 'ul', b.items, names, b.ordered && b.start !== 1 ? ` start="${b.start}"` : '') : '');
      return `<div class="box ${b.t === 'expect' ? 'expect' : 'stopif'}"><div class="box-label">${label}</div><div class="box-body">${body}</div></div>`;
    }
    default: throw new Error(`unknown block ${b.t}`);
  }
}

/** Consecutive Field lines become one group of inputs. */
function groupFields(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.t !== 'field') out.push(b);
    else if (out.length && out[out.length - 1].t === 'fields') out[out.length - 1].fields.push(b);
    else out.push({ t: 'fields', fields: [b] });
  }
  return out;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function renderSection(sec, names) {
  const body = groupFields(sec.blocks).map((b) => renderBlock(b, names, false)).join('\n');
  if (sec.kind === 'step') {
    return `<section class="step" id="step-${sec.n}" data-step="${sec.n}" aria-labelledby="step-${sec.n}-title">\n`
      + `<header class="step-head"><span class="step-num" aria-hidden="true">${sec.n}</span><h2 id="step-${sec.n}-title">${inline(sec.title, names)}</h2>`
      + `<label class="tick"><input type="checkbox" id="tick-${sec.n}" data-step="${sec.n}"><span>Step ${sec.n} done</span></label></header>\n`
      + `<div class="step-body">\n${body}\n</div>\n</section>`;
  }
  const id = slug(sec.title);
  return `<section class="plain" id="${id}" aria-labelledby="${id}-title">\n<h2 id="${id}-title">${inline(sec.title, names)}</h2>\n<div class="plain-body">\n${body}\n</div>\n</section>`;
}

// What the page script does is written as a function here, so Node checks its syntax when this file loads; its source is what the page
// carries. It runs in the page: it may use nothing from this file.
function checklistPage() {
  const KEY = 'new-app-checklist';
  const DOC_PATH = 'checklist/progress';
  // What a field may hold: it ends up inside a cmd command, so no & | < > ^ % quote or bracket gets through.
  const SAFE = /^[A-Za-z0-9 ._:\\/-]{0,200}$/;

  const main = document.querySelector('main');
  const source = (main && main.getAttribute('data-source')) || '';
  const tickEls = Array.from(document.querySelectorAll('input[data-step]'));
  const fieldEls = Array.from(document.querySelectorAll('input[data-field]'));
  const statusEl = document.getElementById('save-status');
  const liveEl = document.getElementById('live');
  const barEl = document.getElementById('progress');
  const countEl = document.getElementById('progress-text');
  const total = tickEls.length;

  const TEXT = {
    loading: 'Loading saved progress...',
    db: "Progress saves to this page's record, where Claude can read it.",
    local: 'Progress saves in this browser only. Publish the page for Claude to read it.',
    blocked: 'This browser blocks storage, so progress lasts only while this page is open.',
    slow: "Can't reach the saved progress yet. What you tick stays on this page and is saved once it answers.",
  };
  const say = (text) => { if (statusEl) statusEl.textContent = text; };
  const code = (e) => (e && e.code ? e.code : 'error');

  // The state: a tick per step and a value per field. Anything read from a store is untrusted: it is cleaned before it is used.
  const blank = () => {
    const s = { ticks: {}, fields: {} };
    tickEls.forEach((t) => { s.ticks[t.dataset.step] = false; });
    fieldEls.forEach((f) => { s.fields[f.dataset.field] = ''; });
    return s;
  };
  const clean = (raw) => {
    const s = blank();
    if (raw && typeof raw === 'object') {
      const rt = raw.ticks && typeof raw.ticks === 'object' ? raw.ticks : {};
      const rf = raw.fields && typeof raw.fields === 'object' ? raw.fields : {};
      Object.keys(s.ticks).forEach((k) => { s.ticks[k] = rt[k] === true; });
      Object.keys(s.fields).forEach((k) => { s.fields[k] = typeof rf[k] === 'string' && SAFE.test(rf[k]) ? rf[k] : ''; });
    }
    return s;
  };
  let state = blank();
  let dirty = { ticks: {}, fields: {} }; // keys changed here and not yet saved: they win over what a store delivers
  let saved = ''; // what the store last held
  const body = (s) => JSON.stringify({ ticks: s.ticks, fields: s.fields });

  // The state onto the page.
  function show() {
    tickEls.forEach((t) => {
      const on = state.ticks[t.dataset.step] === true;
      t.checked = on;
      const sec = document.getElementById('step-' + t.dataset.step);
      if (sec) sec.classList.toggle('done', on);
    });
    fieldEls.forEach((f) => {
      if (document.activeElement === f) return; // never rewrite the field being typed in
      f.value = state.fields[f.dataset.field] || '';
      f.setAttribute('aria-invalid', 'false');
      const err = document.getElementById('field-' + f.dataset.field + '-error');
      if (err) err.hidden = true;
    });
    document.querySelectorAll('.ph').forEach((el) => {
      const name = el.getAttribute('data-ph');
      const v = state.fields[name] || '';
      el.textContent = v || '<' + name + '>';
      el.classList.toggle('filled', v !== '');
    });
    const done = tickEls.filter((t) => t.checked).length;
    if (barEl) { barEl.max = total; barEl.value = done; }
    if (countEl) countEl.textContent = done === total ? 'All ' + total + ' steps done. The hand-off to the agents is next.' : done + ' of ' + total + ' steps done';
  }

  // Browser storage: every access in try/catch. It can be empty, blocked or throw (a private window, cleared site data).
  const readLocal = () => { try { const s = window.localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  const writeLocal = (payload) => { try { window.localStorage.setItem(KEY, JSON.stringify(payload)); return true; } catch (e) { return false; } };

  // What a store delivers becomes the state; the changes made here and not yet saved are kept on top of it.
  function adopt(remote) {
    saved = body(remote);
    Object.keys(dirty.ticks).forEach((k) => { remote.ticks[k] = state.ticks[k]; });
    Object.keys(dirty.fields).forEach((k) => { remote.fields[k] = state.fields[k]; });
    state = remote;
    show();
  }

  let store = { kind: 'none' };
  let storeReady = null;
  let timer = null;
  let writing = false;
  let again = false;

  // The artifact database: one document, read live and written whole, one write at a time and only when something changed. The store is
  // ready for writes once its first definitive answer has been adopted: a write before that would replace what is saved with a partial state.
  // A viewer who refuses the database, or whose grant is withdrawn, gets the browser's storage instead.
  const GONE = ['not_granted', 'capability_disabled', 'capability_removed', 'revoked'];
  function listen(ref) {
    return new Promise((resolve) => {
      let waiting = true;
      const ready = (s) => { if (waiting) { waiting = false; resolve(s || { kind: 'db', ref }); } };
      const slow = setTimeout(() => say(TEXT.slow), 10000);
      ref.onSnapshot((snap) => {
        const definitive = !snap.metadata || snap.metadata.fromCache === false;
        if (definitive) clearTimeout(slow);
        if (snap.metadata && snap.metadata.hasPendingWrites) return;
        adopt(clean(snap.exists ? snap.data() : null));
        if (!writing) say(TEXT.db);
        if (definitive) ready();
      }, (e) => {
        clearTimeout(slow);
        if (GONE.indexOf(code(e)) !== -1) {
          adopt(clean(readLocal()));
          say(TEXT.local);
          store = { kind: 'local' };
          ready(store);
          return;
        }
        say('The saved progress cannot be read (' + code(e) + '). What you tick stays on this page.');
        ready();
      });
    });
  }

  function decide() {
    const c = window.claude;
    if (!c || typeof c.use !== 'function') {
      adopt(clean(readLocal()));
      say(TEXT.local);
      return Promise.resolve({ kind: 'local' });
    }
    say(TEXT.loading);
    return Promise.resolve()
      .then(() => c.use('db'))
      .then((db) => {
        if (!db) throw new Error('no db');
        return listen(db.doc(DOC_PATH));
      })
      .catch(() => { adopt(clean(readLocal())); say(TEXT.local); return { kind: 'local' }; });
  }

  async function flush() {
    await storeReady;
    if (writing) { again = true; return; }
    writing = true;
    try {
      do {
        again = false;
        const now = body(state);
        if (now === saved) break;
        const payload = {
          v: 1,
          source,
          steps: total,
          done: tickEls.filter((t) => state.ticks[t.dataset.step] === true).length,
          ticks: Object.assign({}, state.ticks),
          fields: Object.assign({}, state.fields),
          updatedAt: new Date().toISOString(),
        };
        if (store.kind === 'db') {
          await store.ref.set(payload);
          say(TEXT.db);
        } else {
          say(writeLocal(payload) ? TEXT.local : TEXT.blocked);
        }
        saved = now;
        if (!again && body(state) === now) dirty = { ticks: {}, fields: {} };
      } while (again);
    } catch (e) {
      writeLocal({ ticks: state.ticks, fields: state.fields });
      say('Not saved (' + code(e) + '). It tries again at your next change.');
    } finally {
      writing = false;
    }
  }
  const changed = () => { clearTimeout(timer); timer = setTimeout(flush, 400); };

  tickEls.forEach((t) => t.addEventListener('change', () => {
    state.ticks[t.dataset.step] = t.checked;
    dirty.ticks[t.dataset.step] = true;
    show();
    changed();
  }));
  fieldEls.forEach((f) => f.addEventListener('input', () => {
    const name = f.dataset.field;
    const v = f.value.trim();
    const ok = SAFE.test(v);
    f.setAttribute('aria-invalid', ok ? 'false' : 'true');
    const err = document.getElementById('field-' + name + '-error');
    if (err) err.hidden = ok;
    if (!ok || state.fields[name] === v) return;
    state.fields[name] = v;
    dirty.fields[name] = true;
    show();
    changed();
  }));

  // Copy: the Clipboard API, and where it refuses, the text selected (and copied the old way where that works).
  const select = (el) => { try { const r = document.createRange(); r.selectNodeContents(el); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* nothing to select */ } };
  const selectAndCopy = (el) => { select(el); try { return document.execCommand('copy'); } catch (e) { return false; } };
  document.addEventListener('click', (ev) => {
    const btn = ev.target instanceof Element ? ev.target.closest('button.copy') : null;
    if (!btn) return;
    const codeEl = btn.closest('.cmd').querySelector('code');
    const text = codeEl.textContent;
    const open = Array.from(codeEl.querySelectorAll('.ph:not(.filled)')).map((p) => p.textContent);
    const done = (copied) => {
      const label = copied ? (open.length ? 'Copied (field empty)' : 'Copied') : 'Press Ctrl+C';
      btn.textContent = label;
      if (liveEl) liveEl.textContent = copied ? (open.length ? 'Copied. ' + open.join(', ') + ' is still empty: fill the field first.' : 'Copied.') : 'The command is selected: press Ctrl+C.';
      clearTimeout(btn.resetTimer);
      btn.resetTimer = setTimeout(() => { btn.textContent = 'Copy'; }, 2400);
    };
    let p = null;
    try { p = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : null; } catch (e) { p = null; }
    if (p) p.then(() => done(true), () => done(selectAndCopy(codeEl)));
    else done(selectAndCopy(codeEl));
  });

  // Starting another app: clear the ticks and fields, after a confirmation inside the page (the viewer shows no confirm dialog).
  const resetOpen = document.getElementById('reset-open');
  const resetBox = document.getElementById('reset-confirm');
  if (resetOpen && resetBox) {
    const closeReset = () => { resetBox.hidden = true; resetOpen.hidden = false; resetOpen.focus(); };
    resetOpen.addEventListener('click', () => { resetBox.hidden = false; resetOpen.hidden = true; document.getElementById('reset-yes').focus(); });
    document.getElementById('reset-no').addEventListener('click', closeReset);
    document.getElementById('reset-yes').addEventListener('click', () => {
      state = blank();
      Object.keys(state.ticks).forEach((k) => { dirty.ticks[k] = true; });
      Object.keys(state.fields).forEach((k) => { dirty.fields[k] = true; });
      fieldEls.forEach((f) => { f.value = ''; });
      show();
      changed();
      closeReset();
    });
  }

  // Leaving the page flushes a save still waiting for its pause.
  const leave = () => { clearTimeout(timer); flush(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leave(); });
  window.addEventListener('pagehide', leave);

  show();
  storeReady = decide().then((s) => { store = s; return s; });
}

// The starter's design tokens, light and dark (src/styles/tokens.css at this build), and the page's own rules, which use tokens only.
const PAGE_CSS = `
:root {
  --base: #f5f6f8;
  --surface: #ffffff;
  --surface-raised: #eef0f3;
  --border-subtle: #eaedf1;
  --border: #dbdfe5;
  --border-strong: #bcc3cd;
  --text-primary: #121821;
  --text-secondary: #475162;
  --text-muted: #687384;
  --accent: #2453bd;
  --accent-muted: rgba(36, 83, 189, 0.09);
  --on-accent: #ffffff;
  --error: #c0302f;
  --error-muted: rgba(192, 48, 47, 0.08);
  --success: #1b7444;
  --success-muted: rgba(27, 116, 68, 0.09);
  --warning: #9a5800;
  --warning-muted: rgba(154, 88, 0, 0.09);
  --fs-xs: 12px;
  --fs-sm: 13px;
  --fs-base: 15px;
  --fs-lg: 17px;
  --fs-xl: 21px;
  --fs-2xl: 27px;
  --radius-sm: 6px;
  --radius-md: 9px;
  --radius-lg: 14px;
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, "Cascadia Mono", "JetBrains Mono", Consolas, Menlo, "Liberation Mono", monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --base: #0c0f14;
    --surface: #12161c;
    --surface-raised: #1a1f27;
    --border-subtle: #1b2029;
    --border: #252c37;
    --border-strong: #374150;
    --text-primary: #edf0f4;
    --text-secondary: #a7b0bd;
    --text-muted: #7f8997;
    --accent: #7ea3f2;
    --accent-muted: rgba(126, 163, 242, 0.13);
    --on-accent: #0b1220;
    --error: #ef7d7a;
    --error-muted: rgba(239, 125, 122, 0.12);
    --success: #5fcb8d;
    --success-muted: rgba(95, 203, 141, 0.12);
    --warning: #e1a446;
    --warning-muted: rgba(225, 164, 70, 0.12);
    color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --base: #0c0f14;
  --surface: #12161c;
  --surface-raised: #1a1f27;
  --border-subtle: #1b2029;
  --border: #252c37;
  --border-strong: #374150;
  --text-primary: #edf0f4;
  --text-secondary: #a7b0bd;
  --text-muted: #7f8997;
  --accent: #7ea3f2;
  --accent-muted: rgba(126, 163, 242, 0.13);
  --on-accent: #0b1220;
  --error: #ef7d7a;
  --error-muted: rgba(239, 125, 122, 0.12);
  --success: #5fcb8d;
  --success-muted: rgba(95, 203, 141, 0.12);
  --warning: #e1a446;
  --warning-muted: rgba(225, 164, 70, 0.12);
  color-scheme: dark;
}

*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
html { -webkit-text-size-adjust: 100%; padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); }
body {
  margin: 0;
  background: var(--base);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: var(--fs-base);
  line-height: 1.55;
  padding-block: 28px 72px;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.page { max-width: 760px; margin: 0 auto; display: grid; gap: 20px; }
.page > *, .top > * { min-width: 0; }
.top { display: grid; gap: 12px; }
h1 { margin: 0; font-size: var(--fs-2xl); line-height: 1.2; letter-spacing: -0.01em; text-wrap: balance; }
h2 { margin: 0; font-size: var(--fs-xl); line-height: 1.25; text-wrap: balance; }
h3 { margin: 4px 0 0; font-size: var(--fs-lg); line-height: 1.3; }
p { margin: 0; }
ul, ol { margin: 0; padding-left: 1.3em; display: grid; gap: 6px; }
li { min-width: 0; }
a { color: var(--accent); text-underline-offset: 2px; }
strong { font-weight: 650; }
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--surface-raised);
  border: 1px solid var(--border-subtle);
  border-radius: 5px;
  padding: 1px 5px;
  overflow-wrap: anywhere;
}
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.lede { color: var(--text-secondary); }
.notes { color: var(--text-secondary); }
.warn { padding: 12px 14px; border: 1px solid var(--warning); border-radius: var(--radius-md); background: var(--warning-muted); }

.progress { display: grid; gap: 8px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.progress-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
progress { flex: 1 1 160px; min-width: 0; height: 10px; accent-color: var(--accent); }
.progress-text { font-weight: 600; font-variant-numeric: tabular-nums; }
.status { font-size: var(--fs-sm); color: var(--text-muted); }

.step, .plain { display: grid; gap: 14px; padding: 18px 18px 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); }
.step > *, .plain > * { min-width: 0; }
.step.done { border-color: var(--success); }
.step-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.step-num {
  flex: none; display: grid; place-items: center; width: 32px; height: 32px;
  border-radius: var(--radius-sm); background: var(--accent-muted); color: var(--accent);
  font: 700 var(--fs-base)/1 var(--font-mono);
}
.step.done .step-num { background: var(--success-muted); color: var(--success); }
.step-head h2 { flex: 1 1 14rem; min-width: 0; }
.tick { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; font-weight: 600; cursor: pointer; }
.tick input { width: 22px; height: 22px; margin: 0; accent-color: var(--accent); }
.step-body, .plain-body { display: grid; gap: 12px; }
.step-body > *, .plain-body > * { min-width: 0; }

.cmd { min-width: 0; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-raised); }
.cmd-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 8px 6px 12px; border-bottom: 1px solid var(--border); }
.cmd-label { font: 700 var(--fs-xs)/1 var(--font-mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted); }
.copy, .btn {
  min-height: 32px; padding: 0 14px; max-width: 100%;
  font: 600 var(--fs-sm)/1.2 var(--font-sans);
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--accent); cursor: pointer;
}
.copy:hover, .btn:hover { background: var(--accent-muted); }
.cmd-body { margin: 0; padding: 12px 14px; overflow-x: auto; font: var(--fs-sm)/1.65 var(--font-mono); white-space: pre; tab-size: 4; }
.cmd-body code { padding: 0; border: 0; background: none; font: inherit; overflow-wrap: normal; }
.ph { color: var(--warning); font-weight: 700; }
.ph.filled { color: var(--success); }

.box { display: grid; gap: 6px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); }
.box-label { font: 700 var(--fs-xs)/1 var(--font-sans); letter-spacing: 0.08em; text-transform: uppercase; }
.box-body { display: grid; gap: 6px; min-width: 0; }
.expect { background: var(--success-muted); }
.expect .box-label { color: var(--success); }
.stopif { background: var(--error-muted); }
.stopif .box-label { color: var(--error); }

.fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 12px; padding: 12px 14px; border: 1px dashed var(--border-strong); border-radius: var(--radius-md); }
.field { display: grid; gap: 4px; align-content: start; min-width: 0; }
.field label { font-size: var(--fs-sm); color: var(--text-secondary); }
.field-name { font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); }
.field input {
  width: 100%; min-width: 0; padding: 9px 12px;
  font: inherit; font-size: max(16px, var(--fs-base));
  border: 1px solid var(--border-strong); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--text-primary);
}
.field input[aria-invalid="true"] { border-color: var(--error); }
.field-error { font-size: var(--fs-sm); color: var(--error); }

.reset { display: grid; gap: 8px; justify-items: start; }
.reset > * { min-width: 0; }
.link-button { padding: 4px 0; font: inherit; font-size: var(--fs-sm); color: var(--text-muted); background: none; border: 0; text-decoration: underline; cursor: pointer; }
.reset-confirm { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.btn.danger { color: var(--error); border-color: var(--error); }
.foot { font-size: var(--fs-xs); color: var(--text-muted); }
`;

/** The whole page as one HTML text. Pure: the same markdown always gives the same text, line endings included. */
export function renderPage(markdown) {
  const doc = parseChecklist(markdown);
  const names = new Set(doc.fields.map((f) => f.name));
  const header = groupFields(doc.intro).map((b) => renderBlock(b, names, true)).join('\n');
  const total = doc.steps.length;
  const script = `(${checklistPage.toString()})();`;
  if (script.includes('</script')) throw new Error('the page script holds a closing script tag');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(doc.title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="claude:viewport-fit-sides" content="cover">
<!-- Generated by scripts/build-checklist-page.mjs from docs/new-app-checklist.md (source ${doc.source}). Do not edit this file: edit the markdown and run the script. scripts/build-checklist-page.test.mjs fails when this file is not that markdown rendered. -->
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="page">
<header class="top">
<h1>${esc(doc.title)}</h1>
${header}
</header>
<div class="progress" role="group" aria-label="Progress">
<div class="progress-row"><progress id="progress" max="${total}" value="0">0 of ${total}</progress><span class="progress-text" id="progress-text">0 of ${total} steps done</span></div>
<p class="status" id="save-status" role="status">Progress saves automatically.</p>
<noscript><p class="status">Copy buttons, fields and saved progress need JavaScript. The commands below can still be selected and copied by hand.</p></noscript>
</div>
<main data-source="${doc.source}">
${doc.sections.map((s) => renderSection(s, names)).join('\n')}
</main>
<section class="reset" aria-label="Starting another app">
<button type="button" class="link-button" id="reset-open">Starting another app? Clear the ticks and fields</button>
<div class="reset-confirm" id="reset-confirm" hidden>
<span>This clears all ${total} ticks and every field.</span>
<button type="button" class="btn danger" id="reset-yes">Clear everything</button>
<button type="button" class="btn" id="reset-no">Keep them</button>
</div>
</section>
<p class="foot">Built from <code>docs/new-app-checklist.md</code> (source ${doc.source}). Edit the markdown, then run <code>node scripts/build-checklist-page.mjs</code>.</p>
<p class="sr-only" id="live" role="status" aria-live="polite"></p>
</div>
<script>
${script}
</script>
</body>
</html>
`;
  return normalize(html);
}

// ---------------------------------------------------------------------------------------------------------------------- CLI

function main(argv) {
  const args = argv.slice(2);
  const check = args.includes('--check');
  const [mdPath = DEFAULT_MD, htmlPath = DEFAULT_HTML] = args.filter((a) => a !== '--check');
  let markdown;
  try { markdown = readFileSync(mdPath, 'utf8'); } catch (e) {
    console.error(`build-checklist-page: cannot read ${mdPath} (${e.code || e.message}).`);
    return 2;
  }
  let html;
  try { html = renderPage(markdown); } catch (e) {
    console.error(`build-checklist-page: ${e.message}`);
    return 1;
  }
  if (check) {
    let onDisk = null;
    try { onDisk = normalize(readFileSync(htmlPath, 'utf8')); } catch { /* missing counts as stale */ }
    if (onDisk !== html) {
      console.error(`build-checklist-page: ${htmlPath} is not ${mdPath} rendered. Run: node scripts/build-checklist-page.mjs`);
      return 1;
    }
    console.log(`build-checklist-page: ${htmlPath} is up to date (source ${sourceHash(markdown)}).`);
    return 0;
  }
  writeFileSync(htmlPath, html);
  const doc = parseChecklist(markdown);
  const commands = [...doc.intro, ...doc.sections.flatMap((s) => s.blocks)].filter((b) => b.t === 'cmd').length;
  console.log(`build-checklist-page: wrote ${htmlPath}: ${doc.steps.length} steps, ${commands} commands, ${doc.fields.length} fields, source ${doc.source}.`);
  return 0;
}

// Run only as a script (the tests import the functions above).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv));
