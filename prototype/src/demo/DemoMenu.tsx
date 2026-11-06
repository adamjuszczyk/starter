import type { CSSProperties } from 'react'
import { X } from 'lucide-react'
import { base, useDemo } from './demoStore'
import type { Frame, Theme } from './demoStore'

// The states menu, lifted from Overload's prototype/src/demo/DemoMenu.tsx:
// every screen and state in the verdict list, one tap away; a state with no
// row is a missing state. New: a phone frame, so the phone layout can be seen
// on a computer.

type Set = ReturnType<typeof useDemo.getState>['set']
interface Entry { screen: string; item: string; empty: string; states: { label: string; apply: (set: Set) => void }[] }

const ENTRIES: Entry[] = [
  {
    screen: 'Logowanie (sign in)', item: 'stack', empty: '—',
    states: [
      { label: 'Normal', apply: (s) => s({ ...base, screen: 'signIn' }) },
      { label: 'Wrong password', apply: (s) => s({ ...base, screen: 'signIn', signIn: 'wrong' }) },
      { label: 'Signing in', apply: (s) => s({ ...base, screen: 'signIn', signIn: 'pending' }) },
    ],
  },
  {
    screen: 'New app: what you get', item: 'stack', empty: 'A new app has no screens of its own yet: only Settings, until its first build adds tabs.',
    states: [{ label: 'Signed in', apply: (s) => s({ ...base, fresh: true, screen: 'settings' }) }],
  },
  {
    screen: 'Example screen, not in the starter: Klienci', item: 'design system', empty: '"Nie ma jeszcze klientów." and Dodaj klienta.',
    states: [
      { label: 'Full', apply: (s) => s({ ...base }) },
      { label: 'Empty', apply: (s) => s({ ...base, list: 'empty' }) },
      { label: 'Loading', apply: (s) => s({ ...base, list: 'loading' }) },
      { label: "Couldn't load", apply: (s) => s({ ...base, list: 'error' }) },
      { label: 'Offline', apply: (s) => s({ ...base, online: false }) },
      { label: 'Saved', apply: (s) => s({ ...base, toast: 'Zapisano' }) },
    ],
  },
  {
    screen: 'Example screen, not in the starter: Klient form', item: 'design system', empty: 'A new client starts with empty fields.',
    states: [
      { label: 'New', apply: (s) => s({ ...base, panel: 'new' }) },
      { label: 'Edit', apply: (s) => s({ ...base, panel: 'edit' }) },
      { label: 'Missing fields', apply: (s) => s({ ...base, panel: 'new', form: 'invalid' }) },
      { label: 'Saving', apply: (s) => s({ ...base, panel: 'new', form: 'saving' }) },
      { label: 'Save failed', apply: (s) => s({ ...base, panel: 'new', form: 'failed' }) },
      { label: 'Offline', apply: (s) => s({ ...base, panel: 'edit', online: false }) },
      { label: 'Delete', apply: (s) => s({ ...base, panel: 'edit', confirmDelete: true }) },
    ],
  },
  {
    screen: 'Ustawienia (settings)', item: 'stack', empty: '—',
    states: [{ label: 'Normal', apply: (s) => s({ ...base, screen: 'settings' }) }],
  },
  {
    screen: 'Design system', item: 'design system', empty: '—',
    states: [{ label: 'Tokens and components', apply: (s) => s({ ...base, screen: 'system' }) }],
  },
]

const mono: CSSProperties = { fontFamily: 'var(--font-mono)' }
const chip: CSSProperties = { ...mono, minHeight: 36, padding: '0 12px', borderRadius: 9, fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)', cursor: 'pointer' }
const on: CSSProperties = { background: 'var(--accent)', color: 'var(--on-accent)', border: '1px solid transparent' }

export function DemoButton() {
  const set = useDemo((s) => s.set)
  return (
    <button type="button" onClick={() => set({ menuOpen: true })}
      style={{ ...mono, position: 'fixed', right: 'env(safe-area-inset-right, 0px)', top: '42%', zIndex: 90, height: 64, width: 22, padding: 0, writingMode: 'vertical-rl', borderRadius: '10px 0 0 10px', fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', background: 'var(--staging)', color: 'var(--staging-text)', border: 'none', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
      DEMO
    </button>
  )
}

export function DemoMenu() {
  const { set, theme, frame } = useDemo()
  const close = () => set({ menuOpen: false })
  const themes: [Theme, string][] = [['system', 'DEVICE'], ['light', 'LIGHT'], ['dark', 'DARK']]
  const frames: [Frame, string][] = [['fill', 'FULL WINDOW'], ['phone', 'PHONE FRAME']]
  return (
    <div data-demo-menu style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'var(--base)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 'calc(14px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px))', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span style={{ ...mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--staging)' }}>DEMO · STARTER PROTOTYPE · EXAMPLE DATA</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>Screens and states</span>
        </div>
        <button type="button" onClick={close} aria-label="Close" style={{ marginLeft: 'auto', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 9, background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
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
                  <button key={s.label} type="button" data-demo-state={`${e.screen} · ${s.label}`} style={chip} onClick={() => { s.apply(set); close() }}>{s.label}</button>
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
