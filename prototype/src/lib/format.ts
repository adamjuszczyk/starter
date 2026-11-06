// Polish formats for dates, numbers and money, in one place (decided 2026-11-06).
// An app for another market changes the locale here.

const LOCALE = 'pl-PL'

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })
const moneyFmt = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'PLN' })
const numberFmt = new Intl.NumberFormat(LOCALE)
const plurals = new Intl.PluralRules(LOCALE)

export const formatDate = (d: Date | string) => dateFmt.format(typeof d === 'string' ? new Date(d) : d)
export const formatMoney = (zl: number) => moneyFmt.format(zl)
export const formatNumber = (n: number) => numberFmt.format(n)

/** Polish plural: 1 klient, 2 klientów… — one / few / many. */
export function plural(n: number, one: string, few: string, many: string) {
  const r = plurals.select(n)
  return r === 'one' ? one : r === 'few' ? few : many
}

/** Phone as 3-3-3 digits, the way Polish numbers are read out. */
export const formatPhone = (digits: string) => digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')
