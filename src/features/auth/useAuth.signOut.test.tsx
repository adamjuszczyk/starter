// @vitest-environment jsdom
// Lifted from Overload's useAuth.signOut.test.tsx, which ran the real `signOut` and pinned what it does and in what order (Supabase signs out
// first, then the cache is cleared, then Dexie's tables are wiped). The starter has no Dexie and its sign-out wipes nothing but the cache, so
// this keeps the order and the cache, and adds what the starter's sign-out also decides: a user change clears the cache (so data never leaks
// from one account to the next), and a sign-out that fails clears nothing and leaves the person signed in (TASKS.md, chunk 4). Since SPEC
// Screens' amendment of 2026-11-07 (DECISIONS 77, 82, 83) a sign-out whose server side fails in any way, or that starts with the browser offline,
// is not one that fails: the person is signed out on this device (authService.signOut), and the provider does what it does after any
// sign-out; only a sign-out on this device that fails too leaves the person signed in. The mock tells the listener, as the real client does
// once it has removed a session; authService.signOut.test.ts and App.signOut.test.tsx run it on the real client.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'

type Session = { user: { id: string } } | null
const calls = vi.hoisted(() => ({
  order: [] as string[],
  /** What Supabase's sign-out resolves with. */
  signOutResult: { error: null } as { error: unknown },
  /** What its sign-out with scope 'local' resolves with, and whether it tells the listeners that the session is gone (the real one does). */
  localResult: { error: null } as { error: unknown },
  announceLocal: true,
  /** The sign-out with scope 'local' while it is still running. */
  holdLocal: Promise.resolve() as Promise<void>,
  /** A sign-out that is still waiting for the server. */
  hold: Promise.resolve() as Promise<void>,
  onAuthChange: null as null | ((event: string, session: Session) => void),
}))
vi.mock('../../lib/supabase', () => ({
  AUTH_STORAGE_KEY: 'sb-test-auth-token',
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
      onAuthStateChange: (callback: (event: string, session: Session) => void) => {
        calls.onAuthChange = callback
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signOut: async (options?: { scope?: string }) => {
        if (options?.scope === 'local') {
          calls.order.push('auth.signOut(local)')
          await calls.holdLocal
          if (calls.announceLocal) calls.onAuthChange?.('SIGNED_OUT', null)
          return calls.localResult
        }
        calls.order.push('auth.signOut')
        await calls.hold
        return calls.signOutResult
      },
    },
  },
}))
vi.mock('../../lib/queryClient', () => ({ queryClient: { clear: () => void calls.order.push('queryClient.clear') } }))

const { AuthProvider, useAuth } = await import('./useAuth')

beforeEach(() => {
  calls.order.length = 0
  calls.signOutResult = { error: null }
  calls.localResult = { error: null }
  calls.announceLocal = true
  calls.holdLocal = Promise.resolve()
  calls.hold = Promise.resolve()
  calls.onAuthChange = null
})
afterEach(() => vi.restoreAllMocks())

async function mount() {
  const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>
  const hook = renderHook(() => useAuth(), { wrapper })
  await waitFor(() => expect(hook.result.current.loading).toBe(false))
  return hook
}

describe('sign-out', () => {
  it('does nothing else: the session ends first, then the query cache is cleared', async () => {
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut', 'queryClient.clear'])
  })

  it('is pending while the server has not answered, for every reader of the context, and not after', async () => {
    let answer: () => void = () => {}
    calls.hold = new Promise<void>((resolve) => {
      answer = resolve
    })
    const { result } = await mount()
    expect(result.current.signingOut).toBe(false)

    let finished: Promise<void> = Promise.resolve()
    act(() => {
      finished = result.current.signOut()
    })
    expect(result.current.signingOut).toBe(true)
    expect(calls.order).toEqual(['auth.signOut'])

    await act(async () => {
      answer()
      await finished
    })
    expect(result.current.signingOut).toBe(false)
  })
})

