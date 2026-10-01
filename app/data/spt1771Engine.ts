/**
 * Config-driven lampiran engine for SPT Tahunan Badan (Lampiran 2–14).
 * Every lampiran in Figma "SPT-Tahunan-Badan › --> SPT" is built from four block kinds:
 *   table      — rows edited inline, or added through a "Tambah data" drawer
 *   form       — numbered "No. | Rincian | Nilai" calculation sheet
 *   statements — Ya/Tidak (or checklist) declarations
 *   fields     — labelled inputs in the 640px form column
 */
import { formatNumber, formatRp } from '~/utils/currency'
import { parseDmy } from '~/utils/date'

export type FieldType =
  | 'text' | 'id' | 'currency' | 'usd' | 'percent' | 'number'
  | 'year' | 'month' | 'date' | 'select' | 'yesno' | 'checkbox'

/** Select option: stored `value`, shown `label` (plain strings are both). */
export interface CodeOption { value: string, label: string }
export type Options = readonly (string | CodeOption)[]

export const normalizeOptions = (options: Options | undefined): CodeOption[] =>
  (options ?? []).map(o => (typeof o === 'string' ? { value: o, label: o } : o))

export type Row = Record<string, unknown> & { id: string }
export type BlockValues = Record<string, unknown>
/** Saved data of one lampiran section: block key → rows (table) or values (others). */
export type SectionData = Record<string, Row[] | BlockValues>

export interface Ctx {
  /** Tax year of the SPT (e.g. 2023). */
  year: number
  /** SPT Induk 9 - 10 — penghasilan kena pajak the tarif applies to. */
  pkp: number
  /** SPT Induk D.9 — penghasilan kena pajak before the D.10 facility. */
  pkpAngka9: number
  /** SPT Induk D.4 — penghasilan neto fiskal. */
  penghasilanNeto: number
  /** SPT Induk D.12 — PPh terutang. Feeds Lampiran 11B I.c and Lampiran 12A angka 2. */
  pphTerutang: number
  /** Lampiran 1 bagian A "Laba (Rugi) Sebelum Pajak", kolom (3) komersial. */
  labaKomersial: number
  /** Lampiran 1 bagian A "Beban Penyusutan dan Amortisasi", kolom (3) komersial. */
  penyusutanKomersial: number
  /** All blocks of the current lampiran section (for cross-block totals). */
  section: SectionData
  /** Every lampiran section (for values filled from another lampiran). */
  lampiran: Record<string, SectionData>
  /**
   * Every SPT Induk Ya/Tidak answer, keyed as the gating questions name their field
   * ('c2', 'h21.a'). A lampiran part opens on the same answer that requires the lampiran,
   * so Lampiran 4 bagian A appears for C.2 and bagian B for C.3 — never both regardless.
   */
  answers: Record<string, boolean>
  /** Entity form: Yayasan/KIK drop the capital columns of Lampiran 2A. */
  entityType?: 'yayasan' | 'kik-reksadana' | 'kik-eba'
}

/**
 * PER-11 Bagian D angka 9: "Untuk keperluan penerapan tarif pajak, jumlah penghasilan
 * kena pajak dibulatkan ke bawah dalam ribuan rupiah penuh." A negative PKP carries no
 * tax, so it floors to zero rather than away from it.
 */
export const pkpKenaTarif = (pkp: number): number => Math.floor(Math.max(0, pkp) / 1000) * 1000

/** An answered Tidak (false) counts as filled. */
const isFilled = (v: unknown) => v !== null && v !== undefined && v !== ''

/**
 * One thing wrong with the return. `label` is the terse locator the section menu lists
 * ("A.1 NPWP"); `message` is the sentence shown at the field. They are deliberately not
 * the same string — a locator reads wrong under an input and a sentence reads wrong in
 * a menu chip.
 *
 * `section` / `tab` / `target` are what the page needs to navigate to the offending
 * field: route to the section, open the tab, then focus the DOM id.
 */
export interface Issue {
  severity: 'error' | 'warning'
  /** Stable id for the rule, e.g. 'l1/neraca' or 'cross/l4a-c2'. */
  code: string
  label: string
  message: string
  section: string
  tab?: string
  target?: string
}

/**
 * A rule beyond `required`, returning the message to show or undefined when the value is
 * fine. One function rather than a set of declarative primitives, because `compute`,
 * `when` and `derive` are already function-valued here — the rule shapes are factories
 * over it (`requiredWhen`, `notBefore`), so the config still reads declaratively.
 */
