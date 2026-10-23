/**
 * Lampiran 1 — Rekonsiliasi Fiskal per CoA Jurnal (L1 — Fiscal Reconciliation PRD, R1,
 * with the Round-1 usability decisions: reconcile per Jurnal CoA, inline, bulk-set, editable value).
 *
 * PRD §4 layers, kept apart so the numbers stay defensible:
 *  - Layer 1 (regulatory config): INDUSTRY_SEKTOR, COA_DJP_LOOKUP, FISCAL_PROMPT. Declarative —
 *    a rule change is a data change. Draft values from the mapping workbook; NOT yet validated
 *    against PER-11 (PRD §9 items 6–8) and the pasal citations need Tax/Legal sign-off.
 *  - Layer 2a (mapping, deterministic): buildWorkspace / lookupDjp — lookup + account-class
 *    guard + user override. Never silently auto-assigns: no lookup hit → unmapped (AC-008).
 *  - Layer 3 (computation): coaValue / rollUp — the per-CoA reconciliation summed into the
 *    DJP Lampiran 1A shape the rest of the return already reads (Induk D.4, L11B, validation).
 */
import type { CoaClass, JurnalAccount, JurnalTransaction, PullResult } from '~/data/jurnalErp'
import { sectorRows, type AccountRow, type RowValues } from '~/data/spt1771Lampiran1'
import { n } from '~/utils/currency'

// ── Layer 1 — regulatory config ──────────────────────────────────────────────

/** Industry (company setup) → default sektor (PRD §6 "Determinants", 43 → 12 in the workbook; a subset here). */
export const INDUSTRY_SEKTOR: Record<string, string> = {
  'Software & SaaS': 'BC04',
  'Konsultan': 'BC04',
  'Logistik & Pengiriman': 'BC04',
  'Restoran & Kafe': 'BC03',
  'Perdagangan Grosir': 'BC03',
  'Ekspor-Impor': 'BC03',
  'Manufaktur': 'BC02',
  'Properti': 'BC08',
  'Organisasi Nirlaba': 'BC01',
}
export const sektorFromIndustry = (industry: string | undefined): string | null =>
  (industry && INDUSTRY_SEKTOR[industry]) || null

/**
 * CoA (Jurnal standard numbering) → DJP account, keyed by sektor; '*' applies to every
 * sektor that has the code. A hit is used only when the code exists in that sektor's schema
 * and passes the class guard — otherwise the line stays unmapped for the preparer.
 */
const COA_DJP_LOOKUP: Record<string, Record<string, string>> = {
  '4-40000': { '*': '4021', BC01: '4002', BC02: '4002', BC03: '4002' },
  '4-40100': { '*': '4021', BC01: '4002', BC02: '4002', BC03: '4002' },
  '4-40200': { '*': '4013' },
  '5-50000': { '*': '5020', BC01: '5007' },
  '5-50100': { '*': '5020', BC01: '5007' },
  '6-60001': { '*': '5311' },
  '6-60002': { '*': '5311' },
  '6-60003': { '*': '5312' },
  '6-60004': { '*': '5312' },
  '6-60101': { '*': '5313' },
  '6-60201': { '*': '5314' },
  '6-60202': { '*': '5314' },
  '6-60301': { '*': '5315' },
  '6-60401': { '*': '5317' },
  '6-60501': { '*': '5320' },
  '6-60502': { '*': '5321' },
  '6-60601': { '*': '5399' },
  '6-60701': { '*': '5399', BC01: '5322' },
  '6-60702': { '*': '5399', BC01: '5322' },
  '6-60801': { '*': '5499' },
  '6-60803': { '*': '5399' },
  '7-70001': { '*': '4511' },
  '7-70002': { '*': '4511' },
  '7-70003': { '*': '4599' },
  '7-70004': { '*': '4501' },
  '8-80001': { '*': '5499' },
  '8-80002': { '*': '5421' },
  '8-80003': { '*': '5409' },
  '1-10001': { '*': '1101' },
  '1-10002': { '*': '1101' },
  '1-10003': { '*': '1101' },
  '1-10004': { '*': '1101' },
  '1-10100': { '*': '1122' },
  '1-10101': { '*': '1131' },
  '1-10300': { '*': '1124' },
  '1-10402': { '*': '1421' },
  '1-10500': { '*': '1423' },
  '1-10501': { '*': '1423' },
  '1-10600': { '*': '1422' },
  '1-10700': { '*': '1521' },
  '1-10701': { '*': '1521' },
  '1-10751': { '*': '1522' },
  '1-10752': { '*': '1522' },
  '1-10800': { '*': '1600' },
  '1-10801': { '*': '1601' },
  '1-10900': { '*': '1698' },
  '2-20100': { '*': '2102' },
  '2-20400': { '*': '2195' },
  '2-20500': { '*': '2191' },
  '2-20501': { '*': '2191' },
  '2-20502': { '*': '2191' },
  '2-20700': { '*': '2203' },
  '2-20800': { '*': '2322' },
  '3-30000': { '*': '3102' },
  '3-30100': { '*': '3200' },
  '3-30200': { '*': '3200' },
}

