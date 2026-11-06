import type { ReactNode } from 'react'
import { cx } from './ui'

// Desktop table (new: Overload has none). Header row, rows that open on click,
// skeleton rows while loading. Long text wraps inside its cell; the table
// scrolls sideways inside its own box, never the page.

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  width?: string
  numeric?: boolean
}

export function Table<T extends { id: string }>({ columns, rows, loading, onRowClick, label }: {
  columns: Column<T>[]
  rows: T[]
  loading?: boolean
  onRowClick?: (row: T) => void
  label: string
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-wire bg-surface">
      <table className="w-full border-collapse text-left" aria-label={label} aria-busy={loading}>
        <thead>
          <tr className="border-b border-wire">
            {columns.map((c) => (
              <th key={c.key} scope="col" style={{ width: c.width }} className={cx('h-10 px-4 text-xs font-semibold whitespace-nowrap text-ink-3', c.numeric && 'text-right')}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <tr key={i} className="border-b border-wire-faint last:border-b-0">
                  {columns.map((c, j) => (
                    <td key={c.key} className="h-14 px-4">
                      <span className="block h-3 rounded-sm bg-raised" style={{ width: `${40 + ((i * 7 + j * 13) % 45)}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((r) => (
                <tr key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined}
                  className={cx('border-b border-wire-faint last:border-b-0', onRowClick && 'cursor-pointer hover:bg-raised')}>
                  {columns.map((c) => (
                    <td key={c.key} className={cx('h-14 px-4 py-2 align-middle text-base text-ink', c.numeric && 'text-right')}>{c.render(r)}</td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
