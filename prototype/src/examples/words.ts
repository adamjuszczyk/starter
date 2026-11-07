// The words of the Klienci example (the list, its form and the delete question), in Polish: the same file shape as src/i18n/pl.ts, kept apart
// from it because the starter has no clients (TASKS.md, Decided 19: src/i18n/pl.ts holds the starter's words only, and an app's words file
// holds the app's). Everything else the example shows (Zapisz, Anuluj, Brak połączenia…) is the starter's own words, read from src/i18n/pl.ts.
// prototype/src/i18n/pl.ts as committed stays the wording record the SPEC points to.

import { plural } from '@app/lib/format'

export const exampleWords = {
  nav: {
    clients: 'Klienci',
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
}

export type ExampleWords = typeof exampleWords
