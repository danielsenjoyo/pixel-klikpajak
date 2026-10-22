/**
 * Import engine for SPT Tahunan Badan lampiran (1-pager "SPT Tahunan Badan (2)", items 6–12).
 *
 * Each DJP import template is described once as an `ImportSpec`; the same description
 * builds the downloadable workbook (DATA + Petunjuk Pengisian + Ref, the shape of DJP's
 * own templates) and parses an uploaded one. The specs themselves live in
 * spt1771ImportSpecs.ts; this file is the generic part.
 *
 * Rules shared by every template, from DJP's "Petunjuk Pengisian" sheets:
 *   - NPWP SPT and Tahun Pajak at the top must be this SPT's — else the file is refused.
 *   - Amounts are positive; an SPT Rupiah rounds decimals commercially to whole rupiah.
 *   - Codes must come from the template's reference list. Numeric codes are matched
 *     without leading zeros, so DJP's "0401" / "01" and our stored "401" / "1" agree.
 *   - A bad row is rejected on its own with the reason; good rows still import.
 */
import { newRowId, type Row } from '~/data/spt1771Engine'
import { parseCsv, parseNumber } from '~/utils/csv'
import { parseDmyDate } from '~/utils/date'
import { excelSerialToDmy, readXlsx, type Cell, type Sheet, type SheetSpec } from '~/utils/xlsx'

export interface Code { code: string, name: string }

/** What a file is checked against. */
export interface ImportCtx { npwp: string, year: number }

export interface ImportIssue {
  sheet?: string
  /** Excel row number (1-based), 0 for a file-level problem. */
  row: number
  reason: string
}

export interface ImportResult<P> {
  /** The whole file is refused (wrong template, wrong NPWP/year …); nothing imports. */
  fileError?: string
  /** Rows (or accounts) that will be written. */
  accepted: number
  rejected: ImportIssue[]
  payload: P
}

/** One DJP template: how to build it, how to read it back. */
export interface ImportSpec<P = unknown> {
  id: string
  /** "Impor biaya promosi" — modal heading. */
  title: string
  /** One sentence under the heading: what the file fills. */
  description: string
  /** Noun for counts: "baris", "akun". */
  unit: string
  fileName: (ctx: ImportCtx) => string
  template: (ctx: ImportCtx) => SheetSpec[]
  parse: (sheets: Sheet[], ctx: ImportCtx) => ImportResult<P>
}

/** Payload of a list template: rows for one table block (`dataKey`). */
export interface ListPayload { target: string, rows: Row[] }
/** A list template also names its block up front, so "N baris sudah ada" is known before upload. */
export type ListImportSpec = ImportSpec<ListPayload> & { target: string }

// ── File reading ─────────────────────────────────────────────────────────────
export const MAX_FILE_BYTES = 5 * 1024 * 1024

/** .xlsx (DJP's template) or .csv (one sheet). Throws a user-facing message. */
export async function readImportFile(file: File): Promise<Sheet[]> {
  const name = file.name.toLowerCase()
  if (file.size > MAX_FILE_BYTES) throw new Error('Ukuran file melebihi 5 MB.')
  if (name.endsWith('.csv')) return [{ name: 'DATA', rows: parseCsv(await file.text()) }]
  if (!name.endsWith('.xlsx')) throw new Error('Format file tidak didukung. Gunakan template .xlsx atau file .csv.')
  try {
    return await readXlsx(await file.arrayBuffer())
  }
  catch {
    throw new Error('File tidak dapat dibaca. Pastikan file berformat .xlsx dan tidak terkunci kata sandi.')
  }
}

// ── Cells ────────────────────────────────────────────────────────────────────
/** Header text compared loosely: case, line breaks, double spaces and a trailing * ignored. */
export const norm = (v: Cell | undefined) => String(v ?? '').replace(/\s+/g, ' ').replace(/\*$/, '').trim().toLowerCase()

/** Cell → text. Excel turns long digit strings into numbers (1E+15), so integers are re-spelt in full. */
export function cellText(v: Cell | undefined): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString('fullwide', { useGrouping: false }) : String(v)
  return String(v).trim()
}

const isBlank = (row: Cell[] | undefined) => !row || row.every(c => cellText(c) === '')

