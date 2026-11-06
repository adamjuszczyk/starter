// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import { Button } from './Button'

// The button and the badge: variants and tones come from the semantic token classes; a Button never submits a form unless it says so.
afterEach(() => cleanup())

describe('Button', () => {
  it.each([
    ['primary', 'bg-accent'],
    ['secondary', 'bg-surface'],
    ['ghost', 'bg-transparent'],
    ['danger', 'bg-danger'],
    ['danger-ghost', 'text-danger'],
  ] as const)('the %s variant is drawn with %s', (variant, tokenClass) => {
    render(<Button variant={variant}>OK</Button>)
    expect(screen.getByRole('button').className.split(' ')).toContain(tokenClass)
  })

  it('is the secondary variant until it is told otherwise', () => {
    render(<Button>OK</Button>)
    expect(screen.getByRole('button').className.split(' ')).toContain('border-wire-strong')
  })

  it('is a type="button" unless it says otherwise, so inside a form it does not submit; type="submit" does', () => {
    const submitted = vi.fn((e: { preventDefault: () => void }) => e.preventDefault())
    render(
      <form onSubmit={submitted}>
        <Button>Nie</Button>
        <Button type="submit">Tak</Button>
      </form>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Nie' }))
    expect(submitted).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Tak' }))
    expect(submitted).toHaveBeenCalledTimes(1)
  })

  it('draws its icon before its label and takes a class from the caller beside its own', () => {
    render(
      <Button icon={<svg data-testid="icon" />} className="w-full">
        Etykieta
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button.firstElementChild).toBe(screen.getByTestId('icon'))
    expect(button.textContent).toBe('Etykieta')
    expect(button.className.split(' ')).toEqual(expect.arrayContaining(['w-full', 'rounded-md']))
  })

  it('is disabled and does not act when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        OK
      </Button>,
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('Badge', () => {
  it.each([
    ['neutral', 'bg-raised'],
    ['ok', 'text-ok'],
    ['warn', 'text-warn'],
    ['danger', 'text-danger'],
    ['accent', 'text-accent'],
  ] as const)('the %s tone is drawn with %s', (tone, tokenClass) => {
    render(<Badge tone={tone}>Status</Badge>)
    expect(screen.getByText('Status').className.split(' ')).toContain(tokenClass)
  })

  it('is neutral until it is told otherwise', () => {
    render(<Badge>Status</Badge>)
    expect(screen.getByText('Status').className.split(' ')).toContain('bg-raised')
  })
})
