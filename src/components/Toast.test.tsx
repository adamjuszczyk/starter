// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, fireEvent } from '@testing-library/react'
import { Panel } from './Panel'
import { Toast } from './Toast'
import { useToastStore } from '../features/notifications/toastStore'
import { renderInFrame } from '../testing/frame'

// The toast (Overload's toastStore and its 3-second timing; the prototype's look; drawn into the frame, TASKS.md Decided 17). Fake timers
// drive the 3 seconds.

beforeEach(() => {
  vi.useFakeTimers()
  useToastStore.setState({ message: null })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const show = (message: string) => act(() => useToastStore.getState().show(message))
const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms)
  })

describe('Toast', () => {
  it('shows nothing until a message is shown', () => {
    renderInFrame(<Toast />)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('shows the message and clears it 3 seconds later, not before', () => {
    renderInFrame(<Toast />)
    show('Zapisano')
    expect(screen.getByRole('status').textContent).toContain('Zapisano')
    advance(2999)
    expect(screen.getByText('Zapisano')).toBeTruthy()
    expect(useToastStore.getState().message).toBe('Zapisano')
    advance(1)
    expect(screen.queryByText('Zapisano')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
    expect(useToastStore.getState().message).toBeNull()
  })

  it('a new message replaces the one on show and starts the 3 seconds again', () => {
    renderInFrame(<Toast />)
    show('Pierwsza')
    advance(2000)
    show('Druga')
    expect(screen.queryByText('Pierwsza')).toBeNull()
    expect(screen.getByText('Druga')).toBeTruthy()
    advance(2000)
    // four seconds since the first, two since the second: still there
    expect(screen.getByText('Druga')).toBeTruthy()
    advance(1000)
    expect(screen.queryByText('Druga')).toBeNull()
  })

  it('stops its clock when it goes away: nothing is cleared afterwards by a toast that is gone', () => {
    const { unmount } = renderInFrame(<Toast />)
    show('Zapisano')
    unmount()
    advance(5000)
    // the message stays in the store: it is the store's, and the next toast that is mounted draws it and runs its own 3 seconds
    expect(useToastStore.getState().message).toBe('Zapisano')
  })

  it("is drawn into the frame's overlay root as a status, with the overlay marker, and above the panels and dialogs", () => {
    renderInFrame(<Toast />, { width: 390 })
    show('Zapisano')
    const toast = screen.getByRole('status')
    expect(toast.getAttribute('data-overlay')).toBe('toast')
    expect(toast.parentElement?.style.transform).toBe('translateZ(0)')
    expect(toast.parentElement).not.toBe(document.body)
    const classes = toast.className.split(' ')
    // one layer above the panels and the dialogs (z-40), and it takes no touch, so the tab bar under it still works
    expect(classes).toEqual(expect.arrayContaining(['fixed', 'z-50', 'pointer-events-none']))
  })

  it('draws nothing where there is no frame to draw into, and still clears the message', () => {
    render(<Toast />)
    show('Zapisano')
    expect(screen.queryByRole('status')).toBeNull()
    advance(3000)
    expect(useToastStore.getState().message).toBeNull()
  })

  it('is passive: a toast drawn over an open panel takes no key from it, and no focus', () => {
    const onClose = vi.fn()
    renderInFrame(
      <>
        <Panel title="Piekarnia Pod Wawelem" onClose={onClose} closeLabel="Zamknij">
          <button type="button">W środku</button>
        </Panel>
        <Toast />
      </>,
      { width: 390 },
    )
    const panel = screen.getByRole('dialog')
    expect(document.activeElement).toBe(panel)
    show('Zapisano')
    // the toast is the last overlay in the document, and the panel is still the one that owns the keys and the focus
    const toast = screen.getByRole('status')
    expect(Boolean(panel.compareDocumentPosition(toast) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    expect(document.activeElement).toBe(panel)
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('the toast store', () => {
  it('holds the one message: show sets it, a second replaces it, clear takes it away', () => {
    expect(useToastStore.getState().message).toBeNull()
    useToastStore.getState().show('Zapisano')
    expect(useToastStore.getState().message).toBe('Zapisano')
    useToastStore.getState().show('Usunięto')
    expect(useToastStore.getState().message).toBe('Usunięto')
    useToastStore.getState().clear()
    expect(useToastStore.getState().message).toBeNull()
  })
})