export type Validator = (value: unknown, row: Record<string, unknown>, ctx: Ctx) => string | undefined

/** Required only under a condition on the rest of the row — e.g. a code once an amount exists. */
export const requiredWhen = (cond: (row: Record<string, unknown>, ctx: Ctx) => boolean, message = 'Wajib diisi'): Validator =>
  (value, row, ctx) => (cond(row, ctx) && !isFilled(value) ? message : undefined)

/** A statutory ceiling on a number or percentage. */
export const atMost = (max: number, message: string): Validator =>
  value => (typeof value === 'number' && value > max ? message : undefined)

/** This date may not fall before the one in `otherKey`; silent until both are complete. */
export const notBefore = (otherKey: string, message: string): Validator =>
  (value, row) => {
    const from = parseDmy(row[otherKey])
    const to = parseDmy(value)
    return from !== null && to !== null && to < from ? message : undefined
  }

export interface FieldDef {
  /** Prefilled and owned upstream: shown greyed in the form, never written. */
  readOnly?: boolean
  /** Column only renders when this holds — e.g. modal disetor is N/A for Yayasan. */
  when?: (ctx: Omit<Ctx, 'section'>) => boolean
  /** Asked for in the add/edit form but not shown as a grid column. */
  formOnly?: boolean
  key: string
  label: string
  type: FieldType
  options?: Options
  /** Tables show the stored value (e.g. "SGP") instead of the option label. */
  showValue?: boolean
  /** Read-only text taken from other fields of the row (e.g. a code's name). */
  derive?: (values: Record<string, unknown>) => string
  /** Table: two-row header group. Drawer/fields: sub-heading above the field. */
  group?: string
  /** Read-only value computed from the row (table) or block values (fields). */
  compute?: (values: Record<string, unknown>, ctx: Ctx) => number
  /**
   * Always required. Kept alongside `validate` because it does two things a validator
   * cannot: it draws the asterisk with no row in hand, and the CSV import reads it to
   * build its rejection message. `required` = always; `validate` = conditional or
   * relational.
   */
  required?: boolean
  validate?: Validator
  placeholder?: string
  /** Column width in px (tables). */
  width?: number
  /** Drawer/fields grid: take the full row. */
  full?: boolean
}

export interface Summary {
  label: string
  value: (rows: Row[], ctx: Ctx) => number | string
  format?: 'rp' | 'percent' | 'text'
  /** Total only shows when this holds — mirrors the column's own `when` gate. */
  when?: (ctx: Omit<Ctx, 'section'>) => boolean
}

/**
 * A fixed set of labelled rows across the same columns — DJP's rekapitulasi grids,
 * e.g. Lampiran 5B rows a–g over the twelve months plus Jumlah. Values are stored
 * flat as `${row.key}.${column.key}`.
 */
export interface MatrixRow {
  key: string
  /** Render this recap row straight after the named group (see `groupBy`). */
  after?: string
  /** The one column carrying the value; the label spans the columns before it. */
  valueKey?: string
  /** Row letter as DJP numbers it ("a.", "b." …). */
  no?: string
  label: string
  /** false → only the total column carries a value (Lampiran 5B rows e, f, g). */
  monthly?: boolean
  /** Derived rows pass a value per column; omit for preparer input. */
  compute?: (values: BlockValues, ctx: Ctx, columnKey: string) => number
}

