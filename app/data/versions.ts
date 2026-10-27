/**
 * Prototype versions — a release train the viewer can switch between, so a stakeholder can
 * compare what ships now with what is proposed next. Features check `atLeast()` against the
 * version that introduced them; everything else is shared by every version.
 */
export interface PrototypeVersion {
  id: string
  label: string
  description: string
}

export const VERSIONS: PrototypeVersion[] = [
  { id: '26Q4', label: '26Q4', description: 'Rilis berjalan — Lampiran 1 diisi manual atau impor template DJP' },
  { id: '27Q1', label: '27Q1', description: 'Rekonsiliasi fiskal: tarik data dari Jurnal, pemetaan CoA → akun DJP, koreksi per akun' },
]

/** What opens when nothing was chosen. */
export const DEFAULT_VERSION = '26Q4'

export const isVersion = (v: unknown): v is string => VERSIONS.some(x => x.id === v)

/** "27Q1" ≥ "26Q4": year then quarter — the ids sort as strings. */
export const atLeast = (current: string, target: string) => current >= target
