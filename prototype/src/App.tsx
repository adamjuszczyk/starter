import { useEffect } from 'react'
import { WidthRoot } from './lib/useWide'
import { AppShell } from './shell/Shell'
import { OfflineStrip, Toast, cx } from './components/ui'
import { ConfirmDialog } from './components/overlays'
import { ClientsScreen } from './screens/Clients'
import { ClientForm } from './screens/ClientForm'
import { SignInScreen } from './screens/SignIn'
import { SettingsScreen } from './screens/Settings'
import { DesignSystemScreen } from './screens/DesignSystem'
import { DemoButton, DemoMenu } from './demo/DemoMenu'
import { base, useDemo } from './demo/demoStore'
import { clients } from './demo/fixtures'
import { pl as t } from './i18n/pl'

const EMAIL = 'anna@firma.pl'

// Where the page host set a theme of its own, "as on the device" goes back to it.
const HOST_THEME = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : null

export default function App() {
  const d = useDemo()
  const { set } = d

  // Theme: "as on the device" sets nothing, so the device decides (tokens.css).
  useEffect(() => {
    const root = document.documentElement
    const value = d.theme === 'system' ? HOST_THEME : d.theme
    if (value) root.setAttribute('data-theme', value)
    else root.removeAttribute('data-theme')
  }, [d.theme])

  const phone = d.frame === 'phone'
  const content =
    d.screen === 'signIn' ? (
      <SignInScreen state={d.signIn} onSubmit={() => set({ signIn: 'pending' })} />
    ) : (
      <AppShell current={d.screen === 'system' ? 'clients' : d.screen} go={(s) => set({ ...base, fresh: d.fresh, screen: s })} email={EMAIL}
        tabs={d.fresh ? ['settings'] : undefined}
        banner={!d.online ? <OfflineStrip text={t.common.offline} /> : undefined}>
        {d.screen === 'settings' ? <SettingsScreen email={EMAIL} theme={d.theme} setTheme={(theme) => set({ theme })} />
          : d.screen === 'system' ? <DesignSystemScreen />
          : <ClientsScreen state={d.list} onAdd={() => set({ panel: 'new', form: 'idle' })} onOpen={() => set({ panel: 'edit', form: 'idle' })} onRetry={() => set({ list: 'loading' })} />}
      </AppShell>
    )

  return (
    <div className={cx('h-full', phone && 'flex items-center justify-center bg-raised p-4')}>
      <WidthRoot
        className={cx('relative isolate overflow-hidden bg-bg', phone ? 'h-full max-h-[844px] w-[390px] max-w-full rounded-xl border border-wire-strong shadow-panel' : 'h-full w-full')}>
        <div className="h-full" style={{ transform: 'translateZ(0)' }}>
          {content}
          {d.panel && (
            <ClientForm key={`${d.panel}-${d.form}`} mode={d.panel} state={d.form} online={d.online}
              onClose={() => set({ panel: null, form: 'idle' })} onSave={() => set({ form: 'saving' })} onDelete={() => set({ confirmDelete: true })} />
          )}
          {d.confirmDelete && (
            <ConfirmDialog danger title={t.deleteClient.title(clients[0].name)} body={t.deleteClient.body}
              confirmLabel={t.deleteClient.confirm} cancelLabel={t.common.cancel}
              onConfirm={() => set({ ...base })} onCancel={() => set({ confirmDelete: false })} />
          )}
          {d.toast && <Toast text={d.toast} />}
        </div>
      </WidthRoot>
      <DemoButton />
      {d.menuOpen && <DemoMenu />}
    </div>
  )
}
