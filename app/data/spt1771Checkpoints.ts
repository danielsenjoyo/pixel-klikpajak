/**
 * Per-section checkpoints for the Lapor SPT section menu.
 *   done     — the section has data (correctness is `spt1771Validation.ts`, not here)
 *   required — an SPT Induk answer requires this lampiran, but it is still empty
 *   optional — not required by the current answers and not filled
 * Required lampiran follow the activation matrix (PRD §5.7): mostly the
 * "Jika “Ya”, isilah Lampiran …" hints of SPT Induk, plus the four that are
 * always required and the two driven from outside the Induk (11C, 12A/B).
 */
import type { SectionData } from '~/data/spt1771Engine'
import { blockValues, isSectionFilled, tableRows } from '~/data/spt1771Engine'
import type { SptIndukData } from '~/data/spt1771Induk'
import type { Lampiran1Data } from '~/data/spt1771Lampiran1'
import { lampiranDef } from '~/data/spt1771LampiranDefs'
import { SPT_SECTIONS } from '~/data/sptTahunanBadan'

export type CheckState = 'done' | 'required' | 'optional'

/** What the activation matrix reads besides the Induk answers. */
export interface ActivationInput {
  induk: SptIndukData
  lampiran: Record<string, SectionData>
  /** Entity is a bentuk usaha tetap — opens Lampiran 12A/12B. */
  isBut: boolean
}

/**
 * Lampiran keys the return must carry, per the activation matrix (PRD §5.7).
 * Always required regardless of any answer: Lampiran 1 (financial statements),
 * Lampiran 2 part A (ownership), Lampiran 6 (G.20 requires it either way) and
 * Lampiran 11B (DER).
 */
export function requiredLampiran({ induk: d, lampiran, isBut }: ActivationInput): Set<string> {
  const h = d.h21 ?? {}
  const req = new Set<string>(['lampiran-1', 'lampiran-2', 'lampiran-6', 'lampiran-11b'])
  const add = (cond: unknown, ...keys: string[]) => { if (cond) keys.forEach(k => req.add(k)) }
  add(d.e13, 'lampiran-3')
  add(d.c2 || d.c3, 'lampiran-4')
  add(d.c1a, 'lampiran-5')
  add(d.d8, 'lampiran-7')
  add(d.tarif === 'c', 'lampiran-8')
  add(h.e, 'lampiran-9')
  add(h.a, 'lampiran-10a', 'lampiran-10b', 'lampiran-10c')
  add(h.b, 'lampiran-10d')
  add(h.f, 'lampiran-11a')
  // Lampiran 11C hangs off Lampiran 11B's own question, not the Induk.
  add(blockValues(lampiran['lampiran-11b'] ?? {}, 'utangLn').swastaLn, 'lampiran-11c')
  add(isBut, 'lampiran-12a', 'lampiran-12b')
  add(d.d5 || h.g, 'lampiran-13a')
  add(d.d6 || d.d10, 'lampiran-13b')
  add(d.e16, 'lampiran-13c')
  add(h.h, 'lampiran-14')
  return req
}

const hasValue = (v: unknown) => v !== null && v !== undefined && v !== ''

/**
 * Both halves must have data: an untouched Posisi Keuangan balances trivially
 * (0 === 0), which would let a Laba Rugi on its own mark the section done.
 *
 * "Has data" only — whether the two sides *balance* is a correctness rule and lives in
 * `spt1771Validation.ts`, so the menu can say "tidak seimbang" instead of "belum diisi".
 */
export function isLampiran1Filled(l1: Lampiran1Data): boolean {
  const hasLabaRugi = Object.values(l1.labaRugi).some(r => Object.values(r ?? {}).some(hasValue))
  const hasPosisiKeuangan = Object.values(l1.posisiKeuangan).some(hasValue)
  return hasLabaRugi && hasPosisiKeuangan
}

/**
 * "Has data" only: Part A carries at least one owner. The 100% modal-disetor rule and
 * the Part B requirement (PRD F4 §7.1) are correctness rules — see `spt1771Validation.ts`.
 */
export function isLampiran2Filled(section: SectionData | undefined): boolean {
  return tableRows(section ?? {}, 'pemegangSaham').length > 0
}

export interface CheckpointInput extends ActivationInput {
  lampiran1: Lampiran1Data
}

/**
 * Downgrade any section that has data but also has a correctness error, so the menu
 * never shows a green tick next to a section that blocks Lapor SPT.
 */
export function applyIssues(states: Record<string, CheckState>, issues: { section: string, severity: string }[]): Record<string, CheckState> {
  const broken = new Set(issues.filter(i => i.severity === 'error').map(i => i.section))
  if (!broken.size) return states
  const out = { ...states }
  for (const s of SPT_SECTIONS) {
    const keys = s.children ? s.children.map(c => c.key) : [s.key]
    for (const key of keys) if (out[key] === 'done' && broken.has(key)) out[key] = 'required'
    if (s.children) {
      const kids = s.children.map(c => out[c.key])
      out[s.key] = kids.includes('required') ? 'required' : kids.includes('done') ? 'done' : 'optional'
    }
  }
  return out
}

/** State of every leaf section plus each group (worst child wins, then any done). */
export function sectionStates(f: CheckpointInput): Record<string, CheckState> {
  const required = requiredLampiran(f)
  const leaf = (key: string): CheckState => {
    let done: boolean
    // The Induk always carries data (it is seeded); only correctness can unset its tick.
    if (key === 'induk') done = true
    else if (key === 'lampiran-1') done = isLampiran1Filled(f.lampiran1)
    else if (key === 'lampiran-2') done = isLampiran2Filled(f.lampiran['lampiran-2'])
    else {
      const def = lampiranDef(key, 0)
      done = !!def && isSectionFilled(def, f.lampiran[key])
    }
    if (done) return 'done'
    return key === 'induk' || required.has(key) ? 'required' : 'optional'
  }

  const out: Record<string, CheckState> = {}
  for (const s of SPT_SECTIONS) {
    if (!s.children) {
      out[s.key] = leaf(s.key)
      continue
    }
    const kids = s.children.map(c => (out[c.key] = leaf(c.key)))
    out[s.key] = kids.includes('required') ? 'required' : kids.includes('done') ? 'done' : 'optional'
  }
  return out
}

/** Section keys that are required but still empty — fed to `validateSpt`. */
export function missingSections(states: Record<string, CheckState>): string[] {
  const out: string[] = []
  for (const s of SPT_SECTIONS) {
    for (const key of s.children ? s.children.map(c => c.key) : [s.key]) {
      if (key !== 'induk' && states[key] === 'required') out.push(key)
    }
  }
  return out
}
