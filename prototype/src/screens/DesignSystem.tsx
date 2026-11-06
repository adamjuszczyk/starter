import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge, Button, InlineError, OfflineStrip, SelectField, TextField, cx } from '../components/ui'
import { Table } from '../components/Table'
import { useWide } from '../lib/useWide'
import { clients } from '../demo/fixtures'
import { formatDate, formatMoney, formatPhone } from '../lib/format'

// The design system on one page, for the spec chat and for builders: every
// token and base component, live. Not a screen of the app (DEMO only), so its
// labels are English and not in the words file.

const COLOURS: [string, string][] = [
  ['--base', 'Page'], ['--surface', 'Card, panel'], ['--surface-raised', 'Raised, hover'], ['--surface-overlay', 'Dialog'],
  ['--border-subtle', 'Divider'], ['--border', 'Border'], ['--border-strong', 'Field border'],
  ['--text-primary', 'Text'], ['--text-secondary', 'Text, second'], ['--text-muted', 'Text, quiet'], ['--text-dim', 'Placeholder'],
  ['--accent', 'Accent'], ['--accent-muted', 'Accent, light'], ['--error', 'Error'], ['--success', 'Success'], ['--warning', 'Warning'],
]
const SIZES: [string, string, string][] = [
  ['text-2xl', '--fs-2xl', 'Page title'], ['text-xl', '--fs-xl', 'Panel title'], ['text-lg', '--fs-lg', 'Dialog title'],
  ['text-base', '--fs-base', 'Body, fields, table'], ['text-sm', '--fs-sm', 'Labels, buttons, second lines'], ['text-xs', '--fs-xs', 'Column headers, badges, hints'],
]

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 font-display text-lg font-bold text-ink">{title}</h2>
        {note && <p className="m-0 text-sm text-ink-3">{note}</p>}
      </div>
      {children}
    </section>
  )
}

export function DesignSystemScreen() {
  const wide = useWide()
  return (
    <div className={cx('flex flex-col gap-10 pb-12', wide ? 'mx-auto max-w-[1000px] px-8 pt-8' : 'px-4 pt-5')}>
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-accent">Starter · design system</span>
        <h1 className="m-0 font-display text-2xl font-bold text-ink">Tokens and components</h1>
        <p className="m-0 text-sm text-ink-3">Each app restyles by changing the token values; screens only use these names.</p>
      </div>

      <Block title="Colours" note="Token names from Overload's tokens.css. Both themes; switch in DEMO.">
        <div className={cx('grid gap-2', wide ? 'grid-cols-4' : 'grid-cols-2')}>
          {COLOURS.map(([v, label]) => (
            <div key={v} className="flex min-w-0 items-center gap-2.5 rounded-md border border-wire bg-surface p-2">
              <span className="h-9 w-9 shrink-0 rounded-sm border border-wire" style={{ background: `var(${v})` }} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-ink">{label}</span>
                <span className="num truncate text-xs text-ink-3">{v}</span>
              </span>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Text sizes" note="New: Overload sets sizes inside each screen. Archivo for words, JetBrains Mono for numbers that line up.">
        <div className="flex flex-col rounded-lg border border-wire bg-surface">
          {SIZES.map(([cls, v, use]) => (
            <div key={cls} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-wire-faint px-4 py-3 last:border-b-0">
              <span className={cx(cls, 'min-w-0 flex-1 font-semibold text-ink')}>Przeglądy w tym miesiącu</span>
              <span className="num text-xs text-ink-3">{v} · {use}</span>
            </div>
          ))}
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
            <span className="num min-w-0 flex-1 text-base text-ink">{formatDate('2026-11-06')} · {formatMoney(12480.5)} · {formatPhone('601234567')}</span>
            <span className="num text-xs text-ink-3">Polish formats</span>
          </div>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={<Plus size={16} />}>Dodaj klienta</Button>
          <Button>Anuluj</Button>
          <Button variant="ghost">Pomiń</Button>
          <Button variant="danger">Usuń</Button>
          <Button variant="danger-ghost" icon={<Trash2 size={16} />}>Usuń klienta</Button>
          <Button variant="primary" disabled>Zapisywanie…</Button>
        </div>
      </Block>

      <Block title="Fields">
        <div className={cx('grid gap-4', wide ? 'grid-cols-2' : 'grid-cols-1')}>
          <TextField id="ds-1" label="Nazwa" required defaultValue="Piekarnia Pod Wawelem" />
          <TextField id="ds-2" label="Telefon" hint="9 cyfr, bez +48." placeholder="601 234 567" />
          <TextField id="ds-3" label="Nazwa" required error="Wpisz nazwę klienta." />
          <SelectField id="ds-4" label="Status" defaultValue="active"><option value="active">Aktywny</option><option value="inactive">Nieaktywny</option></SelectField>
          <TextField id="ds-5" label="Wyłączone" disabled defaultValue="Tylko do odczytu" />
        </div>
      </Block>

      <Block title="Badges and notices">
        <div className="flex flex-wrap gap-2">
          <Badge tone="ok">Aktywny</Badge><Badge>Nieaktywny</Badge><Badge tone="warn">Termin za 7 dni</Badge><Badge tone="danger">Po terminie</Badge><Badge tone="accent">Nowy</Badge>
        </div>
        <div className="overflow-hidden rounded-lg border border-wire"><OfflineStrip text="Brak połączenia. Zapisywanie wróci, gdy połączenie wróci." /></div>
        <InlineError text="Nie udało się zapisać. Wpisane dane zostają, spróbuj ponownie." />
      </Block>

      <Block title="Table" note="Desktop. On a phone the same list is drawn as rows (Klienci, phone width).">
        <Table label="Example" rows={clients.slice(0, 3)} columns={[
          { key: 'n', header: 'Nazwa', render: (c) => <span className="font-semibold">{c.name}</span> },
          { key: 'c', header: 'Miasto', render: (c) => <span className="text-ink-2">{c.city}</span> },
          { key: 'd', header: 'Dodano', render: (c) => <span className="num text-sm text-ink-3">{formatDate(c.added)}</span>, numeric: true },
        ]} />
      </Block>

      <Block title="Panels and dialogs" note="Open them from DEMO: the example Klient form and its Delete state. Side panel on desktop, Overload's bottom sheet on a phone." >
        <span />
      </Block>
    </div>
  )
}