/** Amount: blank → null, otherwise a non-negative number rounded to whole rupiah. */
export function cellAmount(v: Cell | undefined): { value: number | null, error?: string } {
  if (typeof v === 'number') return v < 0 ? { value: null, error: 'tidak boleh negatif' } : { value: Math.round(v) }
  const s = cellText(v)
  if (!s) return { value: null }
  const n = parseNumber(s)
  if (n === null) return { value: null, error: 'bukan angka yang valid' }
  if (n < 0) return { value: null, error: 'tidak boleh negatif' }
  return { value: Math.round(n) }
}

/** dd-mm-yyyy / dd/mm/yyyy text, or an Excel date serial → stored `DD/MM/YYYY`. */
export function cellDate(v: Cell | undefined): { value: string | null, error?: string } {
  if (typeof v === 'number') {
    const d = excelSerialToDmy(v)
    return d ? { value: d } : { value: null, error: 'bukan tanggal yang valid' }
  }
  const s = cellText(v)
  if (!s) return { value: null }
  const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s)
  const dmy = m ? `${m[1]!.padStart(2, '0')}/${m[2]!.padStart(2, '0')}/${m[3]}` : ''
  return parseDmyDate(dmy) ? { value: dmy } : { value: null, error: 'harus berformat dd-mm-yyyy' }
}

const stripZeros = (s: string) => (/^\d+$/.test(s) ? String(Number(s)) : s.toUpperCase())

/** Code (or its exact description) → the stored code; undefined when not in the list. */
export function matchCode(list: readonly Code[], v: Cell | undefined): string | undefined {
  const s = cellText(v)
  if (!s) return undefined
  const key = stripZeros(s)
  return list.find(c => stripZeros(c.code) === key)?.code
    ?? list.find(c => c.name.toLowerCase() === s.toLowerCase())?.code
}

/** DJP's 4-digit / 2-digit spelling of a stored code ("401" → "0401"), for templates. */
export const djpCode = (code: string, width: number) => (/^\d+$/.test(code) ? code.padStart(width, '0') : code)

// ── Preamble (NPWP SPT / Tahun Pajak) ────────────────────────────────────────
const digits = (s: string) => s.replace(/\D/g, '').padStart(16, '0')

export const preambleRows = (ctx: ImportCtx): Cell[][] => [['NPWP SPT', ctx.npwp], ['Tahun Pajak', ctx.year]]

/** Checks the template's NPWP SPT and Tahun Pajak against this SPT. */
export function checkPreamble(rows: Cell[][], ctx: ImportCtx): string | undefined {
  const find = (label: string) => rows.slice(0, 10).find(r => norm(r?.[0]) === label)
  const npwp = find('npwp spt')
  const year = find('tahun pajak')
  if (!npwp || !year) return 'NPWP SPT dan Tahun Pajak tidak ditemukan di bagian atas sheet. Gunakan template dari tombol "Unduh template".'
  if (digits(cellText(npwp[1])) !== digits(ctx.npwp)) return `NPWP SPT di file (${cellText(npwp[1]) || 'kosong'}) tidak sama dengan NPWP SPT ini (${ctx.npwp}).`
  if (Number(cellText(year[1])) !== ctx.year) return `Tahun Pajak di file (${cellText(year[1]) || 'kosong'}) tidak sama dengan tahun pajak SPT ini (${ctx.year}).`
  return undefined
}

// ── List templates ───────────────────────────────────────────────────────────
export type ColumnType = 'text' | 'id' | 'amount' | 'date' | 'code' | 'int'

export interface ImportColumn {
  /** "Kolom pada excel" — the header the file must carry. */
  header: string
  /** "Kolom pada xml" — Coretax field, documented in Petunjuk Pengisian. */
  xml: string
  key: string
  type: ColumnType
  codes?: readonly Code[]
  /** Width of the code in DJP's spelling (4 → "0401"). */
  codeWidth?: number
  /** Reference-list title on the Ref sheet. */
  codesTitle?: string
  required?: boolean
  /** "Petunjuk pengisian". */
  hint: string
  example: string | number
  /** "Validasi" text; derived from the type when omitted. */
  rule?: string
  /** 'int' columns: allowed range. */
  min?: number
  max?: number
}

