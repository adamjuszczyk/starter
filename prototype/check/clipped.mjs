// Lifted from Overload's prototype/check/clipping.mjs (twenty lines, now a module of their own: check/clipping.mjs imports it, and a script that
// needs the same check copies it with this file named: TASKS.md Decided 44).
//
// The function Playwright runs INSIDE the page (`page.evaluate(findClipped)`), so it holds no reference to anything outside itself: it is sent as
// text. It reports, for the page as it stands: any sideways scroll of the page itself; any element that clips its own content (overflow hidden
// or clip, with more inside than its box shows: a card that cuts a row off); and any flex child of a column that has been squeezed below its
// content. Not reported: the DEMO menu, an element with display none, and screen-reader-only text (`sr-only` is clipped on purpose: SPEC item 3).
// An element that scrolls by design (`overflow: auto` or `scroll`) is not a clip; a long text may be cut by `truncate` on purpose.
// What it returns is the first six findings, each a line that names the element, its box and its content.
export const findClipped = () => {
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
