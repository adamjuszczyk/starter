// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'
import { resetTheme, useTheme } from './useTheme'

// The theme is per device (TASKS.md, Data models; Decided 23): one localStorage key, `theme`, with `system`, `light` or `dark`; `system` takes
// `data-theme` off <html>, so tokens.css's `prefers-color-scheme` rule decides; every storage access is in a try/catch. jsdom has a real
// localStorage; `resetTheme()` makes the next hook read it again, as a new run of the app would.
const html = document.documentElement

beforeEach(() => {
  localStorage.clear()
  html.removeAttribute('data-theme')
  resetTheme()
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('reading the key', () => {
  it('reads what is stored and applies it to <html>', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(html.getAttribute('data-theme')).toBe('dark')
  })

  it('reads `system` with nothing stored, and leaves <html> alone so the device decides', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
    expect(html.hasAttribute('data-theme')).toBe(false)
  })

  it('reads a value that is not one of the three as `system`', () => {
    localStorage.setItem('theme', 'sepia')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
    expect(html.hasAttribute('data-theme')).toBe(false)
  })
})

describe('writing the key', () => {
  it('writes the choice, applies it, and a new run of the app reads it back', () => {
    const first = renderHook(() => useTheme())
    act(() => first.result.current.setTheme('light'))
    expect(localStorage.getItem('theme')).toBe('light')
    expect(html.getAttribute('data-theme')).toBe('light')
    expect(first.result.current.theme).toBe('light')
    first.unmount()

    html.removeAttribute('data-theme')
    resetTheme()
    const second = renderHook(() => useTheme())
    expect(second.result.current.theme).toBe('light')
    expect(html.getAttribute('data-theme')).toBe('light')
  })

  it('`system` removes data-theme from <html> and is what is stored', () => {
    localStorage.setItem('theme', 'dark')
    const { result } = renderHook(() => useTheme())
    expect(html.getAttribute('data-theme')).toBe('dark')

    act(() => result.current.setTheme('system'))
    expect(html.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('system')
  })

  it('is one value for every caller: Settings changes it and the hook that applies it (App) follows', () => {
    const app = renderHook(() => useTheme())
    const settings = renderHook(() => useTheme())
    act(() => settings.result.current.setTheme('dark'))
    expect(app.result.current.theme).toBe('dark')
    expect(html.getAttribute('data-theme')).toBe('dark')
  })
})

describe('storage that is not there', () => {
  it('a storage that throws on every read and write reads as `system` and does not crash', () => {
    // A dark theme is stored; a read that fails must not find it.
    localStorage.setItem('theme', 'dark')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
    expect(html.hasAttribute('data-theme')).toBe(false)

    // The choice simply does not persist: it holds for this visit.
    act(() => result.current.setTheme('dark'))
    expect(result.current.theme).toBe('dark')
    expect(html.getAttribute('data-theme')).toBe('dark')
  })

  it('a localStorage whose accessor itself throws (blocked site data) is the same', () => {
    localStorage.setItem('theme', 'dark')
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('system')
    act(() => result.current.setTheme('light'))
    expect(result.current.theme).toBe('light')
    expect(html.getAttribute('data-theme')).toBe('light')
  })
})
