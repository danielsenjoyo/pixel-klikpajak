import {
  MODULES,
  type ModuleId,
  type PackageId,
  type QuotaState,
  SUBSCRIPTIONS,
  type Subscription,
  applyPackagePreset,
  daysToRenewal,
  exhaustionRoute,
  isExpired,
  isLegacy,
  isMigrationDue,
  isNearingRenewal,
  migratedToFreemium,
  quotaState,
  withState,
  worstState,
} from '~/data/subscription'
import { dmyFromToday } from '~/utils/date'

export type LoadState = 'ok' | 'loading' | 'error'

/**
 * Package and quota state for the active company.
 *
 * Migration off the legacy Basic/Small tiers is lazy and login-triggered rather than a
 * batch job (BR-015), so it runs once when this store is first created — the prototype's
 * closest equivalent to a login — and records which CIDs it touched so the one-time
 * confirmation notice (Story 2 AC-002) can be shown.
 *
 * Dismissals live in memory only, never localStorage: AC-011 requires a prompt to be
 * dismissible but never permanently suppressed, so it must come back on reload.
 */
interface SubscriptionState {
  subs: Record<number, Subscription>
  migratedIds: number[]
  dismissed: string[]
  /** How the Billing fetch is going. Mocked today; real once the API lands. */
  loadState: LoadState
}

function createState(): SubscriptionState {
  const subs: Record<number, Subscription> = structuredClone(SUBSCRIPTIONS)
  const migratedIds: number[] = []
  for (const key of Object.keys(subs)) {
    const id = Number(key)
    const sub = subs[id]!
    if (isMigrationDue(sub)) {
      subs[id] = migratedToFreemium(sub)
      migratedIds.push(id)
    }
  }
  return { subs, migratedIds, dismissed: [], loadState: 'ok' }
}

export function useSubscription() {
  const { companyId } = useSession()
  const state = useState<SubscriptionState>('kp-subscription', createState)

  const subscription = computed(() => state.value.subs[companyId.value] ?? state.value.subs[188311]!)

  /**
   * Neither state may render a quota figure. A failed or half-loaded view that shows 0 is
   * indistinguishable from genuinely being out of quota, and the customer's response to
   * the latter is to spend money.
   */
  const isLoading = computed(() => state.value.loadState === 'loading')
  const hasError = computed(() => state.value.loadState === 'error')

  /** Re-fetch once Billing is wired in; with mock data it just clears the flag. */
  function retry() {
    state.value.loadState = 'ok'
  }

  /** True only for the session in which the CID was migrated at "login". */
  const justMigrated = computed(() => state.value.migratedIds.includes(companyId.value))

  /** Still on Basic/Small because cutover has not arrived yet — the pre-cutover notice (AC-006). */
  const awaitingMigration = computed(() => isLegacy(subscription.value))

  const modules = computed(() =>
    MODULES.map(({ id, label }) => ({
      id,
      label,
      quota: subscription.value.quota[id],
      state: quotaState(subscription.value.quota[id]),
    })),
  )

  const overallState = computed(() => worstState(subscription.value))

  /**
   * Modules split by state rather than collapsed to the worst one. Story 1 AC-008 and
   * Story 3 AC-001/AC-002 each promise a warning "for that module", so a module at 10%
   * must stay visible even when a different module has already hit zero.
   */
  const exhaustedModules = computed(() => modules.value.filter(m => m.state === 'exhausted'))
  const lowModules = computed(() => modules.value.filter(m => m.state === 'low'))

  const renewalDays = computed(() => daysToRenewal(subscription.value))
  const showRenewalNotice = computed(() => isNearingRenewal(subscription.value))
  /** Past the end date — the renewal notice and the AM routing both still apply. */
  const hasExpired = computed(() => isExpired(subscription.value))

  /** Which exhaustion route the active package implies (BR-021 / BR-022 / BR-023). */
  const route = computed(() => exhaustionRoute(subscription.value))

  function isDismissed(key: string): boolean {
    return state.value.dismissed.includes(key)
  }

  function dismiss(key: string) {
    if (!state.value.dismissed.includes(key)) state.value.dismissed.push(key)
  }

  // ── Dev-only scenario controls ─────────────────────────────────────────────
  // Driven by QuotaDevPanel, which renders only under `import.meta.dev`. These never
  // run in a production build, so they stay out of the read-only API above.

  function patch(fn: (sub: Subscription) => Subscription) {
    const current = state.value.subs[companyId.value]
    if (!current) return
    state.value.subs[companyId.value] = fn(current)
  }

  function setPackageId(packageId: PackageId) {
    patch(sub => applyPackagePreset(sub, packageId, renewalDays.value ?? 18))
  }

  function setModuleState(moduleId: ModuleId, next: QuotaState) {
    patch(sub => ({ ...sub, quota: { ...sub.quota, [moduleId]: withState(sub.quota[moduleId], next) } }))
  }

  /** No-op on Freemium and the legacy tiers, which have no end date to move. */
  function setRenewalDays(days: number) {
    patch(sub => (sub.endDate === null ? sub : { ...sub, endDate: dmyFromToday(days) }))
  }

  /** Dev-only: drive the load state, so loading and error are reviewable rather than theory. */
  function setLoadState(next: LoadState) {
    state.value.loadState = next
  }

  /** Back to the seeded scenario, including re-running migration and clearing dismissals. */
  function resetScenario() {
    const id = companyId.value
    const seed = SUBSCRIPTIONS[id]
    if (!seed) return
    const fresh = structuredClone(seed)
    const due = isMigrationDue(fresh)
    state.value.subs[id] = due ? migratedToFreemium(fresh) : fresh
    state.value.migratedIds = state.value.migratedIds.filter(m => m !== id)
    if (due) state.value.migratedIds.push(id)
    state.value.dismissed = state.value.dismissed.filter(k => !k.endsWith(`:${id}`))
    state.value.loadState = 'ok'
  }

  return {
    subscription,
    modules,
    overallState,
    exhaustedModules,
    lowModules,
    renewalDays,
    showRenewalNotice,
    hasExpired,
    route,
    justMigrated,
    awaitingMigration,
    isDismissed,
    dismiss,
    isLoading,
    hasError,
    retry,
    setLoadState,
    setPackageId,
    setModuleState,
    setRenewalDays,
    resetScenario,
  }
}
