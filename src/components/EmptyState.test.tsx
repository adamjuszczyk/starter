// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Button } from './Button'
import { EmptyState } from './EmptyState'

// The empty list: an icon, one line and the button that adds the first record. The words are the caller's.
afterEach(() => cleanup())

describe('EmptyState', () => {
  it('draws the icon (hidden from a screen reader), the line and the action, in that order', () => {
    const onAdd = vi.fn()
    render(<EmptyState icon={<svg data-testid="icon" />} text="Nie ma jeszcze klientów." action={<Button onClick={onAdd}>Dodaj klienta</Button>} />)
    const icon = screen.getByTestId('icon')
    const text = screen.getByText('Nie ma jeszcze klientów.')
    const action = screen.getByRole('button', { name: 'Dodaj klienta' })
    expect(icon.parentElement?.getAttribute('aria-hidden')).toBe('true')
    const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
    expect(follows(icon, text)).toBe(true)
    expect(follows(text, action)).toBe(true)
    fireEvent.click(action)
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('is the line alone when it has no icon and no action', () => {
    const { container } = render(<EmptyState text="Nie ma jeszcze klientów." />)
    expect(container.firstElementChild?.children).toHaveLength(1)
    expect(screen.getByText('Nie ma jeszcze klientów.')).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('is a dashed box, so it reads as a place something will go', () => {
    const { container } = render(<EmptyState text="Nie ma jeszcze klientów." />)
    expect((container.firstElementChild as HTMLElement).className.split(' ')).toEqual(expect.arrayContaining(['border-dashed', 'text-center']))
  })
})
