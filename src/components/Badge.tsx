import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

// A small label for a status. Lifted from the prototype's ui.tsx: five tones, all from the semantic tokens.
export type BadgeTone = 'neutral' | 'ok' | 'warn' | 'danger' | 'accent'

const BASE = ['inline-flex', 'h-6', 'shrink-0', 'items-center', 'rounded-full', 'px-2.5', 'text-xs', 'font-semibold', 'whitespace-nowrap']

const TONE: Record<BadgeTone, string[]> = {
  neutral: ['bg-raised', 'text-ink-2'],
  ok: ['bg-ok-ghost', 'text-ok'],
  warn: ['bg-warn-ghost', 'text-warn'],
  danger: ['bg-danger-ghost', 'text-danger'],
  accent: ['bg-accent-ghost', 'text-accent'],
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={cx(BASE, TONE[tone])}>{children}</span>
}
