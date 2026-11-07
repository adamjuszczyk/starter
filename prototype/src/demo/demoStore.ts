import { create } from 'zustand'
import type { Theme } from '@app/features/settings/useTheme'

// The kit's state, switched from the DEMO menu (lifted from Overload's prototype/src/demo/demoStore.ts, as the spec chat's prototype amended it).
// The real app shows what the fakes in src/fakes say: whether anyone is signed in (useAuth), whether the connection is there (useOnlineStatus),
// the theme (useTheme) and how a sign-in ends (authService). The example screens in src/examples read the rest. `base` is the world every DEMO
// state starts from; a state is `base` with a few changes (demo/DemoMenu.tsx, applyState in demo/seed.ts).

export type { Theme }
export type ListState = 'full' | 'empty' | 'loading' | 'error'
export type FormState = 'idle' | 'invalid' | 'saving' | 'failed'
export type SignInState = 'idle' | 'wrong' | 'offline' | 'pending'
export type Frame = 'fill' | 'phone'

/** What a DEMO state sets. The theme and the frame are the menu's own and stay as they are when a state is applied. */
export interface DemoValues {
  /** False shows the real sign-in page: the fake useAuth has no user. */
  signedIn: boolean
  /** The design-system page, shown in place of the Klienci list inside the example's tab (a DEMO-only view, not a tab and not a route). */
  design: boolean
  /** What the Klienci list's data is: the cache holds the nine clients, none, nothing yet (loading) or an error (demo/seed.ts). */
  list: ListState
  /** False: the fake useOnlineStatus says there is no connection, so the real offline strip shows and the example's Save is off. */
  online: boolean
  /** The example's Klient form, open as a new client or an existing one. */
  panel: null | 'new' | 'edit'
  /** How the form starts: empty, with its errors showing, saving, or with the failed line. The fake save then does the same (clientsService.fake.ts). */
  form: FormState
  /** The delete confirmation over the form. */
  confirmDelete: boolean
  /** A message shown through the real toast store, as a save that worked would. */
  toast: string | null
  /** "New app: what you get": the Settings tab only, without the example's tab. */
  fresh: boolean
  /** How a sign-in ends: the fake authService rejects with `wrong` or `offline`, stays pending, or lets the person in. */
  signIn: SignInState
}

interface DemoState extends DemoValues {
  theme: Theme
  frame: Frame
  menuOpen: boolean
  /** How many states the menu has applied. App.tsx draws the app afresh for each (it keys AppRoutes by this), so a state never inherits what the one before left on screen. */
  applied: number
  set: (patch: Partial<Omit<DemoState, 'set'>>) => void
}

export const base: DemoValues = {
  signedIn: true,
  design: false,
  list: 'full',
  online: true,
  panel: null,
  form: 'idle',
  confirmDelete: false,
  toast: null,
  fresh: false,
  signIn: 'idle',
}

export const useDemo = create<DemoState>((set) => ({
  ...base,
  theme: 'system',
  frame: 'fill',
  menuOpen: false,
  applied: 0,
  set: (patch) => set(patch),
}))
