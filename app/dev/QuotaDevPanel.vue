<script setup lang="ts">
import { MpButton, MpIcon, MpSelect, MpText } from '@mekari/pixel3'
import { type ModuleId, type PackageId, type QuotaState } from '~/data/subscription'
import type { LoadState } from '~/composables/useSubscription'

/**
 * Scenario controls for walking states the six seeded companies do not cover — a
 * Cumulative pool one day from renewal, say, or all three modules exhausted at once.
 *
 * Floats over the page rather than sitting in it, and starts closed, so the screen reads
 * as the real product until someone deliberately opens the controls. It used to be an
 * inline block, which pushed the content down and put the scaffolding into every
 * screenshot of the page.
 *
 * Dev-only: the page renders it behind `import.meta.dev`, so Vite drops the whole branch
 * from a production build. It writes through the same setters and rule helpers as
 * everything else, so it cannot fabricate a state the real model would reject.
 */
const {
  subscription,
  modules,
  renewalDays,
  isLoading,
  hasError,
  setLoadState,
  setPackageId,
  setModuleState,
  setRenewalDays,
  resetScenario,
} = useSubscription()

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

const PACKAGES: { value: PackageId, label: string }[] = [
  { value: 'freemium', label: 'Klikpajak Freemium' },
  { value: 'quota', label: 'Klikpajak Quota' },
  { value: 'quota-cumulative', label: 'Klikpajak Quota - Cumulative' },
  { value: 'legacy-basic', label: 'Basic (paket lama)' },
]

const STATES: { value: QuotaState, label: string }[] = [
  { value: 'healthy', label: 'Aman' },
  { value: 'low', label: 'Hampir habis (20%)' },
  { value: 'exhausted', label: 'Habis' },
]

/** 21 and 22 bracket the BR-022 threshold — the boundary worth clicking. */
const RENEWAL_DAYS = [5, 12, 18, 21, 22, 45, 115]

/**
 * The seeded value is rarely one of the presets (and drifts daily as the fixed end dates
 * approach), so fold it in — otherwise the select renders blank on load.
 */
const renewalOptions = computed(() => {
  const current = renewalDays.value
  const all = current !== null && !RENEWAL_DAYS.includes(current)
    ? [...RENEWAL_DAYS, current]
    : RENEWAL_DAYS
  return [...all].sort((a, b) => a - b)
})

/** Freemium and the legacy tiers have no end date, so there is nothing to move. */
const hasEndDate = computed(() => subscription.value.endDate !== null)

const loadValue = computed<LoadState>(() => (isLoading.value ? 'loading' : hasError.value ? 'error' : 'ok'))

// The opening click starts inside `root`, so it never closes the panel it just opened.
function onDocumentClick(e: MouseEvent) {
  if (!isOpen.value) return
  if (root.value && !root.value.contains(e.target as Node)) isOpen.value = false
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') isOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="quota-dev">
    <section v-show="isOpen" id="quota-dev-panel" class="quota-dev__panel" aria-label="Kontrol skenario (dev)">
      <header class="quota-dev__head">
        <MpText size="label-small" weight="semiBold">Skenario (dev only)</MpText>
        <MpButton id="quota-dev-reset" variant="textLink" size="sm" @click="resetScenario()">Reset</MpButton>
      </header>

      <div class="quota-dev__field">
        <MpText size="label-small" color="text.secondary">Paket</MpText>
        <MpSelect
          id="quota-dev-package"
          :model-value="subscription.packageId"
          size="sm"
          is-full-width
          aria-label="Paket"
          @update:model-value="setPackageId($event as PackageId)"
        >
          <option v-for="p in PACKAGES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </MpSelect>
      </div>

      <div v-for="m in modules" :key="m.id" class="quota-dev__field">
        <MpText size="label-small" color="text.secondary">{{ m.label }}</MpText>
        <MpSelect
          :id="`quota-dev-state-${m.id}`"
          :model-value="m.state"
          size="sm"
          is-full-width
          :aria-label="`Status kuota ${m.label}`"
          @update:model-value="setModuleState(m.id as ModuleId, $event as QuotaState)"
        >
          <option v-for="s in STATES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </MpSelect>
      </div>

      <div class="quota-dev__field">
        <MpText size="label-small" color="text.secondary">Sisa hari langganan</MpText>
        <MpSelect
          id="quota-dev-renewal"
          :model-value="renewalDays ?? undefined"
          size="sm"
          is-full-width
          :is-disabled="!hasEndDate"
          :placeholder="hasEndDate ? undefined : 'Tanpa masa berlaku'"
          aria-label="Sisa hari langganan"
          @update:model-value="setRenewalDays(Number($event))"
        >
          <option v-for="d in renewalOptions" :key="d" :value="d">{{ d }} hari</option>
        </MpSelect>
      </div>

      <div class="quota-dev__field">
        <MpText size="label-small" color="text.secondary">Status data</MpText>
        <MpSelect
          id="quota-dev-load"
          :model-value="loadValue"
          size="sm"
          is-full-width
          aria-label="Status pemuatan data"
          @update:model-value="setLoadState($event as LoadState)"
        >
          <option value="ok">Normal</option>
          <option value="loading">Sedang memuat</option>
          <option value="error">Gagal dimuat</option>
        </MpSelect>
      </div>
    </section>

    <!-- The documented icon-only button (CLAUDE.md), restyled as a floating control so
         the scaffolding never sits in the product's layout. -->
    <button
      class="kp-icon-btn quota-dev__fab"
      type="button"
      :aria-expanded="isOpen"
      aria-controls="quota-dev-panel"
      aria-label="Kontrol skenario (dev only)"
      @click="isOpen = !isOpen"
    >
      <MpIcon :name="isOpen ? 'close' : 'sliders'" size="md" />
    </button>
  </div>
</template>

<style scoped>
.quota-dev {
  position: fixed;
  right: var(--mp-spacing-6);
  bottom: var(--mp-spacing-6);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--mp-spacing-3);
}

/* 48px so it clears the 40px default and reads as a floating control, not a toolbar icon. */
.quota-dev__fab {
  width: 48px;
  height: 48px;
  border-radius: var(--mp-radii-full);
  background: var(--mp-colors-background-neutral-bold);
  color: var(--mp-colors-icon-inverse);
  box-shadow: var(--mp-shadows-lg);
}
.quota-dev__fab:hover {
  background: var(--mp-colors-background-neutral-bold-hovered);
}

.quota-dev__panel {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  width: 300px;
  max-width: calc(100vw - var(--mp-spacing-10));
  max-height: 70vh;
  overflow-y: auto;
  padding: var(--mp-spacing-4);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-stage);
  box-shadow: var(--mp-shadows-lg);
}

.quota-dev__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-2);
}

.quota-dev__field {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  min-width: 0;
}
</style>