export interface TableBlock {
  kind: 'table'
  key: string
  /**
   * Block only renders when this holds. Unlike a part's gate it receives the full `Ctx`,
   * so it can read the lampiran's own answers — Lampiran 12B's detail sections open on
   * the bentuk penanaman ticked in bagian IV.a.
   */
  when?: (ctx: Ctx) => boolean
  title?: string
  description?: string
  mode: 'inline' | 'drawer'
  /** drawer mode: false hides "Tambah data" (roster owned elsewhere, e.g. DJP Coretax). */
  canAdd?: boolean
  /** false hides the delete action; rows can only be edited. */
  canDelete?: boolean
  /** drawer mode: 'modal' edits the row in a centred modal instead of a side drawer. */
  form?: 'drawer' | 'modal'
  /** Column whose value identifies a row: a repeat is rejected as a duplicate. */
  dedupeKey?: string
  /** Offer a CSV template download + bulk import for this table. */
  importable?: boolean
  /** Roster comes from DJP: offer "Tarik ulang data" instead of an add button. */
  refreshable?: boolean
  /**
   * The whole roster is DJP's and nothing in it is edited here — no add, no delete, no
   * row actions, every cell read-only. Lampiran 5A's tempat kegiatan usaha is registered
   * in Coretax, so a wrong row is corrected there and re-pulled, never typed over.
   */
  readOnly?: boolean
  /**
   * Rows mirror another block in the same section: one row per source row, keyed
   * by `key`. Lampiran 5B takes its TKU list from bagian A, so rows are never
   * added or removed by hand — only the value columns are typed.
   */
  derivedFrom?: { block: string, key: string, copy?: string[] }
  /**
   * Fixed recap rows rendered under the data rows in the same grid — DJP's
   * Lampiran 5B baris a–g. Values live in their own block key, flat as
   * `${row.key}.${column.key}`.
   */
  /**
   * `placement: 'footer'` renders the recap under the table in the standard
   * totals footer (Lampiran 9 a–c / d–f); the default keeps them as body rows
   * so Lampiran 5B's monthly grid stays one continuous sheet.
   */
  recap?: { key: string, rows: MatrixRow[], totalKey: string, placement?: 'body' | 'footer' }
  /**
   * Rows sit under a heading chosen per row, so one table covers every category —
   * Lampiran 9 keeps its DJP groups (Kelompok 1–4, Bangunan, Tak Berwujud) in a
   * single grid with one "Tambah data" button.
   */
  groupBy?: { key: string, options: { value: string, label: string, heading?: string }[] }
  /**
   * Storage key for the rows, when it differs from the block key. Two blocks can
   * share one store and each render its own groups — Lampiran 9 keeps one asset
   * list behind two tables so a single "Tambah data" covers both.
   */
  dataKey?: string
  /**
   * Columns pinned while the grid scrolls sideways: `start` counts leading data
   * columns (the row number is always included), `end` counts trailing ones.
   */
  sticky?: { start?: number, end?: number }
  columns: FieldDef[]
  /** Show a "No." column (default true). */
  numbered?: boolean
  /** Column keys summed in a "Jumlah" footer row. */
  totals?: string[]
  summaries?: Summary[]
  /** Used in the blank state: "Data {emptyLabel} akan muncul di sini". */
  emptyLabel?: string
}

export interface FormItem {
  no?: string
  label: string
  /** Omit for heading-only rows. */
  key?: string
  type?: FieldType | 'computed'
  options?: Options
  compute?: (values: BlockValues, ctx: Ctx) => number
  /** Grey formula hint under the label. */
  hint?: string
  /** Value from another lampiran; while it returns a number the row is read-only. */
  linked?: (ctx: Ctx) => number | null
  indent?: 1 | 2
  /** Heading rows are bold with no control. */
  heading?: boolean
}

export interface FormBlock {
  kind: 'form'
  key: string
  /**
   * Block only renders when this holds. Unlike a part's gate it receives the full `Ctx`,
   * so it can read the lampiran's own answers — Lampiran 12B's detail sections open on
   * the bentuk penanaman ticked in bagian IV.a.
   */
  when?: (ctx: Ctx) => boolean
  title?: string
  headers?: [string, string, string]
  items: FormItem[]
}

export interface StatementGroup {
  no?: string
  title?: string
  intro?: string
  items: { key: string, letter?: string, label: string, subItems?: string[] }[]
}

export interface StatementsBlock {
  kind: 'statements'
  key: string
  /**
   * Block only renders when this holds. Unlike a part's gate it receives the full `Ctx`,
   * so it can read the lampiran's own answers — Lampiran 12B's detail sections open on
   * the bentuk penanaman ticked in bagian IV.a.
   */
  when?: (ctx: Ctx) => boolean
  title?: string
  control: 'yesno' | 'checkbox'
  /**
   * Every statement must be answered, not merely defaulted. Only meaningful with
   * `control: 'yesno'`, where an unanswered item renders as neither radio.
   */
  required?: boolean
  groups: StatementGroup[]
  /** Extra dated fields after the statements (Lampiran 10D). */
  fields?: FieldDef[]
}

