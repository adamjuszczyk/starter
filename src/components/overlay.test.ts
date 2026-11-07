// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { isTopOverlay, lockPageScroll, overlayMarker } from './overlay'

// The overlay module on its own (what Panel, ConfirmDialog and Toast share, TASKS.md Decided 6): the marker, the counted scroll lock, and which
// overlay is the top one. The components' tests prove each of them where it is used; this pins the module's own contract.

afterEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
})

describe('overlayMarker', () => {
  it('is the data-overlay attribute with the overlay\'s kind as its value', () => {
    expect(overlayMarker('panel')).toEqual({ 'data-overlay': 'panel' })
    expect(overlayMarker('dialog')).toEqual({ 'data-overlay': 'dialog' })
    expect(overlayMarker('toast')).toEqual({ 'data-overlay': 'toast' })
  })
})

describe('lockPageScroll', () => {
  it('locks the page and gives it its own overflow back when the release is called', () => {
    document.body.style.overflow = 'auto'
    const release = lockPageScroll()
    expect(document.body.style.overflow).toBe('hidden')
    release()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('is one lock for locks stacked on each other: the page is released by the last release, not the first', () => {
    document.body.style.overflow = 'scroll'
    const first = lockPageScroll()
    const second = lockPageScroll()
    first()
    expect(document.body.style.overflow).toBe('hidden')
    second()
    expect(document.body.style.overflow).toBe('scroll')
  })

  it('a release called twice releases once: it cannot take another overlay\'s lock away', () => {
    const first = lockPageScroll()
    const second = lockPageScroll()
    first()
    first()
    expect(document.body.style.overflow).toBe('hidden')
    second()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('isTopOverlay', () => {
  function draw(...kinds: Array<'panel' | 'dialog' | 'toast'>) {
    return kinds.map((kind) => {
      const el = document.createElement('div')
      el.setAttribute('data-overlay', kind)
      document.body.appendChild(el)
      return el
    })
  }

  it('the one drawn last is the top one, the others are not', () => {
    const [panel, dialog] = draw('panel', 'dialog')
    expect(isTopOverlay(dialog)).toBe(true)
    expect(isTopOverlay(panel)).toBe(false)
  })

  it('a toast is never the top one and never takes it from the overlay under it', () => {
    const [panel, dialog, toast] = draw('panel', 'dialog', 'toast')
    expect(isTopOverlay(toast)).toBe(false)
    expect(isTopOverlay(dialog)).toBe(true)
    expect(isTopOverlay(panel)).toBe(false)
  })

  it('goes back to the one under when the top one is gone', () => {
    const [panel, dialog] = draw('panel', 'dialog')
    dialog.remove()
    expect(isTopOverlay(panel)).toBe(true)
  })
})