// SPEC Screens as amended 2026-11-07 (DECISIONS 82, 83): whatever the failure of the server's sign-out, the person is signed out on this device,
// and when the browser reports itself offline the server is not asked. The provider runs the same lines in every case.
describe('sign-out when the server\'s sign-out fails: the person is signed out on this device', () => {
  const FAILURES: [string, () => unknown][] = [
    ['no connection (`AuthRetryableFetchError`, status 0)', () => new AuthRetryableFetchError('Failed to fetch', 0)],
    ['a server error (`AuthRetryableFetchError`, 502)', () => new AuthRetryableFetchError('Bad Gateway', 502)],
    ['a rate limit (`AuthApiError`, 429)', () => new AuthApiError('Too many requests', 429, 'over_request_rate_limit')],
  ]
  const noAnswer = () => new AuthRetryableFetchError('Failed to fetch', 0)

  it.each(FAILURES)('%s: runs the lines of any sign-out in the same order: the session ends, then the query cache is cleared, and nothing else', async (_what, failure) => {
    calls.signOutResult = { error: failure() }
    // Nothing tells the listener here, so the clear after the session ended is the only one: the line under test.
    calls.announceLocal = false
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut', 'auth.signOut(local)', 'queryClient.clear'])
    expect(result.current.signingOut).toBe(false)
  })

  it.each(FAILURES)('%s: the person lands on the sign-in screen: the session becomes null (SIGNED_OUT reaches the provider, as it does online), the cache is cleared, the pending state goes', async (_what, failure) => {
    calls.signOutResult = { error: failure() }
    const { result } = await mount()
    expect(result.current.user).toEqual({ id: 'u1' })

    await act(async () => {
      await result.current.signOut()
    })

    // The listener clears the cache when the user changes, and the sign-out clears it once the session has ended.
    expect(calls.order).toEqual(['auth.signOut', 'auth.signOut(local)', 'queryClient.clear', 'queryClient.clear'])
    expect(result.current.user).toBeNull()
    expect(result.current.signingOut).toBe(false)
  })

  it('is pending from the press to the end of the sign-out on this device, for every reader of the context, and not after', async () => {
    let answer: () => void = () => {}
    let finishLocal: () => void = () => {}
    calls.signOutResult = { error: noAnswer() }
    calls.hold = new Promise<void>((resolve) => {
      answer = resolve
    })
    calls.holdLocal = new Promise<void>((resolve) => {
      finishLocal = resolve
    })
    const { result } = await mount()

    let finished: Promise<void> = Promise.resolve()
    act(() => {
      finished = result.current.signOut()
    })
    expect(result.current.signingOut).toBe(true)

    // The server has not answered yet.
    expect(calls.order).toEqual(['auth.signOut'])
    expect(result.current.signingOut).toBe(true)

    // It answers with a failure: the sign-out on this device is under way, and the state has not gone.
    await act(async () => {
      answer()
      await waitFor(() => expect(calls.order).toEqual(['auth.signOut', 'auth.signOut(local)']))
    })
    expect(result.current.signingOut).toBe(true)
    expect(result.current.user).toEqual({ id: 'u1' })

    await act(async () => {
      finishLocal()
      await finished
    })
    expect(result.current.signingOut).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('a sign-out on this device that fails too clears nothing and leaves the person signed in (the only way a sign-out now fails)', async () => {
    calls.signOutResult = { error: new AuthRetryableFetchError('Bad Gateway', 502) }
    calls.localResult = { error: noAnswer() }
    calls.announceLocal = false
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut', 'auth.signOut(local)'])
    expect(result.current.user).toEqual({ id: 'u1' })
    expect(result.current.signingOut).toBe(false)
  })
})

describe('sign-out when the browser reports itself offline: the server is not asked', () => {
  beforeEach(() => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
  })

  it('runs the lines of any sign-out without the first one: the session ends on this device, then the query cache is cleared, and nothing else', async () => {
    calls.announceLocal = false
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut(local)', 'queryClient.clear'])
    expect(result.current.signingOut).toBe(false)
  })

  it('the person lands on the sign-in screen: the session becomes null, the cache is cleared, the pending state goes', async () => {
    const { result } = await mount()
    expect(result.current.user).toEqual({ id: 'u1' })

    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut(local)', 'queryClient.clear', 'queryClient.clear'])
    expect(result.current.user).toBeNull()
    expect(result.current.signingOut).toBe(false)
  })

  it('is pending while the sign-out on this device runs, and not after', async () => {
    let finishLocal: () => void = () => {}
    calls.holdLocal = new Promise<void>((resolve) => {
      finishLocal = resolve
    })
    const { result } = await mount()

    let finished: Promise<void> = Promise.resolve()
    act(() => {
      finished = result.current.signOut()
    })
    expect(result.current.signingOut).toBe(true)
    expect(result.current.user).toEqual({ id: 'u1' })

    await act(async () => {
      finishLocal()
      await finished
    })
    expect(result.current.signingOut).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('a sign-out on this device that fails clears nothing and leaves the person signed in', async () => {
    calls.localResult = { error: new AuthRetryableFetchError('Failed to fetch', 0) }
    calls.announceLocal = false
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut(local)'])
    expect(result.current.user).toEqual({ id: 'u1' })
    expect(result.current.signingOut).toBe(false)
  })
})

describe('a change of user clears the query cache', () => {
  it('a different user, and nobody (signed out elsewhere), clear it; the same user (a token refresh) does not', async () => {
    const { result } = await mount()
    expect(calls.order).toEqual([])

    act(() => calls.onAuthChange?.('TOKEN_REFRESHED', { user: { id: 'u1' } }))
    expect(calls.order).toEqual([])

    act(() => calls.onAuthChange?.('SIGNED_IN', { user: { id: 'u2' } }))
    expect(calls.order).toEqual(['queryClient.clear'])
    expect(result.current.user).toEqual({ id: 'u2' })

    act(() => calls.onAuthChange?.('SIGNED_OUT', null))
    expect(calls.order).toEqual(['queryClient.clear', 'queryClient.clear'])
    expect(result.current.user).toBeNull()
  })
})
