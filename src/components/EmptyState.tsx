import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

// What a list shows when there is nothing in it yet: a dashed box with an icon, one line and, usually, the button that adds the first record.
// Lifted from the prototype's example screen (Clients.tsx, the Empty state), which stays in prototype/ (TASKS.md, Decided 18). The caller gives
// the words (`text`, a line from the words file), the icon (a lucide icon at `size={20}`, which the circle around it is sized for) and the
// action (a Button), so a client's own screen says its own thing: "Nie ma jeszcze klientów."
const BOX = ['flex', 'flex-col', 'items-center', 'gap-3', 'rounded-lg', 'border', 'border-dashed', 'border-wire-strong', 'px-6', 'py-14', 'text-center']
const ICON = ['flex', 'h-11', 'w-11', 'items-center', 'justify-center', 'rounded-full', 'bg-raised', 'text-ink-3']

export function EmptyState({ icon, text, action }: { icon?: ReactNode; text: string; action?: ReactNode }) {
  return (
    <div className={cx(BOX)}>
      {icon ? (
        <span aria-hidden="true" className={cx(ICON)}>
          {icon}
        </span>
      ) : null}
      <p className="m-0 text-base text-ink-2">{text}</p>
      {action}
    </div>
  )
}
