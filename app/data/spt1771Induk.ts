/**
 * SPT Tahunan PPh Badan — SPT Induk form model + calculations.
 * Fields and numbering follow Figma "SPT / induk" (sections A–J).
 */
import { hitungLampiran8, type LampiranLinks } from '~/data/spt1771LampiranDefs'
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

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
/** Periode pembukuan: 12-month book years starting in any month. */
export const PERIODE_PEMBUKUAN = MONTHS.map((m, i) => `${m} - ${MONTHS[(i + 11) % 12]}`)

export const BANKS = ['Bank Central Asia (BCA)', 'Bank Mandiri', 'Bank Negara Indonesia (BNI)', 'Bank Rakyat Indonesia (BRI)', 'Bank CIMB Niaga', 'Bank Permata', 'Bank Syariah Indonesia (BSI)']

/** I. Lampiran lainnya — attachment slots (file names only in this prototype). */
export const LAMPIRAN_LAINNYA: { key: string, label: string, group?: string }[] = [
  { key: 'a', label: 'a. Laporan keuangan' },
  { key: 'b', label: 'b. Opini audit' },
  { key: 'c', label: 'c. Laporan keuangan konsolidasi untuk bentuk usaha tetap' },
  { key: 'd', label: 'd. Bukti pemotongan sehubungan dengan kredit pajak luar negeri' },
  { key: 'e', label: 'e. Bukti jenis penanaman kembali dan realisasi penanaman kembali untuk bentuk usaha tetap' },
  { key: 'f1', group: 'f. Surat Penghitungan Pengkreditan Pajak yang telah dibayar atau dipotong/dipungut atas dividen yang diterima dari badan usaha luar negeri (BULN) nonbursa terkendali langsung, termasuk:', label: '1. Laporan keuangan BULN nonbursa terkendali langsung' },
  { key: 'f2', label: '2. Fotokopi surat pemberitahuan tahunan pajak penghasilan BULN nonbursa terkendali langsung' },
  { key: 'f3', label: '3. Perhitungan atau rincian laba setelah pajak dalam 5 (lima) tahun terakhir BULN nonbursa terkendali langsung' },
  { key: 'f4', label: '4. Bukti pembayaran pajak penghasilan atau bukti pemotongan pajak penghasilan atas dividen yang diterima dari BULN nonbursa terkendali langsung' },
  { key: 'g', label: 'g. Bukti pembayaran zakat' },
  { key: 'h1', group: 'h. laporan wajib pajak dalam rangka pemenuhan persyaratan penurunan tarif pajak penghasilan bagi wajib pajak Badan Dalam Negeri yang berbentuk Perseroan Terbuka', label: '1. Laporan bulanan' },
  { key: 'h2', label: '2. Laporan kepemilikan saham yang memiliki hubungan istimewa' },
  { key: 'i', label: 'i. tanda terima elektronik penyampaian laporan per negara (Country-by-Country-Report)' },
  { key: 'j', label: 'j. Dokumen lainnya' },
]

/** H. Pernyataan transaksi — 21a–21i with the lampiran each "Ya" requires. */
export const PERNYATAAN_TRANSAKSI: { key: string, label: string, hint: string }[] = [
  { key: 'a', label: '21. a. Apakah terdapat transaksi dengan pihak yang mempunyai hubungan istimewa?', hint: 'Jika “Ya”, isilah Lampiran 10A, 10B, dan 10C' },
  { key: 'b', label: '21. b. Apakah wajib pajak berkewajiban menyampaikan dokumen penentuan harga transfer?', hint: 'Jika “Ya”, isilah Lampiran 10D' },
  { key: 'c', label: '21. c. Apakah terdapat penanaman modal pada perusahaan afiliasi?', hint: 'Jika “Ya”, isilah Lampiran 2 Bagian B' },
  { key: 'd', label: '21. d. Apakah wajib pajak memiliki utang dari pemilik modal atau perusahaan afiliasi, dan/atau piutang ke pemilik modal atau perusahaan afiliasi?', hint: 'Jika “Ya”, isilah Lampiran 2 Bagian B' },
  { key: 'e', label: '21. e. Apakah wajib pajak membebankan biaya penyusutan dan/atau amortisasi fiskal?', hint: 'Jika “Ya”, isilah Lampiran 9' },
  { key: 'f', label: '21. f. Apakah wajib pajak membebankan biaya entertainment, biaya promosi, penggantian atau imbalan dalam bentuk natura dan/atau kenikmatan dan piutang yang nyata-nyata tidak dapat ditagih?', hint: 'Jika “Ya”, isilah Lampiran 11A' },
  { key: 'g', label: '21. g. Apakah wajib pajak memperoleh fasilitas perpajakan dalam rangka penanaman modal selain pengurangan penghasilan neto?', hint: 'Jika “Ya”, isilah Lampiran 13A' },
  { key: 'h', label: '21. h. Apakah wajib pajak memiliki sisa lebih yang digunakan untuk pembangunan dan pengadaan sarana dan prasarana?', hint: 'Jika “Ya”, isilah Lampiran 14' },
  { key: 'i', label: '21. i. Apakah wajib pajak menerima atau memperoleh penghasilan dividen dari luar negeri dan melaporkannya sebagai penghasilan yang tidak termasuk objek pajak?', hint: 'Jika “Ya”, sampaikan Laporan Realisasi Investasi secara terpisah sesuai dengan ketentuan perundang-undangan yang berlaku' },
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
  c2Amount: number | null
  c3: YesNo
  c3Amount: number | null
  // D. Perhitungan PPh
  d5: YesNo
  d5Amount: number | null
  d6: YesNo
  d6Amount: number | null
  d8: YesNo
  d8Amount: number | null
  d10: YesNo
  d10Amount: number | null
  tarif: Tarif
  // E. Pengurang PPh terutang
  e13: YesNo
  e13Amount: number | null
  e14Amount: number | null
  e15Amount: number | null
  e16: YesNo
  e16Amount: number | null
  // F. PPh kurang/lebih bayar
  f17b: YesNo
  f17bAmount: number | null
  f18aAmount: number | null
  f19a: 'pemeriksaan' | 'pendahuluan' | null
  bank: string | null
  namaPemilikRekening: string
  nomorRekening: string
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
  tanggal: string | null
  tandaTangan: string | null
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
    c2Amount: null,
    c3: false,
    c3Amount: null,
    d5: false,
    d5Amount: null,
    d6: false,
    d6Amount: null,
    d8: false,
    d8Amount: null,
    d10: false,
    d10Amount: null,
    tarif: 'a',
    e13: false,
    e13Amount: null,
    e14Amount: null,
    e15Amount: null,
    e16: false,
    e16Amount: null,
    f17b: false,
    f17bAmount: null,
    f18aAmount: null,
    f19a: null,
    bank: null,
    namaPemilikRekening: '',
    nomorRekening: '',
    g20: false,
    h21: Object.fromEntries(PERNYATAAN_TRANSAKSI.map(q => [q.key, false])),
    lampiranLainnya: Object.fromEntries(LAMPIRAN_LAINNYA.map(l => [l.key, null])),
    penandatangan: 'wp',
    nikNpwpPenandatangan: '',
    namaPenandatangan: '',
    jabatan: '',
    tanggal: null,
    tandaTangan: null,
    ...prefill,
  }
}