export type CoaCol = 'c4' | 'c5' | 'c7' | 'c8'

/**
 * Default fiscal prompt per CoA (PRD §5 "Default fiscal-code per account"): a column and
 * code to CHECK, with its legal basis — never applied on its own; the preparer enters the amount.
 */
export interface FiscalPrompt { col: CoaCol, code?: string, basis: string }
export const FISCAL_PROMPT: Record<string, FiscalPrompt> = {
  '6-60004': { col: 'c7', code: 'FPO-12', basis: 'Pembentukan cadangan bukan biaya — Pasal 9 ayat (1) huruf c UU PPh' },
  '6-60201': { col: 'c7', code: 'FPO-09', basis: 'Bandingkan dengan penyusutan fiskal Lampiran 9 — Pasal 11 UU PPh' },
  '6-60202': { col: 'c7', code: 'FPO-10', basis: 'Bandingkan dengan amortisasi fiskal Lampiran 9 — Pasal 11A UU PPh' },
  '6-60501': { col: 'c7', code: 'FPO-12', basis: 'Promosi wajib didukung daftar nominatif — PMK 02/PMK.03/2010' },
  '6-60502': { col: 'c7', code: 'FPO-12', basis: 'Entertainment wajib didukung daftar nominatif — SE-27/PJ.22/1986' },
  '6-60601': { col: 'c7', code: 'FPO-03', basis: 'Natura dapat dibiayakan sejak UU HPP; koreksi hanya yang tidak memenuhi 3M — Pasal 6 ayat (1) huruf n, PMK 66/2023' },
  '6-60801': { col: 'c7', code: 'FPO-08', basis: 'Sanksi administrasi — Pasal 9 ayat (1) huruf k UU PPh' },
  '6-60803': { col: 'c7', code: 'FPO-06', basis: 'Pajak penghasilan — Pasal 9 ayat (1) huruf h UU PPh' },
  '8-80003': { col: 'c7', code: 'FPO-05', basis: 'Sumbangan — Pasal 9 ayat (1) huruf g UU PPh' },
  '7-70001': { col: 'c5', basis: 'Bunga jasa giro dikenakan PPh Final — Pasal 4 ayat (2) huruf a UU PPh' },
  '7-70002': { col: 'c5', basis: 'Bunga deposito dikenakan PPh Final — Pasal 4 ayat (2) huruf a UU PPh' },
  '7-70003': { col: 'c4', basis: 'Dividen dalam negeri dapat dikecualikan dari objek pajak — Pasal 4 ayat (3) huruf f UU PPh' },
}

export const COA_COL_LABEL: Record<CoaCol, string> = {
  c4: 'Non objek pajak',
  c5: 'Dikenakan PPh Final',
  c7: 'Koreksi fiskal positif',
  c8: 'Koreksi fiskal negatif',
}

// ── Workspace model ──────────────────────────────────────────────────────────

export interface CoaLine {
  coa: string
  name: string
  category: string
  cls: CoaClass
  /** As pulled; null when the pull could not read the account (AC-004). */
  jurnalValue: number | null
  /** Commercial value used — equals jurnalValue until the preparer overrides it (round-1 F4 / US-011). */
  value: number | null
  djp: string | null
  /** Where the DJP account came from: the lookup table, last year's confirmed mapping, or the preparer. */
  djpSource: 'lookup' | 'reuse' | 'user' | null
  c4?: number | null
  c5?: number | null
  c7?: number | null
  c8?: number | null
  c9?: string
  /** Transactions ticked to build a qualification (optional, round-1 F5) and the column they fill. */
  picked?: string[]
  pickCol?: CoaCol
  isMissing?: boolean
}

/** Audit trail (PRD §4 guardrails): what changed on which CoA, from what, to what. */
export interface AuditEntry { at: string, coa: string, field: string, from: string, to: string }

export interface ErpWorkspace {
  pulledAt: string
  lines: CoaLine[]
  transactions: Record<string, JurnalTransaction[]>
  log: AuditEntry[]
}