export interface FieldsBlock {
  kind: 'fields'
  key: string
  /**
   * Block only renders when this holds. Unlike a part's gate it receives the full `Ctx`,
   * so it can read the lampiran's own answers — Lampiran 12B's detail sections open on
   * the bentuk penanaman ticked in bagian IV.a.
   */
  when?: (ctx: Ctx) => boolean
  title?: string
  groups: { title?: string, fields: FieldDef[] }[]
}

export type Block = TableBlock | FormBlock | StatementsBlock | FieldsBlock

export interface LampiranPart {
  key: string
  /** Tab label; parts without tabs render one after another. */
  tab?: string
  title?: string
  /** Part only renders when this holds — e.g. Lampiran 2B needs H.21.c or H.21.d. */
  when?: (ctx: Omit<Ctx, 'section'>) => boolean
  blocks: Block[]
}

export interface LampiranDef {
  section: string
  title: string
  parts: LampiranPart[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────
export const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

export function sumColumn(rows: Row[], key: string, col?: FieldDef, ctx?: Ctx): number {
  return rows.reduce((acc, r) => acc + (col?.compute && ctx ? col.compute(r, ctx) : num(r[key])), 0)
}

/** A row counts once any field besides its id has a value (answered Tidak = false counts). */
export const isRowFilled = (r: Row) => Object.entries(r).some(([k, v]) => k !== 'id' && isFilled(v))

/** Rows that hold data — blank rows added with "Tambah baris" are ignored in totals and links. */
export function tableRows(section: SectionData, blockKey: string): Row[] {
  const v = section[blockKey]
  return Array.isArray(v) ? v.filter(isRowFilled) : []
}

/**
 * Everything wrong with one row, keyed by field — the single place `required` and
 * `validate` are folded together, so the drawer form, the inline grid and the document
 * gate all state the same rule in the same words.
 *
 * Only call this with rows from `tableRows()`. The raw array carries the blank row that
 * "Tambah baris" appends, and validating it would turn the section red and block Lapor
 * SPT the instant the preparer clicks the button.
 */
export function fieldErrors(fields: FieldDef[], row: Record<string, unknown>, ctx: Ctx): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of fields) {
    // Nothing the preparer owns, or a column this entity does not have: it cannot be wrong.
    if (f.readOnly || f.compute || f.derive) continue
    if (f.when && !f.when(ctx)) continue
    const message = f.required && !isFilled(row[f.key]) ? 'Wajib diisi' : f.validate?.(row[f.key], row, ctx)
    if (message) out[f.key] = message
  }
  return out
}

export function blockValues(section: SectionData, blockKey: string): BlockValues {
  const v = section[blockKey]
  return v && !Array.isArray(v) ? v : {}
}

/** A lampiran counts as filled once any table row or any other block has a value. */
export function isSectionFilled(def: LampiranDef, data: SectionData | undefined): boolean {
  if (!data) return false
  return def.parts.some(p => p.blocks.some((b) => {
    const v = data[b.key]
    if (b.kind === 'table') return tableRows(data, b.key).length > 0
    return !!v && !Array.isArray(v) && Object.values(v).some(isFilled)
  }))
}

export const newRowId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Read-only display of a value (drawer tables, totals, summaries). */
export function formatValue(type: FieldType | 'computed' | 'rp' | 'text', value: unknown, field?: Pick<FieldDef, 'options' | 'showValue'>): string {
  if (type === 'currency' || type === 'computed' || type === 'rp') return formatRp(num(value))
  if (type === 'usd') return `${num(value) < 0 ? '-' : ''}$${formatNumber(Math.abs(num(value)))}`
  if (value === null || value === undefined || value === '') return '-'
  if (type === 'percent') return `${String(value).replace('.', ',')}%`
  if (type === 'yesno') return value ? 'Ya' : 'Tidak'
  if (type === 'checkbox') return value ? 'Ya' : '-'
  if (type === 'select' && field?.options && !field.showValue) {
    return normalizeOptions(field.options).find(o => o.value === value)?.label ?? String(value)
  }
  return String(value)
}

/** Table columns grouped for a two-row header: ungrouped columns span both rows. */
export function headerGroups(columns: FieldDef[]): { label: string, span: number, grouped: boolean }[] {
  const out: { label: string, span: number, grouped: boolean }[] = []
  for (const c of columns) {
    const last = out[out.length - 1]
    if (c.group && last?.grouped && last.label === c.group) last.span++
    else out.push({ label: c.group ?? c.label, span: 1, grouped: !!c.group })
  }
  return out
}
