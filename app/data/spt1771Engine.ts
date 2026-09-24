/**
 * Config-driven lampiran engine for SPT Tahunan Badan (Lampiran 2–14).
 * Every lampiran in Figma "SPT-Tahunan-Badan › --> SPT" is built from four block kinds:
 *   table      — rows edited inline, or added through a "Tambah data" drawer
 *   form       — numbered "No. | Rincian | Nilai" calculation sheet
 *   statements — Ya/Tidak (or checklist) declarations
 *   fields     — labelled inputs in the 640px form column
 */
import { formatNumber, formatRp } from '~/utils/currency'

export type FieldType =
  | 'text' | 'id' | 'currency' | 'usd' | 'percent' | 'number'
  | 'year' | 'month' | 'date' | 'select' | 'yesno' | 'checkbox'

export type Row = Record<string, unknown> & { id: string }
export type BlockValues = Record<string, unknown>
/** Saved data of one lampiran section: block key → rows (table) or values (others). */
export type SectionData = Record<string, Row[] | BlockValues>

export interface Ctx {
  /** Tax year of the SPT (e.g. 2023). */
  year: number
  /** SPT Induk D.9 — penghasilan kena pajak. */
  pkp: number
  /** SPT Induk D.4 — penghasilan neto fiskal. */
  penghasilanNeto: number
  /** All blocks of the current lampiran section (for cross-block totals). */
  section: SectionData
}

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  options?: readonly string[]
  /** Table: two-row header group. Drawer/fields: sub-heading above the field. */
  group?: string
  /** Read-only value computed from the row (table) or block values (fields). */
  compute?: (values: Record<string, unknown>, ctx: Ctx) => number
  required?: boolean
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
}

export interface TableBlock {
  kind: 'table'
  key: string
  title?: string
  description?: string
  mode: 'inline' | 'drawer'
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
  options?: readonly string[]
  compute?: (values: BlockValues, ctx: Ctx) => number
  /** Grey formula hint under the label. */
  hint?: string
  indent?: 1 | 2
  /** Heading rows are bold with no control. */
  heading?: boolean
}

export interface FormBlock {
  kind: 'form'
  key: string
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
  title?: string
  control: 'yesno' | 'checkbox'
  groups: StatementGroup[]
  /** Extra dated fields after the statements (Lampiran 10D). */
  fields?: FieldDef[]
}

export interface FieldsBlock {
  kind: 'fields'
  key: string
  title?: string
  groups: { title?: string, fields: FieldDef[] }[]
}

export type Block = TableBlock | FormBlock | StatementsBlock | FieldsBlock

export interface LampiranPart {
  key: string
  /** Tab label; parts without tabs render one after another. */
  tab?: string
  title?: string
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

export function tableRows(section: SectionData, blockKey: string): Row[] {
  const v = section[blockKey]
  return Array.isArray(v) ? v : []
}

export function blockValues(section: SectionData, blockKey: string): BlockValues {
  const v = section[blockKey]
  return v && !Array.isArray(v) ? v : {}
}

/** An answered Tidak (false) counts as filled. */
const isFilled = (v: unknown) => v !== null && v !== undefined && v !== ''

/** A lampiran counts as filled once any table has a row or any other block has a value. */
export function isSectionFilled(def: LampiranDef, data: SectionData | undefined): boolean {
  if (!data) return false
  return def.parts.some(p => p.blocks.some((b) => {
    const v = data[b.key]
    if (b.kind === 'table') return Array.isArray(v) && v.length > 0
    return !!v && !Array.isArray(v) && Object.values(v).some(isFilled)
  }))
}

export const newRowId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** Read-only display of a value (drawer tables, totals, summaries). */
export function formatValue(type: FieldType | 'computed' | 'rp' | 'text', value: unknown): string {
  if (type === 'currency' || type === 'computed' || type === 'rp') return formatRp(num(value))
  if (type === 'usd') return `${num(value) < 0 ? '-' : ''}$${formatNumber(Math.abs(num(value)))}`
  if (value === null || value === undefined || value === '') return '-'
  if (type === 'percent') return `${String(value).replace('.', ',')}%`
  if (type === 'yesno') return value ? 'Ya' : 'Tidak'
  if (type === 'checkbox') return value ? 'Ya' : '-'
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
