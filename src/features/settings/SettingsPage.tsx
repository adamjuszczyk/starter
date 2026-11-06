import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { Button } from '../../components/Button'
import { formatDateTime } from '../../lib/format'
import { useWide } from '../../lib/useWide'
import { APP_VERSION } from '../../lib/version'
import { PageHeader } from '../../shell/PageHeader'
import { pl as t } from '../../i18n/pl'
import { useAuth } from '../auth/useAuth'
import { useTheme, type Theme } from './useTheme'

// Settings. Layout and wording from the prototype's Settings.tsx; the behaviour is Overload's SettingsPage, ACCOUNT and APPEARANCE (its
// other sections are Overload's own: accent, units, rest times, what's new): the account with its sign-out, which shows a pending word while
// it signs out, and the theme, which is applied through <html> (useTheme). The build line stays at the bottom, as in Overload.

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="m-0 text-sm font-semibold text-ink-3">{title}</h2>
      <div className="flex flex-col rounded-lg border border-wire bg-surface">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  const wide = useWide()
  return (
    <div className={'flex gap-3 border-b border-wire-faint px-4 py-3.5 last:border-b-0 ' + (wide ? 'items-center justify-between' : 'flex-col')}>
      <span className="text-base text-ink">{label}</span>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const wide = useWide()
  const { user, signOut, signingOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const choices: [Theme, string][] = [
    ['system', t.settings.themeSystem],
    ['light', t.settings.themeLight],
    ['dark', t.settings.themeDark],
  ]
  return (
    <div className={wide ? 'mx-auto max-w-[720px] pb-10' : 'pb-6'}>
      <PageHeader title={t.settings.title} />
      <div className={'flex flex-col gap-6 ' + (wide ? 'px-8' : 'px-4')}>
        <Section title={t.settings.account}>
          <Row label={user?.email ?? ''}>
            <Button icon={<LogOut size={15} />} disabled={signingOut} onClick={() => void signOut()} className={wide ? undefined : 'self-start'}>
              {signingOut ? t.settings.signingOut : t.settings.signOut}
            </Button>
          </Row>
        </Section>
        <Section title={t.settings.look}>
          <Row label={t.settings.theme}>
            <div role="radiogroup" aria-label={t.settings.theme} className="flex rounded-md border border-wire-strong bg-raised p-0.5">
              {choices.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={theme === id}
                  onClick={() => setTheme(id)}
                  className={'h-9 flex-1 rounded-sm border px-3 text-sm font-semibold whitespace-nowrap ' + (theme === id ? 'border-wire bg-surface text-ink' : 'border-transparent text-ink-3 hover:text-ink')}
                >
                  {label}
                </button>
              ))}
            </div>
          </Row>
        </Section>
        <p className="num m-0 text-xs text-ink-4">{t.settings.buildLine(APP_VERSION, __BUILD_HASH__, formatDateTime(__BUILD_TIME__))}</p>
      </div>
    </div>
  )
}
