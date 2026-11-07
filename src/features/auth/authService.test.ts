// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthApiError, AuthRetryableFetchError, AuthUnknownError } from '@supabase/supabase-js'

// `signIn` is the one place a failed sign-in is classified (SPEC Screens as amended 2026-11-06; TASKS.md Decided 24): the e-mail or password
// is wrong, there is no connection, or something else failed, which carries its reason. supabase-js does not throw for a refused sign-in, it
// resolves with `{ error }`; a failed fetch is thrown. The fixtures are supabase-js's own error classes, built the way its client builds them
// (auth-js's fetch.js: a 400 `invalid_credentials` AuthApiError for a wrong password; an AuthRetryableFetchError with status 0 for a request
// that got no answer, and with the server's status for a 5xx answer), so what the classification reads is what the client really gives it.
// No Supabase project is reached: the client is stood in for at its boundary.
const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signOut: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ supabase: { auth } }))

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

describe('signOut', () => {
  it('resolves when supabase ends the session', async () => {
    auth.signOut.mockResolvedValue({ error: null })
    await expect(signOut()).resolves.toBeUndefined()
    expect(auth.signOut).toHaveBeenCalledTimes(1)
  })

  it('throws the error supabase resolves with: with no connection the session is kept, and the caller must not act as if it ended', async () => {
    const offline = new AuthRetryableFetchError('Failed to fetch', 0)
    auth.signOut.mockResolvedValue({ error: offline })
    await expect(signOut()).rejects.toBe(offline)
  })
})
