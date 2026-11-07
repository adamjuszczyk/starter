// @vitest-environment jsdom
import { StrictMode, useState } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Panel } from './Panel'
import type { PanelProps } from './Panel'
import { renderInFrame, resizeFrame } from '../testing/frame'

// Overload's BottomSheet.test.tsx (35 tests), adapted: the panel is drawn into the frame's overlay root and not into the body (TASKS.md,
// Decided 6), so every test mounts it inside a frame (src/testing/frame.tsx), at the desktop's width unless the test says 390; the sheet's
// inline style values are token classes, so what was a style value is a class; the words are the starter's. New: the panel draws nothing
// outside a frame, the phone's and the desktop's shapes carry the same parts in the same order, and the content survives a change of shape.

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})

const EYEBROW = 'Klient'
const TITLE = 'Piekarnia Pod Wawelem'
const CTA = 'Zapisz'
const CLOSE = 'Zamknij'
const PHONE = 390

/** A panel with the words it needs given, so a test says only what it is about. */
function TestPanel({ title = 'Panel', onClose = () => {}, children = <p>treść</p>, ...rest }: Partial<PanelProps>) {
  return (
    <Panel title={title} onClose={onClose} closeLabel={CLOSE} {...rest}>
      {children}
    </Panel>
  )
}

// What the screen shows behind a panel: the page, covered by the scrim.
function PageBehind() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 px-4 py-5">
      <span className="font-display text-2xl font-bold text-ink">Klienci</span>
      <div className="h-14 rounded-lg border border-wire bg-surface" />
      <div className="h-56 rounded-lg border border-wire bg-surface" />
    </div>
  )
}

const rowClasses = 'flex h-12 items-center rounded-md border border-wire px-3 font-semibold text-ink'

function Framed({ onClose = () => {} }: { onClose?: () => void }) {
  return (
    <>
      <PageBehind />
      <TestPanel
        eyebrow={EYEBROW}
        title={TITLE}
        onClose={onClose}
        footer={
          <button type="button" className="h-11 rounded-md bg-accent text-on-accent">
            {CTA}
          </button>
        }
      >
        <div className={rowClasses}>Pierwszy</div>
        <div className={rowClasses}>Drugi</div>
      </TestPanel>
    </>
  )
}

/** An opener button and a panel that is mounted while open, the way every screen uses it. */
function Harness({ children }: { children?: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Otwórz
      </button>
      {open && <TestPanel title="Panel z przyciskiem" onClose={() => setOpen(false)}>{children ?? <button type="button">W środku</button>}</TestPanel>}
    </>
  )
}

function openHarness(children?: ReactNode, width = PHONE) {
  renderInFrame(<Harness>{children}</Harness>, { width })
  const opener = screen.getByRole('button', { name: 'Otwórz' })
  opener.focus()
  fireEvent.click(opener)
  return opener
}

const scrim = () => document.querySelector('[data-overlay-scrim]') as HTMLElement
const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
const classesOf = (el: Element) => el.className.split(' ')

/** Presses a key on whatever has focus; false when something called preventDefault. */
function press(key: string, init: KeyboardEventInit = {}): boolean {
  return fireEvent.keyDown(document.activeElement ?? document.body, { key, ...init })
}

