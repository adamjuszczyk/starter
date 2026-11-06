import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react'
import { useWide } from '../lib/useWide'

// The starter's base components. Every colour, size and radius is a token
// (tokens.css through global.css); nothing here writes a value of its own.

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ── Button ───────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'
const VARIANT: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent border border-transparent hover:opacity-90',
  secondary: 'bg-surface text-ink border border-wire-strong hover:bg-raised',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-raised hover:text-ink',
  danger: 'bg-danger text-on-accent border border-transparent hover:opacity-90',
  'danger-ghost': 'bg-transparent text-danger border border-transparent hover:bg-danger-ghost',
}

export function Button({ variant = 'secondary', icon, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: ReactNode }) {
  const wide = useWide()
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50',
        wide ? 'h-10' : 'h-11',
        VARIANT[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  )
}

// ── Fields ───────────────────────────────────────────────────────────────────
// Lifted from Overload's LoginPage fields (label over input, error under it);
// labels are sentence case, not Overload's mono capitals.
interface FieldShell { id: string; label: string; hint?: string; error?: string; required?: boolean }

function Shell({ id, label, hint, error, required, children }: FieldShell & { children: ReactNode }) {
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

const control = (error?: string) =>
  cx(
    'w-full min-w-0 rounded-md border bg-surface px-3 text-base text-ink placeholder:text-ink-4 transition-colors',
    'focus:outline-none focus:border-accent disabled:bg-raised disabled:text-ink-3',
    error ? 'border-danger' : 'border-wire-strong',
  )

export function TextField({ id, label, hint, error, required, className, ...rest }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const wide = useWide()
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required}>
      <input id={id} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-msg` : undefined} className={cx(control(error), wide ? 'h-10' : 'h-11', className)} {...rest} />
    </Shell>
  )
}

export function SelectField({ id, label, hint, error, required, children, ...rest }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const wide = useWide()
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required}>
      <select id={id} className={cx(control(error), wide ? 'h-10' : 'h-11')} {...rest}>{children}</select>
    </Shell>
  )
}

export function TextArea({ id, label, hint, error, required, ...rest }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Shell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea id={id} rows={3} className={cx(control(error), 'resize-y py-2')} {...rest} />
    </Shell>
  )
}

// ── Badge ────────────────────────────────────────────────────────────────────
type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'
const TONE: Record<Tone, string> = {
  neutral: 'bg-raised text-ink-2',
  ok: 'bg-ok-ghost text-ok',
  warn: 'bg-warn-ghost text-warn',
  danger: 'bg-danger-ghost text-danger',
  accent: 'bg-accent-ghost text-accent',
}
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={cx('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap', TONE[tone])}>{children}</span>
}

// ── Strips and notices ───────────────────────────────────────────────────────
// Offline strip: lifted from Overload's Nav.tsx, moved to the top of the content.
export function OfflineStrip({ text }: { text: string }) {
  return (
    <div role="status" className="flex items-center gap-2 border-b border-wire bg-warn-ghost px-4 py-2 text-sm text-warn">
      <WifiOff size={15} aria-hidden className="shrink-0" />
      <span className="min-w-0">{text}</span>
    </div>
  )
}

export function InlineError({ text }: { text: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md bg-danger-ghost px-3 py-2.5 text-sm text-danger">
      <AlertCircle size={16} aria-hidden className="mt-0.5 shrink-0" />
      <span className="min-w-0">{text}</span>
    </div>
  )
}

export function Toast({ text }: { text: string }) {
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 bottom-6 z-60 flex justify-center px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-bg shadow-panel">
        <CheckCircle2 size={16} aria-hidden /> {text}
      </div>
    </div>
  )
}

export { cx }