export const isProfitLoss = (cls: CoaClass) => cls === 'pendapatan' || cls === 'beban'

// ── Layer 2a — deterministic mapping ─────────────────────────────────────────

/** The account-class guard (PRD §6, AC-010): which DJP input rows a class may map to. */
const CLASS_PREFIX: Record<CoaClass, string> = { pendapatan: '4', beban: '5', aset: '1', liabilitas: '2', ekuitas: '3' }

export interface DjpOption { value: string, label: string, row: Extract<AccountRow, { kind: 'input' }> }

export function allowedDjp(cls: CoaClass, sektor: string): DjpOption[] {
  const schema = sectorRows(sektor)
  const rows = isProfitLoss(cls) ? schema.labaRugi : schema.posisiKeuangan
  return rows
    .filter((r): r is Extract<AccountRow, { kind: 'input' }> => r.kind === 'input' && r.code.startsWith(CLASS_PREFIX[cls]))
    .map(r => ({ value: r.code, label: `${r.code} · ${r.label}`, row: r }))
}

export const isAllowedDjp = (cls: CoaClass, sektor: string, code: string) =>
  allowedDjp(cls, sektor).some(o => o.value === code)

export function djpRow(sektor: string, code: string | null) {
  if (!code) return undefined
  const s = sectorRows(sektor)
  return [...s.labaRugi, ...s.posisiKeuangan].find(r => r.kind === 'input' && r.code === code) as Extract<AccountRow, { kind: 'input' }> | undefined
}

export function lookupDjp(coa: string, cls: CoaClass, sektor: string): string | null {
  const hit = COA_DJP_LOOKUP[coa]
  const code = hit?.[sektor] ?? hit?.['*']
  return code && isAllowedDjp(cls, sektor, code) ? code : null
}

/** Income rows DJP opens (4)/(5) on — the disabled-cell matrix lives in the sektor schema (`variant: 'full'`). */
export function editableCols(line: CoaLine, sektor: string): CoaCol[] {
  const full = djpRow(sektor, line.djp)?.variant === 'full'
  return full ? ['c4', 'c5', 'c7', 'c8'] : ['c7', 'c8']
}

/**
 * Lines from a pull. A confirmed mapping from an earlier year (US-006) wins over the lookup
 * when still valid for this sektor; corrections and overrides already in the draft survive a re-pull.
 */
export function buildWorkspace(
  pull: PullResult,
  sektor: string,
  saved: Record<string, string> | undefined,
  previous: ErpWorkspace | undefined,
): ErpWorkspace {
  const prev = new Map(previous?.lines.map(l => [l.coa, l]))
  const toLine = (a: JurnalAccount, isMissing: boolean): CoaLine => {
    const old = prev.get(a.coa)
    const jurnalValue = isMissing ? null : a.balance
    const reuse = saved?.[a.coa]
    let djp: string | null = null
    let djpSource: CoaLine['djpSource'] = null
    if (old?.djpSource === 'user' && old.djp && isAllowedDjp(a.cls, sektor, old.djp)) [djp, djpSource] = [old.djp, 'user']
    else if (reuse && isAllowedDjp(a.cls, sektor, reuse)) [djp, djpSource] = [reuse, 'reuse']
    else if ((djp = lookupDjp(a.coa, a.cls, sektor))) djpSource = 'lookup'
    const kept = old && old.value !== old.jurnalValue ? old.value : jurnalValue
    return {
      coa: a.coa,
      name: a.name,
      category: a.category,
      cls: a.cls,
      jurnalValue,
      value: kept,
      djp,
      djpSource,
      c4: old?.c4 ?? null,
      c5: old?.c5 ?? null,
      c7: old?.c7 ?? null,
      c8: old?.c8 ?? null,
      c9: old?.c9 ?? '',
      picked: old?.picked ?? [],
      pickCol: old?.pickCol,
      isMissing,
    }
  }
  return {
    pulledAt: pull.pulledAt,
    lines: [...pull.accounts.map(a => toLine(a, false)), ...pull.missing.map(a => toLine(a, true))],
    transactions: pull.transactions,
    log: previous?.log ?? [],
  }
}

/**
 * Induk B.1 changed: lines whose DJP account the new sektor lacks (or that had none) take the
 * mapping confirmed for that sektor, else the lookup, else stay unmapped.
 */
