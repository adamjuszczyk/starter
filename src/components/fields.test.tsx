// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { SelectField, TextArea, TextField } from './fields'

// The form fields: a label over the field, a hint or an error under it (SPEC Design system, Components). TextField is the one the sign-in page
// uses; SelectField and TextArea have their first screens in the kit's Klient form, so this is where their wiring is proven.
afterEach(() => cleanup())

describe.each([
  ['TextField', (props: { error?: string; hint?: string; required?: boolean; className?: string }) => <TextField id="f" label="Nazwa" {...props} />],
  ['SelectField', (props: { error?: string; hint?: string; required?: boolean; className?: string }) => (
    <SelectField id="f" label="Nazwa" {...props}>
      <option value="a">A</option>
    </SelectField>
  )],
  ['TextArea', (props: { error?: string; hint?: string; required?: boolean; className?: string }) => <TextArea id="f" label="Nazwa" {...props} />],
])('%s', (_name, field) => {
  it('puts the label on the control, so a click on the label and a screen reader both reach it', () => {
    render(field({}))
    expect(screen.getByLabelText('Nazwa').id).toBe('f')
  })

  it('shows a hint under the field and points the control at it', () => {
    render(field({ hint: 'Dziewięć cyfr.' }))
    const control = screen.getByLabelText('Nazwa')
    const hint = screen.getByText('Dziewięć cyfr.')
    expect(control.getAttribute('aria-describedby')).toBe(hint.id)
    expect(control.getAttribute('aria-invalid')).toBe('false')
  })

  it('shows an error instead of the hint, marks the control invalid and points it at the error', () => {
    render(field({ hint: 'Dziewięć cyfr.', error: 'Wpisz nazwę.' }))
    const control = screen.getByLabelText('Nazwa')
    const error = screen.getByText('Wpisz nazwę.')
    expect(screen.queryByText('Dziewięć cyfr.')).toBeNull()
    expect(control.getAttribute('aria-describedby')).toBe(error.id)
    expect(control.getAttribute('aria-invalid')).toBe('true')
    expect(control.className).toContain('border-danger')
  })

  it('has no description when it has no hint and no error', () => {
    render(field({}))
    expect(screen.getByLabelText('Nazwa').hasAttribute('aria-describedby')).toBe(false)
  })

  it('`required` draws the asterisk after the label and goes no further: the browser\'s own validation does not take over the form\'s error line', () => {
    const { container } = render(field({ required: true }))
    expect(container.querySelector('label')?.textContent).toBe('Nazwa *')
    expect((screen.getByLabelText(/Nazwa/) as HTMLInputElement).required).toBe(false)
  })

  it('keeps a class the caller gives it beside its own', () => {
    render(field({ className: 'w-1/2' }))
    const classes = screen.getByLabelText('Nazwa').className.split(' ')
    expect(classes).toContain('w-1/2')
    expect(classes).toContain('border-wire-strong')
  })
})

describe('TextArea', () => {
  it('has three rows until the caller says otherwise', () => {
    render(<TextArea id="notes" label="Notatki" />)
    expect((screen.getByLabelText('Notatki') as HTMLTextAreaElement).rows).toBe(3)
    cleanup()
    render(<TextArea id="notes" label="Notatki" rows={6} />)
    expect((screen.getByLabelText('Notatki') as HTMLTextAreaElement).rows).toBe(6)
  })
})