export interface IndukTotals {
  d4: number
  d7: number
  /** D.8 kompensasi kerugian fiskal (0 when answered Tidak). */
  d8: number
  /** D.8 comes from Lampiran 7 jumlah kolom 8. */
  d8FromLampiran7: boolean
  d9: number
  /** Base for D.12: 9 - 10. */
  pkp: number
  d12: number
  /** D.12 comes from Lampiran 8 angka 4 (tarif c with peredaran bruto filled). */
  d12FromLampiran8: boolean
  /** E.13 kredit pajak luar negeri / dipotong pihak lain (0 when answered Tidak). */
  e13: number
  /** E.13 comes from Lampiran 3 (3A kolom 10 + 3B kolom 6). */
  e13FromLampiran3: boolean
  f17a: number
  f17c: number
  f18b: number
  isLebihBayar: boolean
}

/** Amount only counts when its "Ya" question is answered Ya. */
const when = (flag: boolean, amount: number | null) => (flag ? n(amount) : 0)

/** Amounts a filled lampiran provides replace the matching manual Induk entry. */
export function computeInduk(d: SptIndukData, penghasilanNeto: number, isPembetulan: boolean, links: Partial<LampiranLinks> = {}): IndukTotals {
  const d4 = penghasilanNeto
  const d7 = d4 - when(d.d5, d.d5Amount) - when(d.d6, d.d6Amount)
  const d8FromLampiran7 = d.d8 && links.kompensasiLampiran7 != null
  const d8 = when(d.d8, d8FromLampiran7 ? links.kompensasiLampiran7! : d.d8Amount)
  const d9 = d7 - d8
  const pkp = d9 - when(d.d10, d.d10Amount)
  const rate = TARIF_OPTIONS.find(t => t.value === d.tarif)?.rate ?? 0.22
  const pasal31eBruto = links.pasal31eBruto ?? 0
  const d12FromLampiran8 = d.tarif === 'c' && pasal31eBruto > 0
  const d12 = Math.max(0, d12FromLampiran8 ? hitungLampiran8(pasal31eBruto, pkp).total : Math.round(rate * pkp))
  const e13FromLampiran3 = d.e13 && links.kreditLampiran3 != null
  const e13 = when(d.e13, e13FromLampiran3 ? links.kreditLampiran3! : d.e13Amount)
  const f17a = d12 - e13 - n(d.e14Amount) - n(d.e15Amount) - when(d.e16, d.e16Amount)
  const f17c = f17a - when(d.f17b, d.f17bAmount)
  const f18b = isPembetulan ? f17a - n(d.f18aAmount) : 0
  return { d4, d7, d8, d8FromLampiran7, d9, pkp, d12, d12FromLampiran8, e13, e13FromLampiran3, f17a, f17c, f18b, isLebihBayar: f17c < 0 || f18b < 0 }
}

/** Fields that must be filled before the SPT can be reported. */
export function missingFields(d: SptIndukData, totals: IndukTotals): string[] {
  const missing: string[] = []
  if (!d.npwp.trim()) missing.push('A.1 NPWP')
  if (!d.nama.trim()) missing.push('A.2 Nama')
  if (d.diaudit && !d.opiniAuditor) missing.push('B. Opini auditor')
  if (d.diaudit && !d.namaKap.trim()) missing.push('B. Nama kantor akuntan publik')
  if (totals.isLebihBayar && !d.f19a) missing.push('F.19a Permohonan lebih bayar')
  if (totals.isLebihBayar && (!d.bank || !d.nomorRekening.trim())) missing.push('F.19b Informasi rekening')
  if (!d.nikNpwpPenandatangan.trim()) missing.push('J. NIK/NPWP penandatangan')
  if (!d.namaPenandatangan.trim()) missing.push('J. Nama lengkap penandatangan')
  if (!d.jabatan.trim()) missing.push('J. Jabatan')
  if (!d.tanggal) missing.push('J. Tanggal')
  if (!d.tandaTangan) missing.push('J. Tanda tangan')
  return missing
}
