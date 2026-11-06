// @vitest-environment jsdom
// Lifted from Overload's useAuth.signOut.test.tsx, which ran the real `signOut` and pinned what it does and in what order (Supabase signs out
// first, then the cache is cleared, then Dexie's tables are wiped). The starter has no Dexie and its sign-out wipes nothing but the cache, so
// this keeps the order and the cache, and adds what the starter's sign-out also decides: a user change clears the cache (so data never leaks
// from one account to the next), and a sign-out that fails clears nothing and leaves the person signed in (TASKS.md, chunk 4).
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

type Session = { user: { id: string } } | null
const calls = vi.hoisted(() => ({
  order: [] as string[],
  /** What Supabase's sign-out resolves with. */
  signOutResult: { error: null } as { error: unknown },
  /** A sign-out that is still waiting for the server. */
  hold: Promise.resolve() as Promise<void>,
  onAuthChange: null as null | ((event: string, session: Session) => void),
}))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }),
      onAuthStateChange: (callback: (event: string, session: Session) => void) => {
        calls.onAuthChange = callback
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
      signOut: async () => {
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
  calls.hold = Promise.resolve()
  calls.onAuthChange = null
})

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

  it('a sign-out that fails (no connection: the session is kept) clears nothing, leaves the person signed in, and the pending state goes', async () => {
    calls.signOutResult = { error: new Error('Failed to fetch') }
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
