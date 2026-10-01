/**
 * SPT Tahunan PPh Badan — SPT Induk form model + calculations.
 * Fields and numbering follow Figma "SPT / induk" (sections A–J).
 */
import { pkpKenaTarif, tableRows, type SectionData } from '~/data/spt1771Engine'
import { BATAS_31E_MAKS, hitungLampiran8, litbangDimanfaatkan, type LampiranLinks } from '~/data/spt1771LampiranDefs'
import { n } from '~/utils/currency'

export type YesNo = boolean

export const OPINI_AUDITOR = [
  'Wajar tanpa pengecualian',
  'Wajar dengan pengecualian',
  'Tidak wajar',
  'Tidak menyatakan pendapat',
] as const

/** D.11 Tarif pajak. (c) uses Lampiran 8 when its peredaran bruto is filled, else a flat 50% facility. */
export const TARIF_OPTIONS = [
  { value: 'a', label: 'a. Tarif Ketentuan Umum sebagaimana Pasal 17 ayat (1) huruf b UU PPh', rate: 0.22 },
  { value: 'b', label: 'b. Tarif Fasilitas sebagaimana Pasal 17 ayat (2b) UU PPh', rate: 0.19 },
  { value: 'c', label: 'c. Tarif Fasilitas sebagaimana Pasal 31E ayat (1) UU PPh', rate: 0.11 },
] as const
export type Tarif = typeof TARIF_OPTIONS[number]['value']

/** Short article reference for the rate badge on row 11. */
export const TARIF_PASAL: Record<Tarif, string> = {
  a: 'Ps. 17(1)b',
  b: 'Ps. 17(2b)',
  c: 'Ps. 31E',
}