describe('Panel: the frame', () => {
  it('draws the phone\'s frame: handle, eyebrow, title, the ×, the content, then the footer', () => {
    renderInFrame(<Framed />, { width: PHONE })
    const dialog = screen.getByRole('dialog', { name: TITLE })
    const handle = dialog.firstElementChild as HTMLElement
    expect(handle.getAttribute('aria-hidden')).toBe('true')
    const parts = [
      handle,
      within(dialog).getByText(EYEBROW),
      within(dialog).getByRole('heading', { level: 2, name: TITLE }),
      within(dialog).getByRole('button', { name: CLOSE }),
      within(dialog).getByText('Pierwszy'),
      within(dialog).getByText('Drugi'),
      within(dialog).getByRole('button', { name: CTA }),
    ]
    for (let i = 1; i < parts.length; i++) expect(follows(parts[i - 1], parts[i])).toBe(true)
  })

  it('shows nothing for an eyebrow or a footer that is not given', () => {
    renderInFrame(
      <TestPanel title="Nowy klient">
        <p>treść</p>
      </TestPanel>,
      { width: PHONE },
    )
    const dialog = screen.getByRole('dialog', { name: 'Nowy klient' })
    // the handle, the header and the content; no footer region
    expect(dialog.children).toHaveLength(3)
    // the heading block holds the title alone: no empty eyebrow line above it
    expect(screen.getByRole('heading', { name: 'Nowy klient' }).parentElement?.children).toHaveLength(1)
  })

  it('is a modal dialog named by its title, and its scrim is hidden from assistive technology', () => {
    renderInFrame(<Framed />)
    const dialog = screen.getByRole('dialog', { name: TITLE })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(scrim().getAttribute('aria-hidden')).toBe('true')
  })

  it("is drawn into the frame's overlay root, outside the page that rendered it, and not into the body", () => {
    renderInFrame(
      <div data-testid="page">
        <TestPanel title={TITLE} />
      </div>,
    )
    const dialog = screen.getByRole('dialog')
    const overlay = dialog.closest('[data-overlay]') as HTMLElement
    // The frame's own element: the one that carries translateZ(0), so it is the containing block of the fixed overlay (Decided 6), and the
    // box that measures the layout is its parent.
    expect(overlay.parentElement?.style.transform).toBe('translateZ(0)')
    expect(overlay.parentElement?.parentElement?.hasAttribute('data-layout')).toBe(true)
    expect(overlay.parentElement).not.toBe(document.body)
    // ...and not inside the page's own tree, where a transformed or clipped ancestor could trap it
    expect(screen.getByTestId('page').contains(dialog)).toBe(false)
  })

  it('draws nothing where there is no frame to draw into, and holds nothing: no scroll lock, no key listener', () => {
    const onClose = vi.fn()
    render(<TestPanel onClose={onClose} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    press('Escape')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('carries the overlay marker with its kind, the one Panel, ConfirmDialog and Toast share', () => {
    renderInFrame(<Framed />)
    const marked = document.querySelectorAll('[data-overlay]')
    expect(marked).toHaveLength(1)
    expect(marked[0].getAttribute('data-overlay')).toBe('panel')
    expect(marked[0].contains(screen.getByRole('dialog'))).toBe(true)
  })

  it('writes no colour literal of its own (hex)', () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Panel.tsx'), 'utf8')
    expect(source.match(/#[0-9a-fA-F]{3,6}\b/g)).toBeNull()
  })

  it('wraps an eyebrow or a title that is one long word inside its line (DECISIONS 128 (i) in Overload, Adam 2026-10-15)', () => {
    const LONG = 'X'.repeat(80)
    renderInFrame(
      <TestPanel eyebrow={`${LONG} · klient`} title={LONG}>
        <p>treść</p>
      </TestPanel>,
    )
    // jsdom lays nothing out: this holds the rule that gives the wrap (`overflow-wrap: anywhere`, Tailwind's wrap-anywhere), and the kit's
    // clipping check measures it in Chromium
    const eyebrow = screen.getByText(`${LONG} · klient`)
    expect(classesOf(eyebrow)).toContain('wrap-anywhere')
    expect(classesOf(screen.getByRole('heading', { level: 2, name: LONG }))).toContain('wrap-anywhere')
    // the heading block can shrink below the word, which is what lets it wrap beside the × button
    expect(classesOf(eyebrow.parentElement as HTMLElement)).toContain('min-w-0')
  })
})

describe.each([
  ['phone', PHONE],
  ['desktop', 1280],
] as const)('Panel: the %s shape', (shape, width) => {
  it('carries the eyebrow, the title, the ×, the toolbar, the content and the footer, in that order (the same parts in both shapes)', () => {
    renderInFrame(
      <TestPanel
        eyebrow={EYEBROW}
        title={TITLE}
        toolbar={<button type="button">Wszystkie</button>}
        footer={<button type="button">{CTA}</button>}
      >
        <p>Pierwszy</p>
      </TestPanel>,
      { width },
    )
    const dialog = screen.getByRole('dialog', { name: TITLE })
    expect(dialog.closest('[data-layout]')?.getAttribute('data-layout')).toBe(shape)
    const parts = [
      within(dialog).getByText(EYEBROW),
      within(dialog).getByRole('heading', { level: 2, name: TITLE }),
      within(dialog).getByRole('button', { name: CLOSE }),
      within(dialog).getByRole('button', { name: 'Wszystkie' }),
      within(dialog).getByText('Pierwszy'),
      within(dialog).getByRole('button', { name: CTA }),
    ]
    for (let i = 1; i < parts.length; i++) expect(follows(parts[i - 1], parts[i])).toBe(true)
    // the header, the toolbar, the content and the footer are the same four regions in both; the handle is the sheet's grab bar, the phone's alone
    const regions = Array.from(dialog.children).filter((child) => child.getAttribute('aria-hidden') !== 'true')
    expect(regions).toHaveLength(4)
    expect(dialog.children).toHaveLength(shape === 'phone' ? 5 : 4)
    expect(dialog.firstElementChild?.getAttribute('aria-hidden') === 'true').toBe(shape === 'phone')
  })
})

describe('Panel: the two shapes', () => {
  it('phone: a sheet from the bottom, full width, rounded at the top, held to the frame\'s height minus 64 px', () => {
    renderInFrame(<TestPanel />, { width: PHONE })
    const dialog = screen.getByRole('dialog')
    expect(classesOf(dialog.closest('[data-overlay]') as HTMLElement)).toContain('items-end')
    expect(classesOf(dialog)).toEqual(expect.arrayContaining(['w-full', 'rounded-t-xl', 'max-h-[calc(100%-64px)]']))
  })

  it('desktop: a side panel from the right, 440 px at most, the frame\'s full height; `tall` changes nothing', () => {
    renderInFrame(<TestPanel height="tall" />, { width: 1280 })
    const dialog = screen.getByRole('dialog')
    expect(classesOf(dialog.closest('[data-overlay]') as HTMLElement)).toContain('justify-end')
    expect(classesOf(dialog)).toEqual(expect.arrayContaining(['h-full', 'w-full', 'max-w-[440px]', 'border-l', 'shadow-panel']))
    expect(classesOf(dialog)).not.toContain('h-[calc(100%-64px)]')
    expect(classesOf(dialog)).not.toContain('rounded-t-xl')
  })

  it('changes shape while it is open without remounting anything: what the person typed, and the focus, stay', () => {
    renderInFrame(
      <TestPanel title={TITLE} footer={<button type="button">{CTA}</button>}>
        <input aria-label="Nazwa" />
      </TestPanel>,
      { width: 1280 },
    )
    const dialog = screen.getByRole('dialog')
    const input = screen.getByRole('textbox', { name: 'Nazwa' }) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Kawiarnia Nowa Prowincja' } })
    input.focus()

    resizeFrame(PHONE)
    expect(dialog.closest('[data-layout]')?.getAttribute('data-layout')).toBe('phone')
    expect(classesOf(dialog)).toContain('rounded-t-xl')
    expect(screen.getByRole('dialog')).toBe(dialog)
    expect(screen.getByRole('textbox', { name: 'Nazwa' })).toBe(input)
    expect(input.value).toBe('Kawiarnia Nowa Prowincja')
    expect(document.activeElement).toBe(input)

    resizeFrame(1280)
    expect(classesOf(dialog)).toContain('border-l')
    expect(screen.getByRole('textbox', { name: 'Nazwa' })).toBe(input)
    expect(input.value).toBe('Kawiarnia Nowa Prowincja')
    expect(document.activeElement).toBe(input)
  })
})

describe('Panel: closing', () => {
  it('the × asks to close', () => {
    const onClose = vi.fn()
    renderInFrame(<Framed onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: CLOSE }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('a tap on the scrim asks to close; a tap anywhere on the panel does not', () => {
    const onClose = vi.fn()
    renderInFrame(<Framed onClose={onClose} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog)
    fireEvent.click(screen.getByText('Pierwszy'))
    fireEvent.click(screen.getByRole('heading', { name: TITLE }))
    fireEvent.click(screen.getByRole('button', { name: CTA }))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(scrim())
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape asks to close, once; other keys do not', () => {
    const onClose = vi.fn()
    renderInFrame(<Framed onClose={onClose} />)
    press('a')
    press('Enter')
    press('Escapee')
    expect(onClose).not.toHaveBeenCalled()
    press('Escape')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Escape calls the onClose of the latest render', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = renderInFrame(<TestPanel title="T" onClose={first} />)
    rerender(<TestPanel title="T" onClose={second} />)
    press('Escape')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('leaves an Escape that something inside already handled alone', () => {
    const onClose = vi.fn()
    renderInFrame(
      <TestPanel title="T" onClose={onClose}>
        <input
          aria-label="Nowa uwaga"
          onKeyDown={(e) => {
            if (e.key === 'Escape') e.preventDefault()
          }}
        />
      </TestPanel>,
    )
    const input = screen.getByRole('textbox', { name: 'Nowa uwaga' })
    input.focus()
    press('Escape')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('stops listening once it is gone', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const remove = vi.spyOn(document, 'removeEventListener')
    const onClose = vi.fn()
    const { unmount } = renderInFrame(<TestPanel title="T" onClose={onClose} />)
    const added = add.mock.calls.filter(([type]) => type === 'keydown').map(([, listener]) => listener)
    expect(added.length).toBeGreaterThan(0)
    unmount()
    const removed = remove.mock.calls.filter(([type]) => type === 'keydown').map(([, listener]) => listener)
    for (const listener of added) expect(removed).toContain(listener)
    press('Escape')
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('Panel: panels stacked', () => {
  function Stack() {
    const [lower, setLower] = useState(true)
    const [upper, setUpper] = useState(true)
    return (
      <>
        {lower && (
          <TestPanel title="Dolny panel" onClose={() => setLower(false)}>
            <p>dolna treść</p>
          </TestPanel>
        )}
        {/* closes at once, in the middle of the key event, as a flush between two listeners would */}
        {upper && (
          <TestPanel title="Górny panel" onClose={() => flushSync(() => setUpper(false))}>
            <p>górna treść</p>
          </TestPanel>
        )}
      </>
    )
  }

  it('Escape closes the one on top, then the next', () => {
    renderInFrame(<Stack />)
    expect(screen.getAllByRole('dialog')).toHaveLength(2)
    press('Escape')
    expect(screen.queryByRole('dialog', { name: 'Górny panel' })).toBeNull()
    expect(screen.getByRole('dialog', { name: 'Dolny panel' })).toBeTruthy()
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('the page stays locked until the last panel is gone, then gets its own overflow back', () => {
    document.body.style.overflow = 'auto'
    renderInFrame(<Stack />)
    expect(document.body.style.overflow).toBe('hidden')
    press('Escape')
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
    expect(document.body.style.overflow).toBe('hidden')
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('a panel mounted later is drawn above, and Tab belongs to it', () => {
    renderInFrame(<Stack />)
    const upper = screen.getByRole('dialog', { name: 'Górny panel' })
    const lower = screen.getByRole('dialog', { name: 'Dolny panel' })
    expect(follows(lower, upper)).toBe(true)
    // focus on the lower panel's × is outside the one on top: Tab is pulled up into it
    const lowerClose = within(lower).getByRole('button', { name: CLOSE })
    lowerClose.focus()
    expect(press('Tab')).toBe(false)
    expect(document.activeElement).toBe(within(upper).getByRole('button', { name: CLOSE }))
  })
})

describe('Panel: the page behind', () => {
  it('does not scroll while a panel is open, and gets its own overflow back after', () => {
    document.body.style.overflow = 'auto'
    const { unmount } = renderInFrame(<Framed />)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('auto')
  })

  it('takes no touch panning on the scrim', () => {
    renderInFrame(<Framed />)
    expect(classesOf(scrim())).toContain('touch-none')
  })
})

describe('Panel: content taller than the screen', () => {
  it('scrolls inside the panel: held to the frame, header and footer outside the scroll, nothing passed on', () => {
    renderInFrame(<Framed />, { width: PHONE })
    const dialog = screen.getByRole('dialog')
    // taller content stops 64 px below the top of the frame (where Overload's tall sheets stop)
    expect(classesOf(dialog)).toContain('max-h-[calc(100%-64px)]')
    const content = screen.getByText('Pierwszy').parentElement as HTMLElement
    expect(classesOf(content)).toEqual(expect.arrayContaining(['overflow-y-auto', 'overscroll-contain']))
    expect(content.contains(screen.getByRole('button', { name: CTA }))).toBe(false)
    expect(content.contains(screen.getByRole('heading', { name: TITLE }))).toBe(false)
    expect(content.contains(screen.getByRole('button', { name: CLOSE }))).toBe(false)
  })
})

describe('Panel: tall, and a toolbar', () => {
  const sheet = (props: Partial<PanelProps> = {}) => (
    <TestPanel title="Wybierz" {...props}>
      <p>lista</p>
    </TestPanel>
  )

  it('is as tall as its content by default: no height of its own, only the cap', () => {
    renderInFrame(sheet(), { width: PHONE })
    const dialog = screen.getByRole('dialog')
    expect(classesOf(dialog)).not.toContain('h-[calc(100%-64px)]')
    expect(classesOf(dialog)).toContain('max-h-[calc(100%-64px)]')
  })

  it('"tall" fills the whole height below the 64 px gap: the height is the cap, and the content still scrolls inside', () => {
    renderInFrame(sheet({ height: 'tall' }), { width: PHONE })
    const dialog = screen.getByRole('dialog')
    expect(classesOf(dialog)).toEqual(expect.arrayContaining(['h-[calc(100%-64px)]', 'max-h-[calc(100%-64px)]']))
    const content = screen.getByText('lista').parentElement as HTMLElement
    expect(classesOf(content)).toContain('overflow-y-auto')
  })

  it('"content" says the same as leaving it out, and the height follows the prop while the panel stays open', () => {
    const { rerender } = renderInFrame(sheet({ height: 'content' }), { width: PHONE })
    expect(classesOf(screen.getByRole('dialog'))).not.toContain('h-[calc(100%-64px)]')
    rerender(sheet({ height: 'tall' }))
    expect(classesOf(screen.getByRole('dialog'))).toContain('h-[calc(100%-64px)]')
    rerender(sheet({ height: 'content' }))
    expect(classesOf(screen.getByRole('dialog'))).not.toContain('h-[calc(100%-64px)]')
  })

  it("draws the toolbar between the header and the content, outside the content's scroll", () => {
    renderInFrame(
      sheet({
        toolbar: <button type="button">Wszystkie</button>,
        footer: <button type="button">Zamień</button>,
      }),
      { width: PHONE },
    )
    const dialog = screen.getByRole('dialog')
    const toolbar = screen.getByRole('button', { name: 'Wszystkie' })
    const parts = [
      screen.getByRole('heading', { level: 2, name: 'Wybierz' }),
      screen.getByRole('button', { name: CLOSE }),
      toolbar,
      screen.getByText('lista'),
      screen.getByRole('button', { name: 'Zamień' }),
    ]
    for (let i = 1; i < parts.length; i++) expect(follows(parts[i - 1], parts[i])).toBe(true)
    const content = screen.getByText('lista').parentElement as HTMLElement
    expect(content.contains(toolbar)).toBe(false)
    // handle, header, toolbar, content, footer
    expect(dialog.children).toHaveLength(5)
    // pinned: it keeps its own height when the panel is held to the frame, whatever the content's
    expect(classesOf(toolbar.parentElement as HTMLElement)).toContain('shrink-0')
  })

  it('draws no toolbar region when none is given', () => {
    renderInFrame(sheet(), { width: PHONE })
    // handle, header and content: the same three as before the toolbar existed
    expect(screen.getByRole('dialog').children).toHaveLength(3)
  })

  it("keeps the toolbar inside the panel's Tab ring: with nothing after it, Tab on it goes round to the ×", () => {
    renderInFrame(
      <TestPanel title="Wybierz" toolbar={<button type="button">Wszystkie</button>}>
        <p>lista</p>
      </TestPanel>,
    )
    const chip = screen.getByRole('button', { name: 'Wszystkie' })
    const close = screen.getByRole('button', { name: CLOSE })
    close.focus()
    // between two controls inside, the browser moves focus; the trap only acts on the ends of the ring
    expect(press('Tab')).toBe(true)
    chip.focus()
    expect(press('Tab')).toBe(false)
    expect(document.activeElement).toBe(close)
    expect(press('Tab', { shiftKey: true })).toBe(false)
    expect(document.activeElement).toBe(chip)
  })
})

describe('Panel: focus', () => {
  it('moves into the panel when it opens and back to the opener when it closes', () => {
    const opener = openHarness()
    const dialog = screen.getByRole('dialog', { name: 'Panel z przyciskiem' })
    expect(document.activeElement).toBe(dialog)
    fireEvent.click(screen.getByRole('button', { name: CLOSE }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('does the same on the desktop shape', () => {
    const opener = openHarness(undefined, 1280)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('leaves focus where a child took it (an autofocused input), and still returns it on close', () => {
    const opener = openHarness(<input aria-label="Nazwa" autoFocus />)
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Nazwa' }))
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('does not take focus back from something the caller focused while closing', () => {
    function Elsewhere() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Otwórz
          </button>
          <button type="button">Gdzie indziej</button>
          {open && (
            <TestPanel
              title="T"
              onClose={() => {
                setOpen(false)
                screen.getByRole('button', { name: 'Gdzie indziej' }).focus()
              }}
            >
              <p>x</p>
            </TestPanel>
          )}
        </>
      )
    }
    renderInFrame(<Elsewhere />)
    const opener = screen.getByRole('button', { name: 'Otwórz' })
    opener.focus()
    fireEvent.click(opener)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Gdzie indziej' }))
  })

  it('survives React StrictMode running every effect twice', () => {
    document.body.style.overflow = 'auto'
    renderInFrame(
      <StrictMode>
        <Harness />
      </StrictMode>,
    )
    const opener = screen.getByRole('button', { name: 'Otwórz' })
    opener.focus()
    fireEvent.click(opener)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
    expect(document.body.style.overflow).toBe('hidden')
    press('Escape')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
    expect(document.body.style.overflow).toBe('auto')
  })

  describe('Tab stays inside', () => {
    // Tab order inside: the × in the header, the two inputs, then the footer button when there is one.
    // The four after the inputs cannot take focus, so none may be the end Tab wraps from or to.
    function withControls({ footer }: { footer: boolean }) {
      return renderInFrame(
        <>
          <button type="button">Na zewnątrz</button>
          <TestPanel title="T" footer={footer ? <button type="button">Gotowe</button> : undefined}>
            <input aria-label="Pierwsze" />
            <input aria-label="Drugie" />
            <input aria-label="Pominięte przez tabindex" tabIndex={-1} />
            <input aria-label="Pominięte jako wyłączone" disabled />
            <input aria-label="Pominięte jako ukryte" type="hidden" />
            <div hidden>
              <button type="button">Pominięty w ukrytym</button>
            </div>
            <div aria-hidden="true">
              <button type="button">Pominięty w aria-hidden</button>
            </div>
          </TestPanel>
        </>,
      )
    }
    const close = () => screen.getByRole('button', { name: CLOSE })
    const done = () => screen.getByRole('button', { name: 'Gotowe' })
    const second = () => screen.getByRole('textbox', { name: 'Drugie' })

    it('Tab on the last control goes to the first', () => {
      withControls({ footer: true })
      done().focus()
      expect(press('Tab')).toBe(false)
      expect(document.activeElement).toBe(close())
    })

    it('Shift+Tab on the first control goes to the last', () => {
      withControls({ footer: true })
      close().focus()
      expect(press('Tab', { shiftKey: true })).toBe(false)
      expect(document.activeElement).toBe(done())
    })

    it('Shift+Tab on the panel itself goes to the last control', () => {
      withControls({ footer: true })
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
      expect(press('Tab', { shiftKey: true })).toBe(false)
      expect(document.activeElement).toBe(done())
    })

    it('wraps around the controls that can take focus, never to one that cannot', () => {
      withControls({ footer: false })
      second().focus()
      expect(press('Tab')).toBe(false)
      expect(document.activeElement).toBe(close())
      expect(press('Tab', { shiftKey: true })).toBe(false)
      expect(document.activeElement).toBe(second())
    })

    it('Tab pulls in focus that was outside the panel', () => {
      withControls({ footer: true })
      screen.getByRole('button', { name: 'Na zewnątrz' }).focus()
      expect(press('Tab')).toBe(false)
      expect(document.activeElement).toBe(close())
      screen.getByRole('button', { name: 'Na zewnątrz' }).focus()
      expect(press('Tab', { shiftKey: true })).toBe(false)
      expect(document.activeElement).toBe(done())
    })

    it('leaves Tab between two controls inside to the browser', () => {
      withControls({ footer: true })
      screen.getByRole('textbox', { name: 'Pierwsze' }).focus()
      expect(press('Tab')).toBe(true)
      expect(press('Tab', { shiftKey: true })).toBe(true)
    })

    it('holds focus on the panel when it has nothing to tab to', () => {
      renderInFrame(
        <TestPanel title="T">
          <p>tekst</p>
        </TestPanel>,
      )
      // the × is always there, so take it out of play to prove the no-control path
      const closeButton = screen.getByRole('button', { name: CLOSE })
      closeButton.setAttribute('disabled', '')
      expect(press('Tab')).toBe(false)
      expect(document.activeElement).toBe(screen.getByRole('dialog'))
    })
  })
})
