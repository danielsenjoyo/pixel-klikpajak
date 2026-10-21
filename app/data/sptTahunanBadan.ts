/**
 * SPT Tahunan Badan (Coretax) — list seed + domain rules.
 * Source: jurnal-tax frontend
 *   pages/efiling/Report/sptTahunan/badan/List            (list, type TAHUNAN_BADAN_RP)
 *   components/templates/efiling/Report/sptTahunan/badan/List (row mapping + actions)
 * Seed rows mirror the Figma "SPT Tahunan Badan" index frame.
 */
export type SptLaporStatus = 'READY' | 'IN_PROGRESS' | 'FAILED' | 'SUBMITTED'

export interface SptTahunanBadan {
  id: string
  /** Tax year, e.g. 2023 → masa "01-12/2023". */
  year: number
  /** Pembetulan ke (0 = original). */
  revision: number
  status: SptLaporStatus
  /** Nomor Tanda Terima Elektronik — only once DJP accepts the report. */
  ntte: string | null
  /**
   * When DJP last ran Posting for this SPT (the prefill pull). Mock data here — the
   * real value arrives with IF_TXR_039's interface-tracking status.
   */
  postedAt: string | null
}

type BadgeType = 'announcement' | 'information' | 'warning' | 'completed' | 'critical'

export const LAPOR_STATUS: Record<SptLaporStatus, { label: string, badge: BadgeType }> = {
  READY: { label: 'Siap lapor', badge: 'information' },
  IN_PROGRESS: { label: 'Diproses DJP', badge: 'warning' },
  FAILED: { label: 'Gagal posting SPT', badge: 'critical' },
  SUBMITTED: { label: 'Berhasil', badge: 'completed' },
}

/** Source: statusSpt = revision === 0 ? NORMAL : NORMAL_REVISION. */
export function statusSptLabel(spt: SptTahunanBadan) {
  return spt.revision === 0 ? 'Normal' : 'Normal-Pembetulan'
}

/** Source: taxPeriod = `01-12/${year}`. */
export function masaLabel(spt: Pick<SptTahunanBadan, 'year'>) {
  return `01-12/${spt.year}`
}

/** Source actionDropdown: BPE only once submitted; delete while not yet with DJP. */
export function canDownloadBpe(spt: SptTahunanBadan) {
  return spt.status === 'SUBMITTED'
}
export function canDelete(spt: SptTahunanBadan) {
  return spt.status === 'READY' || spt.status === 'FAILED'
}

/**
 * Coretax only accepts the annual CIT return from tax year 2025 onward, so a
 * new SPT cannot be created for an earlier year (PRD US-001 AC-05). Older
 * returns still exist in the list; the rule governs creation only.
 */
export const MIN_TAX_YEAR = 2025

export const LIST_PATH = '/main/efiling/report-v2/spt-tahunan-badan'

/**
 * Lapor SPT page (Figma "--> SPT"): SPT Induk + Lampiran 1–14.
 * Source equivalent: EfilingReportSptTahunanBadanDetail (decoupled /v2 app).
 */
export function detailPath(spt: Pick<SptTahunanBadan, 'id'>, section: SptSectionKey = 'induk') {
  return `${LIST_PATH}/${spt.id}/${section}`
}

const BULAN_SINGKAT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des']

/**
 * "12 Agt 2026, 18:53 WIB" for the section menu, matching how SPT Masa PPN prints its
 * posting time. Null while nothing has been posted yet.
 */
