import { emptyInduk, type SptIndukData } from '~/data/spt1771Induk'
import { emptyLampiran1, type Lampiran1Data } from '~/data/spt1771Lampiran1'

export interface Spt1771Form {
  induk: SptIndukData
  lampiran1: Lampiran1Data
  savedAt: string | null
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

// Saved SPT Tahunan Badan forms, keyed by SPT id (session-scoped mock backend).
export function useSpt1771Form(sptId: string) {
  const store = useState<Record<string, Spt1771Form>>('kp-spt1771-forms', () => ({}))
  const { company } = useSession()

  if (!store.value[sptId]) {
    store.value = {
      ...store.value,
      [sptId]: {
        induk: emptyInduk({ npwp: company.value.npwp, nama: company.value.name }),
        lampiran1: emptyLampiran1(),
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

  function discard() {
    draft.value = clone(store.value[sptId]!)
  }

  return { draft, isDirty, save, discard }
}
