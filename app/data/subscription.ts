/**
 * Klikpajak Repackaging — package, quota and entitlement model.
 * PRD: Confluence PD/51248267285 "[PRD] Klikpajak Repackaging" (26Q3).
 * Source copy: jurnal-tax pages/setting/Account/UploadQuota.
 *
 * Four paid/freemium tiers collapse into Freemium / Quota / Quota - Cumulative plus
 * per-module top-ups. Everything the UI branches on is derived here as a pure function
 * of the seed, so the rules can be read against the PRD without opening a component.
 */
import { daysUntil, dmyFromToday, formatDmy, formatDmyLong, parseDmyDate } from '~/utils/date'

export type PackageId =
  | 'freemium'
  | 'quota'
  | 'quota-cumulative'
  /** Pre-repackaging freemium tiers; migrate to Freemium at login after cutover (BR-015). */
  | 'legacy-basic'
  | 'legacy-small'

export type ModuleId = 'efaktur' | 'ebupot-unifikasi' | 'ebupot-2126'

/** Quota is never pooled across modules — BR-006, and the §4 non-goal rejecting unification. */
export const MODULES: { id: ModuleId, label: string }[] = [
  { id: 'efaktur', label: 'e-Faktur' },
  { id: 'ebupot-unifikasi', label: 'e-Bupot Unifikasi' },
  { id: 'ebupot-2126', label: 'e-Bupot 21/26' },
]

/** BR-012: warn at 20% remaining, across Freemium, Quota and Cumulative alike. */
export const LOW_QUOTA_RATIO = 0.2
/** BR-022 / VR-02, resolved in OQ-01: "nearing renewal" is 21 days before the end date. */
export const RENEWAL_WARNING_DAYS = 21
/** BR-003: Standard quota resets on the 3rd of each calendar month. */
export const QUOTA_RESET_DAY = 3
/**
 * Last day a Standard top-up stays valid. PRD §5 writes this as "ends at 2 every month";
 * confirmed with the PM to mean the 2nd — the day before the monthly reset — so a top-up
 * bought mid-month never survives into the next cycle. This is exactly the waste that
 * Cumulative's end-date-tied top-up (BR-023) is sold against.
 */
export const TOPUP_LAST_DAY = QUOTA_RESET_DAY - 1
/** BR-002: Freemium grants 20 per module, lifetime. */
export const FREEMIUM_QUOTA = 20
/** BR-015: fixed cutover for the login-triggered migration off Basic/Small. */
export const MIGRATION_CUTOVER = '03/10/2026'
/** BR-004: Cumulative requires a minimum 6-month commitment. */
export const CUMULATIVE_MIN_MONTHS = 6

/**
 * The self-service purchase surface is Marketing-owned (PRD §12 item 8), so every CTA
 * leaves the app here. One constant, so there is a single place to repoint it.
 */
export const PURCHASE_URL = 'https://www.klikpajak.id/harga'

/**
 * Where BR-022 sends a Standard customer whose quota ran out near renewal. Routing this
 * to the Account Manager rather than the subscription-management team is still open in
 * the PRD (Story 3 dependencies), so this is a placeholder for the real channel.
 */
export const SUPPORT_URL = 'https://bantuan.klikpajak.id'

export interface ModuleQuota {
  /** Monthly allotment for Standard; the whole pooled term allotment for Cumulative (VR-01). */
  total: number
  used: number
}

export interface PurchaseRow {
  id: string
  packageName: string
  startDate: string | null
  endDate: string | null
  quota: Partial<Record<ModuleId, number>>
  isActive: boolean
  /** Null for Freemium, which is never purchased. */
  amount: number | null
}

export interface Subscription {
  packageId: PackageId
  packageName: string
  startDate: string | null
  /** Null means lifetime — Freemium never expires (BR-002). */
  endDate: string | null
  /** Cumulative only: the committed term, so the pool reads as monthly x term (AC-001). */
  termMonths: number | null
  quota: Record<ModuleId, ModuleQuota>
  history: PurchaseRow[]
}

export type QuotaState = 'healthy' | 'low' | 'exhausted'

/** Where a blocked document creation sends the user. */
export type ExhaustionRoute = 'upgrade' | 'topup' | 'contact-am' | 'topup-cumulative'

// ── Rules ────────────────────────────────────────────────────────────────────

export function remaining(q: ModuleQuota): number {
  return Math.max(0, q.total - q.used)
}

export function isExhausted(q: ModuleQuota): boolean {
  return remaining(q) <= 0
}

/**
 * BR-012 / VR-01: the threshold is a share of the CID's own total for that package type,
 * never a fixed number — 4 of 20 on Freemium and 1,200 of 6,000 on a Cumulative pool are
 * both "20% left".
 */
