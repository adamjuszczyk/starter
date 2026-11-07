// @vitest-environment jsdom
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// THE proof of SPEC Screens as amended 2026-11-07 (DECISIONS 77): a sign-out with no connection leaves no session on the device. Nothing here
// is stood in for but the network. The client is the starter's own (src/lib/supabase.ts, loaded for real with a project URL and key set here, not
// a copy of it), the sign-out is the real `authService.signOut`, and the device is the browser's storage, which in jsdom is an in-memory
// localStorage and is what supabase-js reads by default in a browser. `fetch` is the one fake: it fails the way a browser's does with no
// network (a `TypeError`), or answers with the status a test names. So the key the client is given, the service that empties it and the
// library that reads it cannot drift apart without a test here failing.
//
// Every "nothing left" below is two assertions, never one: the client reads no session (`getSession()`), AND the storage holds nothing. With an
// access token that has expired, supabase-js's `getSession()` reads null while the whole session is still stored (its refresh got no answer),
// so `getSession()` alone passes on a device that still holds the previous person's session.
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

const { supabase: client, AUTH_STORAGE_KEY } = await import('../../lib/supabase')
const { signOut } = await import('./authService')

const STORED_ACCESS_TOKEN = 'access-token-of-anna'
const STORED_REFRESH_TOKEN = 'refresh-token-of-anna'

/** The session supabase-js stores after a sign-in, as the client reads it back; `expiresIn` seconds from now (negative: already expired). */
function storeSession(expiresIn: number) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      access_token: STORED_ACCESS_TOKEN,
      refresh_token: STORED_REFRESH_TOKEN,
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      user: {
        id: 'user-1',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'anna@firma.pl',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-01-01T00:00:00.000Z',
      },
    }),
  )
}

/** Everything the device holds: every storage entry, key and value. Empty means no session, no half of one, nothing of the client's. */
function onDevice(): string[] {
  return Object.keys(localStorage).map((key) => `${key}=${localStorage.getItem(key)}`)
}

const answer = (status: number, body: object = {}) => async () =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'x-supabase-api-version': '2024-01-01' } })

