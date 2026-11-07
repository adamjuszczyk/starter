// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { pl as t } from './i18n/pl'
import { queryClient } from './lib/queryClient'
import { resetTheme } from './features/settings/useTheme'

// Sign-out with no connection, through the whole app (SPEC Screens as amended 2026-11-07, DECISIONS 77): the person presses Wyloguj się in
// Settings or in the side menu, the server cannot be reached, and the sign-in page shows, the cache is empty and the device holds no
// session. Nothing is stood in for but the network and the page's width: the provider, the sign-out service, the starter's own Supabase
// client (src/lib/supabase.ts, loaded for real with a URL and key set here), the Settings page, the side menu and the sign-in page are the
// real ones, and the device is jsdom's localStorage, which supabase-js reads by default. App.test.tsx stands useAuth in for the route table
// and says which page a path gets; this file is the one that runs a sign-out through the real provider, whose SIGNED_OUT event is what takes
// the person to the sign-in page.
const network = vi.hoisted(() => ({
  /** What a request the client sends gets. A test sets it; the default is no network. */
  respond: (async () => {
    throw new TypeError('Failed to fetch')
  }) as (url: string, init?: RequestInit) => Promise<Response>,
  /** Every request the client sent, as `METHOD /path?query`. */
  requests: [] as string[],
}))

vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefgh.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key-for-this-test')
vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input))
  network.requests.push(`${init?.method ?? 'GET'} ${url.pathname}${url.search}`)
  return network.respond(String(input), init)
})
// Not called by AppRoutes (only by App() itself): mocked because the module reaches vite-plugin-pwa's virtual module (as App.test.tsx does).
vi.mock('./features/pwa/useServiceWorker', () => ({ useServiceWorker: () => {} }))

// jsdom has no layout: the frame measures a width a test sets (1280 is the desktop's, with the side menu; 390 the phone's, with Settings only).
let width = 1280
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })

const { supabase: client, AUTH_STORAGE_KEY } = await import('./lib/supabase')
const { AuthProvider } = await import('./features/auth/useAuth')
const { AppRoutes } = await import('./App')
// The background refresh would race the sign-outs for the stored session: it is not what is under test.
await client.auth.stopAutoRefresh()

function storeSession() {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      access_token: 'access-token-of-anna',
      refresh_token: 'refresh-token-of-anna',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'user-1', aud: 'authenticated', role: 'authenticated', email: 'anna@firma.pl', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00.000Z' },
    }),
  )
}

/** The app as App() wires it (the providers, then the routes), under a MemoryRouter, signed in as the stored session says. */
async function renderSignedIn() {
  storeSession()
  const view = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/settings']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
  // The provider reads the session before the app is drawn.
  await screen.findAllByText('anna@firma.pl')
  // The provider clears the cache when the session first resolves to a user (the user changes from nobody), so what the sign-out is to clear is
  // put in once the session is known and supabase-js has told its listeners: an entry put in earlier would be gone before the press.
  await act(async () => {
    await client.auth.getSession()
  })
  queryClient.setQueryData(['clients'], [{ id: 'client-1', name: 'Firma Anny' }])
  return view
}

const signOutButtons = (root: HTMLElement = document.body) => within(root).queryAllByRole('button', { name: t.settings.signOut })
const pendingButtons = () => screen.queryAllByRole('button', { name: t.settings.signingOut }) as HTMLButtonElement[]
const signInPage = () => screen.queryByRole('heading', { name: t.signIn.title })
const cached = () => queryClient.getQueryCache().getAll().length
/** Everything the device holds: every storage entry. Empty means no session of the client's, nothing of it. */
const onDevice = () => Object.keys(localStorage)

beforeEach(() => {
  width = 1280
  network.requests.length = 0
  network.respond = async () => {
    throw new TypeError('Failed to fetch')
  }
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  resetTheme()
  queryClient.clear()
  // supabase-js logs a failed request with console.error; that line, and only that one, is expected here.
  const log = console.error.bind(console)
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!(args[0] instanceof TypeError && args[0].message === 'Failed to fetch')) log(...args)
  })
})
afterEach(() => {
  cleanup()
  queryClient.clear()
  localStorage.clear()
  vi.restoreAllMocks()
})

