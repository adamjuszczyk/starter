// Every word the app shows, in Polish. Screens read `t.settings.title`, never a
// string of their own (decision B, 2026-11-06). Another language is a second
// file of the same type (`Words`), so a missing word fails the type check.
// Words that depend on a number are functions, using Polish plural forms
// (`plural` in ../lib/format). The app's own name is not a word: it is in
// app.config.ts, with its colours and icons.

export const pl = {
  app: {
    signedInAs: 'Zalogowano jako',
  },
  nav: {
    settings: 'Ustawienia',
  },
  signIn: {
    title: 'Zaloguj się',
    email: 'E-mail',
    password: 'Hasło',
    submit: 'Zaloguj się',
    pending: 'Logowanie…',
    wrong: 'Nieprawidłowy e-mail lub hasło.',
    offline: 'Brak połączenia. Spróbuj ponownie, gdy wróci.',
    failed: 'Nie udało się zalogować.',
  },
  common: {
    cancel: 'Anuluj',
    save: 'Zapisz',
    saving: 'Zapisywanie…',
    saved: 'Zapisano',
    retry: 'Spróbuj ponownie',
    close: 'Zamknij',
    search: 'Szukaj',
    offline: 'Brak połączenia. Zapisywanie wróci, gdy połączenie wróci.',
    needsConnection: 'Zapis wymaga połączenia.',
    loadFailed: (what: string) => `Nie udało się wczytać: ${what}.`,
    reason: 'Powód',
  },
  settings: {
    title: 'Ustawienia',
    account: 'Konto',
    signOut: 'Wyloguj się',
    look: 'Wygląd',
    theme: 'Motyw',
    themeSystem: 'Jak w urządzeniu',
    themeLight: 'Jasny',
    themeDark: 'Ciemny',
    about: 'O aplikacji',
    version: 'Wersja',
    // The build line at the bottom of Settings: "Wersja 0.1.0 · build 3f9c2a1 · 06.11.2026 13:52". `time` arrives already formatted
    // (formatDateTime in ../lib/format), so the sentence is the only thing written here.
    buildLine: (version: string, hash: string, time: string) => `Wersja ${version} · build ${hash} · ${time}`,
  },
}

export type Words = typeof pl
