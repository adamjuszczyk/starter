import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { pl as t } from '@app/i18n/pl'
import { exampleWords as w } from '../examples/words'
import { clients, loadErrorReason } from '../examples/clients/fixtures'
import { useDemo } from './demoStore'
import type { DemoValues, Frame, Theme } from './demoStore'
import { applyState } from './seed'

// The states menu, lifted from Overload's prototype/src/demo/DemoMenu.tsx and the spec chat's prototype: every screen and state in the verdict
// list, one tap away; a state with no row is a missing state. Also from the prototype: THEME, a phone frame (WIDTH → PHONE FRAME, so the phone
// layout can be seen on a computer), the "New app: what you get" state, and the example screens' labels ("Example screen, not in the starter").
//
// Each state is a set of changes to `base` (demoStore.ts), the route the app goes to, and ONE EXPECTATION (TASKS.md, Decided 46): what must be
// on the page once the state is applied, a text or a selector. The check (check/clipping.mjs) reads it from the chip (`data-demo-expect`) and
// asserts it after applying the state, so a check that visits twenty states cannot pass with twenty identical screens. Without one a state fails
// check/kit.test.mjs. The words are the real ones (src/i18n/pl.ts and the example's), so an edit to a word moves the expectation with it.

/** What must hold after a state is applied: a visible element with this text, or elements matching a selector (with the text, or exactly `count` of them). */
export type Expect = { text: string } | { selector: string; text?: string; count?: number }

interface DemoStateEntry {
  label: string
  /** What the state changes in `base`. */
  patch: Partial<DemoValues>
  /** The path the real router goes to (/clients is the example's tab, /settings is the starter's). Left out: the router stays where it is. */
  at?: string
  expect: Expect
  /** The sign-in states are the real page's own, so the check drives them: it fills the fields (`fill`) and presses the button (`submit`). */
  drive?: 'fill' | 'submit'
}
interface Entry {
  screen: string
  item: string
  empty: string
  states: DemoStateEntry[]
}

// The rows of the Klienci list in either layout: the desktop's table rows and the phone's list items (both carry the list's name).
const LIST = `[aria-label="${w.clients.title}"]`
const ROWS = ':is(tbody tr, li)'

const ENTRIES: Entry[] = [
  {
    screen: 'Logowanie (sign in)',
    item: 'stack',
    empty: '—',
    states: [
      { label: 'Normal', patch: { signedIn: false }, expect: { text: t.signIn.title }, drive: 'fill' },
      { label: 'Wrong password', patch: { signedIn: false, signIn: 'wrong' }, expect: { text: t.signIn.wrong }, drive: 'submit' },
      { label: 'Offline', patch: { signedIn: false, signIn: 'offline' }, expect: { text: t.signIn.offline }, drive: 'submit' },
      { label: 'Signing in', patch: { signedIn: false, signIn: 'pending' }, expect: { text: t.signIn.pending }, drive: 'submit' },
    ],
  },
  {
    screen: 'New app: what you get',
    item: 'stack',
    empty: 'A new app has no screens of its own yet: only Settings, until its first build adds tabs.',
    states: [{ label: 'Signed in', patch: { fresh: true }, at: '/settings', expect: { selector: 'nav a', count: 1 } }],
  },
  {
    screen: 'Example screen, not in the starter: Klienci',
    item: 'design system',
    empty: '"Nie ma jeszcze klientów." and Dodaj klienta.',
    states: [
      { label: 'Full', patch: {}, at: '/clients', expect: { selector: `${LIST} ${ROWS}`, count: clients.length } },
      { label: 'Empty', patch: { list: 'empty' }, at: '/clients', expect: { text: w.clients.empty } },
      { label: 'Loading', patch: { list: 'loading' }, at: '/clients', expect: { selector: `${LIST}[aria-busy="true"] ${ROWS}`, count: 6 } },
      { label: "Couldn't load", patch: { list: 'error' }, at: '/clients', expect: { text: `${t.common.reason}: ${loadErrorReason}` } },
      { label: 'Offline', patch: { online: false }, at: '/clients', expect: { selector: '[role="status"]', text: t.common.offline } },
      { label: 'Saved', patch: { toast: t.common.saved }, at: '/clients', expect: { selector: '[data-overlay="toast"]', text: t.common.saved } },
    ],
  },
  {
    screen: 'Example screen, not in the starter: Klient form',
    item: 'design system',
    empty: 'A new client starts with empty fields.',
    states: [
      { label: 'New', patch: { panel: 'new' }, at: '/clients', expect: { selector: '[role="dialog"] h2', text: w.clientForm.titleNew } },
      { label: 'Edit', patch: { panel: 'edit' }, at: '/clients', expect: { selector: '[role="dialog"] h2', text: clients[0].name } },
      { label: 'Missing fields', patch: { panel: 'new', form: 'invalid' }, at: '/clients', expect: { selector: '[role="dialog"]', text: w.clientForm.nameMissing } },
      { label: 'Saving', patch: { panel: 'new', form: 'saving' }, at: '/clients', expect: { selector: '[role="dialog"] button', text: t.common.saving } },
      { label: 'Save failed', patch: { panel: 'new', form: 'failed' }, at: '/clients', expect: { selector: '[role="dialog"] [role="alert"]', text: w.clientForm.saveFailed } },
      { label: 'Offline', patch: { panel: 'edit', online: false }, at: '/clients', expect: { selector: '[role="dialog"]', text: t.common.needsConnection } },
      { label: 'Delete', patch: { panel: 'edit', confirmDelete: true }, at: '/clients', expect: { selector: '[role="alertdialog"] h2', text: w.deleteClient.title(clients[0].name) } },
    ],
  },
  {
    screen: 'Ustawienia (settings)',
    item: 'stack',
    empty: '—',
    states: [{ label: 'Normal', patch: {}, at: '/settings', expect: { selector: `[role="radiogroup"][aria-label="${t.settings.theme}"]` } }],
  },
  {
    screen: 'Design system',
    item: 'design system',
    empty: '—',
    states: [{ label: 'Tokens and components', patch: { design: true }, at: '/clients', expect: { selector: 'h1', text: 'Tokens and components' } }],
  },
]

