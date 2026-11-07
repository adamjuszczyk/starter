import { create } from 'zustand'

// The one message the toast shows (Overload's toastStore.ts, as it was). Anywhere in the app: `useToastStore.getState().show(t.common.saved)`;
// the toast (src/components/Toast.tsx) draws it and clears it after 3 seconds. A new message replaces the one on show.
interface ToastState {
  message: string | null
  show: (message: string) => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message) => set({ message }),
  clear: () => set({ message: null }),
}))
