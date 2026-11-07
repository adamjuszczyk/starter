import { useId } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from '../lib/cx'
import { useOverlayRoot } from '../lib/useWide'
import { overlayMarker, useOverlay } from './overlay'

// The shared confirm and cancel dialog (the delete confirmation, say). Lifted from Overload's ConfirmDialog.tsx: the same props and layout
// (centred, 380 px wide at most, the two buttons side by side, red when `danger`, `pendingLabel` for the confirm button while the write is
// out), drawn with the prototype's tokens. A single step: no typed-name friction. `danger` picks red against the app's accent for the
// confirm button, so an irreversible outcome (a delete) reads differently from a reversible one.
//
// New since Overload's: it is drawn through the overlay module (src/components/overlay.ts), like Panel, so it works over an open panel. Drawn
// last, it is the top overlay: it takes focus when it opens, owns Escape (which cancels) and keeps Tab inside, and when it closes focus goes
// back to what had it (the panel's button). It is drawn into the frame's overlay root, so it stays inside the kit's phone frame; outside a
// frame it draws nothing. Mount it to open it and unmount it to close it.
//
// The words come from the caller, as the prototype's do: `confirmLabel` and `cancelLabel` from the words file, a `pendingLabel` for the
// button while `isPending` ("…" until given one).
export interface ConfirmDialogProps {
  title: string
  body: ReactNode
  confirmLabel: string
  cancelLabel: string
  pendingLabel?: string
  danger?: boolean
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

// The same layer as a panel: the one mounted later is drawn above, and it is the one that owns the keys.
const ROOT = ['fixed', 'inset-0', 'z-40', 'flex', 'items-center', 'justify-center', 'p-5']
const SCRIM = ['absolute', 'inset-0', 'bg-scrim', 'touch-none']
const CARD = ['relative', 'w-full', 'max-w-[380px]', 'rounded-lg', 'border', 'border-wire', 'bg-overlay', 'p-6', 'shadow-panel', 'outline-none']
// A name the person typed ("Usunąć <name>?") may have no break in it: it wraps inside the dialog.
const TITLE = ['m-0', 'mb-3', 'font-display', 'text-lg', 'font-bold', 'text-ink', 'wrap-anywhere']
const BODY = ['mb-6', 'text-base', 'leading-normal', 'text-ink-2']
const BUTTON = ['h-11', 'flex-1', 'rounded-md', 'text-sm', 'font-semibold']
const CANCEL = ['border', 'border-wire-strong', 'bg-transparent', 'text-ink-2', 'hover:bg-raised']
const CONFIRM = ['border-0', 'text-on-accent', 'disabled:opacity-60']

function Dialog({ title, body, confirmLabel, cancelLabel, pendingLabel = '…', danger, isPending, onConfirm, onCancel }: ConfirmDialogProps) {
  const titleId = useId()
  const bodyId = useId()
  const { rootRef, dialogRef } = useOverlay(onCancel)

  return (
    <div ref={rootRef} {...overlayMarker('dialog')} className={cx(ROOT)}>
      <div aria-hidden="true" data-overlay-scrim="" onClick={() => onCancel()} className={cx(SCRIM)} />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className={cx(CARD)}
      >
        <h2 id={titleId} className={cx(TITLE)}>
          {title}
        </h2>
        <div id={bodyId} className={cx(BODY)}>
          {body}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className={cx(BUTTON, CANCEL)}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} disabled={isPending} className={cx(BUTTON, CONFIRM, danger ? 'bg-danger' : 'bg-accent')}>
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const overlayRoot = useOverlayRoot()
  if (!overlayRoot) return null
  return createPortal(<Dialog {...props} />, overlayRoot)
}