let events: string[]
let unsubscribe: () => void
beforeAll(async () => {
  // The background refresh would race the sign-outs below for the stored session: it is not what is under test.
  await client.auth.stopAutoRefresh()
})
afterAll(async () => {
  await client.auth.dispose()
})
beforeEach(() => {
  localStorage.clear()
  network.requests.length = 0
  network.respond = async () => {
    throw new TypeError('Failed to fetch')
  }
  events = []
  unsubscribe = client.auth.onAuthStateChange((event) => void events.push(event)).data.subscription.unsubscribe
  // supabase-js logs a failed request with console.error; that line, and only that one, is expected here.
  const log = console.error.bind(console)
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (!(args[0] instanceof TypeError && args[0].message === 'Failed to fetch')) log(...args)
  })
})
afterEach(() => {
  unsubscribe()
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('what supabase-js does with no connection (why the service takes the stored session out first)', () => {
  it('its sign-out, whatever the scope, asks the server, gets no answer, returns the error and KEEPS the session', async () => {
    for (const scope of ['global', 'local'] as const) {
      storeSession(3600)
      network.requests.length = 0

      const { error } = await client.auth.signOut({ scope })

      expect(error?.name, scope).toBe('AuthRetryableFetchError')
      expect((error as { status?: number } | null)?.status, scope).toBe(0)
      expect(network.requests, scope).toEqual([`POST /auth/v1/logout?scope=${scope}`])
      expect(localStorage.getItem(AUTH_STORAGE_KEY), scope).not.toBeNull()
      expect((await client.auth.getSession()).data.session, scope).not.toBeNull()
    }
  })

  it('with an expired access token it cannot even refresh: getSession() reads null while the whole session is still stored', async () => {
    vi.useFakeTimers()
    storeSession(-3600)

    const outcome = client.auth.signOut({ scope: 'local' })
    await vi.advanceTimersByTimeAsync(40_000)
    const { error } = await outcome

    expect(error?.name).toBe('AuthRetryableFetchError')
    expect(network.requests.length).toBeGreaterThan(1)
    expect(network.requests.every((request) => request === 'POST /auth/v1/token?grant_type=refresh_token')).toBe(true)
    const read = client.auth.getSession()
    await vi.advanceTimersByTimeAsync(40_000)
    expect((await read).data.session).toBeNull()
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull()
  })
})

describe('signOut with no connection: the person is signed out on this device', () => {
  it('a stored session: resolves; getSession() reads null and the storage holds nothing; the server was asked once and the device sign-out asked nothing', async () => {
    storeSession(3600)
    // The control: the client reads the stored session under the key it was given, so the empty storage below is the sign-out's doing and not
    // a key the client never read.
    expect((await client.auth.getSession()).data.session?.user.email).toBe('anna@firma.pl')
    expect(onDevice()).toHaveLength(1)

    await expect(signOut()).resolves.toBeUndefined()

    expect((await client.auth.getSession()).data.session).toBeNull()
    expect(onDevice()).toEqual([])
    expect(network.requests).toEqual(['POST /auth/v1/logout?scope=global'])
    // The app learns it from this event (useAuth's listener): the sign-in screen and the cleared cache follow from it.
    expect(events[events.length - 1]).toBe('SIGNED_OUT')
  })

  it('a stored session whose access token has expired (supabase-js tries to refresh it first, and gets no answer either): nothing is left', async () => {
    vi.useFakeTimers()
    storeSession(-3600)
    expect(onDevice()).toHaveLength(1)

    const outcome = signOut().then(
      () => 'resolved',
      (error: unknown) => error,
    )
    await vi.advanceTimersByTimeAsync(40_000)
    expect(await outcome).toBe('resolved')

    const read = client.auth.getSession()
    await vi.advanceTimersByTimeAsync(40_000)
    expect((await read).data.session).toBeNull()
    expect(onDevice()).toEqual([])
    // It did try to refresh, more than once, and asked for no logout: the refresh is what supabase-js does first, and it got no answer.
    expect(network.requests.length).toBeGreaterThan(1)
    expect(network.requests.every((request) => request === 'POST /auth/v1/token?grant_type=refresh_token')).toBe(true)
    expect(events[events.length - 1]).toBe('SIGNED_OUT')
  })

  it('the device says it is offline and the request still fails: the same', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    storeSession(3600)

    await expect(signOut()).resolves.toBeUndefined()

    expect((await client.auth.getSession()).data.session).toBeNull()
    expect(onDevice()).toEqual([])
  })

  it('the rest of what the client keeps goes too: its code verifier and its stored user', async () => {
    storeSession(3600)
    localStorage.setItem(`${AUTH_STORAGE_KEY}-code-verifier`, 'verifier')
    localStorage.setItem(`${AUTH_STORAGE_KEY}-user`, JSON.stringify({ user: { id: 'user-1' } }))

    await expect(signOut()).resolves.toBeUndefined()

    expect(onDevice()).toEqual([])
  })

  it('a second sign-out on the empty device resolves and leaves it empty', async () => {
    storeSession(3600)
    await signOut()
    network.requests.length = 0

    await expect(signOut()).resolves.toBeUndefined()

    expect(onDevice()).toEqual([])
    expect(network.requests).toEqual([])
  })
})

describe('signOut with a connection', () => {
  it('the server answers: the session ends, on the server and here, and the device sign-out is not used', async () => {
    network.respond = async () => new Response(null, { status: 204 })
    storeSession(3600)

    await expect(signOut()).resolves.toBeUndefined()

    expect((await client.auth.getSession()).data.session).toBeNull()
    expect(onDevice()).toEqual([])
    expect(network.requests).toEqual(['POST /auth/v1/logout?scope=global'])
  })
})

describe('signOut when the server answered with an error', () => {
  // DECISIONS 77 covers "the server can't be reached". A server that answered with an error is a decision card in chunk 11's report: these pin
  // what the service does with it today, which is what supabase-js does: the session stays on this device and the error is thrown.
  it.each([[500], [502], [429]])('a %i is not "no connection": it is thrown as it came, and the session is still on the device', async (status) => {
    network.respond = answer(status, { message: 'The server said no', code: 'over_request_rate_limit' })
    storeSession(3600)

    await expect(signOut()).rejects.toMatchObject({ status })

    expect(network.requests).toEqual(['POST /auth/v1/logout?scope=global'])
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull()
    expect((await client.auth.getSession()).data.session?.user.email).toBe('anna@firma.pl')
    expect(events).not.toContain('SIGNED_OUT')
  })
})
