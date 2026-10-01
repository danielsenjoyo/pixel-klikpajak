/**
 * Minimal CSV read/write for the lampiran import templates.
 * CSV rather than .xlsx: Excel opens and saves it natively and it needs no
 * dependency. Swap for a real workbook reader if DJP mandates .xlsx.
 */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return rows.map(r => r.map(cell).join(';')).join('\r\n')
}

/** Splits on ; or , — whichever the header row uses — respecting quoted cells. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const head = clean.split('\n', 1)[0] ?? ''
  const delim = (head.match(/;/g)?.length ?? 0) >= (head.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]!
    if (quoted) {
      if (ch === '"' && clean[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === delim) { row.push(cell); cell = '' }
    else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else cell += ch
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

/**
 * "1.234.567,89" / "1,234,567.89" / "5.000.000" / "1234567" -> number.
 * With both separators the rightmost is the decimal point. With only one, it is a
 * thousands separator when it repeats or leaves a 3-digit tail (Rp has no decimals
 * in these forms), otherwise a decimal point. Blank -> 0 (V-I3).
 */
export function parseNumber(raw: string): number | null {
  const s = raw.trim()
  if (!s) return 0
  const neg = /^-/.test(s)
  const cleaned = s.replace(/[^\d,.]/g, '')
  if (!cleaned) return null

  const dots = (cleaned.match(/\./g) ?? []).length
  const commas = (cleaned.match(/,/g) ?? []).length
  let normalized: string
  if (dots && commas) {
    const decimal = cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.') ? ',' : '.'
    const thousands = decimal === ',' ? '.' : ','
    normalized = cleaned.split(thousands).join('').replace(decimal, '.')
  }
  else if (dots || commas) {
    const sep = dots ? '.' : ','
    const count = dots || commas
    const tail = cleaned.slice(cleaned.lastIndexOf(sep) + 1)
    const isThousands = count > 1 || tail.length === 3
    normalized = isThousands ? cleaned.split(sep).join('') : cleaned.replace(sep, '.')
  }
  else normalized = cleaned

  const n = Number(normalized)
  if (!Number.isFinite(n)) return null
  return neg ? -n : n
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