export function postedAtLabel(spt: Pick<SptTahunanBadan, 'postedAt'>): string | null {
  if (!spt.postedAt) return null
  const d = new Date(spt.postedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getDate()} ${BULAN_SINGKAT[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`
}

/** Submitted or with DJP → the form is read-only. */
export function isLocked(spt: SptTahunanBadan) {
  return spt.status === 'IN_PROGRESS' || spt.status === 'SUBMITTED'
}

export interface SptSection {
  key: string
  /** Short label for the section menu. */
  label: string
  /**
   * DJP's official title, shown as the heading of the section's own page.
   * Sub-parts (Lampiran 10A …) have no separate title in DJP's index, so they
   * fall back to the heading carried by their own form definition.
   */
  officialTitle?: string
  children?: SptSection[]
}

/** Short menu name of each sub-part, shown after its number. */
const PART_NAMES: Record<string, string> = {
  'lampiran-10a': 'Daftar Transaksi',
  'lampiran-10b': 'Pernyataan',
  'lampiran-10c': 'Tax Haven',
  'lampiran-10d': 'Ikhtisar Dokumen',
  'lampiran-11a': 'Rincian Biaya',
  'lampiran-11b': 'DER',
  'lampiran-11c': 'Utang Luar Negeri',
  'lampiran-12a': 'PPh 26(4)',
  'lampiran-12b': 'Penanaman Kembali',
  'lampiran-13a': 'Penanaman Modal',
  'lampiran-13b': 'Vokasi & Litbang',
  'lampiran-13c': 'Pengurang PPh',
}

/** Sub-part titles as the forms themselves head them (Figma + DJP form-spec workbook). */
const PART_TITLES: Record<string, string> = {
  'lampiran-10a': 'Transaksi Hubungan Istimewa',
  'lampiran-10b': 'Dokumentasi Penetapan Harga Wajar Transaksi',
  'lampiran-10c': 'Transaksi dengan Penduduk Tax Haven Country',
  'lampiran-10d': 'Ikhtisar Dokumen Induk dan Dokumen Lokal',
  'lampiran-11a': 'Daftar Rincian Biaya Tertentu',
  'lampiran-11b': 'Penghitungan EBITDA, DER, dan Biaya Pinjaman',
  'lampiran-11c': 'Daftar Utang Swasta Luar Negeri',
  'lampiran-12a': 'Penghitungan PPh Pasal 26 Ayat (4)',
  'lampiran-12b': 'Pemberitahuan Penanaman Kembali Penghasilan Kena Pajak BUT',
  'lampiran-13a': 'Fasilitas Penanaman Modal',
  'lampiran-13b': 'Tambahan Pengurangan Penghasilan Bruto',
  'lampiran-13c': 'Fasilitas Pengurangan PPh Terutang',
}

/** Menu label: the form code as SPT Masa PPN prints it ("Lampiran B1"), then a short name. */
const menuLabel = (key: string, name?: string) => {
  const no = sectionNumber(key) ?? key
  return name ? `${no} · ${name}` : no
}

const lampiran = (n: number, name: string, officialTitle: string, children?: SptSection[]): SptSection =>
  ({ key: `lampiran-${n}`, label: menuLabel(`lampiran-${n}`, name), officialTitle, children })

const parts = (n: number, letters: string[]): SptSection[] =>
  letters.map((p) => {
    const key = `lampiran-${n}${p.toLowerCase()}`
    return { key, label: menuLabel(key, PART_NAMES[key]), officialTitle: PART_TITLES[key] }
  })

/**
 * In-page section menu (Figma "menu"): Lampiran 10–13 expand into parts.
 * `label` is the form code plus a short name ("Lampiran 1 · Rekonsiliasi Fiskal");
 * `officialTitle` is DJP's own title for the form, shown as the heading once the section is open.
 */
export const SPT_SECTIONS: SptSection[] = [
  { key: 'induk', label: 'SPT Induk', officialTitle: 'SPT Induk' },
  lampiran(1, 'Rekonsiliasi Fiskal', 'Rekonsiliasi Laporan Keuangan'),
  lampiran(2, 'Kepemilikan', 'Daftar Kepemilikan'),
  lampiran(3, 'Kredit Pajak', 'Daftar PPh Dipotong/Dipungut Pihak Lain'),
  lampiran(4, 'Final & Non-Objek', 'Penghasilan Final & Bukan Objek Pajak'),
  lampiran(5, 'Peredaran Bruto', 'Daftar Peredaran Bruto'),
  lampiran(6, 'Angsuran PPh 25', 'Angsuran PPh Pasal 25 Tahun Berjalan'),
  lampiran(7, 'Kompensasi Rugi', 'Penghitungan Kompensasi Kerugian Fiskal'),
  lampiran(8, 'Pengurang Tarif 31E', 'Fasilitas Pengurang Tarif Pasal 31E(1)'),
  lampiran(9, 'Penyusutan Fiskal', 'Daftar Penyusutan & Amortisasi Fiskal'),
  lampiran(10, 'Hubungan Istimewa', 'Transaksi Hubungan Istimewa / TP (A–D)', parts(10, ['A', 'B', 'C', 'D'])),
  lampiran(11, 'Biaya & Utang', 'Rincian Biaya Tertentu / DER / Utang LN (A–C)', parts(11, ['A', 'B', 'C'])),
  lampiran(12, 'Khusus BUT', 'PPh 26(4) & Penanaman Kembali BUT (A–B)', parts(12, ['A', 'B'])),
  lampiran(13, 'Fasilitas & Insentif', 'Fasilitas Penanaman Modal / Insentif (A–C)', parts(13, ['A', 'B', 'C'])),
  lampiran(14, 'Sisa Lebih Nirlaba', 'Penggunaan Sisa Lebih (Nirlaba)'),
]

export type SptSectionKey = string

/** "lampiran-7" → "Lampiran 7", "lampiran-10a" → "Lampiran 10A"; Induk has no number. */
export function sectionNumber(key: string): string | undefined {
  const m = /^lampiran-(\d+)([a-d])?$/.exec(key)
  return m ? `Lampiran ${m[1]}${(m[2] ?? '').toUpperCase()}` : undefined
}

/** Page heading: the lampiran number kept alongside DJP's official title. */
export function sectionHeading(section: SptSection): string {
  const no = sectionNumber(section.key)
  const title = section.officialTitle
  if (!title) return no ?? section.label
  return no ? `${no} — ${title}` : title
}

export function findSection(key: string): SptSection | undefined {
  for (const s of SPT_SECTIONS) {
    if (s.key === key) return s
    const child = s.children?.find(c => c.key === key)
    if (child) return child
  }
  return undefined
}

export const sptTahunanBadanSeed: SptTahunanBadan[] = [
  { id: 'sptb-2023-1', year: 2023, revision: 1, status: 'READY', ntte: null, postedAt: '2026-03-02T09:14:00' },
  { id: 'sptb-2022-0', year: 2022, revision: 0, status: 'READY', ntte: null, postedAt: '2026-02-18T16:40:00' },
  { id: 'sptb-2021-4', year: 2021, revision: 4, status: 'IN_PROGRESS', ntte: null, postedAt: '2025-04-21T11:05:00' },
  { id: 'sptb-2020-12', year: 2020, revision: 12, status: 'IN_PROGRESS', ntte: null, postedAt: '2024-04-19T08:52:00' },
  { id: 'sptb-2019-5', year: 2019, revision: 5, status: 'IN_PROGRESS', ntte: null, postedAt: '2023-04-20T14:30:00' },
  { id: 'sptb-2018-0', year: 2018, revision: 0, status: 'IN_PROGRESS', ntte: null, postedAt: null },
  { id: 'sptb-2017-21', year: 2017, revision: 21, status: 'FAILED', ntte: null, postedAt: '2022-04-28T10:11:00' },
  { id: 'sptb-2016-8', year: 2016, revision: 8, status: 'FAILED', ntte: null, postedAt: null },
  { id: 'sptb-2015-0', year: 2015, revision: 0, status: 'SUBMITTED', ntte: '2839276489012946', postedAt: '2021-04-15T13:22:00' },
]
