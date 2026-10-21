<script setup lang="ts">
import { type ModuleId, type QuotaState, quotaPeriodLabel } from '~/data/subscription'
import { canViewPackagePrice } from '~/data/session'

// Pengaturan › Perusahaan › Manajemen kuota.
// PRD: Confluence PD/51248267285 "[PRD] Klikpajak Repackaging" (26Q3).
// Source: jurnal-tax pages/setting/Account/UploadQuota (the Pixel sidebar already points
// at this /v2 path, so this page replaces the KpNotPorted placeholder behind that link).
useHead({ title: 'Manajemen kuota · Klikpajak' })

// Breadcrumb: the Pengaturan module entry (sidebar target).
const PENGATURAN_PATH = '/main/setting/account/tax'

const { subscription, modules, isLoading, hasError, retry } = useSubscription()

// ── Blocked / top-up modal ───────────────────────────────────────────────────
const isBlockedOpen = ref(false)
const blockedModule = ref<ModuleId | null>(null)

/** Worst-off module first, so a page-level "Tambah kuota" lands on the one that needs it. */
const RANK: Record<QuotaState, number> = { exhausted: 0, low: 1, healthy: 2 }
const neediestModule = computed(() =>
  [...modules.value].sort((a, b) => RANK[a.state] - RANK[b.state])[0]?.id ?? null,
)

function openBlocked(moduleId?: ModuleId) {
  blockedModule.value = moduleId ?? neediestModule.value
  isBlockedOpen.value = true
}

// Scenario controls for walking states the seed does not cover. The panel lives outside
// `app/components/` so Nuxt does not auto-import it; `import.meta.dev` is a compile-time
// constant, so this whole branch — and the panel's chunk — is dropped from a production
// build rather than merely hidden at runtime.
const QuotaDevPanel = import.meta.dev
  ? defineAsyncComponent(() => import('~/dev/QuotaDevPanel.vue'))
  : null
</script>

<template>
  <div class="quota-page">
    <KpPageHeader title="Manajemen kuota" :breadcrumbs="[{ label: 'Pengaturan', to: PENGATURAN_PATH }]" />

    <KpStage>
      <!-- Banners and figures all derive from the same Billing payload, so when it fails
           none of them may render: a stale or zeroed number here reads as "kuota habis"
           and invites a purchase the customer may not need. -->
      <QuotaBanners v-if="!hasError && !isLoading" @add-quota="openBlocked()" />

      <div class="quota-content">
        <QuotaLoading v-if="isLoading" />

        <QuotaLoadError v-else-if="hasError" @retry="retry" />

        <template v-else>
          <QuotaPackageCard @add-quota="openBlocked()" />

          <div class="quota-modules">
            <QuotaModuleCard
              v-for="m in modules"
              :key="m.id"
              :module-id="m.id"
              :label="m.label"
              :quota="m.quota"
              :state="m.state"
              :period-label="quotaPeriodLabel(subscription)"
              @add-quota="openBlocked"
            />
          </div>

          <QuotaHistoryTable :rows="subscription.history" :show-amount="canViewPackagePrice" />
        </template>
      </div>
    </KpStage>

    <!-- Fixed-position, so it sits outside the content flow entirely. -->
    <component :is="QuotaDevPanel" v-if="QuotaDevPanel" />

    <QuotaBlockedModal
      :is-open="isBlockedOpen"
      :module-id="blockedModule"
      @close="isBlockedOpen = false"
    />
  </div>
</template>

<style scoped>
.quota-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.quota-content {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-6);
  padding: var(--mp-spacing-4) var(--mp-spacing-6) var(--mp-spacing-6);
}

.quota-modules {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-spacing-4);
}

@media (max-width: 991px) {
  .quota-modules {
    flex-direction: column;
  }
}
</style>
