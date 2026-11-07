import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { cx } from '../lib/cx'

// The phone's list: one tappable row per record, grey skeleton rows while the list loads. The desktop's is Table; a screen draws one or the
// other by the app's width (useWide). Lifted from the prototype's example screen (Clients.tsx; TASKS.md, Decided 18), which stays in prototype/.
//
// The caller says what goes in a row, in three parts (`row`): a title (a name, which wraps inside the row when it is one long word), a line
// of detail under it, and something at the end (a Badge); the chevron that says "opens" is the row's own. The caller gives every word, and
// `label` names the list for a screen reader.
export interface ListRowParts {
  title: ReactNode
  detail?: ReactNode
  trailing?: ReactNode
}

// Six grey rows stand in for the list while it loads (the prototype's count), their bars of different widths.
const SKELETON_ROWS = 6

const LIST = ['m-0', 'flex', 'list-none', 'flex-col', 'overflow-hidden', 'rounded-lg', 'border', 'border-wire', 'bg-surface', 'p-0']
const ITEM = ['border-b', 'border-wire-faint', 'last:border-b-0']
const SKELETON = ['flex', 'flex-col', 'gap-2', 'px-4', 'py-4']
const BAR = ['block', 'rounded-sm', 'bg-raised']
const OPEN = ['flex', 'w-full', 'items-center', 'gap-3', 'bg-transparent', 'px-4', 'py-3', 'text-left', 'hover:bg-raised']
const TITLE = ['font-semibold', 'text-ink', 'wrap-anywhere']

export function ListRows<T extends { id: string }>({
  rows,
  loading,
  onRowClick,
  label,
  row,
}: {
  rows: T[]
  loading?: boolean
  onRowClick: (row: T) => void
  label: string
  row: (item: T) => ListRowParts
}) {
  return (
    <ul aria-label={label} aria-busy={loading} className={cx(LIST)}>
      {loading
        ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <li key={i} className={cx(ITEM)}>
              <div className={cx(SKELETON)}>
                <span className={cx(BAR, 'h-3')} style={{ width: `${55 + ((i * 11) % 30)}%` }} />
                <span className={cx(BAR, 'h-2.5')} style={{ width: `${30 + ((i * 7) % 20)}%` }} />
              </div>
            </li>
          ))
        : rows.map((item) => {
            const { title, detail, trailing } = row(item)
            return (
              <li key={item.id} className={cx(ITEM)}>
                <button type="button" onClick={() => onRowClick(item)} className={cx(OPEN)}>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className={cx(TITLE)}>{title}</span>
                    {detail ? <span className="text-sm text-ink-3">{detail}</span> : null}
                  </div>
                  {trailing}
                  <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-ink-4" />
                </button>
              </li>
            )
          })}
    </ul>
  )
}
