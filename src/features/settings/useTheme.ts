import { useLayoutEffect, useSyncExternalStore } from 'react'

// The theme, per device (TASKS.md, Data models; Decided 23): `system` follows the device, `light` and `dark` are a choice made in Settings.
//   - One localStorage key, `theme`; its value is read once, the first time anything asks, and written when the choice changes.
//   - Every storage access is in a try/catch: in a private window or with site data blocked the accessor itself can throw, and the theme then
//     reads as `system` and a choice applies for this visit and does not persist. A value that is not one of the three reads as `system`.
//   - Applied as `data-theme="light"` or `"dark"` on <html>. `system` removes the attribute, so tokens.css's `prefers-color-scheme` rule
//     decides. It is never a table: a device preference.
// The state is one value shared by every caller (Settings shows and changes it; `AppRoutes` applies it, above everything the app draws, so the
// sign-in page and the spinner wear it too), which is why it is a small store and not state in each hook.
export type Theme = 'system' | 'light' | 'dark'

const KEY = 'theme'

const isTheme = (value: unknown): value is Theme => value === 'system' || value === 'light' || value === 'dark'

function readStored(): Theme {
  try {
    const value = localStorage.getItem(KEY)
    return isTheme(value) ? value : 'system'
  } catch {
    return 'system'
  }
}

function writeStored(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // Not stored: the choice holds until the app is closed, and the device decides after that.
  }
}

function applyToPage(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

let current: Theme | null = null // null until the first read
const listeners = new Set<() => void>()

function getTheme(): Theme {
  if (current === null) current = readStored()
  return current
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setTheme(theme: Theme): void {
  current = theme
  writeStored(theme)
  listeners.forEach((listener) => listener())
}

/** For tests: the next read starts from the stored value again, as a new run of the app would. */
export function resetTheme(): void {
  current = null
}

export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getTheme)
  // In a layout effect, so the theme is in place before the first paint after the app starts.
  useLayoutEffect(() => {
    applyToPage(theme)
  }, [theme])
  return { theme, setTheme }
}