export interface ImportSection {
  /** Title row above the header ("Daftar Penyusutan") when a sheet holds several lists. */
  title?: string
  columns: ImportColumn[]
  /**
   * Cross-column rules and shaping after every cell parsed — may rewrite the row
   * (e.g. bulan + tahun → `perolehan`). Returns the rejection reason, if any.
   */
  finish?: (row: Row, ctx: ImportCtx) => string | undefined
}

export interface ListSpecInput {
  id: string
  title: string
  description: string
  fileName: string
  /** Block (dataKey) the rows go into. */
  target: string
  /** DJP's L9 template carries no NPWP/Tahun Pajak rows; every other one does. */
  preamble: boolean
  sections: ImportSection[]
}

const typeRule = (c: ImportColumn) => c.rule ?? ({
  text: '',
  id: '',
  amount: 'angka positif',
  date: 'dd-mm-yyyy',
  code: `sesuai kode referensi ${c.codesTitle ?? c.header}`,
  int: c.min !== undefined && c.max !== undefined ? `angka ${c.min} s/d ${c.max}` : 'angka',
} satisfies Record<ColumnType, string>)[c.type]

/** Reads one cell into the row; returns an error message for the column. */
function readCell(c: ImportColumn, v: Cell | undefined, row: Row): string | undefined {
  switch (c.type) {
    case 'amount': {
      const r = cellAmount(v)
      row[c.key] = r.value
      return r.error && `${c.header} ${r.error}`
    }
    case 'date': {
      const r = cellDate(v)
      row[c.key] = r.value
      return r.error && `${c.header} ${r.error}`
    }
    case 'int': {
      const s = cellText(v)
      if (!s) { row[c.key] = null; return undefined }
      const n = Number(s)
      if (!Number.isInteger(n) || (c.min !== undefined && n < c.min) || (c.max !== undefined && n > c.max)) return `${c.header} harus ${typeRule(c)}`
      row[c.key] = n
      return undefined
    }
    case 'code': {
      const s = cellText(v)
      if (!s) { row[c.key] = null; return undefined }
      const code = matchCode(c.codes ?? [], v)
      if (!code) return `${c.header} "${s}" tidak ada di referensi ${c.codesTitle ?? c.header}`
      row[c.key] = code
      return undefined
    }
    default:
      row[c.key] = cellText(v) || null
      return undefined
  }
}

const isHeaderOf = (r: Cell[] | undefined, s: ImportSection) => norm(r?.[0]) === norm(s.columns[0]!.header)
  && s.columns.slice(1, 3).every(c => (r ?? []).some(x => norm(x) === norm(c.header)))

