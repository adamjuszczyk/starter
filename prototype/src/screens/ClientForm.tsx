import { Trash2 } from 'lucide-react'
import { Panel } from '../components/overlays'
import { Button, InlineError, SelectField, TextArea, TextField } from '../components/ui'
import { useWide } from '../lib/useWide'
import { pl as t } from '../i18n/pl'
import { clients } from '../demo/fixtures'
import type { FormState } from '../demo/demoStore'

// The example form, in a Panel (side panel on desktop, bottom sheet on phone).
// The starter's rule for every write, online-only (decided 2026-11-06):
// - offline, Save is off and says why; nothing is queued;
// - a failed save keeps the panel open with everything typed, and says so.

export function ClientForm({ mode, state, online, onClose, onSave, onDelete }: {
  mode: 'new' | 'edit'
  state: FormState
  online: boolean
  onClose: () => void
  onSave: () => void
  onDelete: () => void
}) {
  const wide = useWide()
  const c = mode === 'edit' ? clients[0] : null
  const invalid = state === 'invalid'
  const saving = state === 'saving'
  const v = (x: string | undefined) => (invalid && mode === 'new' ? undefined : x)

  const footer = (
    <div className="flex flex-col gap-3">
      {state === 'failed' && <InlineError text={t.clientForm.saveFailed} />}
      {!online && <p className="m-0 text-sm text-ink-3">{t.common.needsConnection}</p>}
      <div className="flex items-center gap-2">
        {mode === 'edit' && (
          <Button variant="danger-ghost" icon={<Trash2 size={16} />} onClick={onDelete} disabled={!online || saving} className="px-3" aria-label={t.clientForm.delete}>
            {wide ? t.clientForm.delete : null}
          </Button>
        )}
        <div className="ml-auto flex gap-2">
          <Button onClick={onClose}>{t.common.cancel}</Button>
          <Button variant="primary" onClick={onSave} disabled={!online || saving}>{saving ? t.common.saving : t.common.save}</Button>
        </div>
      </div>
    </div>
  )

  return (
    <Panel eyebrow={mode === 'edit' ? t.clientForm.eyebrowEdit : undefined} title={c ? c.name : t.clientForm.titleNew}
      onClose={onClose} footer={footer} closeLabel={t.common.close}>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave() }}>
        <TextField id="f-name" label={t.clientForm.name} required defaultValue={v(c?.name ?? (state === 'failed' || state === 'saving' ? 'Kawiarnia Nowa Prowincja' : ''))}
          error={invalid ? t.clientForm.nameMissing : undefined} disabled={saving} />
        <TextField id="f-contact" label={t.clientForm.contact} defaultValue={c?.contact ?? (state !== 'idle' ? 'Beata Wiśniewska' : '')} disabled={saving} />
        <div className={wide ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-4'}>
          <TextField id="f-phone" label={t.clientForm.phone} inputMode="tel" defaultValue={c?.phone ?? (invalid ? '60123' : state !== 'idle' ? '607884512' : '')}
            hint={t.clientForm.phoneHint} error={invalid ? t.clientForm.phoneWrong : undefined} disabled={saving} className="num" />
          <TextField id="f-city" label={t.clientForm.city} defaultValue={c?.city ?? (state !== 'idle' ? 'Kraków' : '')} disabled={saving} />
        </div>
        <TextField id="f-email" label={t.clientForm.email} type="email" defaultValue={c?.email ?? ''} disabled={saving} />
        <SelectField id="f-status" label={t.clientForm.status} defaultValue={c?.status ?? 'active'} disabled={saving}>
          <option value="active">{t.clients.status.active}</option>
          <option value="inactive">{t.clients.status.inactive}</option>
        </SelectField>
        <TextArea id="f-notes" label={t.clientForm.notes} defaultValue={c?.notes ?? ''} disabled={saving} />
      </form>
    </Panel>
  )
}
