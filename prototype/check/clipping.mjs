// Lifted from Overload's prototype/check/clipping.mjs, by way of the starter's prototype. Opens the built page in a real browser (jsdom has no
// layout: LEARNINGS L1) and goes through every DEMO state, at phone width (390 px) and desktop width (1280 px), in both themes. It reports
//   - a page error, or a request for anything that is not part of the page (the kit never reaches a network);
//   - any element that cuts off its own content, any squeezed flex child, and any sideways scroll of the page (check/clipped.mjs);
//   - any state whose expectation does not hold once it is applied (TASKS.md Decided 46): every DEMO state carries one, a text or a selector,
//     so twenty states cannot all draw the same screen and pass. The three sign-in states that are the real page's own are driven here: the
//     fields are filled and the button pressed, and the kit's fake sign-in ends as the state says;
//   - a PHONE FRAME pass: at the 1280 px window with WIDTH → PHONE FRAME on, the box of every panel, dialog and toast must lie inside the frame's
//     box (SPEC item 3, Decided 6: overlays are drawn into the frame, not the window).
// It screenshots every state in both themes (light and dark) at both widths: 80 pictures, the kit's side of the release comparison, and the
// first thing to look at before a page is published (jsdom, and this check, see boxes and text, never taste). Exit code 0 only when all of it is clean.
//
//   node check/clipping.mjs <absolute path of the page> [folder for the screenshots]        (bash check/run.sh builds the page first)
import { createRequire } from 'node:module'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { findClipped } from './clipped.mjs'

// The environment's Playwright (TASKS.md Decided 5: the repo has no dependency on it). `require` finds it where the environment puts it (a
// cloud session has it, with Chromium); anywhere else PLAYWRIGHT_PATH names its index.js, after `npx playwright install chromium` once.
const req = createRequire(import.meta.url)
const { chromium } = (() => {
  try {
    return req('playwright')
  } catch {
    return req(process.env.PLAYWRIGHT_PATH ?? '/opt/node-tools/node_modules/playwright/index.js')
  }
})()

const [, , pagePath, outDir = 'check/shots'] = process.argv
if (!pagePath) {
  console.error('usage: node check/clipping.mjs <absolute path of the built page> [folder for the screenshots]')
  process.exit(2)
}
fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()

const WIDTHS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } }
const THEMES = ['light', 'dark']
const STATES = 20 // how many states the DEMO menu lists. A state with no row is a missing state: an app that adds states changes this number.
const SETTLE_MS = 250 // after a state is applied and its expectation holds, before it is measured and photographed (transitions, scroll)
const EXPECT_MS = 5000 // how long a state's expectation has to come true (a state's list answers 30 ms after it is applied)
const INSIDE_PX = 1 // the box of an overlay may stick out of the frame's by this much (rounding)

const failures = [] // everything that is not clean, printed at the end
const clipped = []
let visits = 0
let expectsMet = 0
let shots = 0
const overlaysSeen = { panel: 0, dialog: 0, toast: 0 }

const firstLine = (text) => String(text).split('\n')[0].slice(0, 220)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const slug = (name) => name.replace(/[^a-z0-9]+/gi, '_')
const describe = (e) => (e ? JSON.stringify(e) : 'no expectation')

async function until(test, ms) {
  const end = Date.now() + ms
  for (;;) {
    if (await test()) return true
    if (Date.now() > end) return false
    await wait(50)
  }
}

const openMenu = (page) => page.locator('[data-demo-button]').click()
const closeMenu = (page) => page.locator('[data-demo-close]').click()

// A browser context as the app is meant to be seen: Warsaw time (the build line shows the device's time), Polish, a window of this width.
async function newPage(browser, viewport, where) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, timezoneId: 'Europe/Warsaw', locale: 'pl-PL' })
  const page = await context.newPage()
  page.setDefaultTimeout(10_000)
  page.on('pageerror', (e) => failures.push(`PAGE ERROR [${where}] ${firstLine(e)}`))
  page.on('console', (m) => {
    if (m.type() === 'error') failures.push(`CONSOLE ERROR [${where}] ${firstLine(m.text())}`)
  })
  // The page is one file with everything inline. A request for anything else is the kit reaching for a network (a server, a font host).
  page.on('request', (r) => {
    if (!/^(file|data|blob|about):/.test(r.url())) failures.push(`NETWORK [${where}] the page asked for ${r.url().slice(0, 100)}`)
  })
  await page.goto(pathToFileURL(pagePath).href)
  // The DEMO button is drawn once the app has started: no button means the page died while loading (its error is reported above).
  await wait(400)
  if ((await page.locator('[data-demo-button]').count()) === 0) {
    failures.push(`NO PAGE [${where}] the page did not start: there is no DEMO button`)
    await context.close()
    return null
  }
  return { context, page }
}

