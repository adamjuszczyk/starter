import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { useAuth as RealUseAuth } from '@app/features/auth/useAuth'
import { useDemo } from '../demo/demoStore'
import { signOut } from './authService'

// Who is signed in: Anna, until a DEMO state says nobody (then the real sign-in page shows). Lifted from Overload's prototype/src/fakes/useAuth.tsx,
// which was always signed in; the starter's kit renders the sign-in page too (TASKS.md Decided 3).
const USER = { id: 'proto-user', email: 'anna@firma.pl' } as unknown as User

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export const useAuth: typeof RealUseAuth = () => {
  const signedIn = useDemo((s) => s.signedIn)
  return { user: signedIn ? USER : null, loading: false, signingOut: false, signOut }
}