/** Row 11 reads as a picker, so each tarif needs a label that fits on one line. */
export const TARIF_SHORT: Record<Tarif, string> = {
  a: 'Ps. 17 ayat (1) huruf b — tarif umum',
  b: 'Ps. 17 ayat (2b) — fasilitas perseroan terbuka',
  c: 'Ps. 31E ayat (1) — fasilitas peredaran bruto',
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
/** Periode pembukuan: 12-month book years starting in any month. */
export const PERIODE_PEMBUKUAN = MONTHS.map((m, i) => `${m} - ${MONTHS[(i + 11) % 12]}`)

/** I. Lampiran lainnya — attachment slots (file names only in this prototype). */
/** What decides whether an attachment is required — PER-11 formulir INDUK Bagian I. */
export interface AttachmentCtx {
  induk: SptIndukData
  isBut: boolean
  lampiran: Record<string, SectionData>
}

export interface LampiranLainnya {
  key: string
  code: string
  label: string
  group?: string
  /**
   * PER-11 Bagian I says when each document is "wajib dilampirkan". Omitted where the rule
   * exists but the form captures nothing to test it against — d (foreign tax credit),
   * f.1–f.4 (BULN nonbursa dividends) and g (zakat) have no field anywhere in the SPT, and
   * PER-11 states no condition at all for i (CbCR receipt).
   */
  mandatoryWhen?: (f: AttachmentCtx) => boolean
}

export const LAMPIRAN_LAINNYA: LampiranLainnya[] = [
  // "wajib dilampirkan oleh semua Wajib Pajak Badan"
  { key: 'a', code: 'a', label: 'Laporan keuangan', mandatoryWhen: () => true },
  { key: 'b', code: 'b', label: 'Opini audit', mandatoryWhen: f => !!f.induk.diaudit },
  { key: 'c', code: 'c', label: 'Laporan keuangan konsolidasi untuk bentuk usaha tetap', mandatoryWhen: f => f.isBut },
  { key: 'd', code: 'd', label: 'Bukti pemotongan sehubungan dengan kredit pajak luar negeri' },
  {
    key: 'e',
    code: 'e',
    label: 'Bukti jenis penanaman kembali dan realisasi penanaman kembali untuk bentuk usaha tetap',
    // "wajib dilampirkan untuk pengecualian pengenaan pajak atas penghasilan kena pajak
    // sesudah dikurangi pajak dari BUT" — the exemption is claimed by filing the realisasi.
    mandatoryWhen: f => f.isBut && tableRows(f.lampiran['lampiran-12b'] ?? {}, 'realisasi').length > 0,
  },
  { key: 'f1', code: 'f.1', group: 'f. Surat Penghitungan Pengkreditan Pajak yang telah dibayar atau dipotong/dipungut atas dividen yang diterima dari badan usaha luar negeri (BULN) nonbursa terkendali langsung, termasuk:', label: 'Laporan keuangan BULN nonbursa terkendali langsung' },
  { key: 'f2', code: 'f.2', label: 'Fotokopi surat pemberitahuan tahunan pajak penghasilan BULN nonbursa terkendali langsung' },
  { key: 'f3', code: 'f.3', label: 'Perhitungan atau rincian laba setelah pajak dalam 5 (lima) tahun terakhir BULN nonbursa terkendali langsung' },
  { key: 'f4', code: 'f.4', label: 'Bukti pembayaran pajak penghasilan atau bukti pemotongan pajak penghasilan atas dividen yang diterima dari BULN nonbursa terkendali langsung' },
  { key: 'g', code: 'g', label: 'Bukti pembayaran zakat' },
  // Both h-reports are required the moment the Pasal 17(2b) perseroan terbuka rate is taken.
  { key: 'h1', code: 'h.1', group: 'h. Laporan wajib pajak dalam rangka pemenuhan persyaratan penurunan tarif pajak penghasilan bagi wajib pajak Badan Dalam Negeri yang berbentuk Perseroan Terbuka', label: 'Laporan bulanan', mandatoryWhen: f => f.induk.tarif === 'b' },
  { key: 'h2', code: 'h.2', label: 'Laporan kepemilikan saham yang memiliki hubungan istimewa', mandatoryWhen: f => f.induk.tarif === 'b' },
  { key: 'i', code: 'i', label: 'Tanda terima elektronik penyampaian laporan per negara (Country-by-Country Report)' },
  {
    key: 'j',
    code: 'j',
    label: 'Dokumen lainnya',
    // Normally the catch-all, but PER-11 Lampiran 14 a) routes the laporan penggunaan sisa
    // lebih here by name: "tetap dilampirkan sebagai dokumen lainnya pada formulir INDUK
    // Bagian I huruf j".
    mandatoryWhen: f => tableRows(f.lampiran['lampiran-14'] ?? {}, 'sisaLebih').length > 0,
  },
]

export interface SptIndukData {
  // Header
  periodType: 'tahun' | 'bagian'
  periodePembukuan: string
  metodePembukuan: 'pembukuan' | 'kas'
  // A. Identitas wajib pajak
  npwp: string
  nama: string
  email: string
  telepon: string
  // B. Informasi laporan keuangan
  diaudit: YesNo
  opiniAuditor: string | null
  npwpKap: string
  namaKap: string
  // C. PPh Final & non objek
  c1a: YesNo
  c1b: YesNo
  c2: YesNo
  c3: YesNo
  // D. Perhitungan PPh
  d5: YesNo
  d6: YesNo
  d8: YesNo
  d10: YesNo
  tarif: Tarif
  // E. Pengurang PPh terutang
  e13: YesNo
  e14Amount: number | null
  e15Amount: number | null
  e16: YesNo
  // F. PPh kurang/lebih bayar
  f17b: YesNo
  f17bAmount: number | null
  f18aAmount: number | null
  f19a: 'pemeriksaan' | 'pendahuluan' | null
  /** Id of a rekening on the Coretax profile — its nomor/pemilik are never typed here. */
  bankAccountId: string | null
  // G. Angsuran tahun berjalan
  g20: YesNo
  // H. Pernyataan transaksi
  h21: Record<string, YesNo>
  // I. Lampiran lainnya (file names)
  lampiranLainnya: Record<string, string | null>
  // J. Pernyataan
  penandatangan: 'wp' | 'kuasa'
  nikNpwpPenandatangan: string
  namaPenandatangan: string
  jabatan: string
  /** Set to the filing date when the return is submitted, not typed by hand. */
  tanggal: string | null
}

/** The H.21 answer keys, read off the gating questions so there is one list, not two. */
function h21Keys(): string[] {
  return GATING_GROUPS.flatMap(g => g.questions)
    .filter(q => q.field.startsWith('h21.'))
    .map(q => q.field.slice(4))
}

export function emptyInduk(prefill: Partial<SptIndukData> = {}): SptIndukData {
  return {
    periodType: 'tahun',
    periodePembukuan: PERIODE_PEMBUKUAN[0]!,
    metodePembukuan: 'pembukuan',
    npwp: '',
    nama: '',
    email: '',
    telepon: '',
    diaudit: false,
    opiniAuditor: null,
    npwpKap: '',
    namaKap: '',
    c1a: false,
    c1b: false,
    c2: false,
    c3: false,
    d5: false,
    d6: false,
    d8: false,
    d10: false,
    tarif: 'a',
    e13: false,
    e14Amount: null,
    e15Amount: null,
    e16: false,
    f17b: false,
    f17bAmount: null,
    f18aAmount: null,
    f19a: null,
    bankAccountId: null,
    g20: false,
    h21: Object.fromEntries(h21Keys().map(k => [k, false])),
    lampiranLainnya: Object.fromEntries(LAMPIRAN_LAINNYA.map(l => [l.key, null])),
    penandatangan: 'wp',
    nikNpwpPenandatangan: '',
    namaPenandatangan: '',
    jabatan: '',
    tanggal: null,
    ...prefill,
  }
}

/** Induk amounts a filled lampiran provides (the Ya/Tidak question still gates them). */
export const LINKED_AMOUNTS = ['c2', 'c3', 'd5', 'd6', 'd8', 'd10', 'e13', 'e16'] as const
export type LinkedKey = typeof LINKED_AMOUNTS[number]

/** Where a linked amount is rolled up from, for the source chip on its computed row. */
export const LINK_ORIGIN: Record<LinkedKey, { label: string, section: string }> = {
  c2: { label: 'Lampiran 4 bagian A', section: 'lampiran-4' },
  c3: { label: 'Lampiran 4 bagian B', section: 'lampiran-4' },
  d5: { label: 'Lampiran 13A', section: 'lampiran-13a' },
  d6: { label: 'Lampiran 13B', section: 'lampiran-13b' },
  d8: { label: 'Lampiran 7', section: 'lampiran-7' },
  d10: { label: 'Lampiran 13B', section: 'lampiran-13b' },
  e13: { label: 'Lampiran 3', section: 'lampiran-3' },
  e16: { label: 'Lampiran 13C', section: 'lampiran-13c' },
}

export interface IndukTotals {
  d4: number
  d7: number
  d9: number
  /** Base for D.12: 9 - 10. */
  pkp: number
  d12: number
  /** D.12 comes from Lampiran 8 angka 4 (tarif c with peredaran bruto filled). */
  d12FromLampiran8: boolean
  /** Lampiran 8 peredaran bruto — gates whether the Pasal 31E tarif may be chosen. */
  pasal31eBruto: number
  /** Above Rp 50 miliar the taxpayer is not eligible for the Pasal 31E tarif at all. */
  is31eEligible: boolean
  f17a: number
  f17c: number
  f18b: number
  isLebihBayar: boolean
  /** Each lampiran-sourced line (0 when its question is answered Tidak). */
  amount: Record<LinkedKey, number>
}

/** Amount only counts when its "Ya" question is answered Ya. */
const when = (flag: boolean, amount: number | null) => (flag ? n(amount) : 0)

/**
 * Every linked line belongs to a lampiran, so the Induk only ever reads it — the figure
 * is whatever that lampiran produces, and Rp 0 until it has something to produce. There is
 * no manual fallback on purpose: a typed Induk amount with an empty lampiran behind it is a
 * number the return cannot support, and the activation matrix already requires the lampiran
 * the moment its question is answered Ya.
 */
export function computeInduk(d: SptIndukData, penghasilanNeto: number, isPembetulan: boolean, links: Partial<LampiranLinks> = {}): IndukTotals {
  const amount = {} as Record<LinkedKey, number>
  const take = (key: LinkedKey, fromLampiran: number | null | undefined): number => {
    amount[key] = d[key] ? n(fromLampiran) : 0
    return amount[key]
  }

  take('c2', links.c2)
  take('c3', links.c3)
  const d4 = penghasilanNeto
  const d7 = d4 - take('d5', links.d5) - take('d6', links.d6)
  const d9 = d7 - take('d8', links.d8)
  const pkp = d9 - take('d10', links.litbangBelum == null ? null : litbangDimanfaatkan(links.litbangBelum, d9))
  const rate = TARIF_OPTIONS.find(t => t.value === d.tarif)?.rate ?? 0.22
  const pasal31eBruto = links.pasal31eBruto ?? 0
  const d12FromLampiran8 = d.tarif === 'c' && pasal31eBruto > 0
  // PER-11: the rate applies to PKP floored to whole thousands, not to the raw figure.
  const d12 = Math.max(0, d12FromLampiran8 ? hitungLampiran8(pasal31eBruto, pkp).total : Math.round(rate * pkpKenaTarif(pkp)))
  const f17a = d12 - take('e13', links.e13) - n(d.e14Amount) - n(d.e15Amount) - take('e16', links.e16)
  const f17c = f17a - when(d.f17b, d.f17bAmount)
  const f18b = isPembetulan ? f17a - n(d.f18aAmount) : 0
  return {
    d4, d7, d9, pkp, d12, d12FromLampiran8,
    pasal31eBruto,
    is31eEligible: pasal31eBruto <= BATAS_31E_MAKS,
    f17a, f17c, f18b, isLebihBayar: f17c < 0 || f18b < 0, amount,
  }
}

/**
 * Hasil SPT — the headline of the whole return (brief §5). Three states, read off
 * angka 17c. The nominal is always positive; the state carries the direction, and
 * Nihil shows no nominal at all.
 *
 * Note: for a pembetulan the refund can also sit on 18b, which is why `isLebihBayar`
 * looks at both. The headline deliberately follows 17c alone, as the brief specifies.
 */
export type HasilState = 'kb' | 'nihil' | 'lb'

export const HASIL_LABEL: Record<HasilState, string> = {
  kb: 'Kurang bayar',
  nihil: 'Nihil',
  lb: 'Lebih bayar',
}

export interface HasilSpt {
  state: HasilState
  label: string
  amount: number
  /** The Induk line the figure comes from — "17c" normally, "18b" on a pembetulan. */
  line: string
  /** Final once nothing is missing; until then the number is still an estimate. */
  isFinal: boolean
}

/**
 * A normal return is settled on angka 17c; a pembetulan on 18b, which is what the
 * correction itself changes (PRD §9 — "lebih bayar pada angka 17 atau 18b").
 */
export function hasilSpt(totals: IndukTotals, isComplete: boolean, isPembetulan = false): HasilSpt {
  const value = isPembetulan ? totals.f18b : totals.f17c
  const state: HasilState = value > 0 ? 'kb' : value < 0 ? 'lb' : 'nihil'
  return { state, label: HASIL_LABEL[state], amount: Math.abs(value), line: isPembetulan ? '18b' : '17c', isFinal: isComplete }
}

/** The four tabs of the Induk panel (brief §6), in workflow order. */
export const INDUK_TABS = [
  { key: 'ringkasan', label: 'Ringkasan & Identitas' },
  { key: 'kondisi', label: 'Kondisi & Transaksi' },
  { key: 'perhitungan', label: 'Perhitungan PPh' },
  { key: 'berkas', label: 'Berkas Pendukung' },
] as const
export type IndukTab = typeof INDUK_TABS[number]['key']

export const isIndukTab = (v: unknown): v is IndukTab => INDUK_TABS.some(t => t.key === v)

/**
 * The gating questions of the Kondisi & Transaksi tab (brief §6.2/§7), grouped and
 * numbered the way the DJP Induk document numbers them.
 *
 * `label` is the short reading wording; `official` keeps DJP's full sentence, shown on
 * the code chip, so shortening never loses what the preparer is legally answering.
 */
export interface GatingQuestion {
  /** DJP code, rendered as the chip: "C.1a", "H.21e". */
  code: string
  /** Element id of the Ya/Tidak control; kept stable across the rewrite. */
  id: string
  /** Where the answer lives: a top-level key, or "h21.<letter>". */
  field: string
  label: string
  official: string
  hint?: string
  /**
   * The lampiran this question activates. `label` is what the button says — the
   * lampiran number alone; `detail` names the exact part, which the code chip's
   * tooltip carries so the precision is never lost.
   */
  lampiran?: { label: string, section: string, detail?: string }
  /** Answer that activates the lampiran — G.20 activates on "Tidak". */
  activeOn?: 'ya' | 'tidak'
  /** Only asked when this holds; a hidden question is forced back to "Tidak". */
  when?: (d: SptIndukData) => boolean
  /** Amount captured beside the answer, for questions with no ladder row of their own. */
  amountKey?: LinkedKey
}

/**
 * DJP numbers an item within its section, with the section letter in the heading:
 * code "C.1a" prints as "1. a.", "H.21a" as "21. a.", "G.20" as "20.".
 */
export function itemNo(code: string): string {
  const m = /^[A-Z]\.(\d+)([a-z]?)$/.exec(code)
  if (!m) return code
  return m[2] ? `${m[1]}. ${m[2]}.` : `${m[1]}.`
}

export interface GatingGroup {
  code: string
  title: string
  questions: GatingQuestion[]
}

export const GATING_GROUPS: GatingGroup[] = [
  {
    code: 'C',
    title: 'Penghasilan yang dikenakan PPh Final dan penghasilan yang tidak termasuk objek pajak',
    questions: [
      {
        code: 'C.1a',
        id: 'induk-c1a',
        field: 'c1a',
        label: 'Menerima penghasilan dari peredaran bruto tertentu (PPh Final)?',
        official: 'Apakah wajib pajak menerima atau memperoleh penghasilan dari usaha dengan peredaran bruto tertentu yang dikenakan PPh Final?',
        lampiran: { label: 'Lampiran 5', section: 'lampiran-5' },
      },
      {
        code: 'C.1b',
        id: 'induk-c1b',
        field: 'c1b',
        label: 'Penghasilan semata-mata hanya dari peredaran bruto tertentu?',
        // Only meaningful once C.1a is "Ya" — "semata-mata" qualifies that income.
        when: d => d.c1a,
        official: 'Apakah wajib pajak semata-mata hanya penghasilan dari usaha dengan peredaran bruto tertentu yang dikenakan PPh Final?',
        hint: 'Ya → SPT PPh umum Nihil; fokus L1 & L5',
      },
      {
        code: 'C.2',
        id: 'induk-c2',
        field: 'c2',
        label: 'Menerima penghasilan lain yang dikenakan PPh Final?',
        official: 'Apakah wajib pajak menerima atau memperoleh penghasilan yang dikenakan PPh Final?',
        lampiran: { label: 'Lampiran 4', section: 'lampiran-4', detail: 'Lampiran 4 bagian A' },
        amountKey: 'c2',
      },
      {
        code: 'C.3',
        id: 'induk-c3',
        field: 'c3',
        label: 'Menerima penghasilan yang bukan objek pajak?',
        official: 'Apakah wajib pajak menerima atau memperoleh penghasilan yang tidak termasuk objek pajak?',
        lampiran: { label: 'Lampiran 4', section: 'lampiran-4', detail: 'Lampiran 4 bagian B' },
        amountKey: 'c3',
      },
    ],
  },
  {
    code: 'D',
    title: 'Perhitungan PPh',
    questions: [
      {
        code: 'D.5',
        id: 'induk-d5',
        field: 'd5',
        label: 'Fasilitas penanaman modal (pengurangan penghasilan neto)?',
        official: 'Apakah wajib pajak memperoleh fasilitas perpajakan dalam rangka penanaman modal berupa pengurangan penghasilan neto?',
        lampiran: { label: 'Lampiran 13', section: 'lampiran-13a', detail: 'Lampiran 13A' },
      },
      {
        code: 'D.6',
        id: 'induk-d6',
        field: 'd6',
        label: 'Fasilitas pengurangan bruto — praktik kerja / pemagangan / vokasi?',
        official: 'Apakah wajib pajak memperoleh fasilitas pengurangan penghasilan bruto untuk kegiatan praktik kerja, pemagangan, dan/atau pembelajaran dalam rangka pembinaan dan pengembangan sumber daya manusia berbasis kompetensi tertentu?',
        lampiran: { label: 'Lampiran 13', section: 'lampiran-13b', detail: 'Lampiran 13B' },
      },
      {
        code: 'D.8',
        id: 'induk-d8',
        field: 'd8',
        label: 'Ada kompensasi kerugian fiskal?',
        official: 'Apakah terdapat kerugian fiskal yang dapat dikompensasikan?',
        lampiran: { label: 'Lampiran 7', section: 'lampiran-7' },
      },
      {
        code: 'D.10',
        id: 'induk-d10',
        field: 'd10',
        label: 'Fasilitas pengurangan bruto — penelitian & pengembangan (litbang)?',
        official: 'Apakah wajib pajak memperoleh fasilitas pengurangan penghasilan bruto untuk kegiatan penelitian dan pengembangan?',
        lampiran: { label: 'Lampiran 13', section: 'lampiran-13b', detail: 'Lampiran 13B' },
      },
    ],
  },
  {
    code: 'E',
    title: 'Pengurang PPh terutang',
    questions: [
      {
        code: 'E.13',
        id: 'induk-e13',
        field: 'e13',
        label: 'Ada kredit pajak dibayar di LN / dipotong pihak lain?',
        official: 'Apakah terdapat kredit pajak yang dibayarkan di luar negeri dan/atau dipotong/pungut oleh pihak lain?',
        lampiran: { label: 'Lampiran 3', section: 'lampiran-3' },
      },
      {
        code: 'E.16',
        id: 'induk-e16',
        field: 'e16',
        label: 'Memperoleh fasilitas pengurangan PPh terutang?',
        official: 'Apakah wajib pajak memperoleh fasilitas pengurangan PPh terutang?',
        lampiran: { label: 'Lampiran 13', section: 'lampiran-13c', detail: 'Lampiran 13C' },
      },
    ],
  },
  {
    code: 'G',
    title: 'Perhitungan angsuran tahun berjalan',
    questions: [
      {
        code: 'G.20',
        id: 'induk-g20',
        field: 'g20',
        label: 'Wajib menyampaikan Laporan Penghitungan PPh Pasal 25?',
        official: 'Apakah wajib pajak berkewajiban menyampaikan laporan penghitungan PPh Pasal 25?',
        hint: 'Jika Tidak → isi Lampiran 6',
        lampiran: { label: 'Lampiran 6', section: 'lampiran-6' },
        activeOn: 'tidak',
      },
    ],
  },
  {
    code: 'H',
    title: 'Pernyataan transaksi',
    questions: [
      {
        code: 'H.21a',
        id: 'induk-h21a',
        field: 'h21.a',
        label: 'Ada transaksi dengan pihak hubungan istimewa?',
        official: 'Apakah terdapat transaksi dengan pihak yang mempunyai hubungan istimewa?',
        lampiran: { label: 'Lampiran 10', section: 'lampiran-10a', detail: 'Lampiran 10A, 10B dan 10C' },
      },
      {
        code: 'H.21b',
        id: 'induk-h21b',
        field: 'h21.b',
        label: 'Wajib menyampaikan Dokumen Penentuan Harga Transfer?',
        official: 'Apakah wajib pajak berkewajiban menyampaikan dokumen penentuan harga transfer?',
        lampiran: { label: 'Lampiran 10', section: 'lampiran-10d', detail: 'Lampiran 10D' },
      },
      {
        code: 'H.21c',
        id: 'induk-h21c',
        field: 'h21.c',
        label: 'Ada penanaman modal pada perusahaan afiliasi?',
        official: 'Apakah terdapat penanaman modal pada perusahaan afiliasi?',
        lampiran: { label: 'Lampiran 2', section: 'lampiran-2', detail: 'Lampiran 2 Bagian B' },
      },
      {
        code: 'H.21d',
        id: 'induk-h21d',
        field: 'h21.d',
        label: 'Ada utang / piutang ke pemilik modal atau afiliasi?',
        official: 'Apakah wajib pajak memiliki utang dari pemilik modal atau perusahaan afiliasi, dan/atau piutang ke pemilik modal atau perusahaan afiliasi?',
        lampiran: { label: 'Lampiran 2', section: 'lampiran-2', detail: 'Lampiran 2 Bagian B' },
      },
      {
        code: 'H.21e',
        id: 'induk-h21e',
        field: 'h21.e',
        label: 'Membebankan biaya penyusutan / amortisasi fiskal?',
        official: 'Apakah wajib pajak membebankan biaya penyusutan dan/atau amortisasi fiskal?',
        lampiran: { label: 'Lampiran 9', section: 'lampiran-9' },
      },
      {
        code: 'H.21f',
        id: 'induk-h21f',
        field: 'h21.f',
        label: 'Membebankan biaya entertainment / natura / piutang tak tertagih?',
        official: 'Apakah wajib pajak membebankan biaya entertainment, biaya promosi, penggantian atau imbalan dalam bentuk natura dan/atau kenikmatan dan piutang yang nyata-nyata tidak dapat ditagih?',
        lampiran: { label: 'Lampiran 11', section: 'lampiran-11a', detail: 'Lampiran 11A' },
      },
      {
        code: 'H.21g',
        id: 'induk-h21g',
        field: 'h21.g',
        label: 'Fasilitas penanaman modal selain pengurangan neto?',
        official: 'Apakah wajib pajak memperoleh fasilitas perpajakan dalam rangka penanaman modal selain pengurangan penghasilan neto?',
        lampiran: { label: 'Lampiran 13', section: 'lampiran-13a', detail: 'Lampiran 13A' },
      },
      {
        code: 'H.21h',
        id: 'induk-h21h',
        field: 'h21.h',
        label: 'Punya sisa lebih untuk pembangunan sarana & prasarana?',
        official: 'Apakah wajib pajak memiliki sisa lebih yang digunakan untuk pembangunan dan pengadaan sarana dan prasarana?',
        lampiran: { label: 'Lampiran 14', section: 'lampiran-14' },
      },
      {
        code: 'H.21i',
        id: 'induk-h21i',
        field: 'h21.i',
        label: 'Menerima dividen LN & melaporkannya sebagai bukan objek pajak?',
        official: 'Apakah wajib pajak menerima atau memperoleh penghasilan dividen dari luar negeri dan melaporkannya sebagai penghasilan yang tidak termasuk objek pajak?',
        hint: 'Laporan Realisasi Investasi disampaikan terpisah',
      },
    ],
  },
]

/** Read/write an answer through a GatingQuestion.field path ("c1a" or "h21.a"). */
export function gatingAnswer(d: SptIndukData, field: string): boolean {
  const [head, key] = field.split('.')
  return head === 'h21' ? !!d.h21?.[key!] : !!(d as unknown as Record<string, unknown>)[field]
}

/**
 * Every Induk Ya/Tidak answer, keyed the way the gating questions name their field
 * ('c2', 'h21.a'). This is what a lampiran part's `when` gate reads, so a part is shown
 * by the same answer that requires its lampiran — one list, not two.
 */
export function gatingAnswers(d: SptIndukData): Record<string, boolean> {
  return Object.fromEntries(
    GATING_GROUPS.flatMap(g => g.questions).map(q => [q.field, gatingAnswer(d, q.field)]),
  )
}

export function setGatingAnswer(d: SptIndukData, field: string, value: boolean) {
  const [head, key] = field.split('.')
  if (head === 'h21') d.h21 = { ...d.h21, [key!]: value }
  else (d as unknown as Record<string, unknown>)[field] = value
}
