import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { APP_CONFIG } from '../lib/appConfig'
import { cx } from '../lib/cx'
import { useWide } from '../lib/useWide'
import { useAuth } from '../features/auth/useAuth'
import { pl as t } from '../i18n/pl'
import { TABS } from './tabs'

// The app's frame, signed in. Phone layout: Overload's bottom tab bar (src/components/Nav.tsx: a NavLink per tab, icon over label, the lit tab
// in the accent, padded by the bottom safe area), labels in sentence case, not Overload's monospace capitals. Desktop layout: the prototype's
// side menu, the same tabs, with the app's name tile, the signed-in line and its own sign-out button. Which of the two is the app's own
// width's to say (useWide), not the window's. Dropped from Overload's Nav: the install prompt (the iPhone guide is the client-ready build)
// and the Coach tab.
//
// `banner` is what sits above the content, the offline strip (App.tsx passes it, so this file does not read the connection).

// Class lists, one class to a string (src/lib/cx.ts says why). A NavLink is lit when its route is the page's: it sets aria-current="page" too.
const SIDE_LINK = ['flex', 'h-10', 'items-center', 'gap-3', 'rounded-md', 'px-3', 'text-left', 'text-base', 'font-medium', 'transition-colors']
const SIDE_LINK_ON = ['bg-accent-ghost', 'text-accent']
const SIDE_LINK_OFF = ['text-ink-2', 'hover:bg-raised', 'hover:text-ink']
const TAB = ['flex', 'flex-1', 'flex-col', 'items-center', 'gap-1', 'py-2.5', 'text-xs', 'font-semibold']
const TAB_ON = ['text-accent']
const TAB_OFF = ['text-ink-3']

export function AppShell({ banner, children }: { banner?: ReactNode; children: ReactNode }) {
  const wide = useWide()
  const { user, signOut, signingOut } = useAuth()

  if (wide) {
    return (
      <div className="flex h-full min-h-0">
        <aside className="flex w-[232px] shrink-0 flex-col border-r border-wire bg-surface">
          <div className="flex h-16 items-center gap-2.5 px-5">
            <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-on-accent">
              {APP_CONFIG.name.charAt(0)}
            </span>
            <span className="font-display text-lg font-bold text-ink">{APP_CONFIG.name}</span>
          </div>
          <nav className="flex flex-col gap-0.5 px-3 pt-2">
            {TABS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => cx(SIDE_LINK, isActive ? SIDE_LINK_ON : SIDE_LINK_OFF)}>
                <Icon size={18} strokeWidth={1.9} /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-1 border-t border-wire-faint px-5 py-4">
            <span className="text-xs text-ink-3">{t.app.signedInAs}</span>
            <span className="truncate text-sm font-medium text-ink">{user?.email}</span>
            <button
              type="button"
              disabled={signingOut}
              onClick={() => void signOut()}
              className="mt-1 flex items-center gap-2 self-start text-sm text-ink-3 hover:text-ink disabled:opacity-50"
            >
              <LogOut size={14} /> {signingOut ? t.settings.signingOut : t.settings.signOut}
            </button>
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
      <nav className="flex shrink-0 border-t border-wire-faint bg-surface pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cx(TAB, isActive ? TAB_ON : TAB_OFF)}>
            <Icon size={21} strokeWidth={1.8} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
