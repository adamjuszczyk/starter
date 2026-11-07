// @vitest-environment jsdom
// Lifted from Overload's useAuth.signOut.test.tsx, which ran the real `signOut` and pinned what it does and in what order (Supabase signs out
// first, then the cache is cleared, then Dexie's tables are wiped). The starter has no Dexie and its sign-out wipes nothing but the cache, so
// this keeps the order and the cache, and adds what the starter's sign-out also decides: a user change clears the cache (so data never leaks
// from one account to the next), and a sign-out that fails clears nothing and leaves the person signed in (TASKS.md, chunk 4). Since SPEC
// Screens' amendment of 2026-11-07 (DECISIONS 77) a sign-out with no connection is not one that fails: the person is signed out on this device
// (authService.signOut), and the provider does what it does after any sign-out. The mock tells the listener, as the real client does once it has
// removed a session; authService.signOut.test.ts and App.signOut.test.tsx run it on the real client.
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

  it('a sign-out the server answered with an error (the session is kept) clears nothing, leaves the person signed in, and the pending state goes', async () => {
    calls.signOutResult = { error: new AuthRetryableFetchError('Bad Gateway', 502) }
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut'])
    expect(result.current.user).toEqual({ id: 'u1' })
    expect(result.current.signingOut).toBe(false)
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

describe('sign-out with no connection: the person is signed out on this device', () => {
  const noAnswer = () => new AuthRetryableFetchError('Failed to fetch', 0)

  it('runs the lines of any sign-out in the same order: the session ends, then the query cache is cleared, and nothing else', async () => {
    calls.signOutResult = { error: noAnswer() }
    // Nothing tells the listener here, so the clear after the session ended is the only one: the line under test.
    calls.announceLocal = false
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut', 'auth.signOut(local)', 'queryClient.clear'])
    expect(result.current.signingOut).toBe(false)
  })

  it('the person lands on the sign-in screen: the session becomes null (SIGNED_OUT reaches the provider, as it does online), the cache is cleared, the pending state goes', async () => {
    calls.signOutResult = { error: noAnswer() }
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

    // It answers with nothing (the request failed): the sign-out on this device is under way, and the state has not gone.
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

  it('a device that says it is offline makes an error that is not even a failed fetch "no connection" (the same rule as the sign-in\'s)', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    calls.signOutResult = { error: new AuthApiError('Too many requests', 429, 'over_request_rate_limit') }
    const { result } = await mount()
    await act(async () => {
      await result.current.signOut()
    })

    expect(calls.order).toEqual(['auth.signOut', 'auth.signOut(local)', 'queryClient.clear', 'queryClient.clear'])
    expect(result.current.user).toBeNull()
  })

  it('a sign-out on this device that fails too clears nothing and leaves the person signed in', async () => {
    calls.signOutResult = { error: noAnswer() }
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