/** A list template: rows for one table block. */
export function listImport(input: ListSpecInput): ListImportSpec {
  const { sections } = input
  return {
    id: input.id,
    target: input.target,
    title: input.title,
    description: input.description,
    unit: 'baris',
    fileName: () => `${input.fileName}.xlsx`,

    template(ctx) {
      // DATA — as DJP lays it out: NPWP SPT / Tahun Pajak in rows 1–2, the header straight on row 3.
      const data: Cell[][] = input.preamble ? preambleRows(ctx) : []
      const bold: number[] = []
      sections.forEach((s, i) => {
        if (i > 0) data.push([])
        if (s.title) { bold.push(data.length); data.push([s.title]) }
        bold.push(data.length)
        data.push(s.columns.map(c => c.header))
      })
      const width = Math.max(...sections.map(s => s.columns.length))
      const textCols = Array.from({ length: width }, (_, i) => sections.some(s => ['id', 'code', 'text'].includes(s.columns[i]?.type ?? '')))

      // Petunjuk Pengisian
      const guide: Cell[][] = []
      const guideBold: number[] = []
      if (input.preamble) {
        guideBold.push(0)
        guide.push(['Kolom pada excel', 'Kolom pada xml', 'Petunjuk pengisian', 'Contoh pengisian', 'Validasi'])
        guide.push(['NPWP SPT', 'TIN', 'Diisi dengan NPWP Pelapor SPT', ctx.npwp, '16 digit angka NPWP sesuai SPT yang dilaporkan'])
        guide.push(['Tahun Pajak', 'TaxYear', 'Diisi dengan tahun pajak SPT', ctx.year, '4 digit angka sesuai tahun pajak SPT yang dilaporkan'])
      }
      for (const s of sections) {
        if (guide.length) guide.push([])
        if (s.title) { guideBold.push(guide.length); guide.push([s.title]) }
        guideBold.push(guide.length)
        guide.push(['Kolom pada excel', 'Kolom pada xml', 'Petunjuk pengisian', 'Contoh pengisian', 'Validasi'])
        for (const c of s.columns) guide.push([c.header, c.xml, c.hint + (c.required ? ' (wajib)' : ''), c.example, typeRule(c)])
      }
      guide.push([], ['Nilai rupiah dengan desimal dibulatkan komersial ke satuan rupiah penuh. Baris yang tidak valid ditolak; baris lainnya tetap diimpor.'])

      // Ref
      const ref: Cell[][] = []
      const refBold: number[] = []
      const seen = new Set<string>()
      for (const c of sections.flatMap(s => s.columns)) {
        if (c.type !== 'code' || !c.codes || seen.has(c.codesTitle ?? c.header)) continue
        seen.add(c.codesTitle ?? c.header)
        if (ref.length) ref.push([])
        refBold.push(ref.length, ref.length + 1)
        ref.push([c.codesTitle ?? c.header], ['Kode', 'Deskripsi'])
        for (const k of c.codes) ref.push([djpCode(k.code, c.codeWidth ?? 0), k.name])
      }

      return [
        { name: 'DATA', rows: data, boldRows: bold, cols: Array.from({ length: width }, (_, i) => ({ width: 22, text: textCols[i] })) },
        { name: 'Petunjuk Pengisian', rows: guide, boldRows: guideBold, cols: [{ width: 28 }, { width: 28 }, { width: 60 }, { width: 28, text: true }, { width: 48 }] },
        ...(ref.length ? [{ name: 'Ref', rows: ref, boldRows: refBold, cols: [{ width: 16, text: true }, { width: 90 }] }] : []),
      ]
    },

    parse(sheets, ctx) {
      const empty = { accepted: 0, rejected: [], payload: { target: input.target, rows: [] } }
      // The DATA sheet, or whichever sheet carries the first section's header (CSV, renamed sheet).
      const sheet = sheets.find(s => s.rows.some(r => sections.some(sec => isHeaderOf(r, sec))))
      if (!sheet) return { ...empty, fileError: `Kolom tidak sesuai template. Unduh template lalu salin data Anda ke sheet DATA.` }
      if (input.preamble) {
        const err = checkPreamble(sheet.rows, ctx)
        if (err) return { ...empty, fileError: err }
      }

      const rows: Row[] = []
      const rejected: ImportIssue[] = []
      let section: ImportSection | null = null
      /** Last title row seen. DJP's L9 lists share one header, so the title says which list follows. */
      let titled: ImportSection | null = null
      let index: number[] = []

      for (let i = 0; i < sheet.rows.length; i++) {
        const r = sheet.rows[i]
        const title = sections.find(s => s.title && norm(r?.[0]) === norm(s.title) && isBlank(r?.slice(1)))
        if (title) { titled = title; continue }
        const header = titled && isHeaderOf(r, titled) ? titled : sections.find(s => isHeaderOf(r, s))
        if (header) {
          titled = null
          section = header
          // Columns by header name, so a reordered or extra column is harmless.
          index = header.columns.map(c => (r ?? []).findIndex(x => norm(x) === norm(c.header)))
          const missing = header.columns.filter((_, ci) => index[ci]! < 0).map(c => c.header)
          if (missing.length) return { ...empty, fileError: `Kolom ${missing.join(', ')} tidak ditemukan${header.title ? ` di ${header.title}` : ''}.` }
          continue
        }
        if (isBlank(r) || !section) continue

        const row: Row = { id: newRowId() }
        let bad: string | undefined
        section.columns.forEach((c, ci) => {
          const err = readCell(c, r?.[index[ci]!], row)
          bad ??= err
        })
        for (const c of section.columns) {
          if (c.required && (row[c.key] === null || row[c.key] === undefined || row[c.key] === '')) bad ??= `${c.header} wajib diisi`
        }
        bad ??= section.finish?.(row, ctx)
        if (bad) rejected.push({ sheet: sheets.length > 1 ? sheet.name : undefined, row: i + 1, reason: bad })
        else rows.push(row)
      }

      if (!rows.length && !rejected.length) return { ...empty, fileError: 'Tidak ada data di file. Isi data di bawah baris judul kolom.' }
      return { accepted: rows.length, rejected, payload: { target: input.target, rows } }
    },
  }
}
