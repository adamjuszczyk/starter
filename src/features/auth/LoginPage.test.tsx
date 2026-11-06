// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { pl as t } from '../../i18n/pl'
import { APP_CONFIG } from '../../lib/appConfig'
import { WidthRoot } from '../../lib/useWide'

// The sign-in page runs on the real `authService`, with only the Supabase client stood in for at its boundary: a failed sign-in reaches the page
// the way supabase-js hands it over (a resolved `{ error }`, or a thrown failed fetch), so the line shown is the whole path's, from the client's
// error class to the words (SPEC Screens as amended 2026-11-06; TASKS.md Decided 24). The error fixtures are supabase-js's own classes.
const auth = vi.hoisted(() => ({ signInWithPassword: vi.fn() }))
vi.mock('../../lib/supabase', () => ({ supabase: { auth } }))

// jsdom has no layout: the width the frame measures is the one a test sets.
let width = 1280
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width })

const { default: LoginPage } = await import('./LoginPage')

const SIGNED_IN = { data: { user: { id: 'u1' }, session: { access_token: 'token' } }, error: null }
const refused = (error: Error) => ({ data: { user: null, session: null }, error })

const email = () => screen.getByLabelText(t.signIn.email) as HTMLInputElement
const password = () => screen.getByLabelText(t.signIn.password) as HTMLInputElement
const button = () => screen.getByRole('button') as HTMLButtonElement

function fill(emailValue = 'anna@firma.pl', passwordValue = 'haslo-przyklad') {
  fireEvent.change(email(), { target: { value: emailValue } })
  fireEvent.change(password(), { target: { value: passwordValue } })
}
async function submit() {
  await act(async () => {
    fireEvent.click(button())
  })
}

beforeEach(() => {
  width = 1280
  auth.signInWithPassword.mockReset()
})
afterEach(() => cleanup())

describe('the page', () => {
  it('has the title, the two fields, one button and the app\'s name, and nothing to create an account', () => {
    const { container } = render(<LoginPage />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t.signIn.title)
    expect(screen.getByText(APP_CONFIG.name)).toBeTruthy()
    expect(container.querySelectorAll('input')).toHaveLength(2)
    expect(email().type).toBe('email')
    expect(password().type).toBe('password')
    expect(button().textContent).toBe(t.signIn.submit)
    // SPEC Rule 5: sign-ups are off and the owner adds the accounts, so no control switches the form to creating one (Overload's did).
    expect(screen.queryAllByRole('button')).toHaveLength(1)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/załóż|zarejestruj|utwórz|konto|sign.?up|create|register/i)
  })

  it('shows no error line until a sign-in fails', () => {
    render(<LoginPage />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('draws the controls at the frame\'s width: 44 px on the phone layout, 40 px on the desktop\'s (Decided 45: the page is inside WidthRoot)', () => {
    width = 390
    const phone = render(
      <WidthRoot>
        <LoginPage />
      </WidthRoot>,
    )
    expect(phone.container.querySelector('[data-layout]')?.getAttribute('data-layout')).toBe('phone')
    expect(email().className).toContain('h-11')
    expect(button().className).toContain('h-11')
    phone.unmount()

    width = 1280
    render(
      <WidthRoot>
        <LoginPage />
      </WidthRoot>,
    )
    expect(email().className).toContain('h-10')
    expect(button().className).toContain('h-10')
  })
})

describe('signing in', () => {
  it('gives supabase the e-mail and the password as typed, and shows no line when it works', async () => {
    auth.signInWithPassword.mockResolvedValue(SIGNED_IN)
    render(<LoginPage />)
    fill('anna@firma.pl', 'haslo-przyklad')
    await submit()

    expect(auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({ email: 'anna@firma.pl', password: 'haslo-przyklad' })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('wrong e-mail or password shows t.signIn.wrong, and not supabase\'s own message', async () => {
    auth.signInWithPassword.mockResolvedValue(refused(new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')))
    render(<LoginPage />)
    fill()
    await submit()

    expect(screen.getByRole('alert').textContent).toBe(t.signIn.wrong)
    expect(screen.queryByText('Invalid login credentials')).toBeNull()
  })

  it('no connection shows t.signIn.offline: a fetch that failed (a thrown TypeError) and a request that got no answer (status 0)', async () => {
    auth.signInWithPassword.mockRejectedValue(new TypeError('Failed to fetch'))
    render(<LoginPage />)
    fill()
    await submit()
    expect(screen.getByRole('alert').textContent).toBe(t.signIn.offline)
    cleanup()

    auth.signInWithPassword.mockResolvedValue(refused(new AuthRetryableFetchError('Failed to fetch', 0)))
    render(<LoginPage />)
    fill()
    await submit()
    expect(screen.getByRole('alert').textContent).toBe(t.signIn.offline)
  })

  it('any other failure shows t.signIn.failed and then the reason: "Powód: x" for a reason "x"', async () => {
    auth.signInWithPassword.mockResolvedValue(refused(new AuthApiError('x', 429, 'over_request_rate_limit')))
    render(<LoginPage />)
    fill()
    await submit()

    const line = screen.getByRole('alert').textContent
    expect(line).toContain(t.signIn.failed)
    expect(line).toContain(`${t.common.reason}: x`)
    expect(line).toBe(`${t.signIn.failed} ${t.common.reason}: x.`)
  })

  it('the raw message never appears alone: not for a reason, and not for a failure the service did not classify either', async () => {
    auth.signInWithPassword.mockResolvedValue(refused(new AuthApiError('Email not confirmed', 400, 'email_not_confirmed')))
    render(<LoginPage />)
    fill()
    await submit()
    expect(screen.queryByText('Email not confirmed')).toBeNull()
    expect(screen.getByRole('alert').textContent).not.toBe('Email not confirmed')
    expect(screen.getByRole('alert').textContent).toContain(t.signIn.failed)
    cleanup()

    auth.signInWithPassword.mockRejectedValue(new Error('Invalid login credentials'))
    render(<LoginPage />)
    fill()
    await submit()
    expect(screen.queryByText('Invalid login credentials')).toBeNull()
    expect(screen.getByRole('alert').textContent).toContain(t.signIn.failed)
  })

  it('pending: both fields and the button are disabled, the button says so, the old line is gone; after the answer all is as it was, typed text kept', async () => {
    const answers: Array<(value: unknown) => void> = []
    auth.signInWithPassword.mockImplementation(() => new Promise((resolve) => answers.push(resolve)))
    render(<LoginPage />)
    fill('anna@firma.pl', 'zle-haslo')

    await submit()
    expect(email().disabled).toBe(true)
    expect(password().disabled).toBe(true)
    expect(button().disabled).toBe(true)
    expect(button().textContent).toBe(t.signIn.pending)

    await act(async () => answers[0](refused(new AuthApiError('Invalid login credentials', 400, 'invalid_credentials'))))
    expect(screen.getByRole('alert').textContent).toBe(t.signIn.wrong)
    expect(email().disabled).toBe(false)
    expect(password().disabled).toBe(false)
    expect(button().disabled).toBe(false)
    expect(button().textContent).toBe(t.signIn.submit)
    expect(email().value).toBe('anna@firma.pl')
    expect(password().value).toBe('zle-haslo')

    // A second attempt starts clean: the line of the first is not shown while it is pending.
    await submit()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(button().textContent).toBe(t.signIn.pending)
  })
})
