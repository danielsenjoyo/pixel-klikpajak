/**
 * Whether the return is *correct* — as distinct from whether it has data.
 *
 * Three questions were previously conflated:
 *   "does this section have data?"  → isSectionFilled / sectionStates (unchanged)
 *   "is this field wrong?"          → FieldDef.validate (later step)
 *   "may this SPT be submitted?"    → validateSpt, here
 *
 * The balance-sheet and modal-disetor rules used to hide inside
 * `isLampiran1Filled` / `isLampiran2Filled`, which is why the section menu could only
 * ever say "belum diisi" and never "tidak seimbang". They live here now.
 *
 * This module sits above the engine, the lampiran definitions and the Induk, because
 * document rules need all three at runtime.
 */
import type { Ctx, FieldDef, Issue, SectionData } from '~/data/spt1771Engine'
import { blockValues, fieldErrors, num, tableRows } from '~/data/spt1771Engine'
import type { AttachmentCtx, IndukTotals, SptIndukData } from '~/data/spt1771Induk'
import { LAMPIRAN_LAINNYA } from '~/data/spt1771Induk'
import type { Lampiran1Data } from '~/data/spt1771Lampiran1'
import { PENYUSUTAN_CODE, koreksiNetto, missingKoreksiCode, posisiKeuanganValue, sectorRows } from '~/data/spt1771Lampiran1'
import { DER_MAKS, derL11b, lampiranDef, selisihPenyusutanL9 } from '~/data/spt1771LampiranDefs'
import { requiredLampiran } from '~/data/spt1771Checkpoints'
import { findSection } from '~/data/sptTahunanBadan'
import { formatRp } from '~/utils/currency'

export interface ValidationInput {
  induk: SptIndukData
  totals: IndukTotals
  lampiran1: Lampiran1Data
  lampiran: Record<string, SectionData>
  /** Entity is a bentuk usaha tetap — opens Lampiran 12A/12B. */
  isBut: boolean
  /** Yayasan / KIK are exempt from the Lampiran 2A 100% rule. */
  entityType?: string
  /** Section keys whose data is still missing, from `sectionStates`. */
  missingSections: string[]
  /** The same context the lampiran render with, so field rules see what the preparer sees. */
  ctx: Omit<Ctx, 'section'>
}

const err = (i: Omit<Issue, 'severity'>): Issue => ({ severity: 'error', ...i })
/** Stated, never enforced: the figure may be right for a reason the form cannot see. */
const warn = (i: Omit<Issue, 'severity'>): Issue => ({ severity: 'warning', ...i })

/**
 * Induk fields the preparer still owns. NIK / Nama / Jabatan arrive from the Coretax
 * signer module, and the filing date is stamped at submission — none of them can be
 * missing by hand, so none are checked here.
 */
function indukIssues(d: SptIndukData, totals: IndukTotals): Issue[] {
  const out: Issue[] = []
  const add = (code: string, label: string, message: string, tab: string, target: string) =>
    out.push(err({ code, label, message, section: 'induk', tab, target }))

  if (!d.npwp.trim()) add('induk/npwp', 'A.1 NPWP', 'NPWP wajib diisi.', 'ringkasan', 'induk-npwp-control')
  if (!d.nama.trim()) add('induk/nama', 'A.2 Nama', 'Nama wajib pajak wajib diisi.', 'ringkasan', 'induk-nama-control')
  if (d.diaudit && !d.opiniAuditor) add('induk/opini', 'B. Opini auditor', 'Opini auditor wajib dipilih karena laporan keuangan diaudit.', 'ringkasan', 'induk-opini-control')
  if (d.diaudit && !d.namaKap.trim()) add('induk/kap', 'B. Nama kantor akuntan publik', 'Nama kantor akuntan publik wajib diisi karena laporan keuangan diaudit.', 'ringkasan', 'induk-nama-kap-control')
  if (totals.isLebihBayar && !d.f19a) add('induk/f19a', 'F.19a Permohonan lebih bayar', 'Pilih cara pengembalian atas lebih bayar.', 'perhitungan', 'induk-f19a-pemeriksaan')
  if (totals.isLebihBayar && !d.bankAccountId) add('induk/f19b', 'F.19b Informasi rekening', 'Pilih rekening bank untuk pengembalian lebih bayar.', 'perhitungan', 'induk-bank-control')
  return out
}

