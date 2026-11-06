import { Plus, Search, Users, ChevronRight } from 'lucide-react'
import { useWide } from '../lib/useWide'
import { Badge, Button, InlineError } from '../components/ui'
import { Table } from '../components/Table'
import type { Column } from '../components/Table'
import { PageHeader } from '../shell/Shell'
import { pl as t } from '../i18n/pl'
import { formatDate, formatPhone } from '../lib/format'
import { clients, loadErrorReason } from '../demo/fixtures'
import type { Client } from '../demo/fixtures'
import type { ListState } from '../demo/demoStore'

// The prototype's example screen: a list of records, the shape most client
// screens take. Its states (full, empty, loading, couldn't load) are the
// starter's standard for any list.

const status = (c: Client) => <Badge tone={c.status === 'active' ? 'ok' : 'neutral'}>{t.clients.status[c.status]}</Badge>

const COLUMNS: Column<Client>[] = [
  { key: 'name', header: t.clients.col.name, render: (c) => (
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold text-ink">{c.name}</span>
        <span className="text-sm text-ink-3">{c.contact}</span>
      </div>
    ) },
  { key: 'city', header: t.clients.col.city, render: (c) => <span className="text-ink-2">{c.city}</span>, width: '16%' },
  { key: 'phone', header: t.clients.col.phone, render: (c) => <span className="num text-sm whitespace-nowrap text-ink-2">{formatPhone(c.phone)}</span>, width: '16%' },
  { key: 'status', header: t.clients.col.status, render: status, width: '13%' },
  { key: 'added', header: t.clients.col.added, render: (c) => <span className="num text-sm text-ink-3">{formatDate(c.added)}</span>, width: '13%', numeric: true },
]

export function ClientsScreen({ state, onAdd, onOpen, onRetry }: { state: ListState; onAdd: () => void; onOpen: (c: Client) => void; onRetry: () => void }) {
  const wide = useWide()
  const rows = state === 'full' ? clients : []
  const sub = state === 'full' ? t.clients.count(rows.length) : undefined
  const search = (
    <label className={wide ? 'relative w-[280px]' : 'relative min-w-0 flex-1'}>
      <span className="sr-only">{t.common.search}</span>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-4" aria-hidden />
      <input id="client-search" type="search" placeholder={t.clients.searchPlaceholder} disabled={state !== 'full'}
        className={`w-full rounded-md border border-wire-strong bg-surface pr-3 pl-9 text-base text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none disabled:bg-raised ${wide ? 'h-10' : 'h-11'}`} />
    </label>
  )

  return (
    <div className={wide ? 'mx-auto max-w-[1200px] pb-10' : 'pb-6'}>
      <PageHeader title={t.clients.title} sub={sub}
        actions={<>{state !== 'empty' && search}<Button variant="primary" icon={<Plus size={16} />} onClick={onAdd} aria-label={wide ? undefined : t.clients.add}>{wide ? t.clients.add : null}</Button></>} />

      <div className={wide ? 'px-8' : 'px-4'}>
        {state === 'error' && (
          <div className="flex flex-col items-start gap-3">
            <InlineError text={`${t.common.loadFailed(t.clients.loadWhat)} ${t.common.reason}: ${loadErrorReason}.`} />
            <Button onClick={onRetry}>{t.common.retry}</Button>
          </div>
        )}

        {state === 'empty' && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-wire-strong px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-raised text-ink-3"><Users size={20} /></span>
            <p className="m-0 text-base text-ink-2">{t.clients.empty}</p>
            <Button variant="primary" icon={<Plus size={16} />} onClick={onAdd}>{t.clients.add}</Button>
          </div>
        )}

        {(state === 'full' || state === 'loading') && wide && (
          <Table label={t.clients.title} columns={COLUMNS} rows={rows} loading={state === 'loading'} onRowClick={onOpen} />
        )}

        {(state === 'full' || state === 'loading') && !wide && (
          <ul className="m-0 flex list-none flex-col overflow-hidden rounded-lg border border-wire bg-surface p-0" aria-busy={state === 'loading'}>
            {(state === 'loading' ? clients.slice(0, 6) : rows).map((c, i) => (
              <li key={c.id} className="border-b border-wire-faint last:border-b-0">
                {state === 'loading' ? (
                  <div className="flex flex-col gap-2 px-4 py-4">
                    <span className="block h-3 rounded-sm bg-raised" style={{ width: `${55 + (i * 11) % 30}%` }} />
                    <span className="block h-2.5 rounded-sm bg-raised" style={{ width: `${30 + (i * 7) % 20}%` }} />
                  </div>
                ) : (
                  <button type="button" onClick={() => onOpen(c)} className="flex w-full items-center gap-3 bg-transparent px-4 py-3 text-left hover:bg-raised">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-semibold text-ink" style={{ overflowWrap: 'anywhere' }}>{c.name}</span>
                      <span className="text-sm text-ink-3">{c.city} · <span className="num">{formatPhone(c.phone)}</span></span>
                    </div>
                    {status(c)}
                    <ChevronRight size={16} className="shrink-0 text-ink-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
