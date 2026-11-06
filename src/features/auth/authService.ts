import { isAuthApiError, isAuthRetryableFetchError } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'

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

function classify(error: unknown): SignInError {
  if (isAuthApiError(error) && error.code === INVALID_CREDENTIALS) return new SignInError('wrong')
  if (isFetchFailure(error) || navigator.onLine === false) return new SignInError('offline')
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

/**
 * Signs out. Throws the error supabase-js resolves with: a sign-out asks the server to end the session, and with no connection the request
 * fails and supabase-js keeps the session, so the person is still signed in and the caller must not act as if they were out.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