/** PRD §13 R1 — the balance sheet must balance. Was buried in `isLampiran1Filled`. */
function neracaIssues(l1: Lampiran1Data): Issue[] {
  const aset = posisiKeuanganValue(l1, '1700')
  const pasiva = posisiKeuanganValue(l1, '3300')
  if (aset === pasiva) return []
  return [err({
    code: 'l1/neraca',
    label: 'L1B Neraca tidak seimbang',
    message: `Jumlah aset (${formatRp(aset)}) belum sama dengan jumlah liabilitas dan ekuitas (${formatRp(pasiva)}).`,
    section: 'lampiran-1',
    tab: 'b',
  })]
}

/**
 * Lampiran 2: modal disetor sums to 100%, and each activated Part B dimension carries
 * data (PRD F4 §7.1). Both rules were inside `isLampiran2Filled`.
 */
function kepemilikanIssues({ induk, lampiran, entityType }: ValidationInput): Issue[] {
  const s = lampiran['lampiran-2'] ?? {}
  const owners = tableRows(s, 'pemegangSaham')
  if (!owners.length) return []
  const out: Issue[] = []

  // Yayasan / KIK are not owned through capital, so the 100% rule does not apply.
  if (!entityType) {
    const total = owners.reduce((acc, r) => acc + num(r.persen), 0)
    if (Math.round(total * 100) !== 100 * 100) {
      out.push(err({
        code: 'l2/modal-100',
        label: 'L2A Modal disetor ≠ 100%',
        message: `Total modal disetor saat ini ${total.toLocaleString('id-ID')}%. Jumlahnya harus tepat 100%.`,
        section: 'lampiran-2',
        tab: 'a',
      }))
    }
  }

  const h = induk.h21 ?? {}
  const affiliates = tableRows(s, 'penyertaan')
  const has = (...keys: string[]) => affiliates.some(r => keys.some(k => num(r[k]) !== 0))
  const missing: string[] = []
  if (h.c && !has('modal', 'persen')) missing.push('penyertaan modal')
  if (h.d && !has('utang', 'utangBunga', 'piutang', 'piutangBunga')) missing.push('utang/piutang')
  if (missing.length) {
    out.push(err({
      code: 'l2/bagian-b',
      label: 'L2B belum diisi',
      message: `Anda menjawab "Ya" pada pernyataan transaksi Induk, jadi data ${missing.join(' dan ')} pada Lampiran 2 Bagian B wajib diisi.`,
      section: 'lampiran-2',
      tab: 'b',
    }))
  }
  return out
}

/** "Nilai fiskal (10)" — DJP's column number is noise in a menu entry. */
const plainLabel = (label: string) => label.replace(/\s*\(\d+\)$/, '')

/**
 * Field rules across every lampiran block.
 *
 * Tables: `required` and `FieldDef.validate` folded by the engine's `fieldErrors`, so a cell
 * that shows red there is a cell that blocks here. Rows come from `tableRows`, never the raw
 * array — "Tambah baris" appends a blank row and validating it would block Lapor SPT the
 * moment the preparer clicks the button.
 *
 * Statements: a `required` yes/no block needs every item *answered*. `null` is the only
 * thing that counts as unanswered; an explicit Tidak is a real answer.
 */
