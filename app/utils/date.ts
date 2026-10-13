/**
 * Date fields (`type: 'date'`) store the display string `DD/MM/YYYY`, so reading one back
 * or comparing two of them needs a parser of our own.
 *
 * Never `new Date(s)`: `new Date('01/02/2024')` is read as US month-first and resolves
 * to 2 January, which silently inverts every comparison in the first twelve days of a
 * month and is correct the rest of the time — the worst possible bug to notice.
 */

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

/** `DD/MM/YYYY` → a comparable `YYYYMMDD` number, or null when it is not a full date. */
export function parseDmy(value: unknown): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim())
  if (!m) return null
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return year * 10000 + month * 100 + day
}

/**
 * `DD/MM/YYYY` → a Date at local midnight, or null when it is not a real date.
 *
 * Stricter than `parseDmy` on purpose: that one only range-checks the parts, which is all
 * an ordering comparison needs, while date arithmetic has to reject overflow like
 * 31/02/2026 that `new Date(2026, 1, 31)` would silently roll into March.
 */
export function parseDmyDate(value: unknown): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim())
  if (!m) return null
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  return d
}

/**
 * Whole days from today to `DD/MM/YYYY`; negative once the date is past, null when it does
 * not parse. Both ends are floored to local midnight so the count does not shift with the
 * time of day.
 */
export function daysUntil(value: unknown, today: Date = new Date()): number | null {
  const target = parseDmyDate(value)
  if (!target) return null
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

/** `DD/MM/YYYY` → "31 Des 2026". Em dash when absent, never a blank cell. */
export function formatDmyLong(value: unknown): string {
  const d = parseDmyDate(value)
  if (!d) return '—'
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`
}

/** Date → `DD/MM/YYYY`, the storage format the parsers above expect. */
export function formatDmy(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

/** `DD/MM/YYYY` for a date `days` from today — the inverse of `daysUntil`. */
export function dmyFromToday(days: number, today: Date = new Date()): string {
  return formatDmy(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days))
}
