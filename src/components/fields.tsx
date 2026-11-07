import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { AlertCircle } from 'lucide-react'
import { cx } from '../lib/cx'
import { useWide } from '../lib/useWide'

// The form fields: a label over the field, a hint or an error under it. Lifted from the prototype's ui.tsx, whose layout comes from
// Overload's LoginPage fields (label over input, error under it); the labels are in sentence case, not Overload's monospace capitals.
//
// `required` draws the asterisk after the label and goes no further: it is not given to the input, so the browser's own validation bubble
// never competes with the form's own error line (`error`, a line from the words file).

interface FieldShellProps {
  id: string
  label: string
  hint?: string
  error?: string
  required?: boolean
}

function FieldShell({ id, label, hint, error, required, children }: FieldShellProps & { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink-2">
        {label}
        {required && <span className="text-ink-4"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="m-0 flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle size={14} aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-msg`} className="m-0 text-xs text-ink-3">{hint}</p>
      ) : null}
    </div>
  )
}

// What the three controls share. The height is added by each (a text area has none: it grows with its rows).
const CONTROL = [
  'w-full', 'min-w-0', 'rounded-md', 'border', 'bg-surface', 'px-3', 'text-base', 'text-ink', 'placeholder:text-ink-4',
  'transition-colors', 'focus:outline-none', 'focus:border-accent', 'disabled:bg-raised', 'disabled:text-ink-3',
]
const control = (error?: string) => [CONTROL, error ? 'border-danger' : 'border-wire-strong']

// What tells a screen reader that a field is in error, and where the message is.
const describe = (id: string, error?: string, hint?: string) => ({
  'aria-invalid': !!error,
  'aria-describedby': error || hint ? `${id}-msg` : undefined,
})

export function TextField({ id, label, hint, error, required, className, ...rest }: FieldShellProps & InputHTMLAttributes<HTMLInputElement>) {
  const wide = useWide()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input id={id} {...describe(id, error, hint)} className={cx(control(error), wide ? 'h-10' : 'h-11', className)} {...rest} />
    </FieldShell>
  )
}

export function SelectField({ id, label, hint, error, required, className, children, ...rest }: FieldShellProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const wide = useWide()
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select id={id} {...describe(id, error, hint)} className={cx(control(error), wide ? 'h-10' : 'h-11', className)} {...rest}>
        {children}
      </select>
    </FieldShell>
  )
}

export function TextArea({ id, label, hint, error, required, className, ...rest }: FieldShellProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea id={id} rows={3} {...describe(id, error, hint)} className={cx(control(error), 'resize-y', 'py-2', className)} {...rest} />
    </FieldShell>
  )
}
