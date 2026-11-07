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
      // The session ends first, then the cache goes. With no connection `endSession` ends the session on this device alone and resolves
      // (authService.signOut, SPEC Screens as amended 2026-11-07), so that case runs the same lines as any sign-out: SIGNED_OUT reaches the
      // listener above and the sign-in screen shows, the cache is cleared, and both sign-out buttons, which read `signingOut`, show the same
      // pending state. A sign-out that fails clears nothing, because the person is still signed in.
      await endSession()
      queryClient.clear()
    } catch {
      // Only a failure that is not "no connection" gets here: a server that answered with an error, which leaves the session on this device
      // (authService.signOut says why). The person is still signed in, so the screen stays as it is and the button goes back to normal. SPEC
      // names no message for it.
    } finally {
      setSigningOut(false)
    }
  }

  return <AuthContext.Provider value={{ user, loading, signingOut, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