function tableFieldIssues(f: ValidationInput): Issue[] {
  const out: Issue[] = []
  const required = requiredLampiran({ induk: f.induk, lampiran: f.lampiran, isBut: f.isBut })
  for (const [key, data] of Object.entries(f.lampiran)) {
    const def = lampiranDef(key, f.ctx.year)
    if (!def) continue
    const ctx: Ctx = { ...f.ctx, section: data }
    /**
     * An unanswered statement is only a problem on a lampiran this return actually owes,
     * and only once it has been started: opening the page seeds every block, so without
     * this gate merely visiting Lampiran 10B would raise fifteen blockers. A section that
     * is required and wholly untouched is already reported once by `lampiranIssues`.
     */
    const answerable = required.has(key) && !f.missingSections.includes(key)
    for (const part of def.parts) {
      if (part.when && !part.when(f.ctx)) continue
      for (const block of part.blocks) {
        // A block the form does not show cannot be wrong — same rule as a hidden part.
        if (block.when && !block.when(ctx)) continue
        if (block.kind === 'statements' && block.required && block.control === 'yesno' && answerable) {
          const values = blockValues(data, block.key)
          for (const group of block.groups) {
            for (const item of group.items) {
              if (values[item.key] != null) continue
              out.push(err({
                code: `${key}/${block.key}/${item.key}`,
                label: `${def.title} — pernyataan ${item.letter ?? item.key}`,
                message: `Pernyataan "${item.label}" belum dijawab Ya atau Tidak.`,
                section: key,
                tab: part.key,
                target: `${key}-${block.key}-${item.key}-tidak`,
              }))
            }
          }
          continue
        }
        if (block.kind !== 'table') continue
        // Inline grids have no drawer, so a form-only column has nowhere to be filled in.
        const fields: FieldDef[] = block.mode === 'inline' ? block.columns.filter(c => !c.formOnly) : block.columns
        tableRows(data, block.dataKey ?? block.key).forEach((row, i) => {
          for (const [fieldKey, message] of Object.entries(fieldErrors(fields, row, ctx))) {
            const label = plainLabel(fields.find(c => c.key === fieldKey)?.label ?? fieldKey)
            out.push(err({
              code: `${key}/${block.key}/${row.id}/${fieldKey}`,
              label: `${def.title} baris ${i + 1} — ${label}`,
              message,
              section: key,
              tab: part.key,
              // Only inline cells carry a per-row id; a drawer row is edited through Ubah.
              target: block.mode === 'inline' ? `${key}-${block.key}-r${row.id}-${fieldKey}` : undefined,
            }))
          }
        })
      }
    }
  }
  return out
}

/** Lampiran 1 kolom (9): a fiscal correction must name the rule it is made under. */
function koreksiCodeIssues(l1: Lampiran1Data): Issue[] {
  const rows = sectorRows(l1.sektor).labaRugi
  return missingKoreksiCode(l1).map((code) => {
    const name = rows.find(r => r.kind !== 'group' && r.code === code)?.label ?? code
    return err({
      code: `l1/kode-koreksi/${code}`,
      label: `L1A ${code} kode koreksi fiskal`,
      message: `${name}: pilih kode koreksi fiskal untuk nilai di kolom (7) atau (8).`,
      section: 'lampiran-1',
      tab: 'a',
      target: `l1a-${code}-c9`,
    })
  })
}

/**
 * Lampiran 9's selisih (fiskal − komersial) is the amount Lampiran 1's depreciation
 * account should be corrected by, so the two should agree in size.
 *
 * Stated as a warning on magnitude only, deliberately: which of kolom (7) or (8) carries
 * the correction depends on the expense-row sign convention that is still an open question
 * for Tax/Legal, and a rule built on the disputed reading would bake it in.
 */
function penyusutanIssues(f: ValidationInput): Issue[] {
  const data = f.lampiran['lampiran-9']
  if (!data) return []
  const selisih = selisihPenyusutanL9({ ...f.ctx, section: data })
  const koreksi = koreksiNetto(f.lampiran1, PENYUSUTAN_CODE)
  if (koreksi === null || !selisih || Math.abs(selisih) === Math.abs(koreksi)) return []
  return [warn({
    code: 'l9/penyusutan-l1',
    label: 'L9 selisih penyusutan ≠ koreksi L1',
    message: `Lampiran 9 mencatat selisih penyusutan dan amortisasi ${formatRp(Math.abs(selisih))}, sedangkan akun ${PENYUSUTAN_CODE} pada Lampiran 1 dikoreksi ${formatRp(Math.abs(koreksi))}. Periksa kembali jika keduanya seharusnya sama.`,
    section: 'lampiran-9',
  })]
}

