<script setup lang="ts">
import {
  MpBanner,
  MpBannerCloseButton,
  MpBannerDescription,
  MpBannerIcon,
  MpBannerLink,
  MpBannerTitle,
  MpButton,
} from '@mekari/pixel3'
import { MIGRATION_CUTOVER, isFreemium } from '~/data/subscription'
import { formatDmyLong } from '~/utils/date'

/**
 * Independent banner slots — migration, Freemium lifetime notice, exhausted, low, renewal.
 *
 * AC-013 is explicit that a quota warning and a renewal reminder must both be visible at
 * once "without overriding each other", so this is a stack, not a precedence chain. The
 * same reasoning splits exhausted from low: they are separate conditions about separate
 * modules, so one must not silence the other.
 *
 * The one deliberate exception is the Freemium lifetime notice, which BR-020 and AC-010
 * say is *replaced* by a warning rather than shown beside it — a "your quota is lifetime"
 * reassurance next to a red warning weakens the warning.
 */
const emit = defineEmits<{ addQuota: [] }>()

const { companyId } = useSession()
const { subscription, overallState, exhaustedModules, lowModules, renewalDays, showRenewalNotice, hasExpired, justMigrated, awaitingMigration, isDismissed, dismiss } = useSubscription()

/** Per company, so switching company brings a dismissed banner back. */
const key = (kind: string) => `${kind}:${companyId.value}`

const exhaustedLabels = computed(() => exhaustedModules.value.map(m => m.label).join(', '))
const lowLabels = computed(() => lowModules.value.map(m => m.label).join(', '))

const showMigration = computed(() =>
  (justMigrated.value || awaitingMigration.value) && !isDismissed(key('migration')),
)

/**
 * BR-020 / AC-007: the lifetime notice is persistent and has no close button. It is shown
 * only while every module is above the threshold — see the AC-007 vs AC-010 note in the
 * plan; AC-007 governs here and per-module state is carried by the module cards instead.
 */
const showFreemiumInfo = computed(() => isFreemium(subscription.value) && overallState.value === 'healthy')

const showExhausted = computed(() => exhaustedModules.value.length > 0 && !isDismissed(key('exhausted')))
const showLow = computed(() => lowModules.value.length > 0 && !isDismissed(key('low')))

const showRenewal = computed(() => showRenewalNotice.value && !isDismissed(key('renewal')))

/** "dalam 0 hari" reads as a bug, and a lapsed subscription is not a countdown at all. */
const renewalTitle = computed(() => {
  if (renewalDays.value === null) return ''
  if (renewalDays.value < 0) return 'Langganan sudah berakhir'
  if (renewalDays.value === 0) return 'Langganan berakhir hari ini'
  return `Langganan berakhir dalam ${renewalDays.value} hari`
})
</script>

