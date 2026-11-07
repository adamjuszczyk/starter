import { useState } from 'react'
import { Plus, Search, Users } from 'lucide-react'
import { Badge } from '@app/components/Badge'
import { Button } from '@app/components/Button'
import { ConfirmDialog } from '@app/components/ConfirmDialog'
import { EmptyState } from '@app/components/EmptyState'
import { ListRows } from '@app/components/ListRows'
import { LoadError } from '@app/components/LoadError'
import { Table } from '@app/components/Table'
import type { Column } from '@app/components/Table'
import { formatDate, formatPhone } from '@app/lib/format'
import { useWide } from '@app/lib/useWide'
import { PageHeader } from '@app/shell/PageHeader'
import { pl as t } from '@app/i18n/pl'
import { exampleWords as w } from '../words'
import { useDemo } from '../../demo/demoStore'
import { clearClients } from '../../demo/seed'
import { ClientForm } from './ClientForm'
import { deleteClient } from './clientsService.fake'
import { useClients } from './useClients'
import type { Client } from './fixtures'

// The example screen: a list of records, the shape most client screens take, rewired from the prototype's to the starter's components (a
// PageHeader, a Table on desktop and ListRows on a phone, EmptyState, LoadError, Panel, ConfirmDialog). Its states (full, empty, loading,
// couldn't load) are the starter's standard for any list. It is NOT in the starter: "Example screen, not in the starter" (SPEC item 3), and a
// new app deletes examples/ and the tab line in App.tsx. It reads its data through a hook (useClients) and writes through a service
// (clientsService.fake.ts), never the database itself (SPEC Rule 4); here both are fakes.

const status = (c: Client) => <Badge tone={c.status === 'active' ? 'ok' : 'neutral'}>{w.clients.status[c.status]}</Badge>

const COLUMNS: Column<Client>[] = [
  {
    key: 'name',
    header: w.clients.col.name,
    render: (c) => (
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold text-ink">{c.name}</span>
        <span className="text-sm text-ink-3">{c.contact}</span>
      </div>
    ),
  },
  { key: 'city', header: w.clients.col.city, render: (c) => <span className="text-ink-2">{c.city}</span>, width: '16%' },
  { key: 'phone', header: w.clients.col.phone, render: (c) => <span className="num text-sm whitespace-nowrap text-ink-2">{formatPhone(c.phone)}</span>, width: '16%' },
  { key: 'status', header: w.clients.col.status, render: status, width: '13%' },
  { key: 'added', header: w.clients.col.added, render: (c) => <span className="num text-sm text-ink-3">{formatDate(c.added)}</span>, width: '13%', numeric: true },
]

export default function ClientsScreen() {
  const wide = useWide()
  const { clients, error } = useClients()
  const panel = useDemo((s) => s.panel)
  const form = useDemo((s) => s.form)
  const confirmDelete = useDemo((s) => s.confirmDelete)
  const set = useDemo((s) => s.set)
  // The row the person opened. The DEMO's "Edit" state opens the panel with none picked, and it shows the first client.
  const [openId, setOpenId] = useState<string | null>(null)

  const loading = !clients && !error
  const empty = clients?.length === 0
  const editing = panel === 'edit' ? ((clients ?? []).find((c) => c.id === openId) ?? clients?.[0] ?? null) : null
  const add = () => set({ panel: 'new', form: 'idle' })
  const open = (c: Client) => {
    setOpenId(c.id)
    set({ panel: 'edit', form: 'idle' })
  }
  const close = () => set({ panel: null, form: 'idle', confirmDelete: false })

  const search = (
    <label className={wide ? 'relative w-[280px]' : 'relative min-w-0 flex-1'}>
      <span className="sr-only">{t.common.search}</span>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-4" aria-hidden />
      <input id="client-search" type="search" placeholder={w.clients.searchPlaceholder} disabled={!clients}
        className={`w-full rounded-md border border-wire-strong bg-surface pr-3 pl-9 text-base text-ink placeholder:text-ink-4 focus:border-accent focus:outline-none disabled:bg-raised ${wide ? 'h-10' : 'h-11'}`} />
    </label>
  )

  return (
    <div className={wide ? 'mx-auto max-w-[1200px] pb-10' : 'pb-6'}>
      <PageHeader title={w.clients.title} sub={clients && !empty ? w.clients.count(clients.length) : undefined}
        actions={<>{!empty && search}<Button variant="primary" icon={<Plus size={16} />} onClick={add} aria-label={wide ? undefined : w.clients.add}>{wide ? w.clients.add : null}</Button></>} />

      <div className={wide ? 'px-8' : 'px-4'}>
        {error && <LoadError what={w.clients.loadWhat} reason={error} onRetry={clearClients} />}

        {empty && (
          <EmptyState icon={<Users size={20} />} text={w.clients.empty}
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={add}>{w.clients.add}</Button>} />
        )}

        {(clients?.length || loading) && wide ? (
          <Table label={w.clients.title} columns={COLUMNS} rows={clients ?? []} loading={loading} onRowClick={open} />
        ) : null}

        {(clients?.length || loading) && !wide ? (
          <ListRows label={w.clients.title} rows={clients ?? []} loading={loading} onRowClick={open}
            row={(c) => ({ title: c.name, detail: <>{c.city} · <span className="num">{formatPhone(c.phone)}</span></>, trailing: status(c) })} />
        ) : null}
      </div>

      {/* An existing client's form opens once the client is known: the list's answer arrives after the screen is drawn (demo/seed.ts). */}
      {(panel === 'new' || (panel === 'edit' && editing)) && (
        <ClientForm key={editing?.id ?? 'new'} client={editing} start={form} onClose={close} onDelete={() => set({ confirmDelete: true })} />
      )}
      {confirmDelete && editing && (
        <ConfirmDialog danger title={w.deleteClient.title(editing.name)} body={w.deleteClient.body}
          confirmLabel={w.deleteClient.confirm} cancelLabel={t.common.cancel}
          onConfirm={() => { void deleteClient(editing.id).then(close) }} onCancel={() => set({ confirmDelete: false })} />
      )}
    </div>
  )
}
