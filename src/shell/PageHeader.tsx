import type { ReactNode } from 'react'
import { useWide } from '../lib/useWide'

/**
 * A screen's heading: the title, a count or a line under it, and actions on the right (on the phone layout, under the title). Lifted from the
 * prototype's Shell.tsx. On the phone layout the top padding adds the safe area, so a title never sits under a notch.
 */
export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  const wide = useWide()
  return (
    <header className={wide ? 'flex items-end justify-between gap-4 px-8 pt-8 pb-5' : 'flex flex-col gap-4 px-4 pt-[calc(20px+env(safe-area-inset-top))] pb-3'}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 font-display text-2xl leading-tight font-bold text-balance text-ink">{title}</h1>
        {sub && <span className="text-sm text-ink-3">{sub}</span>}
      </div>
      {actions && <div className={wide ? 'flex items-center gap-2' : 'flex w-full items-center gap-2'}>{actions}</div>}
    </header>
  )
}