export function isLowQuota(q: ModuleQuota): boolean {
  return q.total > 0 && remaining(q) <= q.total * LOW_QUOTA_RATIO
}

export function quotaState(q: ModuleQuota): QuotaState {
  if (isExhausted(q)) return 'exhausted'
  return isLowQuota(q) ? 'low' : 'healthy'
}

/**
 * Share of the allotment still available, which is what the quota bar renders.
 *
 * Deliberately remaining and not used: every number on a module card counts what is
 * left, so a bar that filled with consumption would move opposite to the figure above
 * it, and a short bar would read as "nearly empty" when it meant "barely touched".
 */
export function remainingPercent(q: ModuleQuota): number {
  if (q.total <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((remaining(q) / q.total) * 100)))
}

export function isFreemium(sub: Subscription): boolean {
  return sub.packageId === 'freemium'
}

export function isCumulative(sub: Subscription): boolean {
  return sub.packageId === 'quota-cumulative'
}

export function isLegacy(sub: Subscription): boolean {
  return sub.packageId === 'legacy-basic' || sub.packageId === 'legacy-small'
}

/** BR-003 vs BR-004: only Standard resets monthly. */
export function resetsMonthly(sub: Subscription): boolean {
  return sub.packageId === 'quota' || isLegacy(sub)
}

export function daysToRenewal(sub: Subscription, today?: Date): number | null {
  return sub.endDate ? daysUntil(sub.endDate, today) : null
}

/** BR-022 / VR-02. Freemium has no end date, so it is never "nearing renewal". */
export function isNearingRenewal(sub: Subscription, today?: Date): boolean {
  const days = daysToRenewal(sub, today)
  return days !== null && days <= RENEWAL_WARNING_DAYS && days >= 0
}

export function worstState(sub: Subscription): QuotaState {
  const states = MODULES.map(m => quotaState(sub.quota[m.id]))
  if (states.includes('exhausted')) return 'exhausted'
  return states.includes('low') ? 'low' : 'healthy'
}

/**
 * BR-021 / BR-022 / BR-023 — the one branch the PRD cares most about getting right.
 * Standard near its renewal date is handed to an Account Manager rather than a top-up,
 * because top-up quota bought then would expire at the next reset anyway. Cumulative
 * keeps self-serve top-up at any point in the term; that quota just inherits the main
 * subscription's end date.
 */
export function exhaustionRoute(sub: Subscription, today?: Date): ExhaustionRoute {
  if (isFreemium(sub) || isLegacy(sub)) return 'upgrade'
  if (isCumulative(sub)) return 'topup-cumulative'
  return isNearingRenewal(sub, today) ? 'contact-am' : 'topup'
}

/** BR-015: migration is lazy and login-triggered, so it only fires on or after cutover. */
export function isMigrationDue(sub: Subscription, today: Date = new Date()): boolean {
  if (!isLegacy(sub)) return false
  const cutover = parseDmyDate(MIGRATION_CUTOVER)
  if (!cutover) return false
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return start.getTime() >= cutover.getTime()
}

/**
 * The Freemium package a migrated Basic/Small CID lands on. AC-004: whatever quota is
 * discarded here is what the CID's normal monthly reset would have taken anyway, because
 * cutover falls on the same day of the month as the reset.
 */
export function migratedToFreemium(sub: Subscription): Subscription {
  return {
    ...sub,
    packageId: 'freemium',
    packageName: 'Klikpajak Freemium',
    startDate: MIGRATION_CUTOVER,
    endDate: null,
    termMonths: null,
    quota: {
      'efaktur': { total: FREEMIUM_QUOTA, used: 0 },
      'ebupot-unifikasi': { total: FREEMIUM_QUOTA, used: 0 },
      'ebupot-2126': { total: FREEMIUM_QUOTA, used: 0 },
    },
  }
}

// ── Seed ─────────────────────────────────────────────────────────────────────

/**
 * One scenario per seeded company, so switching company in the account menu walks the
 * whole state matrix without any dev-only control. Dates are relative to late 2026 to
 * keep the 21-day renewal window reachable.
 */
