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
 * Three independent banner slots — migration, quota and renewal.
 *
 * AC-013 is explicit that a quota warning and a renewal reminder must both be visible at
 * once "without overriding each other", so this is a stack, not a precedence chain. Only
 * the quota slot picks one of its own variants.
 */
const emit = defineEmits<{ addQuota: [] }>()

const { companyId } = useSession()
const { subscription, modules, overallState, renewalDays, showRenewalNotice, justMigrated, awaitingMigration, isDismissed, dismiss } = useSubscription()

/** Per company, so switching company brings a dismissed banner back. */
const key = (kind: string) => `${kind}:${companyId.value}`

const affected = computed(() =>
  modules.value.filter(m => m.state === overallState.value).map(m => m.label).join(', '),
)

const showMigration = computed(() =>
  (justMigrated.value || awaitingMigration.value) && !isDismissed(key('migration')),
)

/**
 * BR-020 / AC-007: the lifetime notice is persistent and has no close button. It is shown
 * only while every module is above the threshold — see the AC-007 vs AC-010 note in the
 * plan; AC-007 governs here and per-module state is carried by the module cards instead.
 */
const showFreemiumInfo = computed(() => isFreemium(subscription.value) && overallState.value === 'healthy')

const showQuotaWarning = computed(() => overallState.value !== 'healthy' && !isDismissed(key('quota')))

const showRenewal = computed(() => showRenewalNotice.value && !isDismissed(key('renewal')))
</script>

<template>
  <div v-if="showMigration || showFreemiumInfo || showQuotaWarning || showRenewal" class="quota-banners">
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

    <!-- 2b. Low or exhausted quota — BR-012, Story 1 AC-008, Story 3 AC-001/AC-002. -->
    <!-- MpBanner reads its default slot once in setup() and caches the vnodes, so an
         already-mounted banner does not pick up a new variant or new copy. Keying on the
         state forces a fresh instance when the quota crosses a threshold. -->
    <MpBanner
      v-if="showQuotaWarning"
      :key="overallState"
      id="quota-banner-warning"
      :variant="overallState === 'exhausted' ? 'danger' : 'warning'"
    >
      <MpBannerIcon id="quota-banner-warning-icon" />
      <MpBannerTitle id="quota-banner-warning-title">
        {{ overallState === 'exhausted' ? 'Kuota upload habis' : 'Kuota upload hampir habis' }}
      </MpBannerTitle>
      <MpBannerDescription id="quota-banner-warning-desc">
        {{ overallState === 'exhausted'
          ? `Kuota ${affected} Anda sudah habis, silakan tambah kuota.`
          : `Kuota ${affected} Anda hampir habis, silakan tambah kuota.` }}
      </MpBannerDescription>
      <!-- No action here on purpose: the module card below carries the same one, scoped
           to the module, so repeating it made three identical "Tambah kuota" compete and
           none of them stand out. The Freemium notice above keeps its link per AC-007. -->
      <!-- AC-011: dismissible, but held in memory only so it returns on reload. -->
      <MpBannerCloseButton id="quota-banner-warning-close" @click="dismiss(key('quota'))" />
    </MpBanner>

    <!-- 3. Renewal — AC-012: fires on the 21-day threshold regardless of quota state.
         VR-03: wording is identical for Standard and Cumulative. -->
    <MpBanner v-if="showRenewal" :key="`renewal-${companyId}`" id="quota-banner-renewal" variant="info">
      <MpBannerIcon id="quota-banner-renewal-icon" />
      <MpBannerTitle id="quota-banner-renewal-title">
        Langganan berakhir dalam {{ renewalDays }} hari
      </MpBannerTitle>
      <MpBannerDescription id="quota-banner-renewal-desc">
        Perpanjang langganan Anda sebelum {{ formatDmyLong(subscription.endDate) }} agar layanan tidak terhenti.
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
