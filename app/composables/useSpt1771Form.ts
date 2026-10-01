import { emptyInduk, type SptIndukData } from '~/data/spt1771Induk'
import type { SectionData } from '~/data/spt1771Engine'
import { emptyLampiran1, type Lampiran1Data } from '~/data/spt1771Lampiran1'
import { emptyLampiran, seedDerived } from '~/data/spt1771LampiranDefs'
import { newRowId } from '~/data/spt1771Engine'
import { pemegangSahamPrefill, tkuPrefill } from '~/data/session'

export interface Spt1771Form {
  induk: SptIndukData
  lampiran1: Lampiran1Data
  /** Lampiran 2–14, keyed by section key (e.g. 'lampiran-10a'). */
  lampiran: Record<string, SectionData>
  savedAt: string | null
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

/** Lampiran 2A and 5A arrive prefilled from DJP; everything else starts empty. */
function withPrefill(lampiran: Record<string, SectionData>, companyId: number, year: number): Record<string, SectionData> {
  const out = { ...lampiran }
  const owners = pemegangSahamPrefill[companyId]
  if (owners?.length) {
    out['lampiran-2'] = { ...(out['lampiran-2'] ?? {}), pemegangSaham: owners.map(o => ({ id: newRowId(), ...o, dividen: null })) }
  }
  const tku = tkuPrefill(companyId)
  if (tku.length) {
    out['lampiran-5'] = { ...(out['lampiran-5'] ?? {}), tku: tku.map(t => ({ id: newRowId(), ...t })) }
  }
  // Lampiran 5B mirrors the roster, so its rows belong to the baseline too.
  seedDerived(out, year, newRowId)
  return out
}

// Saved SPT Tahunan Badan forms, keyed by SPT id (session-scoped mock backend).
export function useSpt1771Form(sptId: string) {
  const store = useState<Record<string, Spt1771Form>>('kp-spt1771-forms', () => ({}))
  const { company } = useSession()
  // Lampiran 7's shape depends on the tax year, so the empty draft has to be built for it.
  const year = useSptTahunanBadan().get(sptId)?.year ?? 0

  if (!store.value[sptId]) {
    store.value = {
      ...store.value,
      [sptId]: {
        // Everything DJP/Coretax owns is seeded here and rendered read-only (brief §10).
        induk: emptyInduk({
          npwp: company.value.npwp,
          nama: company.value.name,
          email: company.value.email,
          telepon: company.value.phone,
          nikNpwpPenandatangan: company.value.signer.nikNpwp,
          namaPenandatangan: company.value.signer.nama,
          jabatan: company.value.signer.jabatan,
        }),
        lampiran1: emptyLampiran1(),
        lampiran: withPrefill(emptyLampiran(year), company.value.id, year),
        savedAt: null,
      },
    }
  }

  /** Working copy the page edits; `save()` commits it. */
  const draft = ref<Spt1771Form>(clone(store.value[sptId]!))

  const isDirty = computed(() => JSON.stringify({ ...draft.value, savedAt: null }) !== JSON.stringify({ ...store.value[sptId], savedAt: null }))

  function save() {
    const saved = { ...clone(draft.value), savedAt: new Date().toISOString() }
    store.value = { ...store.value, [sptId]: saved }
    draft.value.savedAt = saved.savedAt
  }

  /**
   * Re-pull a DJP-owned roster. Manual rather than silent on open, so an in-progress edit
   * is never overwritten by surprise.
   *
   * Lampiran 5A is wholly DJP's, so it is simply replaced — there is nothing of the
   * preparer's in it to preserve.
   */
  function refreshTku() {
    const tku = tkuPrefill(company.value.id)
    draft.value.lampiran = {
      ...draft.value.lampiran,
      'lampiran-5': { ...(draft.value.lampiran['lampiran-5'] ?? {}), tku: tku.map(t => ({ id: newRowId(), ...t })) },
    }
    return tku.length
  }

  /** Lampiran 2A (PRD F4 §3): identity comes from DJP, the value columns stay the preparer's. */
  function refreshPrefill(section = 'lampiran-2') {
    if (section === 'lampiran-5') return refreshTku()
    const owners = pemegangSahamPrefill[company.value.id]
    if (!owners?.length) return 0
    const l2 = draft.value.lampiran['lampiran-2'] ?? {}
    const previous = Array.isArray(l2.pemegangSaham) ? l2.pemegangSaham : []
    // Value columns the preparer owns survive the re-pull; identity comes from DJP.
    draft.value.lampiran = {
      ...draft.value.lampiran,
      'lampiran-2': {
        ...l2,
        pemegangSaham: owners.map((o) => {
          const kept = previous.find(r => String(r.npwp ?? '') === o.npwp)
          return { id: kept?.id ?? newRowId(), ...o, kodeNegara: kept?.kodeNegara ?? o.kodeNegara, modal: kept?.modal ?? o.modal, persen: kept?.persen ?? o.persen, dividen: kept?.dividen ?? null }
        }),
      },
    }
    return owners.length
  }

  function discard() {
    draft.value = clone(store.value[sptId]!)
  }

  return { draft, isDirty, save, discard, refreshPrefill }
}
