import { useId } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cx } from '../lib/cx'
import { useOverlayRoot, useWide } from '../lib/useWide'
import { overlayMarker, useOverlay } from './overlay'

// The panel every client screen opens its form, its detail or its picker in: one component with two shapes, chosen by the app's own width
// (useWide), with the same parts in the same order in both. Phone: Overload's BottomSheet, whole (handle, eyebrow, title, close, the
// caller's content, an optional footer pinned under it, up to the frame's height minus 64 px, a 16 px rhythm between the parts). Desktop: a
// side panel from the right, 440 px at most, the same parts (the handle is the sheet's grab bar and is the phone's alone). The look is the
// prototype's (src/components/overlays.tsx); every colour, size and radius is a token class.
//
// Mount it to open it and unmount it to close it (`{open && <Panel ...>}`). It only ever asks to close, by calling `onClose`: from the close
// button, from a tap on the scrim and from Escape. Whether it then goes away is the caller's.
//
// What it does for its callers (the logic is src/components/overlay.ts, which ConfirmDialog and Toast share):
// - Drawn through a portal into the frame's overlay root (useOverlayRoot), not into document.body: the root carries `transform: translateZ(0)`,
//   so the panel's `position: fixed` stays inside the frame (the kit's phone frame; in the real app the frame is the window), and it is
//   outside the page's own tree, so a transformed or clipped ancestor can't trap it. Events from inside a portal still bubble through React's
//   tree to whatever rendered the panel: mount it outside clickable parents. Outside a frame (no overlay root) it draws nothing.
// - Focus moves into the panel when it opens and back to what had it when it closes; Tab stays inside it.
// - The page behind does not scroll while a panel is open (a counted lock, so stacked overlays are safe), the scrim takes no touch panning,
//   and the content's own scrolling stays inside the panel.
// - With overlays stacked (a delete confirmation over this panel), Escape and the Tab ring belong to the one drawn last, and an Escape that
//   something inside already handled (preventDefault) is left alone.
// - role="dialog", aria-modal, named by the title.
//
// The shape changes while the panel is open (a tablet turned over, the kit's frame resized) without remounting anything: the dialog, the
// header, the content and the footer are the same elements in both shapes, so what the person typed is still there.
//
// Classes are one to a string, as src/lib/cx.ts says why.
export interface PanelProps {
  /** The small line above the title (the kind of record, say). Leave it out for none. */
  eyebrow?: string
  title: string
  /** Asked for by the close button, a tap on the scrim and Escape. */
  onClose: () => void
  /** The close button's name for a screen reader: a word from the words file (`t.common.close`). */
  closeLabel: string
  children: ReactNode
  /** Pinned under the content, outside its scroll: the Save and Cancel buttons. */
  footer?: ReactNode
  /** Pinned between the header and the content, outside the scroll: a row of filters that stays in view while the list under it scrolls. */
  toolbar?: ReactNode
  /**
   * The phone's sheet: `content` (the default) is as tall as the content, up to the frame's height minus 64 px; `tall` is always that tall,
   * for a list whose length changes with a filter, so the sheet doesn't jump. The content scrolls inside it either way. The side panel is
   * always the frame's full height, so this changes nothing on the desktop.
   */
  height?: 'content' | 'tall'
}

const ROOT = ['fixed', 'inset-0', 'z-40', 'flex']
const SCRIM = ['absolute', 'inset-0', 'bg-scrim', 'touch-none']

// The dialog's box. A bottom sheet with rounded top corners, or a side panel with a shadow.
const BOX = ['relative', 'flex', 'flex-col', 'bg-surface', 'outline-none']
const BOX_PHONE = [
  'box-border', 'w-full', 'gap-4', 'rounded-t-xl', 'border', 'border-b-0', 'border-wire', 'px-4', 'pt-2.5',
  'pb-[calc(24px+env(safe-area-inset-bottom,0px))]', 'max-h-[calc(100%-64px)]',
]
const BOX_TALL = ['h-[calc(100%-64px)]']
const BOX_WIDE = ['h-full', 'w-full', 'max-w-[440px]', 'border-l', 'border-wire', 'shadow-panel']

