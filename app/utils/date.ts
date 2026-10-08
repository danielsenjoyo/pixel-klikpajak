/**
 * Date fields (`type: 'date'`) store the display string `DD/MM/YYYY`, so comparing two
 * of them needs a parser of our own.
 *
 * Never `new Date(s)`: `new Date('01/02/2024')` is read as US month-first and resolves
 * to 2 January, which silently inverts every comparison in the first twelve days of a
 * month and is correct the rest of the time — the worst possible bug to notice.
 */

/** `DD/MM/YYYY` → a comparable `YYYYMMDD` number, or null when it is not a full date. */
export function parseDmy(value: unknown): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value ?? '').trim())
  if (!m) return null
  const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])]
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return year * 10000 + month * 100 + day
}
