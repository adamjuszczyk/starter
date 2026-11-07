// Example rows for the prototype. Made up; marked as examples on screen. The kit's example data (demo/seed.ts puts it into the query cache).

export interface Client {
  id: string
  name: string
  contact: string
  city: string
  phone: string
  email: string
  status: 'active' | 'inactive'
  added: string
  notes: string
}

/** What the form writes: a client without the id and the date the server gives it. */
export type ClientInput = Omit<Client, 'id' | 'added'>

export const clients: Client[] = [
  { id: 'c1', name: 'Piekarnia Pod Wawelem', contact: 'Anna Kowalczyk', city: 'Kraków', phone: '601234567', email: 'biuro@podwawelem.pl', status: 'active', added: '2026-10-28', notes: 'Dzwonić przed 10:00.' },
  { id: 'c2', name: 'Auto-Serwis Nowak', contact: 'Tomasz Nowak', city: 'Wieliczka', phone: '512908341', email: 'serwis@autonowak.pl', status: 'active', added: '2026-10-21', notes: '' },
  { id: 'c3', name: 'Gabinet Stomatologiczny Uśmiech', contact: 'dr Ewa Zielińska', city: 'Kraków', phone: '698112045', email: 'rejestracja@usmiech-krakow.pl', status: 'active', added: '2026-10-14', notes: '' },
  { id: 'c4', name: 'Hotel Pod Jedlami', contact: 'Marek Wójcik', city: 'Zakopane', phone: '723450981', email: 'recepcja@podjedlami.pl', status: 'inactive', added: '2026-09-30', notes: 'Sezonowo, od grudnia.' },
  { id: 'c5', name: 'Szkoła Językowa Lingua', contact: 'Katarzyna Lewandowska', city: 'Niepołomice', phone: '665003219', email: 'kontakt@lingua-niepolomice.pl', status: 'active', added: '2026-09-18', notes: '' },
  { id: 'c6', name: 'Kwiaciarnia Bukiet', contact: 'Joanna Kamińska', city: 'Skawina', phone: '503771208', email: 'zamowienia@bukiet.pl', status: 'active', added: '2026-09-02', notes: '' },
  { id: 'c7', name: 'Biuro Rachunkowe Bilans Sp. z o.o.', contact: 'Paweł Szymański', city: 'Kraków', phone: '790213654', email: 'p.szymanski@bilans.krakow.pl', status: 'active', added: '2026-08-25', notes: '' },
  { id: 'c8', name: 'Pensjonat Pod Lipami', contact: 'Halina Dąbrowska', city: 'Myślenice', phone: '608447120', email: 'pensjonat@podlipami.pl', status: 'inactive', added: '2026-08-11', notes: '' },
  { id: 'c9', name: 'Stolarnia Drewbud', contact: 'Krzysztof Mazur', city: 'Bochnia', phone: '533190872', email: 'drewbud@poczta.pl', status: 'active', added: '2026-07-29', notes: '' },
]

// What the server said when the list couldn't load (the real reason is shown, as in Overload).
export const loadErrorReason = 'serwer nie odpowiada (502)'
