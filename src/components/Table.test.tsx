// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { Table } from './Table'
import type { Column } from './Table'

// The desktop table (the prototype's): the header, the rows with a click, six skeleton rows while it loads, its own box that scrolls sideways.
afterEach(() => cleanup())

interface Client {
  id: string
  name: string
  city: string
  added: string
}

const rows: Client[] = [
  { id: 'a', name: 'Piekarnia Pod Wawelem', city: 'Kraków', added: '12.03.2026' },
  { id: 'b', name: 'Auto-Serwis Nowak', city: 'Wieliczka', added: '02.04.2026' },
]

const columns: Column<Client>[] = [
  { key: 'name', header: 'Nazwa', render: (c) => c.name },
  { key: 'city', header: 'Miasto', render: (c) => <span>{c.city}</span>, width: '16%' },
  { key: 'added', header: 'Dodano', render: (c) => c.added, numeric: true },
]

const bodyRows = (container: HTMLElement) => Array.from(container.querySelectorAll('tbody tr'))
const classesOf = (el: Element) => el.className.split(' ')

describe('Table', () => {
  it('draws a header cell per column, in order, with the column\'s width, and a cell per column in every row from that row\'s data', () => {
    const { container } = render(<Table columns={columns} rows={rows} label="Klienci" />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers.map((h) => h.textContent)).toEqual(['Nazwa', 'Miasto', 'Dodano'])
    expect(headers.every((h) => h.getAttribute('scope') === 'col')).toBe(true)
    expect((headers[1] as HTMLElement).style.width).toBe('16%')
    const drawn = bodyRows(container).map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent))
    expect(drawn).toEqual([
      ['Piekarnia Pod Wawelem', 'Kraków', '12.03.2026'],
      ['Auto-Serwis Nowak', 'Wieliczka', '02.04.2026'],
    ])
  })

  it('is named for a screen reader by the label it is given', () => {
    render(<Table columns={columns} rows={rows} label="Klienci" />)
    expect(screen.getByRole('table', { name: 'Klienci' })).toBeTruthy()
  })

  it('right-aligns a numeric column, header and cells', () => {
    const { container } = render(<Table columns={columns} rows={rows} label="Klienci" />)
    expect(classesOf(screen.getByRole('columnheader', { name: 'Dodano' }))).toContain('text-right')
    expect(classesOf(screen.getByRole('columnheader', { name: 'Nazwa' }))).not.toContain('text-right')
    const cells = (bodyRows(container)[0] as HTMLElement).querySelectorAll('td')
    expect(classesOf(cells[2])).toContain('text-right')
    expect(classesOf(cells[0])).not.toContain('text-right')
  })

  it('while loading it draws six skeleton rows and none of the rows it was given; otherwise no skeleton at all', () => {
    const { container, rerender } = render(<Table columns={columns} rows={rows} loading label="Klienci" />)
    expect(bodyRows(container)).toHaveLength(6)
    expect(screen.queryByText('Piekarnia Pod Wawelem')).toBeNull()
    // a bar in every cell, and the header stays
    expect(bodyRows(container).every((tr) => tr.querySelectorAll('td span').length === columns.length)).toBe(true)
    expect(screen.getAllByRole('columnheader')).toHaveLength(3)

    rerender(<Table columns={columns} rows={rows} loading={false} label="Klienci" />)
    expect(bodyRows(container)).toHaveLength(rows.length)
    expect(screen.getByText('Piekarnia Pod Wawelem')).toBeTruthy()

    rerender(<Table columns={columns} rows={[]} label="Klienci" />)
    expect(bodyRows(container)).toHaveLength(0)
  })

  it('says it is busy while it loads, and only then', () => {
    const { rerender } = render(<Table columns={columns} rows={rows} loading label="Klienci" />)
    expect(screen.getByRole('table', { name: 'Klienci', busy: true })).toBeTruthy()
    rerender(<Table columns={columns} rows={rows} label="Klienci" />)
    expect(screen.getByRole('table', { name: 'Klienci' }).getAttribute('aria-busy')).not.toBe('true')
    rerender(<Table columns={columns} rows={rows} loading={false} label="Klienci" />)
    expect(screen.getByRole('table', { name: 'Klienci' }).getAttribute('aria-busy')).not.toBe('true')
  })

  it('a click on a row gives onRowClick that row, and the row only: not another, not the clicked cell', () => {
    const onRowClick = vi.fn()
    render(<Table columns={columns} rows={rows} onRowClick={onRowClick} label="Klienci" />)
    fireEvent.click(screen.getByText('Wieliczka'))
    expect(onRowClick).toHaveBeenCalledTimes(1)
    expect(onRowClick.mock.calls[0][0]).toBe(rows[1])
    fireEvent.click(screen.getByText('Piekarnia Pod Wawelem'))
    expect(onRowClick).toHaveBeenCalledTimes(2)
    expect(onRowClick.mock.calls[1][0]).toBe(rows[0])
  })

  it('a row opens (the pointer, the hover) only when there is something to open it with', () => {
    const { container, rerender } = render(<Table columns={columns} rows={rows} label="Klienci" />)
    expect(classesOf(bodyRows(container)[0])).not.toContain('cursor-pointer')
    fireEvent.click(screen.getByText('Wieliczka'))
    rerender(<Table columns={columns} rows={rows} onRowClick={() => {}} label="Klienci" />)
    expect(classesOf(bodyRows(container)[0])).toEqual(expect.arrayContaining(['cursor-pointer', 'hover:bg-raised']))
  })

  it('a skeleton row opens nothing', () => {
    const onRowClick = vi.fn()
    const { container } = render(<Table columns={columns} rows={rows} loading onRowClick={onRowClick} label="Klienci" />)
    for (const tr of bodyRows(container)) fireEvent.click(tr)
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('scrolls sideways inside its own box, never the page: the table sits in a box that scrolls on x', () => {
    render(<Table columns={columns} rows={rows} label="Klienci" />)
    const box = screen.getByRole('table', { name: 'Klienci' }).parentElement as HTMLElement
    expect(classesOf(box)).toContain('overflow-x-auto')
    expect(within(box).getAllByRole('row')).toHaveLength(1 + rows.length)
  })
})