// The states as the menu lists them, with what each carries: its name, its expectation (JSON in `data-demo-expect`) and how the check drives it.
async function readStates(page, where) {
  await openMenu(page)
  const rows = await page.locator('[data-demo-state]').evaluateAll((els) =>
    els.map((el) => ({ name: el.getAttribute('data-demo-state'), expect: el.getAttribute('data-demo-expect'), drive: el.getAttribute('data-demo-drive') })),
  )
  await closeMenu(page)
  const states = rows.map((row) => {
    let expect = null
    try {
      const parsed = JSON.parse(row.expect ?? 'null')
      if (parsed && ((typeof parsed.selector === 'string' && parsed.selector) || (typeof parsed.text === 'string' && parsed.text))) expect = parsed
    } catch {
      // not JSON: no expectation
    }
    return { name: row.name, expect, drive: row.drive }
  })
  if (states.length !== STATES) failures.push(`DEMO MENU [${where}] lists ${states.length} states, not ${STATES}`)
  for (const s of states) if (!s.expect) failures.push(`DEMO MENU [${where}] "${s.name}" has no expectation (data-demo-expect)`)
  return states
}

// Whether a state's expectation holds right now: a visible element with the text, or visible elements matching the selector (holding the text,
// and exactly `count` of them when a count is given).
async function holds(page, exp) {
  const locator = exp.selector ? page.locator(exp.selector) : page.getByText(exp.text)
  const filtered = exp.selector && exp.text ? locator.filter({ hasText: exp.text }) : locator
  const visibleCount = () =>
    filtered.evaluateAll((els) =>
      els.filter((el) => {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
      }).length,
    )
  return until(async () => {
    const n = await visibleCount()
    return exp.count === undefined ? n > 0 : n === exp.count
  }, EXPECT_MS)
}

// The sign-in states belong to the real page, so the check does what a person does: types in the two fields and, for the three that are an outcome
// (wrong password, offline, signing in), presses the button. The kit's fake sign-in then rejects, or stays pending, as the state says.
async function drive(page, how) {
  await page.locator('#email').fill('anna@firma.pl')
  await page.locator('#password').fill('haslo-przyklad')
  if (how === 'submit') await page.locator('form button[type="submit"]').click()
  // The last field typed in keeps the focus (and its accent border) otherwise; the picture is of the page, not of a cursor in it.
  else await page.locator('#password').blur()
}

async function apply(page, index, state) {
  await openMenu(page)
  await page.locator('[data-demo-state]').nth(index).click()
  if (state.drive) await drive(page, state.drive)
  // Park the pointer in the corner: where the chip (or the button) was, a row or a control under it would be photographed with its hover.
  await page.mouse.move(0, 0)
}

async function setting(page, attribute, value) {
  await openMenu(page)
  await page.locator(`[data-demo-${attribute}="${value}"]`).click()
  await closeMenu(page)
}

for (const [wname, viewport] of Object.entries(WIDTHS)) {
  const started = await newPage(browser, viewport, wname)
  if (!started) continue
  const { context, page } = started
  const states = await readStates(page, wname)
  for (const theme of THEMES) {
    await setting(page, 'theme', theme)
    // Light goes through the states in the menu's order, dark in the reverse order: a state is reached from a different state each time, so
    // one that only works after the state before it (a screen that kept what the last one left, a list that never heard its data arrive) is found.
    const order = states.map((_, i) => i)
    if (theme === 'dark') order.reverse()
    for (const i of order) {
      const state = states[i]
      const where = `${wname} ${theme}`
      visits += 1
      try {
        await apply(page, i, state)
        if (state.expect && (await holds(page, state.expect))) expectsMet += 1
        else failures.push(`EXPECT [${where}] "${state.name}": ${describe(state.expect)} does not hold within ${EXPECT_MS / 1000} s`)
        await wait(SETTLE_MS)
        const found = await page.evaluate(findClipped)
        if (found.length) {
          clipped.push(...found)
          console.log(`CLIPPED [${where}] ${state.name}\n  ` + found.join('\n  '))
        }
        await page.screenshot({ path: `${outDir}/${wname}-${theme}-${String(i).padStart(2, '0')}-${slug(state.name)}.png`, fullPage: false })
        shots += 1
      } catch (error) {
        failures.push(`STATE [${where}] "${state.name}": ${firstLine(error)}`)
      }
    }
  }
  await context.close()
}

