import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@app/components/Button'
import { SelectField, TextArea, TextField } from '@app/components/fields'
import { InlineError } from '@app/components/InlineError'
import { Panel } from '@app/components/Panel'
import { useToastStore } from '@app/features/notifications/toastStore'
import { useOnlineStatus } from '@app/hooks/useOnlineStatus'
import { useWide } from '@app/lib/useWide'
import { pl as t } from '@app/i18n/pl'
import { exampleWords as w } from '../words'
import type { FormState } from '../../demo/demoStore'
import { saveClient } from './clientsService.fake'
import type { Client, ClientInput } from './fixtures'

// The example form, in a Panel (a side panel on desktop, a bottom sheet on a phone), rewired from the prototype's to the starter's components.
// The starter's rule for every write, online-only (SPEC Rule 3, decided 2026-11-06; TASKS.md Decided 36 makes this the kit's demonstration of it):
// - offline, Save is off and says why (`common.needsConnection`); nothing is queued;
// - a failed save keeps the panel open with everything typed, and says so (`clientForm.saveFailed`).
// It is a real form: it checks what was typed, calls the service and shows what comes back. The DEMO states only choose how it starts (empty,
// with its errors showing, saving, failed), and the fake service (clientsService.fake.ts) ends a save the way the DEMO says.

type Values = ClientInput
type Errors = { name?: string; phone?: string }

const EMPTY: Values = { name: '', contact: '', phone: '', email: '', city: '', status: 'active', notes: '' }

// What the form holds when it opens, as the prototype's states showed it.
function startingValues(client: Client | null, start: FormState): Values {
  if (client) return { name: client.name, contact: client.contact, phone: client.phone, email: client.email, city: client.city, status: client.status, notes: client.notes }
  if (start === 'invalid') return { ...EMPTY, contact: 'Beata Wiśniewska', phone: '60123', city: 'Kraków' }
  if (start === 'saving' || start === 'failed') return { ...EMPTY, name: 'Kawiarnia Nowa Prowincja', contact: 'Beata Wiśniewska', phone: '607884512', city: 'Kraków' }
  return EMPTY
}

function check(values: Values): Errors {
  const errors: Errors = {}
  if (!values.name.trim()) errors.name = w.clientForm.nameMissing
  if (values.phone && !/^\d{9}$/.test(values.phone.replace(/\s/g, ''))) errors.phone = w.clientForm.phoneWrong
  return errors
}

export function ClientForm({ client, start, onClose, onDelete }: {
  /** The client being edited; null for a new one. */
  client: Client | null
  /** How the DEMO starts the form. */
  start: FormState
  onClose: () => void
  onDelete: () => void
}) {
  const wide = useWide()
  const online = useOnlineStatus()
  const [values, setValues] = useState<Values>(() => startingValues(client, start))
  const [errors, setErrors] = useState<Errors>(() => (start === 'invalid' ? check(startingValues(client, start)) : {}))
  const [status, setStatus] = useState<'idle' | 'saving' | 'failed'>(start === 'saving' ? 'saving' : start === 'failed' ? 'failed' : 'idle')
  const saving = status === 'saving'

  // A write that is out when the panel closes lands on a panel that is gone: what it does next checks first (a ref set on every effect run,
  // because StrictMode runs effects again after cleanup).
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const change = (patch: Partial<Values>) => setValues((v) => ({ ...v, ...patch }))

  async function save() {
    const found = check(values)
    setErrors(found)
    if (found.name || found.phone) return
    setStatus('saving')
    try {
      await saveClient(values, client?.id)
      if (!mounted.current) return
      useToastStore.getState().show(t.common.saved)
      onClose()
    } catch {
      // Everything typed stays where it is: the form is not touched, only told what happened.
      if (mounted.current) setStatus('failed')
    }
  }

  // The footer's button is outside the <form>, so it calls what the form's own submit calls.
  const footer = (
    <div className="flex flex-col gap-3">
      {status === 'failed' && <InlineError text={w.clientForm.saveFailed} />}
      {!online && <p className="m-0 text-sm text-ink-3">{t.common.needsConnection}</p>}
      <div className="flex items-center gap-2">
        {client && (
          <Button variant="danger-ghost" icon={<Trash2 size={16} />} onClick={onDelete} disabled={!online || saving} className="px-3" aria-label={w.clientForm.delete}>
            {wide ? w.clientForm.delete : null}
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={() => void save()} disabled={!online || saving}>{saving ? t.common.saving : t.common.save}</Button>
        </div>
      </div>
    </div>
  )

  return (
    <Panel eyebrow={client ? w.clientForm.eyebrowEdit : undefined} title={client ? client.name : w.clientForm.titleNew}
      onClose={onClose} footer={footer} closeLabel={t.common.close}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); void save() }}>
        <TextField id="f-name" label={w.clientForm.name} required value={values.name} onChange={(e) => change({ name: e.target.value })}
          error={errors.name} disabled={saving} />
        <TextField id="f-contact" label={w.clientForm.contact} value={values.contact} onChange={(e) => change({ contact: e.target.value })} disabled={saving} />
        <div className={wide ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
          <TextField id="f-phone" label={w.clientForm.phone} inputMode="tel" value={values.phone} onChange={(e) => change({ phone: e.target.value })}
            hint={w.clientForm.phoneHint} error={errors.phone} disabled={saving} className="num" />
          <TextField id="f-city" label={w.clientForm.city} value={values.city} onChange={(e) => change({ city: e.target.value })} disabled={saving} />
        </div>
        <TextField id="f-email" label={w.clientForm.email} type="email" value={values.email} onChange={(e) => change({ email: e.target.value })} disabled={saving} />
        <SelectField id="f-status" label={w.clientForm.status} value={values.status} onChange={(e) => change({ status: e.target.value as Client['status'] })} disabled={saving}>
          <option value="active">{w.clients.status.active}</option>
          <option value="inactive">{w.clients.status.inactive}</option>
        </SelectField>
        <TextArea id="f-notes" label={w.clientForm.notes} value={values.notes} onChange={(e) => change({ notes: e.target.value })} disabled={saving} />
      </form>
    </Panel>
  )
}
