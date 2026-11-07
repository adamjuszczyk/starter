// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { pl as t } from '../../i18n/pl'
import { formatDateTime } from '../../lib/format'
import { resetTheme } from './useTheme'

// Settings runs on the real AuthProvider and the real theme hook, with Supabase stood in for at its boundary (a signed-in person, whose e-mail
// the Account row shows) and the sign-out service watched: the page's sign-out goes to the service through the provider, and the theme
// radio writes the device's choice. The build line is read from the build's defines (vite.config.ts), here given values no real build has,
// so a line written into the page by hand would show.
const service = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'u1', email: 'anna@firma.pl' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  },
}))
vi.mock('../auth/authService', () => ({ signOut: service.signOut }))

const BUILD_TIME = '2031-02-03T04:05:00.000Z'
vi.stubGlobal('__APP_VERSION__', '7.8.9')
vi.stubGlobal('__BUILD_HASH__', 'abc1234')
vi.stubGlobal('__BUILD_TIME__', BUILD_TIME)

const { AuthProvider } = await import('../auth/useAuth')
const { default: SettingsPage } = await import('./SettingsPage')

const html = document.documentElement

async function renderPage() {
  const view = render(
    <AuthProvider>
      <SettingsPage />
    </AuthProvider>,
  )
  // The provider reads the session before it shows the e-mail.
  await screen.findByText('anna@firma.pl')
  return view
}
const signOutButton = () => screen.getByRole('button', { name: new RegExp(`${t.settings.signOut}|${t.settings.signingOut}`) }) as HTMLButtonElement
const radio = (name: string) => screen.getByRole('radio', { name }) as HTMLButtonElement

beforeEach(() => {
  service.signOut.mockReset()
  localStorage.clear()
  html.removeAttribute('data-theme')
  resetTheme()
})
afterEach(() => cleanup())

describe('Settings', () => {
  it('has the title, the account with the signed-in e-mail, the theme and the build line', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(t.settings.title)
    expect(screen.getByRole('heading', { name: t.settings.account })).toBeTruthy()
    expect(screen.getByRole('heading', { name: t.settings.look })).toBeTruthy()
    expect(screen.getByText('anna@firma.pl')).toBeTruthy()
    expect(signOutButton().textContent).toBe(t.settings.signOut)
  })

  it('the build line reads the build\'s defines (version, hash, time) and stays at the bottom', async () => {
    const { container } = await renderPage()
    const line = container.querySelector('p.num') as HTMLElement
    expect(line.textContent).toBe(t.settings.buildLine('7.8.9', 'abc1234', formatDateTime(BUILD_TIME)))
    expect(line.textContent).toContain('7.8.9')
    expect(line.textContent).toContain('abc1234')
    // After the last section, as in Overload.
    const sections = container.querySelectorAll('section')
    const lastSection = sections[sections.length - 1]
    expect(lastSection.compareDocumentPosition(line) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('sign-out', () => {
  it('calls the service, shows the pending word and disables the button while it signs out, and goes back when it is done', async () => {
    let done: () => void = () => {}
    service.signOut.mockImplementation(() => new Promise<void>((resolve) => (done = resolve)))
    await renderPage()

    await act(async () => {
      fireEvent.click(signOutButton())
    })
    expect(service.signOut).toHaveBeenCalledTimes(1)
    expect(signOutButton().textContent).toBe(t.settings.signingOut)
    expect(signOutButton().disabled).toBe(true)

    await act(async () => done())
    expect(signOutButton().textContent).toBe(t.settings.signOut)
    expect(signOutButton().disabled).toBe(false)
  })

  // The service resolves when there is no connection (it signs out on this device: authService.signOut.test.ts, App.signOut.test.tsx); what it
  // throws is a sign-out that failed with the session still on the device, such as a server that answered with an error.
  it('a sign-out that fails (the service throws) leaves the person signed in and the button as it was', async () => {
    service.signOut.mockRejectedValue(new Error('Bad Gateway'))
    await renderPage()

    await act(async () => {
      fireEvent.click(signOutButton())
    })
    expect(service.signOut).toHaveBeenCalledTimes(1)
    expect(signOutButton().textContent).toBe(t.settings.signOut)
    expect(signOutButton().disabled).toBe(false)
    expect(screen.getByText('anna@firma.pl')).toBeTruthy()
  })
})

describe('the theme', () => {
  it('is a radio group of three, in order, with "as on the device" chosen until something is stored', async () => {
    await renderPage()
    expect(screen.getByRole('radiogroup', { name: t.settings.theme })).toBeTruthy()
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([t.settings.themeSystem, t.settings.themeLight, t.settings.themeDark])
    expect(radio(t.settings.themeSystem).getAttribute('aria-checked')).toBe('true')
    expect(radio(t.settings.themeDark).getAttribute('aria-checked')).toBe('false')
  })

  it('the radio writes the theme to the device\'s one key and applies it through <html>; "as on the device" takes it off again', async () => {
    await renderPage()

    fireEvent.click(radio(t.settings.themeDark))
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(html.getAttribute('data-theme')).toBe('dark')
    expect(radio(t.settings.themeDark).getAttribute('aria-checked')).toBe('true')
    expect(radio(t.settings.themeSystem).getAttribute('aria-checked')).toBe('false')

    fireEvent.click(radio(t.settings.themeLight))
    expect(localStorage.getItem('theme')).toBe('light')
    expect(html.getAttribute('data-theme')).toBe('light')

    fireEvent.click(radio(t.settings.themeSystem))
    expect(localStorage.getItem('theme')).toBe('system')
    expect(html.hasAttribute('data-theme')).toBe(false)
  })

  it('shows what is stored on this device as the chosen one', async () => {
    localStorage.setItem('theme', 'light')
    await renderPage()
    expect(radio(t.settings.themeLight).getAttribute('aria-checked')).toBe('true')
    expect(html.getAttribute('data-theme')).toBe('light')
  })
})
