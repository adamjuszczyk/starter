import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../lib/cx'
import { useWide } from '../lib/useWide'

// The starter's button. Lifted from the prototype's ui.tsx: five variants, 40 px tall on the desktop layout and 44 px on the phone's (the
// phone's touch target). Every colour, size and radius is a token class; nothing here writes a value of its own. Classes are one to a
// string, as src/lib/cx.ts says why.
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost'

const BASE = [
  'inline-flex', 'shrink-0', 'items-center', 'justify-center', 'gap-2', 'rounded-md', 'px-4',
  'text-sm', 'font-semibold', 'whitespace-nowrap', 'transition-colors', 'disabled:opacity-50',
]

const VARIANT: Record<ButtonVariant, string[]> = {
  primary: ['bg-accent', 'text-on-accent', 'border', 'border-transparent', 'hover:opacity-90'],
  secondary: ['bg-surface', 'text-ink', 'border', 'border-wire-strong', 'hover:bg-raised'],
  ghost: ['bg-transparent', 'text-ink-2', 'border', 'border-transparent', 'hover:bg-raised', 'hover:text-ink'],
  danger: ['bg-danger', 'text-on-accent', 'border', 'border-transparent', 'hover:opacity-90'],
  'danger-ghost': ['bg-transparent', 'text-danger', 'border', 'border-transparent', 'hover:bg-danger-ghost'],
}

export function Button({
  variant = 'secondary',
  icon,
  children,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; icon?: ReactNode }) {
  const wide = useWide()
  return (
    <button type="button" {...rest} className={cx(BASE, wide ? 'h-10' : 'h-11', VARIANT[variant], className)}>
      {icon}
      {children}
    </button>
  )
}
