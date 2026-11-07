import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { queryClient } from '../../lib/queryClient'
import { signOut as endSession } from './authService'

// Lifted from Overload's useAuth.tsx: who is signed in, and the sign-out. Dropped: the wipe of Dexie's tables on sign-out (the starter has no
// offline store; the theme is a preference of the device and stays).
interface AuthContextValue {
  user: User | null
  /** True until the first read of the session: the app shows its spinner, not the sign-in page, so a signed-in person does not see it flash. */
  loading: boolean
  /** True while a sign-out is under way. Settings' button and the side menu's both read it, so both show it and neither is pressed twice. */
  signingOut: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signingOut: false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  // Tracks the active user id so cached data never leaks across accounts: the cache is cleared whenever auth state resolves to a different
  // user (including none).
  const prevUserId = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      prevUserId.current = session?.user?.id ?? null
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null
      if (nextUserId !== prevUserId.current) {
        queryClient.clear()
        prevUserId.current = nextUserId
      }
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    setSigningOut(true)
    try {
      // The session ends first, then the cache goes. `endSession` ends it on the server or, when the server's sign-out fails in any way or the
      // browser reports itself offline, on this device alone, and resolves (authService.signOut, SPEC Screens as amended 2026-11-07, DECISIONS
      // 82, 83), so every case runs the same lines: SIGNED_OUT reaches the listener above and the sign-in screen shows, the cache is cleared, and
      // both sign-out buttons, which read `signingOut`, show the same pending state. A sign-out that fails clears nothing, because the person
      // is still signed in.
      await endSession()
      queryClient.clear()
    } catch {
      // Only a sign-out on this device that failed too gets here (authService.signOut says what can make it fail): the session is still on the
      // device. The person is still signed in, so the screen stays as it is and the button goes back to normal. SPEC names no message for it.
    } finally {
      setSigningOut(false)
    }
  }

  return <AuthContext.Provider value={{ user, loading, signingOut, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
