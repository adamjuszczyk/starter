import { isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js'
import { AUTH_STORAGE_KEY, supabase } from '../../lib/supabase'

// Signing in and out, around the Supabase client: the one place a screen's sign-in reaches it (SPEC Rule 4, TASKS.md Decided 7).
//
// Sign-in has three ways to fail, and the screen shows a line for each (SPEC Screens as amended 2026-11-06, TASKS.md Decided 24):
//   wrong    the e-mail or the password is not right. The one failure the server itself answers with a sign-in's own code, so it is the
//            only one told apart by that code (`invalid_credentials`), never by its message.
//   offline  the request got no answer: the device has no connection (`navigator.onLine` says so) or the fetch failed. A first version of the
//            screen showed every failure as "wrong password", which told an offline person their password was wrong.
//   failed   anything else, with the reason the server or the browser gave (a rate limit, an account that is not confirmed, a server error),
//            which the screen shows after its own line and never alone.
// supabase-js does not throw for a refused sign-in: it resolves with `{ error }`. A thrown error is a failed fetch. `signIn` takes both to the
// same place and throws a `SignInError` for either, so the screen has one path to its three lines.
export type SignInFailure = 'wrong' | 'offline' | 'failed'

export class SignInError extends Error {
  readonly failure: SignInFailure
  /** What the server or the browser said, for `failed`: the screen shows it after its own line. The message of the others is not shown. */
  readonly reason: string | undefined

  constructor(failure: SignInFailure, reason?: string) {
    super(reason ?? failure)
    this.name = new.target.name
    this.failure = failure
    this.reason = reason
  }
}

/** supabase-js's code for an e-mail and password that do not match (a 400 from the sign-in endpoint). */
const INVALID_CREDENTIALS = 'invalid_credentials'

/**
 * A request that was never answered. supabase-js wraps the failed fetch in `AuthRetryableFetchError` with status 0; the same class also
 * wraps a server's 5xx answer, which is an answer (the server is reachable and says why it failed), so it is a `failed` with its reason,
 * not "no connection". A bare `TypeError` is what `fetch` itself rejects with when something outside supabase-js's wrapping fails.
 */
function isFetchFailure(error: unknown): boolean {
  if (isAuthRetryableFetchError(error)) return error.status === 0
  return error instanceof TypeError
}

/**
 * The server could not be reached: the request got no answer, or the device itself says it has no connection (DECISIONS 65). One rule for a
 * sign-in, which shows `offline`, and a sign-out, which then signs out on this device alone.
 */
function hasNoAnswer(error: unknown): boolean {
  return isFetchFailure(error) || navigator.onLine === false
}

function classify(error: unknown): SignInError {
  if (isAuthApiError(error) && error.code === INVALID_CREDENTIALS) return new SignInError('wrong')
  if (hasNoAnswer(error)) return new SignInError('offline')
  const reason = error instanceof Error ? error.message : String(error)
  return new SignInError('failed', reason || undefined)
}

/** Signs in with an e-mail and a password. Resolves when it worked (the session then reaches `useAuth`); throws a `SignInError` when not. */
export async function signIn(email: string, password: string): Promise<void> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  } catch (error) {
    // The refused sign-in resolved with `{ error }` and was thrown on the line above; a failed fetch was thrown by supabase-js itself.
    throw classify(error)
  }
}

/** supabase-js's own sign-out. Resolves with what went wrong, or null; a thrown error is taken the same way as a resolved `{ error }`. */
async function askServerToSignOut(): Promise<{ error: unknown } | null> {
  try {
    const { error } = await supabase.auth.signOut()
    return error ? { error } : null
  } catch (error) {
    return { error }
  }
}

/**
 * Ends the session on this device without the server. supabase-js's `signOut({ scope: 'local' })` is not that by itself: it still asks the
 * server first, and with no answer it returns the error and keeps the session, as the default scope does (auth-js 2.110.0, `_signOut`;
 * authService.signOut.test.ts shows it on the real client). So the stored session is removed first. With none stored, `signOut({ scope:
 * 'local' })` has nothing to ask the server about and does the rest itself: it removes what else it keeps and tells the app (SIGNED_OUT),
 * which is how `useAuth` clears the cache and the sign-in screen shows, as after any sign-out. The session stays valid on the server until it
 * expires: with no connection there is no way to end it there.
 */
async function signOutOnThisDevice(): Promise<void> {
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Storage the browser will not let the page touch: supabase-js keeps the session in memory then, and the local sign-out below finds it,
    // asks the server and fails as the first sign-out did. The person is still signed in, and this throws.
  }
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
}

/**
 * Signs out. The server is asked to end the session first, as supabase-js does it. When the server cannot be reached (the same "no answer"
 * as a sign-in's `offline`) the person is signed out on this device anyway and this resolves: on a shared computer a sign-out that silently
 * does nothing leaves the next person in someone else's account (SPEC Screens as amended 2026-11-07, DECISIONS 77). Any other failure, a
 * server that answered with an error, is thrown as it came: the session is still on this device, so the caller must not act as if it ended.
 */
export async function signOut(): Promise<void> {
  const failure = await askServerToSignOut()
  if (!failure) return
  if (!hasNoAnswer(failure.error)) throw failure.error
  await signOutOnThisDevice()
}
