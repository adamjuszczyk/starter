import { useLayoutEffect } from 'react'
import type { useTheme as RealUseTheme } from '@app/features/settings/useTheme'
import { useDemo } from '../demo/demoStore'

// The theme: the demo store's, which the DEMO menu's THEME row and Settings' own radio both set. It does what the real hook does to the page,
// `data-theme` on <html>, and none of what it does to the device (no localStorage: a kit has no device to remember for).
//
// Where the page host set a theme of its own (a published page's host can), "as on the device" goes back to that one and not to the browser's
// (LEARNINGS L6, the other half: the host's styles beat the app's).
const HOST_THEME = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null

export const useTheme: typeof RealUseTheme = () => {
  const theme = useDemo((s) => s.theme)
  useLayoutEffect(() => {
    const root = document.documentElement
    const value = theme === 'system' ? HOST_THEME : theme
    if (value) root.setAttribute('data-theme', value)
    else root.removeAttribute('data-theme')
  }, [theme])
  return { theme, setTheme: (next) => useDemo.getState().set({ theme: next }) }
}