describe.each([
  ['Settings\' button', 'main'],
  ['the side menu\'s button', 'aside'],
])('%s, with no connection', (_which, where) => {
  const press = async () => {
    const container = document.querySelector(where) as HTMLElement
    expect(container, `the ${where} is drawn`).not.toBeNull()
    const buttons = signOutButtons(container)
    expect(buttons).toHaveLength(1)
    await act(async () => {
      fireEvent.click(buttons[0])
    })
  }

  it('the sign-in page shows, the cache is empty, and the device holds no session', async () => {
    await renderSignedIn()
    // The controls: the person is in, the cache holds something, and the device holds the session, so what is gone below is the sign-out's doing.
    expect(signInPage()).toBeNull()
    expect(cached()).toBe(1)
    expect(onDevice()).toEqual([AUTH_STORAGE_KEY])

    await press()
    await waitFor(() => expect(signInPage()).not.toBeNull())

    expect(screen.queryByText(t.settings.account)).toBeNull()
    expect(signOutButtons()).toHaveLength(0)
    expect(cached()).toBe(0)
    expect(onDevice()).toEqual([])
    expect((await client.auth.getSession()).data.session).toBeNull()
    // The server was asked, once, and the sign-out on the device asked nothing.
    expect(network.requests).toEqual(['POST /auth/v1/logout?scope=global'])
  })

  it('the device says it is offline as well: the same, and the offline strip goes with the app', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    await renderSignedIn()
    expect(screen.getByRole('status').textContent).toBe(t.common.offline)

    await press()
    await waitFor(() => expect(signInPage()).not.toBeNull())

    expect(screen.queryByRole('status')).toBeNull()
    expect(cached()).toBe(0)
    expect(onDevice()).toEqual([])
  })
})

describe('the pending state with no connection', () => {
  it('both buttons show the same pending word and are disabled from the press until the sign-in page is drawn', async () => {
    let fail: () => void = () => {}
    network.respond = () =>
      new Promise<Response>((_resolve, reject) => {
        fail = () => reject(new TypeError('Failed to fetch'))
      })
    await renderSignedIn()
    expect(signOutButtons()).toHaveLength(2)
    expect(pendingButtons()).toHaveLength(0)

    await act(async () => {
      fireEvent.click(signOutButtons(document.querySelector('main') as HTMLElement)[0])
    })
    // The server has not answered: both buttons, Settings' and the side menu's, read the one state.
    expect(pendingButtons()).toHaveLength(2)
    expect(pendingButtons().every((button) => button.disabled)).toBe(true)
    expect(signOutButtons()).toHaveLength(0)
    expect(onDevice()).toEqual([AUTH_STORAGE_KEY])

    await act(async () => fail())
    await waitFor(() => expect(signInPage()).not.toBeNull())
    expect(pendingButtons()).toHaveLength(0)
    expect(onDevice()).toEqual([])
  })
})

describe('the phone layout, with no connection', () => {
  it('Settings\' button (the only one: the side menu is the desktop\'s) signs out on this device: the sign-in page shows, the cache is empty', async () => {
    width = 390
    await renderSignedIn()
    expect(document.querySelector('aside')).toBeNull()
    const buttons = signOutButtons()
    expect(buttons).toHaveLength(1)

    await act(async () => {
      fireEvent.click(buttons[0])
    })
    await waitFor(() => expect(signInPage()).not.toBeNull())

    expect(cached()).toBe(0)
    expect(onDevice()).toEqual([])
  })
})

describe('with a connection, and with a server that answers with an error', () => {
  it('a sign-out the server answers ends in the same place as one with no connection: the sign-in page, an empty cache, an empty device', async () => {
    network.respond = async () => new Response(null, { status: 204 })
    await renderSignedIn()

    await act(async () => {
      fireEvent.click(signOutButtons(document.querySelector('main') as HTMLElement)[0])
    })
    await waitFor(() => expect(signInPage()).not.toBeNull())

    expect(cached()).toBe(0)
    expect(onDevice()).toEqual([])
    expect(network.requests).toEqual(['POST /auth/v1/logout?scope=global'])
  })

  // DECISIONS 77 covers "the server can't be reached" only: a server that answered with an error is a decision card (chunk 11's report). Until
  // it is decided the person stays signed in, as before: the screen stays as it was, the buttons go back, the session is still on the device.
  it('a server that answered with an error: the person stays signed in, the buttons are back, the cache and the session are untouched', async () => {
    network.respond = async () =>
      new Response(JSON.stringify({ message: 'Bad Gateway' }), { status: 502, headers: { 'content-type': 'application/json' } })
    await renderSignedIn()

    await act(async () => {
      fireEvent.click(signOutButtons(document.querySelector('main') as HTMLElement)[0])
    })
    await waitFor(() => expect(network.requests).toHaveLength(1))
    await waitFor(() => expect(pendingButtons()).toHaveLength(0))

    expect(signInPage()).toBeNull()
    expect(signOutButtons()).toHaveLength(2)
    expect(screen.getAllByText('anna@firma.pl').length).toBeGreaterThan(0)
    expect(cached()).toBe(1)
    expect(onDevice()).toEqual([AUTH_STORAGE_KEY])
  })
})