export const SUBSCRIPTIONS: Record<number, Subscription> = {
  // Standard, eFaktur at exactly the 20% line and 18 days from renewal: the AC-013 case
  // where the quota warning and the renewal reminder must both show.
  188311: {
    packageId: 'quota',
    packageName: 'Klikpajak Quota',
    startDate: '01/01/2026',
    endDate: '26/10/2026',
    termMonths: null,
    quota: {
      'efaktur': { total: 1000, used: 800 },
      'ebupot-unifikasi': { total: 500, used: 150 },
      'ebupot-2126': { total: 300, used: 60 },
    },
    // Deliberately unsorted, the way an API would hand it over. QuotaHistoryTable
    // imposes active-first, then newest-first.
    history: [
      { id: 'inv-2025-01', packageName: 'Pro 300', startDate: '01/01/2025', endDate: '31/12/2025', quota: { 'efaktur': 300, 'ebupot-unifikasi': 300 }, isActive: false, amount: 1_800_000 },
      { id: 'inv-2026-03', packageName: 'Top Up Kuota e-Faktur', startDate: '05/03/2026', endDate: '02/04/2026', quota: { efaktur: 300 }, isActive: false, amount: 500_100 },
      { id: 'inv-2026-01', packageName: 'Klikpajak Quota', startDate: '01/01/2026', endDate: '26/10/2026', quota: { 'efaktur': 1000, 'ebupot-unifikasi': 500, 'ebupot-2126': 300 }, isActive: true, amount: 2_160_000 },
    ],
  },

  // Freemium, everything healthy: the persistent lifetime banner (BR-020 / AC-007) and
  // an empty purchase history.
  188312: {
    packageId: 'freemium',
    packageName: 'Klikpajak Freemium',
    startDate: '14/02/2026',
    endDate: null,
    termMonths: null,
    quota: {
      'efaktur': { total: FREEMIUM_QUOTA, used: 3 },
      'ebupot-unifikasi': { total: FREEMIUM_QUOTA, used: 1 },
      'ebupot-2126': { total: FREEMIUM_QUOTA, used: 0 },
    },
    history: [],
  },

  // Freemium with eFaktur at zero while the other two stay healthy: per-module
  // independence (AC-010) and the zero-quota upgrade modal (AC-009).
  188313: {
    packageId: 'freemium',
    packageName: 'Klikpajak Freemium',
    startDate: '02/06/2026',
    endDate: null,
    termMonths: null,
    quota: {
      'efaktur': { total: FREEMIUM_QUOTA, used: FREEMIUM_QUOTA },
      'ebupot-unifikasi': { total: FREEMIUM_QUOTA, used: 5 },
      'ebupot-2126': { total: FREEMIUM_QUOTA, used: 2 },
    },
    history: [],
  },

  // Cumulative: a 6-month pool, one module low against the pooled total (VR-01) and one
  // exhausted 12 days from the end date — BR-023's case, where top-up stays self-serve
  // even though a Standard CID at the same point would be sent to an Account Manager.
  188314: {
    packageId: 'quota-cumulative',
    packageName: 'Klikpajak Quota - Cumulative',
    startDate: '20/04/2026',
    endDate: '20/10/2026',
    termMonths: CUMULATIVE_MIN_MONTHS,
    quota: {
      'efaktur': { total: 6000, used: 4900 },
      'ebupot-unifikasi': { total: 1800, used: 400 },
      'ebupot-2126': { total: 1200, used: 1200 },
    },
    history: [
      { id: 'inv-cum-2026', packageName: 'Klikpajak Quota - Cumulative', startDate: '20/04/2026', endDate: '20/10/2026', quota: { 'efaktur': 6000, 'ebupot-unifikasi': 1800, 'ebupot-2126': 1200 }, isActive: true, amount: 12_312_000 },
    ],
  },

  // Standard with e-Faktur exhausted but the subscription still mid-term: the BR-021 case,
  // and the only seed where self-serve top-up is offered. Without it the plain top-up route
  // is unreachable, because 188311 always sits inside the 21-day Account Manager window.
  188316: {
    packageId: 'quota',
    packageName: 'Klikpajak Quota',
    startDate: '01/02/2026',
    endDate: '31/01/2027',
    termMonths: null,
    quota: {
      'efaktur': { total: 3000, used: 3000 },
      'ebupot-unifikasi': { total: 1000, used: 220 },
      'ebupot-2126': { total: 600, used: 90 },
    },
    history: [
      { id: 'inv-gln-2026', packageName: 'Klikpajak Quota', startDate: '01/02/2026', endDate: '31/01/2027', quota: { 'efaktur': 3000, 'ebupot-unifikasi': 1000, 'ebupot-2126': 600 }, isActive: true, amount: 5_060_000 },
    ],
  },

  // Still on a legacy freemium tier: migrates to Freemium on load once past cutover
  // (BR-015 / Story 2 AC-001), which surfaces the one-time confirmation notice (AC-002).
  188315: {
    packageId: 'legacy-basic',
    packageName: 'Basic',
    startDate: '10/09/2025',
    endDate: null,
    termMonths: null,
    quota: {
      'efaktur': { total: 50, used: 35 },
      'ebupot-unifikasi': { total: 50, used: 10 },
      'ebupot-2126': { total: 50, used: 0 },
    },
    history: [],
  },
}

