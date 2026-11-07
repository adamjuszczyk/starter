import { pl as t } from '../i18n/pl'
import { Button } from './Button'
import { InlineError } from './InlineError'

// What a list shows when it could not be loaded: the error line, then a retry button. Lifted from the prototype's example screen (Clients.tsx,
// the Couldn't load state; TASKS.md, Decided 18). The line is the starter's words (`t.common.loadFailed(what)`, `t.common.reason`), so it reads
// the same on every screen: `what` is the genitive the line needs ("listy klientów": "Nie udało się wczytać: listy klientów."), and `reason`
// is what the server said, which goes after the line and never alone (SPEC Screens). Without a reason the line stands by itself.
export function LoadError({ what, reason, onRetry }: { what: string; reason?: string; onRetry: () => void }) {
  const line = reason ? `${t.common.loadFailed(what)} ${t.common.reason}: ${reason}.` : t.common.loadFailed(what)
  return (
    <div className="flex flex-col items-start gap-3">
      <InlineError text={line} />
      <Button onClick={onRetry}>{t.common.retry}</Button>
    </div>
  )
}
