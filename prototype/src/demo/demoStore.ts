import { create } from 'zustand'

// The prototype's state, switched from the DEMO menu (lifted from Overload's
// prototype/src/demo/demoStore.ts). In the real starter these are the app's
// screens, query states and settings; here one store fakes them.

export type Screen = 'signIn' | 'clients' | 'settings' | 'system'
export type ListState = 'full' | 'empty' | 'loading' | 'error'
export type FormState = 'idle' | 'invalid' | 'saving' | 'failed'
export type SignInState = 'idle' | 'wrong' | 'offline' | 'pending'
export type Theme = 'system' | 'light' | 'dark'
export type Frame = 'fill' | 'phone'

interface DemoState {
  screen: Screen
  list: ListState
  online: boolean
  panel: null | 'new' | 'edit'
  form: FormState
  confirmDelete: boolean
  toast: string | null
  fresh: boolean
  signIn: SignInState
  theme: Theme
  frame: Frame
  menuOpen: boolean
  set: (patch: Partial<Omit<DemoState, 'set'>>) => void
}

export const base = {
  screen: 'clients' as Screen,
  list: 'full' as ListState,
  online: true,
  panel: null,
  form: 'idle' as FormState,
  confirmDelete: false,
  toast: null,
  fresh: false,
  signIn: 'idle' as SignInState,
}

export const useDemo = create<DemoState>((set) => ({
  ...base,
  theme: 'system',
  frame: 'fill',
  menuOpen: false,
  set: (patch) => set(patch),
}))
