import type { KeyboardEvent, ReactNode } from 'react'
import { cx } from '../lib/cx'

// The desktop table (new: Overload has none), lifted from the prototype's Table.tsx. A header row, rows that open on a click or from the
// keyboard, and skeleton rows while the list loads. A long text wraps inside its cell; the table scrolls sideways inside its own box, never the
// page. The phone's list is ListRows. The caller gives every word: the column headers and the table's name (`label`, for a screen reader).
//
// A row that opens is focusable (Tab reaches it) and opens on Enter and Space, which the prototype's rows do not (they are a pointer's): an office
// user at a keyboard could not open a record otherwise. Only a key pressed on the row itself opens it: a control inside a cell keeps its own Enter
// and Space. Added in chunk 8 as a behaviour change the prototype does not show; CONTEXT.md lists it for the release batch (keep, or mouse only).
export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  /** A width for the column, as CSS (`16%`); the others share what is left. */
  width?: string
  /** Numbers, dates and the like: right-aligned, header and cells. */
  numeric?: boolean
}

// Six grey rows stand in for the list while it loads (the prototype's count); their bars differ in width so they read as text.
const SKELETON_ROWS = 6

const BOX = ['overflow-x-auto', 'rounded-lg', 'border', 'border-wire', 'bg-surface']
const TABLE = ['w-full', 'border-collapse', 'text-left']
const HEAD_ROW = ['border-b', 'border-wire']
const HEAD_CELL = ['h-10', 'px-4', 'text-xs', 'font-semibold', 'whitespace-nowrap', 'text-ink-3']
const ROW = ['border-b', 'border-wire-faint', 'last:border-b-0']
const ROW_OPENS = ['cursor-pointer', 'hover:bg-raised']
const CELL = ['h-14', 'px-4', 'py-2', 'align-middle', 'text-base', 'text-ink']
const SKELETON_CELL = ['h-14', 'px-4']
const BAR = ['block', 'h-3', 'rounded-sm', 'bg-raised']
const RIGHT = 'text-right'

/** Whether this key press opens the row it was pressed on: Enter or Space, on the row itself (not bubbled up from a control in a cell). */
function opensRow(event: KeyboardEvent<HTMLTableRowElement>): boolean {
  if (event.target !== event.currentTarget) return false
  if (event.key !== 'Enter' && event.key !== ' ') return false
  // Space would otherwise scroll the page.
  event.preventDefault()
  return true
}

export function Table<T extends { id: string }>({
  columns,
  rows,
  loading,
  onRowClick,
  label,
}: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  /** Makes every row open on a click, or on Enter or Space once Tab has reached it, and gives it the pointer and the hover. */
  onRowClick?: (row: T) => void
  label: string
}) {
  return (
    <div className={cx(BOX)}>
      <table className={cx(TABLE)} aria-label={label} aria-busy={loading}>
        <thead>
          <tr className={cx(HEAD_ROW)}>
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ width: c.width }} className={cx(HEAD_CELL, c.numeric && RIGHT)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <tr key={i} className={cx(ROW)}>
                  {columns.map((c, j) => (
                    <td key={c.key} className={cx(SKELETON_CELL)}>
                      <span className={cx(BAR)} style={{ width: `${40 + ((i * 7 + j * 13) % 45)}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((r) => (
                <tr
                  key={r.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(r) : undefined}
                  onKeyDown={onRowClick ? (event) => opensRow(event) && onRowClick(r) : undefined}
                  className={cx(ROW, onRowClick && ROW_OPENS)}
                >
                  {columns.map((c) => (
                    <td key={c.key} className={cx(CELL, c.numeric && RIGHT)}>
                      {c.render(r)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
