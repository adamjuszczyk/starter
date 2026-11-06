import { useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { TextField } from '../../components/fields'
import { InlineError } from '../../components/InlineError'
import { APP_CONFIG } from '../../lib/appConfig'
import { useWide } from '../../lib/useWide'
import { pl as t } from '../../i18n/pl'
import { signIn, SignInError } from './authService'

// The sign-in page. Layout from the prototype's SignIn.tsx; the flow is Overload's LoginPage: e-mail and password, one button, the error under
// the fields, the whole form busy while it signs in. Dropped: Overload's "create an account" switch, because sign-ups are off in every app
// built from the starter and the owner adds the accounts (SPEC Rule 5).
//
// A failed sign-in shows one of three lines (SPEC Screens as amended 2026-11-06; TASKS.md Decided 24): the e-mail or password is wrong, there is
// no connection, or something else failed, which adds the reason after the line. Supabase's own message is never shown alone.

function failureText(error: SignInError): string {
  if (error.failure === 'wrong') return t.signIn.wrong
  if (error.failure === 'offline') return t.signIn.offline
  return error.reason ? `${t.signIn.failed} ${t.common.reason}: ${error.reason}.` : t.signIn.failed
}

// `signIn` throws a SignInError for every failure. Anything else that reaches here is a failure it did not classify, and is a `failed` with
// its message as the reason, not a raw message on its own.
function asSignInError(error: unknown): SignInError {
  return error instanceof SignInError ? error : new SignInError('failed', error instanceof Error ? error.message : undefined)
}

export default function LoginPage() {
  const wide = useWide()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<SignInError | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    setFailure(null)
    try {
      await signIn(email, password)
      // Signed in: the session reaches AuthProvider, which replaces this page with the app.
    } catch (error) {
      setFailure(asSignInError(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex h-full overflow-y-auto">
      <div className={wide ? 'm-auto w-full max-w-[400px] px-6 py-10' : 'flex w-full flex-col px-5 pt-[calc(56px+env(safe-area-inset-top))] pb-8'}>
        <div className="mb-8 flex items-center gap-2.5">
          <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-md bg-accent font-display text-base font-bold text-on-accent">
            {APP_CONFIG.name.charAt(0)}
          </span>
          <span className="font-display text-xl font-bold text-ink">{APP_CONFIG.name}</span>
        </div>
        <form onSubmit={handleSubmit} className={'flex flex-col gap-5 ' + (wide ? 'rounded-lg border border-wire bg-surface p-7' : '')}>
          <h1 className="m-0 font-display text-2xl font-bold text-ink">{t.signIn.title}</h1>
          <TextField
            id="email"
            label={t.signIn.email}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
          <TextField
            id="password"
            label={t.signIn.password}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
          {failure && <InlineError text={failureText(failure)} />}
          <Button variant="primary" type="submit" disabled={pending} className="w-full">
            {pending ? t.signIn.pending : t.signIn.submit}
          </Button>
        </form>
      </div>
    </div>
  )
}
