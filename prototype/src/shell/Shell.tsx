import type { ReactNode } from 'react'
import { Users, Settings, LogOut } from 'lucide-react'
import { useWide } from '../lib/useWide'
import { cx } from '../components/ui'
import { pl as t } from '../i18n/pl'
import type { Screen } from '../demo/demoStore'

// The app's frame. Phone: Overload's bottom bar (src/components/Nav.tsx: icon
// over label, the lit tab in the accent, safe-area padding), labels in
// sentence case. Desktop: a side menu with the same tabs (new).
// The tabs are each app's own. A new app has only Settings; Clients is the
// prototype's example screen and not part of the starter.

const TABS: { id: Screen; label: string; Icon: typeof Users }[] = [
  { id: 'clients', label: t.nav.clients, Icon: Users },
  { id: 'settings', label: t.nav.settings, Icon: Settings },
]

export function AppShell({ current, go, email, banner, children, tabs: only }: { current: Screen; go: (s: Screen) => void; email: string; banner?: ReactNode; children: ReactNode; tabs?: Screen[] }) {
  const wide = useWide()
  const tabs = only ? TABS.filter((x) => only.includes(x.id)) : TABS
  if (wide) {
    return (
      <div className="flex h-full min-h-0">
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-wire bg-surface">
          <div className="flex h-16 items-center gap-2.5 px-5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-on-accent">S</span>
            <span className="font-display text-lg font-bold text-ink">{t.app.name}</span>
          </div>
          <nav className="flex flex-col gap-0.5 px-3 pt-2">
            {tabs.map(({ id, label, Icon }) => {
              const on = id === current
              return (
                <button key={id} type="button" onClick={() => go(id)} aria-current={on ? 'page' : undefined}
                  className={cx('flex h-10 items-center gap-3 rounded-md px-3 text-left text-base font-medium transition-colors', on ? 'bg-accent-ghost text-accent' : 'text-ink-2 hover:bg-raised hover:text-ink')}>
                  <Icon size={18} strokeWidth={1.9} /> {label}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-wire-faint px-5 py-4">
            <span className="text-xs text-ink-3">{t.app.signedInAs}</span>
            <span className="truncate text-sm font-medium text-ink">{email}</span>
            <button type="button" className="mt-1 flex items-center gap-2 self-start text-sm text-ink-3 hover:text-ink"><LogOut size={14} /> {t.settings.signOut}</button>
          </div>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          {banner}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    )
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      {banner}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <nav className="flex shrink-0 border-t border-wire-faint bg-surface" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {tabs.map(({ id, label, Icon }) => {
          const on = id === current
          return (
            <button key={id} type="button" onClick={() => go(id)} aria-current={on ? 'page' : undefined}
              className={cx('flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold', on ? 'text-accent' : 'text-ink-3')}>
              <Icon size={21} strokeWidth={1.8} /> {label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

/** A screen's heading: title and a count or line under it, actions on the right (phone: under the title). */
export function PageHeader({ title, sub, actions }: { title: string; sub?: ReactNode; actions?: ReactNode }) {
  const wide = useWide()
  return (
    <header className={cx('flex gap-4', wide ? 'items-end justify-between px-8 pt-8 pb-5' : 'flex-col px-4 pt-5 pb-3')}
      style={wide ? undefined : { paddingTop: 'calc(20px + env(safe-area-inset-top, 0px))' }}>
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="m-0 font-display text-2xl font-bold leading-tight text-ink" style={{ textWrap: 'balance' }}>{title}</h1>
        {sub && <span className="text-sm text-ink-3">{sub}</span>}
      </div>
      {actions && <div className={cx('flex items-center gap-2', !wide && 'w-full')}>{actions}</div>}
    </header>
  )
}
