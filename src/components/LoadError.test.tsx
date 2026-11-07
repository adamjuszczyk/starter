// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { LoadError } from './LoadError'

// The list that could not be loaded: the error line, then a retry button. The line is the starter's words, composed here: the same on every screen.
afterEach(() => cleanup())

describe('LoadError', () => {
  it('reads what could not be loaded, then the reason: "Nie udało się wczytać: listy klientów. Powód: …"', () => {
    render(<LoadError what="listy klientów" reason="serwer nie odpowiada (502)" onRetry={() => {}} />)
    expect(screen.getByRole('alert').textContent).toBe('Nie udało się wczytać: listy klientów. Powód: serwer nie odpowiada (502).')
  })

  it('with no reason the line stands by itself: never "Powód: ."', () => {
    render(<LoadError what="listy klientów" onRetry={() => {}} />)
    expect(screen.getByRole('alert').textContent).toBe('Nie udało się wczytać: listy klientów.')
    cleanup()
    render(<LoadError what="listy klientów" reason="" onRetry={() => {}} />)
    expect(screen.getByRole('alert').textContent).toBe('Nie udało się wczytać: listy klientów.')
  })

  it('the retry button runs onRetry, once per tap', () => {
    const onRetry = vi.fn()
    render(<LoadError what="listy klientów" reason="serwer nie odpowiada (502)" onRetry={onRetry} />)
    expect(onRetry).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Spróbuj ponownie' }))
    expect(onRetry).toHaveBeenCalledTimes(2)
  })

  it('draws the line before the button', () => {
    render(<LoadError what="listy klientów" onRetry={() => {}} />)
    const line = screen.getByRole('alert')
    const button = screen.getByRole('button')
    expect(Boolean(line.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true)
  })
})
