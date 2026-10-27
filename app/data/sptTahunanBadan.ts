/**
 * SPT Tahunan Badan (Coretax) — list seed + domain rules.
 * Source: jurnal-tax frontend
 *   pages/efiling/Report/sptTahunan/badan/List            (list, type TAHUNAN_BADAN_RP)
 *   components/templates/efiling/Report/sptTahunan/badan/List (row mapping + actions)
 * Seed rows: one Tahun Pajak 2025 history (see sptTahunanBadanSeed).
 */
export type SptLaporStatus = 'READY' | 'IN_PROGRESS' | 'FAILED' | 'SUBMITTED'

export interface SptTahunanBadan {
  id: string
  /** Tax year — the year the book year starts in, e.g. July 2025 – June 2026 → 2025. */
  year: number
  /** First month of the book year (1–12); it runs 12 months, so it ends the month before. */
  startMonth: number
  /** Pembetulan ke (0 = original). */
  revision: number
  status: SptLaporStatus
  /** Nomor Tanda Terima Elektronik — only once DJP accepts the report. */
  ntte: string | null
  /** When the SPT was created (ISO date) — the list's "Tanggal pembuatan". */
  createdAt: string
  /** DJP's message for a failed report — the list's "Keterangan". Null otherwise. */
  note: string | null
  /**
   * When DJP last ran Posting for this SPT (the prefill pull). Mock data here — the
   * real value arrives with IF_TXR_039's interface-tracking status.
   */
  postedAt: string | null
  /**
   * Induk angka 18a — what Coretax has recorded in Modul TAM for the revisions before
   * this one: PPh Pasal 29 actually paid (kredit pembayaran) less preliminary refunds
   * through SKPPKP. Under Delta 2.0 (DJP, Oktober 2025) this replaces the KB/LB printed
   * on the SPT being corrected, so a lebih bayar still waiting to be disbursed records
   * as 0 and the pembetulan no longer bills the WP before the refund lands. Null on a
   * normal return, which has no angka 18. Mock data — the real figure comes from TAM.
   */
  tamPembetulanSebelumnya: number | null
}

type BadgeType = 'announcement' | 'information' | 'warning' | 'completed' | 'critical'

/**
 * Labels and colours as SPT Masa PPN prints them: `label` in the list (source: KpPixelListContainer
 * renderBadgeReportStatusSpt), `title` in the badge next to the Lapor SPT page title.
 */
export const LAPOR_STATUS: Record<SptLaporStatus, { label: string, title: string, badge: BadgeType }> = {
  READY: { label: 'Belum dilapor', title: 'Belum dilaporkan', badge: 'announcement' },
  IN_PROGRESS: { label: 'Diproses ke DJP', title: 'Sedang dilaporkan', badge: 'warning' },
  FAILED: { label: 'Gagal', title: 'Gagal lapor', badge: 'critical' },
  SUBMITTED: { label: 'Berhasil', title: 'Berhasil lapor', badge: 'completed' },
}

/**
 * Source: statusSpt = revision === 0 ? NORMAL : NORMAL_REVISION. Printed as SPT Masa PPN
 * prints it — "Normal" / "Pembetulan"; the pembetulan number is not known to the list.
 */
export function statusSptLabel(spt: Pick<SptTahunanBadan, 'revision'>) {
  return spt.revision === 0 ? 'Normal' : 'Pembetulan'
}

/** "2026-07-29" → "29/07/2026", as the SPT Masa lists print Tanggal pembuatan. */
export function createdAtLabel(spt: Pick<SptTahunanBadan, 'createdAt'>) {
  const [y, m, d] = spt.createdAt.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

/** Last month (1–12) and its year for a 12-month book year starting `startMonth` of `year`. */
export function bookYearEnd(year: number, startMonth: number) {
  const end = startMonth + 11
  return { month: ((end - 1) % 12) + 1, year: end > 12 ? year + 1 : year }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Source: taxPeriod = `01-12/${year}`; a non-calendar book year reads e.g. `07-06/2025`. */
export function masaLabel(spt: Pick<SptTahunanBadan, 'year' | 'startMonth'>) {
  return `${pad2(spt.startMonth)}-${pad2(bookYearEnd(spt.year, spt.startMonth).month)}/${spt.year}`
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

/**
 * Coretax takes the annual return from Tahun Pajak 2025 (MIN_TAX_YEAR), so the seed is one
 * 2025 history: the normal return and pembetulan 1 accepted, pembetulan 2 rejected by DJP.
 * Only one unreported SPT may exist per year (`hasOpenSpt`), so "Lapor SPT" for 2025 is
 * blocked until the failed pembetulan is deleted — then it creates pembetulan 3.
 * `tamPembetulanSebelumnya`: the normal return's kurang bayar was paid, so TAM carries it
 * into both pembetulan (Delta 2.0); the normal return has no angka 18.
 */
export const sptTahunanBadanSeed: SptTahunanBadan[] = [
  { id: 'sptb-2025-2', year: 2025, startMonth: 1, revision: 2, status: 'FAILED', ntte: null, createdAt: '2026-09-08', note: 'Tidak dapat menyampaikan SPT Tahunan Badan saat SPT Masa PPN Desember belum disampaikan.', postedAt: '2026-09-08T10:11:00', tamPembetulanSebelumnya: 1_000_000 },
  { id: 'sptb-2025-1', year: 2025, startMonth: 1, revision: 1, status: 'SUBMITTED', ntte: '2839276489013107', createdAt: '2026-06-22', note: null, postedAt: '2026-06-22T14:30:00', tamPembetulanSebelumnya: 1_000_000 },
  { id: 'sptb-2025-0', year: 2025, startMonth: 1, revision: 0, status: 'SUBMITTED', ntte: '2839276489012946', createdAt: '2026-04-14', note: null, postedAt: '2026-04-14T09:14:00', tamPembetulanSebelumnya: null },
]