export function remapForSektor(ws: ErpWorkspace, sektor: string, saved?: Record<string, string>): ErpWorkspace {
  let changed = false
  const lines = ws.lines.map((l) => {
    const valid = !!l.djp && isAllowedDjp(l.cls, sektor, l.djp)
    // The preparer's own choice stands; a confirmed mapping beats the lookup table.
    if (valid && l.djpSource === 'user') return l
    const reuse = saved?.[l.coa]
    if (valid && !(reuse && isAllowedDjp(l.cls, sektor, reuse))) return l
    const next: Pick<CoaLine, 'djp' | 'djpSource'> = reuse && isAllowedDjp(l.cls, sektor, reuse)
      ? { djp: reuse, djpSource: 'reuse' }
      : { djp: lookupDjp(l.coa, l.cls, sektor), djpSource: 'lookup' }
    if (!next.djp) next.djpSource = null
    if (next.djp === l.djp && next.djpSource === l.djpSource) return l
    changed = true
    return { ...l, ...next }
  })
  return changed ? { ...ws, lines } : ws
}

// ── Layer 3 — computation ────────────────────────────────────────────────────

/** (6) = (3) − (4) − (5) for one CoA. */
export const coaTidakFinal = (l: CoaLine) => n(l.value) - n(l.c4) - n(l.c5)

/** (10) for one CoA — the expense sign flip mirrors `labaRugiValue` (a positive correction cuts the cost). */
export const coaFiskal = (l: CoaLine) => coaTidakFinal(l) + (l.cls === 'beban' ? -1 : 1) * (n(l.c7) - n(l.c8))

/** Contra rows (akumulasi, cadangan) are subtracted in Jumlah Aset — DJP wants them as positive amounts. */
function contraCodes(sektor: string): Set<string> {
  const out = new Set<string>()
  for (const r of sectorRows(sektor).posisiKeuangan) {
    if (r.kind === 'total') r.formula.forEach(([c, sign]) => sign < 0 && out.add(c))
  }
  return out
}

/** Codes of the corrections on a line, for kolom (9) — required whenever (7) or (8) carries an amount. */
export const needsCode = (l: CoaLine) => (n(l.c7) !== 0 || n(l.c8) !== 0) && !String(l.c9 ?? '').trim()

/**
 * The DJP Lampiran 1A the CoA reconciliation adds up to (round-1 F1/F2): several CoA roll into
 * one DJP row and are summed; kolom (9) carries every distinct code used on the row.
 */
export function rollUp(ws: ErpWorkspace, sektor: string): { labaRugi: Record<string, RowValues>, posisiKeuangan: Record<string, number | null> } {
  const contra = contraCodes(sektor)
  const labaRugi: Record<string, RowValues & { codes?: Set<string> }> = {}
  const posisiKeuangan: Record<string, number | null> = {}
  for (const l of ws.lines) {
    if (!l.djp || l.value === null) continue
    if (isProfitLoss(l.cls)) {
      const row = (labaRugi[l.djp] ??= { c3: 0, codes: new Set() })
      row.c3 = n(row.c3) + n(l.value)
      for (const c of ['c4', 'c5', 'c7', 'c8'] as const) {
        if (n(l[c]) !== 0) row[c] = n(row[c]) + n(l[c])
      }
      if (l.c9) row.codes!.add(l.c9)
    }
    else {
      posisiKeuangan[l.djp] = n(posisiKeuangan[l.djp]) + (contra.has(l.djp) ? -n(l.value) : n(l.value))
    }
  }
  const lr = Object.fromEntries(Object.entries(labaRugi).map(([code, { codes, ...v }]) => [code, { ...v, c9: [...codes!].sort().join(', ') }]))
  return { labaRugi: lr, posisiKeuangan }
}

export const unmappedLines = (ws: ErpWorkspace) => ws.lines.filter(l => !l.djp)
export const linesMissingCode = (ws: ErpWorkspace) => ws.lines.filter(l => isProfitLoss(l.cls) && needsCode(l))

/** The confirmed mapping to remember for next year (US-006): CoA → DJP for every mapped line. */
export const mappingOf = (ws: ErpWorkspace): Record<string, string> =>
  Object.fromEntries(ws.lines.filter(l => l.djp).map(l => [l.coa, l.djp!]))

/** Record a preparer's change on one CoA (mapping, value or correction) in the workspace's trail. */
export function logChange(ws: ErpWorkspace, coa: string, field: string, from: unknown, to: unknown) {
  if (String(from ?? '') === String(to ?? '')) return
  ws.log.push({ at: new Date().toISOString(), coa, field, from: String(from ?? ''), to: String(to ?? '') })
}

export const CLASS_LABEL: Record<CoaClass, string> = {
  pendapatan: 'Pendapatan',
  beban: 'Beban',
  aset: 'Aset',
  liabilitas: 'Liabilitas',
  ekuitas: 'Ekuitas',
}
