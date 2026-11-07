import { act, render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { vi } from 'vitest'
import { WidthRoot } from '../lib/useWide'

// Test support: the app's frame, in jsdom. A panel, a dialog and a toast are drawn into the frame's overlay root (src/lib/useWide.tsx,
// TASKS.md Decided 6), so a test of one mounts it inside a `WidthRoot`. jsdom lays nothing out (clientWidth is 0) and has no ResizeObserver,
// so the width the frame measures is one the test sets, and the observer is a stand-in that a test fires, as the browser would when the box
// is resized (`resizeFrame`). Not read by the wording check (src/testing/); the tokens check reads it, and it writes no value.

let width = 1280
const observers = new Set<() => void>()

function stubTheBrowser() {
  vi.stubGlobal(
    'ResizeObserver',
    class {
      callback: () => void
      constructor(callback: () => void) {
        this.callback = callback
      }
      observe() {
        observers.add(this.callback)
      }
      unobserve() {}
      disconnect() {
        observers.delete(this.callback)
      }
    },
  )
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })
}

function Frame({ children }: { children: ReactNode }) {
  return <WidthRoot className="h-full">{children}</WidthRoot>
}

/** Renders `ui` inside the app's frame at the given width (1280 px, the desktop's, unless told: 390 is the phone's). `rerender` keeps the frame. */
export function renderInFrame(ui: ReactElement, { width: frameWidth = 1280 }: { width?: number } = {}) {
  stubTheBrowser()
  width = frameWidth
  return render(ui, { wrapper: Frame })
}

/** The frame is resized: it measures the new width and tells everything inside it. */
export function resizeFrame(next: number) {
  act(() => {
    width = next
    observers.forEach((callback) => callback())
  })
}