<template>
  <div v-if="showMigration || showFreemiumInfo || showExhausted || showLow || showRenewal" class="quota-banners">
    <!-- 1. Migration — Story 2 AC-002 after cutover, AC-006 before it. -->
    <!-- TODO(copy): final migration wording is owned by GTM/Marketing and was not drafted in the PRD. -->
    <MpBanner v-if="showMigration" :key="justMigrated ? 'migrated' : 'pending'" id="quota-banner-migration" variant="info">
      <MpBannerIcon id="quota-banner-migration-icon" />
      <MpBannerTitle id="quota-banner-migration-title">
        {{ justMigrated ? 'Paket Anda telah diperbarui' : 'Perubahan paket Klikpajak' }}
      </MpBannerTitle>
      <MpBannerDescription id="quota-banner-migration-desc">
        <template v-if="justMigrated">
          Paket lama Anda telah diperbarui ke Klikpajak Freemium dengan 20 kuota untuk setiap modul, berlaku seumur hidup.
        </template>
        <template v-else>
          Paket {{ subscription.packageName }} Anda akan diperbarui ke Klikpajak Freemium mulai
          {{ formatDmyLong(MIGRATION_CUTOVER) }}, dengan 20 kuota untuk setiap modul yang berlaku seumur hidup.
        </template>
      </MpBannerDescription>
      <MpBannerCloseButton id="quota-banner-migration-close" @click="dismiss(key('migration'))" />
    </MpBanner>

    <!-- 2a. Freemium lifetime notice — persistent, so no close button (BR-020). -->
    <MpBanner v-if="showFreemiumInfo" :key="`lifetime-${companyId}`" id="quota-banner-lifetime" variant="info">
      <MpBannerIcon id="quota-banner-lifetime-icon" />
      <MpBannerTitle id="quota-banner-lifetime-title">Kuota Freemium seumur hidup</MpBannerTitle>
      <MpBannerDescription id="quota-banner-lifetime-desc">
        Kuota Freemium Anda bersifat seumur hidup dan tidak akan pernah direset. Gunakan kuota Anda kapan saja.
      </MpBannerDescription>
      <MpBannerLink id="quota-banner-lifetime-link">
        <MpButton id="quota-banner-lifetime-action" variant="textLink" @click="emit('addQuota')">Tambah kuota</MpButton>
      </MpBannerLink>
    </MpBanner>

    <!-- 2b. Exhausted and low are two separate banners, not one "worst state" banner.
         With a single banner keyed on the worst state, a module sitting at 10% vanished
         from the stack entirely as soon as a different module hit zero — the same
         suppression AC-013 forbids between the quota and renewal notices, happening
         inside the quota slot. Story 1 AC-008 and Story 3 AC-001/AC-002 each promise a
         warning "for that module". -->
    <!-- MpBanner reads its default slot once in setup() and caches the vnodes, so an
         already-mounted banner does not pick up new copy. Keying on the module list
         forces a fresh instance when the affected modules change. -->
    <MpBanner
      v-if="showExhausted"
      :key="`exhausted-${exhaustedLabels}`"
      id="quota-banner-exhausted"
      variant="danger"
    >
      <MpBannerIcon id="quota-banner-exhausted-icon" />
      <MpBannerTitle id="quota-banner-exhausted-title">Kuota upload habis</MpBannerTitle>
      <MpBannerDescription id="quota-banner-exhausted-desc">
        Kuota {{ exhaustedLabels }} Anda sudah habis, silakan tambah kuota.
      </MpBannerDescription>
      <!-- No action here on purpose: the module card below carries the same one, scoped
           to the module, so repeating it made identical "Tambah kuota" buttons compete. -->
      <!-- AC-011: dismissible, but held in memory only so it returns on reload. -->
      <MpBannerCloseButton id="quota-banner-exhausted-close" @click="dismiss(key('exhausted'))" />
    </MpBanner>

    <MpBanner
      v-if="showLow"
      :key="`low-${lowLabels}`"
      id="quota-banner-low"
      variant="warning"
    >
      <MpBannerIcon id="quota-banner-low-icon" />
      <MpBannerTitle id="quota-banner-low-title">Kuota upload hampir habis</MpBannerTitle>
      <MpBannerDescription id="quota-banner-low-desc">
        Kuota {{ lowLabels }} Anda hampir habis, silakan tambah kuota.
      </MpBannerDescription>
      <MpBannerCloseButton id="quota-banner-low-close" @click="dismiss(key('low'))" />
    </MpBanner>

    <!-- 3. Renewal — AC-012: fires on the 21-day threshold regardless of quota state.
         VR-03: wording is identical for Standard and Cumulative. -->
    <MpBanner
      v-if="showRenewal"
      :key="`renewal-${hasExpired}-${renewalDays}-${companyId}`"
      id="quota-banner-renewal"
      :variant="hasExpired ? 'warning' : 'info'"
    >
      <MpBannerIcon id="quota-banner-renewal-icon" />
      <MpBannerTitle id="quota-banner-renewal-title">{{ renewalTitle }}</MpBannerTitle>
      <MpBannerDescription id="quota-banner-renewal-desc">
        <template v-if="hasExpired">
          Langganan Anda berakhir pada {{ formatDmyLong(subscription.endDate) }}. Perpanjang untuk melanjutkan layanan.
        </template>
        <template v-else>
          Perpanjang langganan Anda sebelum {{ formatDmyLong(subscription.endDate) }} agar layanan tidak terhenti.
        </template>
      </MpBannerDescription>
      <MpBannerCloseButton id="quota-banner-renewal-close" @click="dismiss(key('renewal'))" />
    </MpBanner>
  </div>
</template>

<style scoped>
.quota-banners {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  padding: var(--mp-spacing-4) var(--mp-spacing-6) 0;
}
</style>
