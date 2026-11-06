import { Button, InlineError, TextField } from '../components/ui'
import { useWide } from '../lib/useWide'
import { pl as t } from '../i18n/pl'
import type { SignInState } from '../demo/demoStore'

// Lifted from Overload's src/features/auth/LoginPage.tsx: e-mail and password,
// one button, the error under the fields, the button busy while it signs in.
// Dropped: Overload's "create an account" switch. Sign-ups are off in the
// starter: accounts are added by the app's owner (decided 2026-11-06).

export function SignInScreen({ state, onSubmit }: { state: SignInState; onSubmit: () => void }) {
  const wide = useWide()
  const pending = state === 'pending'
  return (
    <div className="flex h-full overflow-y-auto">
      <div className={wide ? 'm-auto w-full max-w-[400px] px-6 py-10' : 'flex w-full flex-col px-5'} style={wide ? undefined : { paddingTop: 'calc(56px + env(safe-area-inset-top, 0px))', paddingBottom: 32 }}>
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent font-display text-base font-bold text-on-accent">S</span>
          <span className="font-display text-xl font-bold text-ink">{t.app.name}</span>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit() }}
          className={wide ? 'flex flex-col gap-5 rounded-lg border border-wire bg-surface p-7' : 'flex flex-col gap-5'}>
          <h1 className="m-0 font-display text-2xl font-bold text-ink">{t.signIn.title}</h1>
          <TextField id="email" label={t.signIn.email} type="email" autoComplete="email" defaultValue="anna@firma.pl" disabled={pending} />
          <TextField id="password" label={t.signIn.password} type="password" autoComplete="current-password" defaultValue="haslo-przyklad" disabled={pending} />
          {state === 'wrong' && <InlineError text={t.signIn.wrong} />}
          <Button variant="primary" type="submit" disabled={pending} className="w-full">{pending ? t.signIn.pending : t.signIn.submit}</Button>
        </form>
      </div>
    </div>
  )
}