export function moduleLabel(id: ModuleId): string {
  return MODULES.find(m => m.id === id)?.label ?? id
}

/**
 * What period a remaining balance covers. Only Standard (and the legacy tiers) hold a
 * month's worth: Freemium is lifetime (BR-002) and Cumulative pools the whole term
 * (BR-004), so neither may be labelled "bulan ini" — PRD §12 item 7 removes the monthly
 * framing from both.
 */
// ── Dev-only scenario helpers ────────────────────────────────────────────────
// Used by QuotaDevPanel to fabricate combinations the six seeded companies do not
// cover. They live here, next to the rules they exercise, so a reviewer can see that
// the panel only ever produces states the real model allows.

/** Rewrite `used` so the module lands in `next`, keeping its total. */
export function withState(q: ModuleQuota, next: QuotaState): ModuleQuota {
  if (next === 'exhausted') return { ...q, used: q.total }
  // Exactly on the threshold: remaining === 20% of total, which BR-012 counts as low.
  if (next === 'low') return { ...q, used: q.total - Math.floor(q.total * LOW_QUOTA_RATIO) }
  return { ...q, used: Math.floor(q.total * 0.5) }
}

interface PackagePreset {
  name: string
  totals: Record<ModuleId, number>
  termMonths: number | null
  hasEndDate: boolean
}

const PACKAGE_PRESETS: Record<PackageId, PackagePreset> = {
  'freemium': { name: 'Klikpajak Freemium', totals: { 'efaktur': FREEMIUM_QUOTA, 'ebupot-unifikasi': FREEMIUM_QUOTA, 'ebupot-2126': FREEMIUM_QUOTA }, termMonths: null, hasEndDate: false },
  'quota': { name: 'Klikpajak Quota', totals: { 'efaktur': 1000, 'ebupot-unifikasi': 500, 'ebupot-2126': 300 }, termMonths: null, hasEndDate: true },
  // Totals are the pooled term allotment (monthly x 6), which is what VR-01 measures against.
  'quota-cumulative': { name: 'Klikpajak Quota - Cumulative', totals: { 'efaktur': 6000, 'ebupot-unifikasi': 1800, 'ebupot-2126': 1200 }, termMonths: CUMULATIVE_MIN_MONTHS, hasEndDate: true },
  'legacy-basic': { name: 'Basic', totals: { 'efaktur': 50, 'ebupot-unifikasi': 50, 'ebupot-2126': 50 }, termMonths: null, hasEndDate: false },
  'legacy-small': { name: 'Small', totals: { 'efaktur': 100, 'ebupot-unifikasi': 100, 'ebupot-2126': 100 }, termMonths: null, hasEndDate: false },
}

/** Switch package, keeping each module at the quota state it is already in. */
export function applyPackagePreset(sub: Subscription, packageId: PackageId, days = 18): Subscription {
  const preset = PACKAGE_PRESETS[packageId]
  const quota = {} as Record<ModuleId, ModuleQuota>
  for (const m of MODULES) {
    quota[m.id] = withState({ total: preset.totals[m.id], used: 0 }, quotaState(sub.quota[m.id]))
  }
  return {
    ...sub,
    packageId,
    packageName: preset.name,
    termMonths: preset.termMonths,
    endDate: preset.hasEndDate ? (sub.endDate ?? dmyFromToday(days)) : null,
    quota,
  }
}

export function quotaPeriodLabel(sub: Subscription, today?: Date): string {
  if (isFreemium(sub)) return 'Sisa kuota seumur hidup'
  if (isCumulative(sub)) return `Sisa kuota sampai ${formatDmyLong(sub.endDate)}`
  return `Sisa kuota bulan ini · reset ${formatDmyLong(nextResetDate(today))}`
}

/**
 * The next time a Standard balance resets (BR-003, the 3rd of the month).
 *
 * This sits next to the figure on the card on purpose: "200 left this month" means very
 * different things on the 1st and the 28th, and leaving the rule on the package card
 * further up made the reader join the two themselves.
 */
export function nextResetDate(today: Date = new Date()): string {
  const base = today.getDate() < QUOTA_RESET_DAY
    ? new Date(today.getFullYear(), today.getMonth(), QUOTA_RESET_DAY)
    : new Date(today.getFullYear(), today.getMonth() + 1, QUOTA_RESET_DAY)
  return formatDmy(base)
}