/**
 * PMK 169/2015 caps the deductible borrowing cost at a 4:1 debt-to-equity ratio. A warning,
 * not a computation: PER-11 leaves the method open ("DER, persentase EBITDA, atau metode
 * lainnya") and the allowed ratio to other regulation, so kolom (4) stays the preparer's.
 */
function derIssues(f: ValidationInput): Issue[] {
  const data = f.lampiran['lampiran-11b']
  if (!data) return []
  const ctx: Ctx = { ...f.ctx, section: data }
  const { ratio } = derL11b(ctx)
  if (ratio === null || ratio <= DER_MAKS) return []
  const rows = tableRows(data, 'biayaPinjaman')
  const ditolak = rows.reduce((acc, r) => acc + (num(r.bunga) - num(r.dapat)), 0)
  if (!rows.length || ditolak > 0) return []
  const der = `${ratio.toFixed(1).replace('.', ',')} : 1`
  return [warn({
    code: 'l11b/der',
    label: `L11B DER ${der}`,
    message: `Perbandingan utang dan modal ${der} melampaui batas ${DER_MAKS} : 1, tetapi seluruh biaya pinjaman masih diperhitungkan. Kelebihannya umumnya tidak dapat dikurangkan dan menjadi koreksi fiskal positif pada Lampiran 1.`,
    section: 'lampiran-11b',
    tab: 'iii',
  })]
}

/**
 * PER-11 formulir INDUK Bagian I — the documents this return must carry, given the answers
 * it makes. Six of the fourteen entries can be decided from the form; the rest are noted on
 * `LAMPIRAN_LAINNYA` itself, where the condition exists but the data to test it does not.
 */
function attachmentIssues(f: ValidationInput): Issue[] {
  const ctx: AttachmentCtx = { induk: f.induk, isBut: f.isBut, lampiran: f.lampiran }
  return LAMPIRAN_LAINNYA
    .filter(l => l.mandatoryWhen?.(ctx) && !f.induk.lampiranLainnya[l.key])
    .map(l => err({
      code: `induk/berkas-${l.key}`,
      label: `I.${l.code} ${l.label}`,
      message: `${l.label} wajib dilampirkan pada SPT ini.`,
      section: 'induk',
      tab: 'berkas',
      target: `induk-lampiran-${l.key}`,
    }))
}

/** PRD §13 R3 — every activated lampiran carries data. */
function lampiranIssues(f: ValidationInput): Issue[] {
  const required = requiredLampiran({ induk: f.induk, lampiran: f.lampiran, isBut: f.isBut })
  return f.missingSections
    .filter(key => key !== 'induk' && required.has(key))
    .map(key => err({
      code: `lampiran/${key}`,
      label: `${findSection(key)?.label ?? key} belum diisi`,
      message: `${findSection(key)?.label ?? key} diaktifkan oleh jawaban Induk tetapi masih kosong.`,
      section: key,
    }))
}

/** Everything wrong with the return, most blocking first. */
export function validateSpt(f: ValidationInput): Issue[] {
  return [
    ...indukIssues(f.induk, f.totals),
    ...neracaIssues(f.lampiran1),
    ...koreksiCodeIssues(f.lampiran1),
    ...attachmentIssues(f),
    ...kepemilikanIssues(f),
    ...lampiranIssues(f),
    ...tableFieldIssues(f),
    ...penyusutanIssues(f),
    ...derIssues(f),
  ]
}

/** Issues that stop Lapor SPT. */
export const blockingIssues = (issues: Issue[]) => issues.filter(i => i.severity === 'error')

/** Issues shown but not enforced. */
export const warningIssues = (issues: Issue[]) => issues.filter(i => i.severity === 'warning')
