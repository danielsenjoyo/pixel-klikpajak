import { sptTahunanBadanSeed, type SptTahunanBadan } from '~/data/sptTahunanBadan'

// Session-scoped store for the SPT Tahunan Badan list (mock backend).
export function useSptTahunanBadan() {
  const list = useState<SptTahunanBadan[]>('kp-spt-tahunan-badan', () => sptTahunanBadanSeed.map(s => ({ ...s })))

  /** Newest tax year first, then latest pembetulan. */
  const sorted = computed(() => [...list.value].sort((a, b) => b.year - a.year || b.revision - a.revision))

  /** An unfinished SPT for the year blocks creating another one. */
  function hasOpenSpt(year: number) {
    return list.value.some(s => s.year === year && s.status !== 'SUBMITTED')
  }

  /** New SPT for a year: pembetulan = one past the latest existing revision. */
  function create(year: number): SptTahunanBadan {
    const revisions = list.value.filter(s => s.year === year).map(s => s.revision)
    const revision = revisions.length ? Math.max(...revisions) + 1 : 0
    const spt: SptTahunanBadan = { id: `sptb-${year}-${revision}-${Date.now()}`, year, revision, status: 'READY', ntte: null }
    list.value = [spt, ...list.value]
    return spt
  }

  function remove(id: string) {
    list.value = list.value.filter(s => s.id !== id)
  }

  return { list, sorted, hasOpenSpt, create, remove }
}
