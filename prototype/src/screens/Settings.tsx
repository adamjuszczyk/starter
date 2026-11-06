import type { ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { PageHeader } from '../shell/Shell'
import { Button, cx } from '../components/ui'
import { useWide } from '../lib/useWide'
import { pl as t } from '../i18n/pl'
import type { Theme } from '../demo/demoStore'

// Lifted from Overload's Settings: the account, the theme, and the build line
// at the bottom. Theme now has three choices; "as on the device" is the default.
// Overload-only settings (accent, units, Coach) are dropped.

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
    <div className={cx('flex gap-3 border-b border-wire-faint px-4 py-3.5 last:border-b-0', wide ? 'items-center justify-between' : 'flex-col')}>
      <span className="text-base text-ink">{label}</span>
      {children}
    </div>
  )
}

export function SettingsScreen({ email, theme, setTheme }: { email: string; theme: Theme; setTheme: (t: Theme) => void }) {
  const wide = useWide()
  const choices: [Theme, string][] = [['system', t.settings.themeSystem], ['light', t.settings.themeLight], ['dark', t.settings.themeDark]]
  return (
    <div className={wide ? 'mx-auto max-w-[720px] pb-10' : 'pb-6'}>
      <PageHeader title={t.settings.title} />
      <div className={cx('flex flex-col gap-6', wide ? 'px-8' : 'px-4')}>
        <Section title={t.settings.account}>
          <Row label={email}>
            <Button variant="secondary" icon={<LogOut size={15} />} className={wide ? '' : 'self-start'}>{t.settings.signOut}</Button>
          </Row>
        </Section>
        <Section title={t.settings.look}>
          <Row label={t.settings.theme}>
            <div role="radiogroup" aria-label={t.settings.theme} className="flex rounded-md border border-wire-strong bg-raised p-0.5">
              {choices.map(([id, label]) => (
                <button key={id} type="button" role="radio" aria-checked={theme === id} onClick={() => setTheme(id)}
                  className={cx('h-9 flex-1 rounded-sm border px-3 text-sm font-semibold whitespace-nowrap', theme === id ? 'border-wire bg-surface text-ink' : 'border-transparent text-ink-3 hover:text-ink')}>
                  {label}
                </button>
              ))}
            </div>
          </Row>
        </Section>
        <p className="num m-0 text-xs text-ink-4">{t.settings.version} 0.1.0 · build 3f9c2a1 · 06.11.2026 13:52</p>
      </div>
    </div>
  )
}
