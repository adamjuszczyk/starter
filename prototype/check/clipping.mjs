// Lifted from Overload's prototype/check/clipping.mjs. Opens the page, goes through every DEMO state in both themes
// and at both widths, and reports any element that cuts off its own content, any squeezed flex child, and any
// sideways scroll of the page itself. Screenshots each state (light theme) for the chat to look at.
import { createRequire } from 'node:module'
const req = createRequire(import.meta.url)
const { chromium } = (() => { try { return req('playwright') } catch { return req(process.env.PLAYWRIGHT_PATH ?? '/opt/npm-tools/node_modules/playwright/index.js') } })()
import fs from 'node:fs'
const [, , pagePath, outDir = 'check/shots'] = process.argv
fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const WIDTHS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } }

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

let total = 0
const errors = []
for (const [wname, viewport] of Object.entries(WIDTHS)) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('file://' + pagePath)
  await page.waitForTimeout(400)
  for (const theme of ['light', 'dark']) {
    await page.getByText('DEMO', { exact: true }).click()
    await page.locator(`[data-demo-theme="${theme}"]`).click()
    const count = await page.locator('[data-demo-state]').count()
    await page.locator('[aria-label="Close"]').click()
    for (let i = 0; i < count; i++) {
      await page.getByText('DEMO', { exact: true }).click()
      const chip = page.locator('[data-demo-state]').nth(i)
      const name = await chip.getAttribute('data-demo-state')
      await chip.click()
      await page.waitForTimeout(250)
      const clipped = await page.evaluate(findClipped)
      const slug = name.replace(/[^a-z0-9]+/gi, '_')
      if (theme === 'light' || i % 4 === 0) await page.screenshot({ path: `${outDir}/${wname}-${theme}-${String(i).padStart(2, '0')}-${slug}.png`, fullPage: false })
      if (clipped.length) { total += clipped.length; console.log(`CLIPPED [${wname} ${theme}] ${name}\n  ` + clipped.join('\n  ')) }
    }
  }
  await page.close()
}
console.log(errors.length ? 'PAGE ERRORS\n  ' + errors.slice(0, 5).join('\n  ') : 'no page errors')
console.log(total === 0 ? 'NO CLIPPING FOUND' : `${total} clipped elements`)
await browser.close()
process.exit(total === 0 && errors.length === 0 ? 0 : 1)
