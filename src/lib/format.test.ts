import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatMoney, formatNumber, formatPhone, plural } from './format'

// Intl writes Polish's thousands separator, and the gap before "zł", as a no-break space (U+00A0), not a plain one.
const NBSP = ' '

// Dates are built from their parts, not from ISO text, so they are in the zone the formatter reads them in: the day and the hour
// come out as written whatever the machine's time zone is.
describe('formatDate', () => {
  it('writes day.month.year, two digits each', () => {
    expect(formatDate(new Date(2026, 10, 6))).toBe('06.11.2026')
    expect(formatDate(new Date(2026, 0, 2))).toBe('02.01.2026')
  })

  it('reads a string as a date too', () => {
    expect(formatDate('2026-11-06T12:00:00')).toBe('06.11.2026')
  })
})

describe('formatDateTime', () => {
  it('is the date and the time with one space between: the build line\'s "06.11.2026 13:52"', () => {
    expect(formatDateTime(new Date(2026, 10, 6, 13, 52))).toBe('06.11.2026 13:52')
  })

  it('pads the hour and the minute, and reads midnight as 00:05, not 24:05', () => {
    expect(formatDateTime(new Date(2026, 0, 2, 0, 5))).toBe('02.01.2026 00:05')
    expect(formatDateTime(new Date(2026, 0, 2, 9, 7))).toBe('02.01.2026 09:07')
  })

  it('reads a string as a date too', () => {
    expect(formatDateTime('2026-11-06T13:52:00')).toBe('06.11.2026 13:52')
  })
})

describe('formatMoney', () => {
  it('writes złoty with a comma for the grosz and a no-break space between thousands and before "zł"', () => {
    expect(formatMoney(12480.5)).toBe(`12${NBSP}480,50${NBSP}zł`)
  })

  it('always shows two decimals', () => {
    expect(formatMoney(7)).toBe(`7,00${NBSP}zł`)
  })

  it('leaves four-digit amounts ungrouped, as Polish does', () => {
    expect(formatMoney(1234.5)).toBe(`1234,50${NBSP}zł`)
  })
})

describe('formatNumber', () => {
  it('groups from five digits with a no-break space and writes the decimals after a comma', () => {
    expect(formatNumber(1234567.891)).toBe(`1${NBSP}234${NBSP}567,891`)
    expect(formatNumber(1234)).toBe('1234')
  })
})

describe('plural', () => {
  const forms = (n: number) => plural(n, 'plik', 'pliki', 'plików')

  it('one: exactly 1', () => {
    expect(forms(1)).toBe('plik')
  })

  it('few: ends in 2, 3 or 4, except 12, 13 and 14', () => {
    for (const n of [2, 3, 4, 22, 23, 24, 102, 1002]) expect(forms(n), String(n)).toBe('pliki')
  })

  it('many: 0, 5 to 21, and the other numbers that do not end in 2 to 4', () => {
    for (const n of [0, 5, 11, 12, 13, 14, 21, 25, 100, 101, 112]) expect(forms(n), String(n)).toBe('plików')
  })

  it('a fraction takes the many form', () => {
    expect(forms(1.5)).toBe('plików')
  })
})

describe('formatPhone', () => {
  it('reads nine digits as 3-3-3', () => {
    expect(formatPhone('600123456')).toBe('600 123 456')
  })
})