const HANDLE = ['h-1', 'w-10', 'shrink-0', 'self-center', 'rounded-sm', 'bg-wire-strong']

const HEADER = ['flex', 'shrink-0', 'items-start', 'gap-3']
const HEADER_WIDE = ['border-b', 'border-wire-faint', 'px-6', 'pt-5', 'pb-4']
// The eyebrow and the title can be one long word (a name the person typed): they wrap inside the line, nothing runs past it.
const EYEBROW = ['text-xs', 'font-semibold', 'text-ink-3', 'wrap-anywhere']
const TITLE = ['m-0', 'font-display', 'text-xl', 'font-bold', 'leading-tight', 'text-ink', 'wrap-anywhere']
const CLOSE = ['flex', 'h-10', 'w-10', 'shrink-0', 'items-center', 'justify-center', 'rounded-md', 'text-ink-3', 'hover:bg-raised', 'hover:text-ink']

const TOOLBAR = ['flex', 'shrink-0', 'flex-col', 'gap-3', 'min-w-0']
const TOOLBAR_WIDE = ['px-6', 'pt-4']

// A grid, not a flex column: a flex item shrinks when the panel is held to its maximum height, and a row with a fixed height would be
// squeezed instead of scrolled. The 16 px between the caller's sections is Overload's; a caller that wants another wraps its sections in a
// container of its own.
const CONTENT = [
  'grid', 'grid-cols-[minmax(0,1fr)]', 'content-start', 'gap-4', 'min-h-0', 'flex-1', 'overflow-y-auto', 'overscroll-contain',
]
// The phone's scroll box reaches the sheet's edges, so its scrollbar sits there, and the content keeps the sheet's 16 px inset.
const CONTENT_PHONE = ['-mx-4', 'px-4']
const CONTENT_WIDE = ['px-6', 'py-5']

const FOOTER = ['flex', 'shrink-0', 'flex-col', 'gap-2']
const FOOTER_WIDE = ['border-t', 'border-wire-faint', 'px-6', 'py-4']

function PanelSheet({ eyebrow, title, onClose, closeLabel, children, footer, toolbar, height = 'content' }: PanelProps) {
  const wide = useWide()
  const titleId = useId()
  const { rootRef, dialogRef } = useOverlay(onClose)

  return (
    <div ref={rootRef} {...overlayMarker('panel')} className={cx(ROOT, wide ? 'justify-end' : 'items-end')}>
      <div aria-hidden="true" data-overlay-scrim="" onClick={() => onClose()} className={cx(SCRIM)} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(BOX, wide ? BOX_WIDE : [BOX_PHONE, height === 'tall' && BOX_TALL])}
      >
        {wide ? null : <div aria-hidden="true" className={cx(HANDLE)} />}
        <div className={cx(HEADER, wide && HEADER_WIDE)}>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {eyebrow ? <span className={cx(EYEBROW)}>{eyebrow}</span> : null}
            <h2 id={titleId} className={cx(TITLE)}>
              {title}
            </h2>
          </div>
          <button type="button" aria-label={closeLabel} onClick={() => onClose()} className={cx(CLOSE)}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        {toolbar ? <div className={cx(TOOLBAR, wide && TOOLBAR_WIDE)}>{toolbar}</div> : null}
        <div className={cx(CONTENT, wide ? CONTENT_WIDE : CONTENT_PHONE)}>{children}</div>
        {footer ? <div className={cx(FOOTER, wide && FOOTER_WIDE)}>{footer}</div> : null}
      </div>
    </div>
  )
}

export function Panel(props: PanelProps) {
  const overlayRoot = useOverlayRoot()
  // No frame yet (or none at all): nothing to draw into, so nothing is drawn, and nothing is held (no scroll lock, no key listener).
  if (!overlayRoot) return null
  return createPortal(<PanelSheet {...props} />, overlayRoot)
}
