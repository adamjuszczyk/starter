// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from '@supabase/supabase-js'

// `signIn` is the one place a failed sign-in is classified (SPEC Screens as amended 2026-11-06; TASKS.md Decided 24): the e-mail or password
// is wrong, there is no connection, or something else failed, which carries its reason. supabase-js does not throw for a refused sign-in, it
// resolves with `{ error }`; a failed fetch is thrown. The fixtures are supabase-js's own error classes, built the way its client builds them
// (auth-js's fetch.js: a 400 `invalid_credentials` AuthApiError for a wrong password; an AuthRetryableFetchError with status 0 for a request
// that got no answer, and with the server's status for a 5xx answer), so what the classification reads is what the client really gives it.
// No Supabase project is reached: the client is stood in for at its boundary. `signOut` is also run on the real client in
// authService.signOut.test.ts; here it is the calls it makes that are pinned, one test for each, with the key the client was given.
const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signOut: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ supabase: { auth }, AUTH_STORAGE_KEY: 'sb-test-auth-token' }))

const { signIn, signOut, SignInError } = await import('./authService')

const SESSION = { data: { user: { id: 'u1' }, session: { access_token: 't' } }, error: null }
const wrongPassword = () => new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')

/** The error `signIn` threw, for a test to look at: fails the test if it resolved. */
async function failure(): Promise<InstanceType<typeof SignInError>> {
  const error = await signIn('anna@firma.pl', 'haslo').then(
    () => null,
    (thrown: unknown) => thrown,
  )
  expect(error).toBeInstanceOf(SignInError)
  return error as InstanceType<typeof SignInError>
}

let onLine = true
beforeEach(() => {
  onLine = true
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => onLine)
})
afterEach(() => {
  vi.restoreAllMocks()
  auth.signInWithPassword.mockReset()
  auth.signOut.mockReset()
})

describe('signIn', () => {
  it('resolves when supabase signs the person in, and gives it the e-mail and the password as typed', async () => {
    auth.signInWithPassword.mockResolvedValue(SESSION)
    await expect(signIn('anna@firma.pl', 'haslo')).resolves.toBeUndefined()
    expect(auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: 'anna@firma.pl', password: 'haslo' })
  })

  it('wrong: a resolved `{ error }` for bad credentials is thrown as `wrong`', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: wrongPassword() })
    const error = await failure()
    expect(error.failure).toBe('wrong')
  })

  it('wrong is told by the error code, never by the message: the credentials message with another code is `failed`, another message with the credentials code is `wrong`', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: new AuthApiError('Invalid login credentials', 400, 'validation_failed') })
    const sameMessage = await failure()
    expect(sameMessage.failure).toBe('failed')
    expect(sameMessage.reason).toBe('Invalid login credentials')
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: new AuthApiError('Something else', 400, 'invalid_credentials') })
    const sameCode = await failure()
    expect(sameCode.failure).toBe('wrong')
    expect(sameCode.reason).toBeUndefined()
  })

  it('offline: a fetch `TypeError` (the browser\'s failed fetch) is thrown as `offline`', async () => {
    auth.signInWithPassword.mockRejectedValue(new TypeError('Failed to fetch'))
    const error = await failure()
    expect(error.failure).toBe('offline')
  })

  it('offline: the request supabase-js never got an answer for (`AuthRetryableFetchError`, status 0) is `offline`', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: new AuthRetryableFetchError('Failed to fetch', 0) })
    const error = await failure()
    expect(error.failure).toBe('offline')
  })

  it('offline: `navigator.onLine === false` makes an error that is not the credentials one `offline`', async () => {
    onLine = false
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: new AuthUnknownError('Unexpected', new Error('x')) })
    const error = await failure()
    expect(error.failure).toBe('offline')
  })

  it('wrong stays wrong when the device says it is offline: the server answered, so the connection was there', async () => {
    onLine = false
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: wrongPassword() })
    const error = await failure()
    expect(error.failure).toBe('wrong')
  })

  it('failed: any other `{ error }` is thrown as `failed` with its own message as the reason', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: new AuthApiError('Email not confirmed', 400, 'email_not_confirmed') })
    const error = await failure()
    expect(error.failure).toBe('failed')
    expect(error.reason).toBe('Email not confirmed')
  })

  it('failed: a server\'s 5xx answer (AuthRetryableFetchError with its status) is an answer, so `failed` with its reason, not `offline`', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: new AuthRetryableFetchError('Bad Gateway', 502) })
    const error = await failure()
    expect(error.failure).toBe('failed')
    expect(error.reason).toBe('Bad Gateway')
  })

  it('failed: a thrown error that is not a failed fetch is `failed` with its message', async () => {
    auth.signInWithPassword.mockRejectedValue(new Error('boom'))
    const error = await failure()
    expect(error.failure).toBe('failed')
    expect(error.reason).toBe('boom')
  })

  it('failed: something thrown that is not an Error has no message of its own, so its text is the reason', async () => {
    auth.signInWithPassword.mockRejectedValue('plain text')
    const error = await failure()
    expect(error.failure).toBe('failed')
    expect(error.reason).toBe('plain text')
  })

  it('wrong and offline carry no reason: the screen shows its own line for them, not the message', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: wrongPassword() })
    expect((await failure()).reason).toBeUndefined()
    auth.signInWithPassword.mockRejectedValue(new TypeError('Failed to fetch'))
    expect((await failure()).reason).toBeUndefined()
  })
})

