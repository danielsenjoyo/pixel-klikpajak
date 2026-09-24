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

export const LIST_PATH = '/main/efiling/report-v2/spt-tahunan-badan'

/**
 * Lapor SPT page (Figma "--> SPT"): SPT Induk + Lampiran 1–14.
 * Source equivalent: EfilingReportSptTahunanBadanDetail (decoupled /v2 app).
 */
export function detailPath(spt: Pick<SptTahunanBadan, 'id'>, section: SptSectionKey = 'induk') {
  return `${LIST_PATH}/${spt.id}/${section}`
}

/** Submitted or with DJP → the form is read-only. */
export function isLocked(spt: SptTahunanBadan) {
  return spt.status === 'IN_PROGRESS' || spt.status === 'SUBMITTED'
}

export interface SptSection {
  key: string
  label: string
  children?: SptSection[]
}

/** In-page section menu (Figma "menu"): Lampiran 10–13 expand into parts. */
export const SPT_SECTIONS: SptSection[] = [
  { key: 'induk', label: 'SPT Induk' },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => ({ key: `lampiran-${i}`, label: `Lampiran ${i}` })),
  { key: 'lampiran-10', label: 'Lampiran 10', children: ['A', 'B', 'C', 'D'].map(p => ({ key: `lampiran-10${p.toLowerCase()}`, label: `Lampiran 10${p}` })) },
  { key: 'lampiran-11', label: 'Lampiran 11', children: ['A', 'B', 'C'].map(p => ({ key: `lampiran-11${p.toLowerCase()}`, label: `Lampiran 11${p}` })) },
  { key: 'lampiran-12', label: 'Lampiran 12', children: ['A', 'B'].map(p => ({ key: `lampiran-12${p.toLowerCase()}`, label: `Lampiran 12${p}` })) },
  { key: 'lampiran-13', label: 'Lampiran 13', children: ['A', 'B', 'C'].map(p => ({ key: `lampiran-13${p.toLowerCase()}`, label: `Lampiran 13${p}` })) },
  { key: 'lampiran-14', label: 'Lampiran 14' },
]

export type SptSectionKey = string

export function findSection(key: string): SptSection | undefined {
  for (const s of SPT_SECTIONS) {
    if (s.key === key) return s
    const child = s.children?.find(c => c.key === key)
    if (child) return child
  }
  return undefined
}

export const sptTahunanBadanSeed: SptTahunanBadan[] = [
  { id: 'sptb-2023-1', year: 2023, revision: 1, status: 'READY', ntte: null },
  { id: 'sptb-2022-0', year: 2022, revision: 0, status: 'READY', ntte: null },
  { id: 'sptb-2021-4', year: 2021, revision: 4, status: 'IN_PROGRESS', ntte: null },
  { id: 'sptb-2020-12', year: 2020, revision: 12, status: 'IN_PROGRESS', ntte: null },
  { id: 'sptb-2019-5', year: 2019, revision: 5, status: 'IN_PROGRESS', ntte: null },
  { id: 'sptb-2018-0', year: 2018, revision: 0, status: 'IN_PROGRESS', ntte: null },
  { id: 'sptb-2017-21', year: 2017, revision: 21, status: 'FAILED', ntte: null },
  { id: 'sptb-2016-8', year: 2016, revision: 8, status: 'FAILED', ntte: null },
  { id: 'sptb-2015-0', year: 2015, revision: 0, status: 'SUBMITTED', ntte: '2839276489012946' },
]