const mono: CSSProperties = { fontFamily: 'var(--font-mono)' }
const chip: CSSProperties = { ...mono, minHeight: 36, padding: '0 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', cursor: 'pointer' }
const on: CSSProperties = { background: 'var(--accent)', color: 'var(--on-accent)', border: '1px solid transparent' }

export function DemoButton() {
  const set = useDemo((s) => s.set)
  return (
    <button type="button" data-demo-button onClick={() => set({ menuOpen: true })}
      style={{ ...mono, position: 'fixed', right: 'env(safe-area-inset-right, 0px)', top: '42%', zIndex: 90, height: 64, width: 22, padding: 0, writingMode: 'vertical-rl', borderRadius: '10px 0 0 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', background: 'var(--staging)', color: 'var(--staging-text)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
      DEMO
    </button>
  )
}

export function DemoMenu() {
  const { set, theme, frame } = useDemo()
  const navigate = useNavigate()
  const close = () => set({ menuOpen: false })
  const themes: [Theme, string][] = [['system', 'DEVICE'], ['light', 'LIGHT'], ['dark', 'DARK']]
  const frames: [Frame, string][] = [['fill', 'FULL WINDOW'], ['phone', 'PHONE FRAME']]
  const go = (state: DemoStateEntry) => {
    applyState(state.patch)
    if (state.at) navigate(state.at)
  }
  return (
    <div data-demo-menu style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--base)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(14px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px))', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--staging)' }}>DEMO · STARTER PROTOTYPE · EXAMPLE DATA</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>Screens and states</span>
        </div>
        <button type="button" data-demo-close onClick={close} aria-label="Close" style={{ marginLeft: 'auto', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px max(16px, env(safe-area-inset-right, 0px)) 32px max(16px, env(safe-area-inset-left, 0px))', minHeight: 0 }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {ENTRIES.map((e) => (
            <div key={e.screen} style={{ padding: '14px 0', borderBottom: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{e.screen}</span>
                <span style={{ ...mono, fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>ITEM: {e.item.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {e.states.map((s) => (
                  <button key={s.label} type="button" style={chip} onClick={() => go(s)}
                    data-demo-state={`${e.screen} · ${s.label}`} data-demo-expect={JSON.stringify(s.expect)} data-demo-drive={s.drive}>
                    {s.label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Empty state: {e.empty}</span>
            </div>
          ))}
          <div style={{ padding: '16px 0 8px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', width: 64 }}>THEME</span>
            {themes.map(([id, label]) => (
              <button key={id} type="button" data-demo-theme={id} onClick={() => set({ theme: id })} style={{ ...chip, ...(theme === id ? on : null) }}>{label}</button>
            ))}
          </div>
          <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ ...mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--text-muted)', width: 64 }}>WIDTH</span>
            {frames.map(([id, label]) => (
              <button key={id} type="button" data-demo-frame={id} onClick={() => set({ frame: id })} style={{ ...chip, ...(frame === id ? on : null) }}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
