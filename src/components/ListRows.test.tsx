// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Badge } from './Badge'
import { ListRows } from './ListRows'

// The phone's list (the prototype's rows): one tappable row per record, six skeleton rows while it loads.
afterEach(() => cleanup())

interface Client {
  id: string
  name: string
  city: string
  active: boolean
}

const rows: Client[] = [
  { id: 'a', name: 'Piekarnia Pod Wawelem', city: 'Kraków', active: true },
  { id: 'b', name: 'Auto-Serwis Nowak', city: 'Wieliczka', active: false },
]

const parts = (c: Client) => ({
  title: c.name,
  detail: c.city,
  trailing: <Badge tone={c.active ? 'ok' : 'neutral'}>{c.active ? 'Aktywny' : 'Nieaktywny'}</Badge>,
})

const classesOf = (el: Element) => el.className.split(' ')

describe('ListRows', () => {
  it('draws one row per record, each a button with the title, the detail under it and the trailing part at the end, from that record\'s data', () => {
    render(<ListRows rows={rows} onRowClick={() => {}} label="Klienci" row={parts} />)
    const list = screen.getByRole('list', { name: 'Klienci' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    const first = within(items[0]).getByRole('button')
    expect(first.textContent).toBe('Piekarnia Pod WawelemKrakówAktywny')
    expect(within(items[1]).getByRole('button').textContent).toBe('Auto-Serwis NowakWieliczkaNieaktywny')
    // the order inside a row: the title, then the detail under it, then the trailing badge, then the chevron
    const title = within(first).getByText('Piekarnia Pod Wawelem')
    const detail = within(first).getByText('Kraków')
    const badge = within(first).getByText('Aktywny')
    expect(Boolean(title.compareDocumentPosition(detail) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    expect(Boolean(detail.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
    expect(first.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('a tap on a row gives onRowClick that record: the one tapped, not another', () => {
    const onRowClick = vi.fn()
    render(<ListRows rows={rows} onRowClick={onRowClick} label="Klienci" row={parts} />)
    fireEvent.click(screen.getByRole('button', { name: /Auto-Serwis Nowak/ }))
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0][0]).toBe(rows[1])
  })

  it('a row with no detail and no trailing part draws the title alone', () => {
    render(<ListRows rows={rows} onRowClick={() => {}} label="Klienci" row={(c) => ({ title: c.name })} />)
    const first = screen.getAllByRole('button')[0]
    expect(first.textContent).toBe('Piekarnia Pod Wawelem')
    expect(first.querySelectorAll('span')).toHaveLength(1)
  })

  it('wraps a name that is one long word inside its row', () => {
    const LONG = 'X'.repeat(80)
    render(<ListRows rows={[{ ...rows[0], name: LONG }]} onRowClick={() => {}} label="Klienci" row={parts} />)
    expect(classesOf(screen.getByText(LONG))).toContain('wrap-anywhere')
  })

  it('while loading it draws six skeleton rows, none of them a button, and none of the rows it was given', () => {
    render(<ListRows rows={rows} loading onRowClick={() => {}} label="Klienci" row={parts} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryByText('Piekarnia Pod Wawelem')).toBeNull()
  })

  it('says it is busy while it loads, and only then; with the rows it has six no longer', () => {
    const { rerender } = render(<ListRows rows={rows} loading onRowClick={() => {}} label="Klienci" row={parts} />)
    expect(screen.getByRole('list', { name: 'Klienci', busy: true })).toBeTruthy()
    rerender(<ListRows rows={rows} loading={false} onRowClick={() => {}} label="Klienci" row={parts} />)
    expect(screen.getByRole('list', { name: 'Klienci' }).getAttribute('aria-busy')).not.toBe('true')
    expect(screen.getAllByRole('listitem')).toHaveLength(rows.length)
  })

  it('draws no rows for no records', () => {
    render(<ListRows rows={[]} onRowClick={() => {}} label="Klienci" row={parts} />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
