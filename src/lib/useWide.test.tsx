// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { createPortal } from 'react-dom'
import { WidthRoot, useOverlayRoot, useWide } from './useWide'

// What the frame hands to the components inside it: whether the layout is the desktop's, and the element an overlay is drawn into
// (TASKS.md, Decided 6: chunk 6's Panel, ConfirmDialog and Toast portal into it, so a `position: fixed` overlay stays inside the kit's phone
// frame). The 899/900 switch itself is proven where it shows, in AppShell.test.tsx. jsdom has no layout, so the width is one a test sets.
let width = 1280
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })

function Probe() {
  const wide = useWide()
  const overlayRoot = useOverlayRoot()
  return (
    <div data-testid="probe" data-wide={String(wide)}>
      {overlayRoot && createPortal(<div data-testid="overlay">AN OVERLAY</div>, overlayRoot)}
    </div>
  )
}

beforeEach(() => {
  width = 1280
})
afterEach(() => cleanup())

describe('outside a frame', () => {
  it('the layout is the desktop\'s and there is no overlay root', () => {
    render(<Probe />)
    expect(screen.getByTestId('probe').getAttribute('data-wide')).toBe('true')
    expect(screen.queryByTestId('overlay')).toBeNull()
  })
})

describe('WidthRoot', () => {
  it('gives the components inside it the width it measured', () => {
    width = 390
    render(
      <WidthRoot>
        <Probe />
      </WidthRoot>,
    )
    expect(screen.getByTestId('probe').getAttribute('data-wide')).toBe('false')
  })

  it('hands out the element that carries transform: translateZ(0) as the overlay root, inside the measured box', () => {
    const { container } = render(
      <WidthRoot className="frame-box">
        <Probe />
      </WidthRoot>,
    )
    const box = container.querySelector('[data-layout]') as HTMLElement
    const overlay = screen.getByTestId('overlay')
    // The overlay was drawn into the frame element: the box's only child, which is the containing block of a fixed overlay.
    const frame = overlay.parentElement as HTMLElement
    expect(frame.style.transform).toBe('translateZ(0)')
    expect(frame.parentElement).toBe(box)
    expect(box.className).toBe('frame-box')
    // ...and not into <body> directly, where a fixed overlay would leave a phone frame.
    expect(overlay.parentElement).not.toBe(document.body)
  })
})
