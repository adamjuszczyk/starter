// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { pl as t } from './i18n/pl'
import { resetTheme } from './features/settings/useTheme'

// App.tsx's own route table (<AppRoutes/>, exported for this), mounted under this test's MemoryRouter instead of App()'s BrowserRouter, as
// Overload's App.test.tsx does: the same routes, without AuthProvider's and the router's side effects. The pages are one-line stand-ins
// (this file proves which page a path gets and what frames it, not the pages' insides, which have tests of their own); useAuth is stood in
// for at its hook, as in Overload, so each test says who is signed in. The frame, the shell, the offline strip and the theme hook are real.
const state = vi.hoisted(() => ({
  auth: { user: null as { id: string; email: string } | null, loading: false, signingOut: false, signOut: async () => {} },
  online: true,
}))
vi.mock('./features/auth/useAuth', () => ({
  useAuth: () => state.auth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('./features/auth/LoginPage', () => ({ default: () => <div>LOGIN PAGE</div> }))
vi.mock('./features/settings/SettingsPage', () => ({ default: () => <div>SETTINGS PAGE</div> }))
vi.mock('./hooks/useOnlineStatus', () => ({ useOnlineStatus: () => state.online }))
// Not called by AppRoutes (only by App() itself): mocked because the module reaches vite-plugin-pwa's virtual module, which exists only under
// vite.config.ts's plugin pipeline, not vitest's, and importing App.tsx evaluates it.
vi.mock('./features/pwa/useServiceWorker', () => ({ useServiceWorker: () => {} }))

// jsdom has no layout: the frame measures a width a test could set (the 899/900 switch is proven in AppShell.test.tsx), here the desktop's.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1280 })

const { AppRoutes } = await import('./App')

const SIGNED_IN = { id: 'user-1', email: 'anna@firma.pl' }
const html = document.documentElement

function Where() {
  return <span data-testid="where">{useLocation().pathname}</span>
}
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  )
}
const where = () => screen.getByTestId('where').textContent

beforeEach(() => {
  state.auth = { user: null, loading: false, signingOut: false, signOut: async () => {} }
  state.online = true
  localStorage.clear()
  html.removeAttribute('data-theme')
  resetTheme()
})
afterEach(() => cleanup())

describe('signed out', () => {
  it('shows the sign-in page on /x, inside the frame that measures the width (Decided 45: the phone layout reaches the sign-in page)', () => {
    renderAt('/x')
    expect(screen.getByText('LOGIN PAGE').closest('[data-layout]')).not.toBeNull()
  })

  it('shows the sign-in page on every path, a tab\'s own included, with no app around it', () => {
    renderAt('/settings')
    expect(screen.getByText('LOGIN PAGE')).toBeTruthy()
    expect(screen.queryByText('SETTINGS PAGE')).toBeNull()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    // The address stays what it was: a person who opened /settings lands on it once signed in.
    expect(where()).toBe('/settings')
  })

  it('has no offline strip on the sign-in page (the sign-in\'s own offline line is the page\'s)', () => {
    state.online = false
    renderAt('/')
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('until the session is known', () => {
  it('shows a spinner, inside the frame, and neither the sign-in page nor the app', () => {
    state.auth = { ...state.auth, loading: true }
    const { container } = renderAt('/settings')
    const spinner = container.querySelector('[aria-busy="true"]')
    expect(spinner).not.toBeNull()
    expect(spinner?.closest('[data-layout]')).not.toBeNull()
    expect(screen.queryByText('LOGIN PAGE')).toBeNull()
    expect(screen.queryByText('SETTINGS PAGE')).toBeNull()
  })
})

describe('signed in', () => {
  beforeEach(() => {
    state.auth = { ...state.auth, user: SIGNED_IN }
  })

  it('/ goes to /settings, the first tab', () => {
    renderAt('/')
    expect(where()).toBe('/settings')
    expect(screen.getByText('SETTINGS PAGE')).toBeTruthy()
  })

  it('a path that is no tab\'s goes to /settings too (`*`)', () => {
    renderAt('/some/removed/route')
    expect(where()).toBe('/settings')
    expect(screen.getByText('SETTINGS PAGE')).toBeTruthy()
  })

  it('/settings is the Settings page, in the shell: the tab is there and lit, inside the frame', () => {
    renderAt('/settings')
    expect(where()).toBe('/settings')
    const page = screen.getByText('SETTINGS PAGE')
    expect(page.closest('[data-layout]')).not.toBeNull()
    expect(page.closest('main')).not.toBeNull()
    const tab = screen.getByRole('link')
    expect(tab.textContent).toContain(t.nav.settings)
    expect(tab.getAttribute('aria-current')).toBe('page')
    expect(screen.queryByText('LOGIN PAGE')).toBeNull()
  })

  it('shows the offline strip above the page while the device has no connection, and not otherwise', () => {
    state.online = false
    renderAt('/settings')
    const strip = screen.getByRole('status')
    expect(strip.textContent).toBe(t.common.offline)
    expect(strip.compareDocumentPosition(screen.getByText('SETTINGS PAGE')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    cleanup()

    state.online = true
    renderAt('/settings')
    expect(screen.queryByRole('status')).toBeNull()
  })
})

describe('the theme is applied above everything', () => {
  it.each([
    ['the spinner', { loading: true, user: null }],
    ['the sign-in page', { loading: false, user: null }],
    ['the app', { loading: false, user: SIGNED_IN }],
  ])('%s wears the stored theme', (_what, auth) => {
    localStorage.setItem('theme', 'dark')
    state.auth = { ...state.auth, ...auth }
    renderAt('/settings')
    expect(html.getAttribute('data-theme')).toBe('dark')
  })
})
