import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { useWide } from '../lib/useWide'
import { cx } from './ui'

// ── Panel ────────────────────────────────────────────────────────────────────
// One component, two shapes, picked by the app's width:
// - phone: Overload's BottomSheet (src/components/BottomSheet.tsx), its layout
//   lifted as is: handle, eyebrow, title, close, scrolling content, pinned
//   footer, up to the screen minus 64 px, 16 px rhythm.
// - desktop: a side panel from the right, same parts in the same order (new).
// The real starter lifts BottomSheet whole (portal, focus trap, scroll lock,
// stacking). In this prototype overlays draw inside the app frame instead of a
// portal, so the phone frame keeps them.
export interface PanelProps {
  eyebrow?: string
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  closeLabel: string
}

export function Panel({ eyebrow, title, onClose, children, footer, closeLabel }: PanelProps) {
  const wide = useWide()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const header = (
    <div className="flex shrink-0 items-start gap-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {eyebrow && <span className="text-xs font-semibold text-ink-3">{eyebrow}</span>}
        <h2 className="m-0 font-display text-xl font-bold leading-tight text-ink" style={{ overflowWrap: 'anywhere' }}>{title}</h2>
      </div>
      <button type="button" onClick={onClose} aria-label={closeLabel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-raised hover:text-ink">
        <X size={18} />
      </button>
    </div>
  )

  return (
    <div className={cx('absolute inset-0 z-40 flex', wide ? 'justify-end' : 'items-end')} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-scrim" onClick={onClose} style={{ touchAction: 'none' }} />
      {wide ? (
        <div className="relative flex h-full w-full max-w-[440px] flex-col border-l border-wire bg-surface shadow-panel">
          <div className="border-b border-wire-faint px-6 pt-5 pb-4">{header}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="shrink-0 border-t border-wire-faint px-6 py-4">{footer}</div>}
        </div>
      ) : (
        <div
          className="relative box-border flex w-full flex-col gap-4 rounded-t-xl border border-b-0 border-wire bg-surface px-4 pt-2.5"
          style={{ maxHeight: 'calc(100% - 64px)', paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="h-1 w-10 shrink-0 self-center rounded-sm bg-wire-strong" />
          {header}
          <div className="-mx-4 min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
          {footer && <div className="shrink-0">{footer}</div>}
        </div>
      )}
    </div>
  )
}

// ── ConfirmDialog ────────────────────────────────────────────────────────────
// Lifted from Overload's src/components/ConfirmDialog.tsx: same props, same
// layout (centred, 380 px wide at most, CANCEL and the confirm side by side,
// red when `danger`). Styled through tokens instead of inline values.
export function ConfirmDialog({ title, body, confirmLabel, cancelLabel, pendingLabel, danger, isPending, onConfirm, onCancel }: {
  title: string
  body: ReactNode
  confirmLabel: string
  cancelLabel: string
  pendingLabel?: string
  danger?: boolean
  isPending?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-scrim p-5" onClick={(e) => { if (e.target === e.currentTarget) onCancel() }} role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-[380px] rounded-lg border border-wire bg-overlay p-6 shadow-panel">
        <h2 className="m-0 mb-3 font-display text-lg font-bold text-ink" style={{ overflowWrap: 'anywhere' }}>{title}</h2>
        <div className="mb-6 text-base leading-normal text-ink-2">{body}</div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="h-11 flex-1 rounded-md border border-wire-strong bg-transparent text-sm font-semibold text-ink-2 hover:bg-raised">{cancelLabel}</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cx('h-11 flex-1 rounded-md border-0 text-sm font-semibold text-on-accent disabled:opacity-60', danger ? 'bg-danger' : 'bg-accent')}
          >
            {isPending ? pendingLabel ?? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