// SPEC Screens as amended 2026-11-07 (DECISIONS 77): with no connection the person is signed out on this device anyway; any other failure is
// thrown as it came. supabase-js's `signOut({ scope: 'local' })` still asks the server and keeps the session when it gets no answer, so the
// service removes the stored session first and then calls it (authService.signOut.test.ts runs that on the real client). `asked` records, for
// each call to supabase-js's sign-out, its scope and whether the session was still stored on the device at that moment.
describe('signOut', () => {
  const KEY = 'sb-test-auth-token'
  const noAnswer = () => new AuthRetryableFetchError('Failed to fetch', 0)
  let asked: { scope: string | undefined; stored: boolean }[]

  /** supabase-js's sign-out, answering with each of `results` in turn (a thrown one is an error it throws), and then with success. */
  function signOutGives(...results: ({ error: unknown } | { throws: unknown })[]) {
    const queue = [...results]
    auth.signOut.mockImplementation(async (options?: { scope?: string }) => {
      asked.push({ scope: options?.scope, stored: localStorage.getItem(KEY) !== null })
      const next = queue.shift() ?? { error: null }
      if ('throws' in next) throw next.throws
      return next
    })
  }
  const normalThenLocal = [
    { scope: undefined, stored: true },
    { scope: 'local', stored: false },
  ]

  beforeEach(() => {
    asked = []
    localStorage.clear()
    localStorage.setItem(KEY, JSON.stringify({ access_token: 'a', refresh_token: 'r', expires_at: 1 }))
  })
  afterEach(() => localStorage.clear())

  it('resolves when supabase ends the session: it was asked once, with the default scope, and the device was left to supabase-js', async () => {
    signOutGives({ error: null })
    await expect(signOut()).resolves.toBeUndefined()
    expect(auth.signOut).toHaveBeenCalledExactlyOnceWith()
    expect(asked).toEqual([{ scope: undefined, stored: true }])
    expect(localStorage.getItem(KEY)).not.toBeNull()
  })

  it.each([
    ['a resolved `AuthRetryableFetchError` with status 0 (the request got no answer)', { error: new AuthRetryableFetchError('Failed to fetch', 0) }],
    ['a thrown fetch `TypeError`', { throws: new TypeError('Failed to fetch') }],
  ])('no connection, %s: the stored session is removed, supabase-js is asked to sign out with scope "local", and it resolves', async (_what, first) => {
    signOutGives(first)
    await expect(signOut()).resolves.toBeUndefined()
    // The normal sign-out first, with the session still stored; then the local one, after the stored session was taken out.
    expect(asked).toEqual(normalThenLocal)
    expect(auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'local' })
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('no connection: `navigator.onLine === false` makes any error that is not an answer one (an error that is not even a failed fetch)', async () => {
    onLine = false
    signOutGives({ error: new AuthUnknownError('Unexpected', new Error('x')) })
    await expect(signOut()).resolves.toBeUndefined()
    expect(asked).toEqual(normalThenLocal)
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('no connection removes this client\'s session and nothing else the device holds (the theme, another app\'s session)', async () => {
    localStorage.setItem('theme', 'dark')
    localStorage.setItem('sb-other-auth-token', 'another app\'s session')
    signOutGives({ error: noAnswer() })
    await expect(signOut()).resolves.toBeUndefined()
    expect(localStorage.getItem(KEY)).toBeNull()
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(localStorage.getItem('sb-other-auth-token')).toBe('another app\'s session')
  })

  it.each([
    ['a server error (`AuthRetryableFetchError` with its 502 status)', { error: new AuthRetryableFetchError('Bad Gateway', 502) }],
    ['a rate limit (`AuthApiError`, 429)', { error: new AuthApiError('Too many requests', 429, 'over_request_rate_limit') }],
    ['an answer supabase-js could not read (`AuthUnknownError`)', { error: new AuthUnknownError('Unexpected', new Error('x')) }],
    ['a thrown error that is not a failed fetch', { throws: new Error('boom') }],
  ])('a server that answered with an error, %s, is not "no connection": it is thrown as it came, once, and the session stays on the device', async (_what, first) => {
    signOutGives(first)
    const thrown = 'throws' in first ? first.throws : first.error
    await expect(signOut()).rejects.toBe(thrown)
    expect(asked).toEqual([{ scope: undefined, stored: true }])
    expect(auth.signOut).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem(KEY)).not.toBeNull()
  })

  it('when the sign-out on this device fails too, its error is thrown: the person is still signed in and the caller must not act as if they were out', async () => {
    const second = new AuthUnknownError('Unexpected', new Error('x'))
    signOutGives({ error: noAnswer() }, { error: second })
    await expect(signOut()).rejects.toBe(second)
    expect(asked).toEqual(normalThenLocal)
  })

  it('storage the page may not touch: the removal is skipped without a throw, the local sign-out is still asked for, and its error is what is thrown', async () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const second = noAnswer()
    signOutGives({ error: noAnswer() }, { error: second })
    await expect(signOut()).rejects.toBe(second)
    // The session was still stored when the local sign-out was asked for: it could not be removed.
    expect(asked).toEqual([
      { scope: undefined, stored: true },
      { scope: 'local', stored: true },
    ])
  })
})