// ─── PHONE FRAME ────────────────────────────────────────────────────────────────────────────────────────────────────
// At the 1280 px window with WIDTH → PHONE FRAME on, the app is a 390 px box in the middle of the window. A panel, a dialog and a toast are
// drawn into that box's overlay root (it carries `transform: translateZ(0)`, which makes it the containing block of a fixed child); drawn into
// the page instead they would cover the whole window. So for every state that has an overlay, its box must lie inside the frame's box.
let framePass = 0
{
  const started = await newPage(browser, WIDTHS.desktop, 'phone frame')
  if (started) {
    const { context, page } = started
    const states = await readStates(page, 'phone frame')
    await setting(page, 'frame', 'phone')
    for (const [i, state] of states.entries()) {
      if (state.drive) continue // the sign-in states have no overlay
      try {
        await apply(page, i, state)
        if (state.expect) await holds(page, state.expect)
        await wait(SETTLE_MS)
        const seen = await page.evaluate(() => {
          const frame = document.querySelector('[data-layout]')
          const box = (el) => {
            const r = el.getBoundingClientRect()
            return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
          }
          return {
            layout: frame?.getAttribute('data-layout') ?? null,
            frame: frame ? box(frame) : null,
            overlays: [...document.querySelectorAll('[data-overlay]')].map((el) => ({ kind: el.getAttribute('data-overlay'), ...box(el) })),
          }
        })
        if (seen.overlays.length === 0) continue
        if (!seen.frame || seen.layout !== 'phone') failures.push(`PHONE FRAME "${state.name}": the app's frame measured ${seen.layout}, not phone`)
        for (const o of seen.overlays) {
          const f = seen.frame
          const inside = f && o.left >= f.left - INSIDE_PX && o.right <= f.right + INSIDE_PX && o.top >= f.top - INSIDE_PX && o.bottom <= f.bottom + INSIDE_PX
          const at = (b) => `${Math.round(b.left)},${Math.round(b.top)} to ${Math.round(b.right)},${Math.round(b.bottom)}`
          if (inside) {
            framePass += 1
            if (o.kind in overlaysSeen) overlaysSeen[o.kind] += 1
          } else failures.push(`PHONE FRAME "${state.name}": the ${o.kind}'s box (${at(o)}) is not inside the frame's (${f ? at(f) : 'none'})`)
        }
      } catch (error) {
        failures.push(`PHONE FRAME "${state.name}": ${firstLine(error)}`)
      }
    }
    for (const kind of Object.keys(overlaysSeen)) if (overlaysSeen[kind] === 0) failures.push(`PHONE FRAME: no ${kind} was seen inside the frame, so none was checked`)
    await context.close()
  }
}

await browser.close()

// ─── The report ─────────────────────────────────────────────────────────────────────────────────────────────────────
const errors = failures.filter((f) => /^(PAGE ERROR|CONSOLE ERROR|NETWORK|NO PAGE)/.test(f))
const rest = failures.filter((f) => !errors.includes(f))
if (rest.length) console.log(rest.join('\n'))
console.log(errors.length ? 'PAGE ERRORS\n  ' + [...new Set(errors)].slice(0, 6).join('\n  ') : 'no page errors')
console.log(
  failures.some((f) => f.startsWith('DEMO MENU')) ? 'DEMO MENU: states or expectations missing (above)' : `DEMO menu: ${STATES} states, every one has an expect`,
)
console.log(`every state's expect met: ${expectsMet} of ${visits} visits (${Object.keys(WIDTHS).length} widths x ${THEMES.length} themes x ${STATES} states)`)
console.log(`PHONE FRAME: ${framePass} overlay boxes inside the frame (${overlaysSeen.panel} panel, ${overlaysSeen.dialog} dialog, ${overlaysSeen.toast} toast)`)
console.log(`${shots} screenshots in ${outDir}`)
console.log(clipped.length === 0 ? 'NO CLIPPING FOUND' : `${clipped.length} clipped elements`)
process.exit(failures.length === 0 && clipped.length === 0 && expectsMet === visits && visits === Object.keys(WIDTHS).length * THEMES.length * STATES ? 0 : 1)
