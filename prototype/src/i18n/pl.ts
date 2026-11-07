// Every word the app shows, in Polish. Screens read `t.clients.title`, never a
// string of their own (decision B, 2026-11-06). Another language is a second
// file of the same type (`Words`), so a missing word fails the type check.
// Words that depend on a number are functions, using Polish plural forms.

import { plural } from '@app/lib/format'

export const pl = {
  app: {
    name: 'Starter',
    signedInAs: 'Zalogowano jako',
  },
  nav: {
    clients: 'Klienci',
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
  clients: {
    title: 'Klienci',
    count: (n: number) => `${n} ${plural(n, 'klient', 'klientów', 'klientów')}`,
    add: 'Dodaj klienta',
    searchPlaceholder: 'Nazwa, miasto lub telefon',
    empty: 'Nie ma jeszcze klientów.',
    loadWhat: 'listy klientów',
    col: { name: 'Nazwa', city: 'Miasto', phone: 'Telefon', status: 'Status', added: 'Dodano' },
    status: { active: 'Aktywny', inactive: 'Nieaktywny' },
  },
  clientForm: {
    eyebrowEdit: 'Klient',
    titleNew: 'Nowy klient',
    name: 'Nazwa',
    contact: 'Osoba kontaktowa',
    phone: 'Telefon',
    email: 'E-mail',
    city: 'Miasto',
    status: 'Status',
    notes: 'Notatki',
    nameMissing: 'Wpisz nazwę klienta.',
    phoneHint: '9 cyfr, bez +48.',
    phoneWrong: 'Wpisz 9 cyfr, bez +48.',
    saveFailed: 'Nie udało się zapisać. Wpisane dane zostają, spróbuj ponownie.',
    delete: 'Usuń klienta',
  },
  deleteClient: {
    title: (name: string) => `Usunąć ${name}?`,
    body: 'Klient zniknie z listy. Tego nie da się cofnąć.',
    confirm: 'Usuń',
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
  },
}

export type Words = typeof pl
