/**
 * Per-section checkpoints for the Lapor SPT section menu.
 *   done     — the section has data (Induk: nothing missing; Lampiran 1: filled and balanced)
 *   required — an SPT Induk answer requires this lampiran, but it is still empty
 *   optional — not required by the current answers and not filled
 * Required lampiran follow the "Jika “Ya”, isilah Lampiran …" hints of SPT Induk.
 */
import type { SectionData } from '~/data/spt1771Engine'
import { isSectionFilled } from '~/data/spt1771Engine'
import type { SptIndukData } from '~/data/spt1771Induk'
import { posisiKeuanganValue, type Lampiran1Data } from '~/data/spt1771Lampiran1'
import { lampiranDef } from '~/data/spt1771LampiranDefs'
import { SPT_SECTIONS, findSection } from '~/data/sptTahunanBadan'

export type CheckState = 'done' | 'required' | 'optional'

/** Lampiran keys required by the SPT Induk answers (Lampiran 1 is always required). */
export function requiredLampiran(d: SptIndukData): Set<string> {
  const h = d.h21 ?? {}
  const req = new Set<string>(['lampiran-1'])
  const add = (cond: unknown, ...keys: string[]) => { if (cond) keys.forEach(k => req.add(k)) }
  add(h.c || h.d, 'lampiran-2')
  add(d.e13, 'lampiran-3')
  add(d.c2 || d.c3, 'lampiran-4')
  add(d.c1a, 'lampiran-5')
  add(d.g20 === false, 'lampiran-6')
  add(d.d8, 'lampiran-7')
  add(d.tarif === 'c', 'lampiran-8')
  add(h.e, 'lampiran-9')
  add(h.a, 'lampiran-10a', 'lampiran-10b', 'lampiran-10c')
  add(h.b, 'lampiran-10d')
  add(h.f, 'lampiran-11a')
  add(d.d5 || h.g, 'lampiran-13a')
  add(d.d6 || d.d10, 'lampiran-13b')
  add(d.e16, 'lampiran-13c')
  add(h.h, 'lampiran-14')
  return req
}

export function isLampiran1Filled(l1: Lampiran1Data): boolean {
  const hasValues = Object.values(l1.labaRugi).some(r => Object.values(r ?? {}).some(v => v !== null && v !== undefined && v !== ''))
  return hasValues && posisiKeuanganValue(l1, '1700') === posisiKeuanganValue(l1, '3300')
}

export interface CheckpointInput {
  induk: SptIndukData
  indukMissing: string[]
  lampiran1: Lampiran1Data
  lampiran: Record<string, SectionData>
}

/** State of every leaf section plus each group (worst child wins, then any done). */
export function sectionStates(f: CheckpointInput): Record<string, CheckState> {
  const required = requiredLampiran(f.induk)
  const leaf = (key: string): CheckState => {
    let done: boolean
    if (key === 'induk') done = f.indukMissing.length === 0
    else if (key === 'lampiran-1') done = isLampiran1Filled(f.lampiran1)
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

/** "Lampiran X belum diisi" for each required-but-empty lampiran (for Lapor SPT completeness). */
export function missingLampiran(states: Record<string, CheckState>): string[] {
  const out: string[] = []
  for (const s of SPT_SECTIONS) {
    for (const key of s.children ? s.children.map(c => c.key) : [s.key]) {
      if (key !== 'induk' && states[key] === 'required') out.push(`${findSection(key)!.label} belum diisi`)
    }
  }
  return out
}
