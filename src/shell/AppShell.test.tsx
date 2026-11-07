// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { pl as t } from '../i18n/pl'
import { APP_CONFIG } from '../lib/appConfig'
import { WIDE_FROM, WidthRoot } from '../lib/useWide'
import { AppShell } from './AppShell'

// The frame is drawn from the app's own width (SPEC item 1): the side menu at 900 px and above, Overload's tab bar below. jsdom has no layout
// (clientWidth is 0 and there is no ResizeObserver), so the width the frame measures is one a test sets, and the observer is a stand-in that
// a test fires as the browser would when the box is resized. useAuth is stood in for (it reaches the Supabase client at load); the tab's page
// is too, as it is not what this file looks at.
const auth = vi.hoisted(() => ({ value: {} as { user: { email: string } | null; signOut: () => Promise<void>; signingOut: boolean } }))
vi.mock('../features/auth/useAuth', () => ({ useAuth: () => auth.value }))
vi.mock('../features/settings/SettingsPage', () => ({ default: () => <div>SETTINGS PAGE</div> }))

let width = 0
const observers = new Set<() => void>()
vi.stubGlobal(
  'ResizeObserver',
  class {
    callback: () => void
    constructor(callback: () => void) {
      this.callback = callback
    }
    observe() {
      observers.add(this.callback)
    }
    unobserve() {}
    disconnect() {
      observers.delete(this.callback)
    }
  },
)
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })
const resizeTo = (next: number) =>
  act(() => {
    width = next
    observers.forEach((callback) => callback())
  })

function renderShell(path = '/settings', banner?: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <WidthRoot>
        <AppShell banner={banner}>
          <p>THE PAGE</p>
        </AppShell>
      </WidthRoot>
    </MemoryRouter>,
  )
}
const layout = (container: HTMLElement) => container.querySelector('[data-layout]')?.getAttribute('data-layout')

let signOut: Mock<() => Promise<void>>
beforeEach(() => {
  signOut = vi.fn(async () => {})
  auth.value = { user: { email: 'anna@firma.pl' }, signOut, signingOut: false }
  width = 0
  observers.clear()
})
afterEach(() => cleanup())

describe('the layout switches at 900 px of the frame\'s own width', () => {
  it('is `phone` at 899 and `desktop` at 900 when the frame first measures', () => {
    expect(WIDE_FROM).toBe(900)

    width = 899
    const phone = renderShell()
    expect(layout(phone.container)).toBe('phone')
    phone.unmount()

    width = 900
    const desktop = renderShell()
    expect(layout(desktop.container)).toBe('desktop')
  })

  it('follows the frame when it is resized, both ways, through the ResizeObserver', () => {
    width = 899
    const { container } = renderShell()
    expect(layout(container)).toBe('phone')
    expect(container.querySelector('aside')).toBeNull()

    resizeTo(900)
    expect(layout(container)).toBe('desktop')
    expect(container.querySelector('aside')).not.toBeNull()

    resizeTo(899)
    expect(layout(container)).toBe('phone')
    expect(container.querySelector('aside')).toBeNull()
  })

  it('stops watching the frame when it goes', () => {
    width = 900
    const { unmount } = renderShell()
    expect(observers.size).toBe(1)
    unmount()
    expect(observers.size).toBe(0)
  })
})

describe.each([
  ['phone', 899],
  ['desktop', 900],
])('the %s layout', (name, at) => {
  beforeEach(() => {
    width = at
  })

  it('draws the page, and the banner above it', () => {
    const { container } = renderShell('/settings', <div>THE STRIP</div>)
    expect(layout(container)).toBe(name)
    const strip = screen.getByText('THE STRIP')
    const page = screen.getByText('THE PAGE')
    expect(strip.compareDocumentPosition(page) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('draws the one tab, Settings, as a link to /settings', () => {
    renderShell()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0].textContent).toContain(t.nav.settings)
    expect(links[0].getAttribute('href')).toBe('/settings')
  })

  it('lights the tab of the page that is open: aria-current and the accent; another path lights none', () => {
    renderShell('/settings')
    const lit = screen.getByRole('link')
    expect(lit.getAttribute('aria-current')).toBe('page')
    expect(lit.className).toContain('text-accent')
    cleanup()

    width = at
    renderShell('/somewhere-else')
    const unlit = screen.getByRole('link')
    expect(unlit.hasAttribute('aria-current')).toBe(false)
    expect(unlit.className).not.toContain('text-accent')
  })
})

describe('the desktop layout\'s side menu', () => {
  beforeEach(() => {
    width = 900
  })

  it('has the app\'s name (from app.config.ts) in its tile, and the signed-in line', () => {
    renderShell()
    expect(screen.getByText(APP_CONFIG.name)).toBeTruthy()
    expect(screen.getByText(APP_CONFIG.name.charAt(0))).toBeTruthy()
    expect(screen.getByText(t.app.signedInAs)).toBeTruthy()
    expect(screen.getByText('anna@firma.pl')).toBeTruthy()
  })

  it('has its own sign-out button, which signs out through the same call as Settings\'', () => {
    renderShell()
    fireEvent.click(screen.getByRole('button', { name: t.settings.signOut }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('shows the same pending state as Settings\': the pending word, and the button disabled', () => {
    auth.value = { ...auth.value, signingOut: true }
    renderShell()
    const button = screen.getByRole('button', { name: t.settings.signingOut }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(screen.queryByRole('button', { name: t.settings.signOut })).toBeNull()
  })
})

describe('the phone layout', () => {
  it('has no side menu and no sign-out of its own: the bar is the tabs, and sign-out is in Settings', () => {
    width = 899
    const { container } = renderShell()
    expect(container.querySelector('aside')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(container.querySelector('nav')?.className).toContain('pb-[env(safe-area-inset-bottom)]')
  })
})
