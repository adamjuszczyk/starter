import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

// The one overlay model that Panel, ConfirmDialog and Toast share (TASKS.md, Decided 6). Lifted from Overload's BottomSheet.tsx, which kept
// the stacking, the keys, the focus and the page scroll lock inside the sheet and counted only other sheets (`[data-bottom-sheet]`); here the
// same logic counts every overlay, so a delete confirmation drawn over an open panel takes Escape and Tab itself, instead of closing the
// panel under it.
//
// - Every overlay carries the same marker, `data-overlay`, whose value is its kind (`overlayMarker`). The kit's check finds them all by it.
// - Overlays are drawn into the frame's overlay root (`useOverlayRoot`), so they stack in document order: the one mounted last is drawn on
//   top, and it is the one that owns the keys (`isTopOverlay`): Escape, the Tab ring, and the focus it takes when it opens.
// - A toast is the exception that keeps the rule: it is passive. It never takes focus and owns no key, so it is never the top overlay, and a
//   panel under a toast still takes its Escape.
// - The page behind does not scroll while a panel or a dialog is open: one counted lock for all of them (`lockPageScroll`).
//
// `useOverlay` is what an overlay with a dialog in it (Panel, ConfirmDialog) calls: the lock, the focus in and back, and the keys.

export type OverlayKind = 'panel' | 'dialog' | 'toast'

/** The attribute every overlay's root element carries, `data-overlay="panel"` and so on. Spread it onto the root: `{...overlayMarker('panel')}`. */
export function overlayMarker(kind: OverlayKind): { 'data-overlay': OverlayKind } {
  return { 'data-overlay': kind }
}

// ─── Page scroll lock ─────────────────────────────────────────────────────────────────────────────────────────────────

let lockCount = 0
let overflowBeforeLock = ''

/** Stops the page behind from scrolling until the returned release is called; overlays stacked on each other share one lock. */
export function lockPageScroll(): () => void {
  if (lockCount === 0) {
    overflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
  let released = false
  return () => {
    if (released) return
    released = true
    lockCount -= 1
    if (lockCount === 0) document.body.style.overflow = overflowBeforeLock
  }
}

// ─── Stacking ─────────────────────────────────────────────────────────────────────────────────────────────────────────

// The overlays that can own the keys, in document order: every one but a toast.
const KEY_OWNERS = '[data-overlay]:not([data-overlay="toast"])'

/** The last overlay in the document is the one on top, and the one the keys belong to. */
export function isTopOverlay(root: HTMLElement): boolean {
  const owners = document.querySelectorAll(KEY_OWNERS)
  return owners[owners.length - 1] === root
}

// ─── The Tab ring ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Written without the spaces after the commas (a selector list is code, not words, to the wording check).
const TABBABLE = 'a[href],button,input,select,textarea,[tabindex]'
const OUT_OF_PLAY = '[hidden],[aria-hidden="true"]'

function tabbableIn(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(TABBABLE)).filter(
    (el) =>
      el.tabIndex >= 0 &&
      (el as HTMLButtonElement).disabled !== true &&
      !(el instanceof HTMLInputElement && el.type === 'hidden') &&
      !el.closest(OUT_OF_PLAY),
  )
}

/** Keeps Tab and Shift+Tab inside the dialog: the ends wrap around, and focus that got out is pulled back in. */
function keepTabInside(event: KeyboardEvent, dialog: HTMLElement): void {
  const items = tabbableIn(dialog)
  if (items.length === 0) {
    event.preventDefault()
    dialog.focus({ preventScroll: true })
    return
  }
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (!(active instanceof Node) || !dialog.contains(active)) {
    event.preventDefault()
    const target = event.shiftKey ? last : first
    target.focus({ preventScroll: true })
  } else if (event.shiftKey && (active === first || active === dialog)) {
    event.preventDefault()
    last.focus({ preventScroll: true })
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus({ preventScroll: true })
  }
}

// ─── What an overlay with a dialog in it does ────────────────────────────────────────────────────────────────────────

/**
 * Call it in the component that draws the overlay, and put `rootRef` on the overlay's root element (the one with the marker) and
 * `dialogRef` on the dialog inside it (`tabIndex={-1}`, so it can hold focus). It
 * - locks the page's scroll while the overlay is mounted;
 * - moves focus into the dialog when the overlay opens (unless a child already took it, say an autofocused input) and back to what had it
 *   when it closes (unless the caller put focus somewhere else while closing);
 * - listens for the keys, but acts only while this is the top overlay: Escape calls `onEscape` (not when something inside already handled
 *   the key and called preventDefault), Tab stays inside the dialog.
 * Mount it to open it and unmount it to close it. It only ever asks to close; whether it goes away is the caller's.
 */
export function useOverlay(onEscape: () => void): {
  rootRef: RefObject<HTMLDivElement | null>
  dialogRef: RefObject<HTMLDivElement | null>
} {
  const rootRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // What had focus when the overlay was asked for, read while rendering: a child's autofocus runs before any effect of this component, and by
  // then the opener is no longer the active element.
  const [opener] = useState(() => (typeof document === 'undefined' ? null : document.activeElement))

  // The latest `onEscape`, so the key listener below is attached once and callers can pass a new function every render.
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => lockPageScroll(), [])

  // Focus into the dialog on open (the dialog itself, so a screen reader reads its name and a stray Enter doesn't press its first button),
  // back to the opener on close.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true })
    return () => {
      const nothingHasFocus = document.activeElement === null || document.activeElement === document.body
      if (opener && opener.isConnected && nothingHasFocus && 'focus' in opener) {
        const target = opener as HTMLElement
        target.focus({ preventScroll: true })
      }
    }
  }, [opener])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const root = rootRef.current
      const dialog = dialogRef.current
      if (!root || !dialog || !isTopOverlay(root)) return
      if (event.key === 'Escape') {
        if (event.defaultPrevented) return
        event.preventDefault()
        onEscapeRef.current()
      } else if (event.key === 'Tab') {
        keepTabInside(event, dialog)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return { rootRef, dialogRef }
}
