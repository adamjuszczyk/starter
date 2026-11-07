import type * as Real from '@app/features/auth/authService'
import { SignInError } from '@app/features/auth/authService'
import { applyState } from '../demo/seed'
import { base, useDemo } from '../demo/demoStore'

// Signing in and out, as the DEMO says. The real sign-in page runs unchanged: it calls `signIn`, and what it shows is what comes back:
//   wrong, offline   the call rejects with the real SignInError, so the page shows its own lines (SPEC Screens: signIn.wrong, signIn.offline);
//   pending          the call never ends, so the page stays in "Logowanie…";
//   idle             the call works and the person is let in (the app takes over, as when a session reaches AuthProvider).
// The error class is the real one (re-exported, so `instanceof` in the page holds and the fake cannot drift from it); this import is also what
// keeps the real src/lib/supabase.ts in the chain, which is why its swap matters (fakes/supabase.ts).
export { SignInError }

export const signIn: typeof Real.signIn = async () => {
  const { signIn: outcome } = useDemo.getState()
  if (outcome === 'pending') return new Promise<void>(() => {})
  if (outcome === 'wrong') throw new SignInError('wrong')
  if (outcome === 'offline') throw new SignInError('offline')
  applyState({ signedIn: true })
}

export const signOut: typeof Real.signOut = async () => {
  useDemo.getState().set({ ...base, signedIn: false })
}
