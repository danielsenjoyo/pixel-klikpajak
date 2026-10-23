<script setup lang="ts">
import { MpIcon, MpSelect, MpText } from '@mekari/pixel3'
import type { ErpScenario } from '~/composables/useJurnalErp'

/**
 * Jurnal pull scenarios for Lampiran 1 (L1 PRD AC-003…006) that the seed alone never shows:
 * a pull with accounts missing, a failed pull, and books that are not connected.
 *
 * Dev-only, same pattern as QuotaDevPanel: the SPT page renders it behind `import.meta.dev`,
 * so it is dropped from a production build. Floats, starts closed.
 */
const { scenario } = useJurnalErp()

const SCENARIOS: { value: ErpScenario, label: string }[] = [
  { value: 'ok', label: 'Terhubung — berhasil' },
  { value: 'partial', label: 'Terhubung — sebagian akun gagal' },
  { value: 'error', label: 'Terhubung — layanan gagal' },
  { value: 'disconnected', label: 'Tidak terhubung' },
]

const isOpen = ref(false)
const root = ref<HTMLElement | null>(null)

function onDocumentClick(e: MouseEvent) {
  if (isOpen.value && root.value && !root.value.contains(e.target as Node)) isOpen.value = false
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
  <div ref="root" class="erp-dev">
    <section v-show="isOpen" id="erp-dev-panel" class="erp-dev__panel" aria-label="Skenario Jurnal (dev)">
      <MpText size="label-small" weight="semiBold">Skenario Jurnal (dev only)</MpText>
      <MpSelect
        id="erp-dev-scenario"
        :model-value="scenario"
        size="sm"
        is-full-width
        aria-label="Skenario penarikan data Jurnal"
        @update:model-value="scenario = $event as ErpScenario"
      >
        <option v-for="s in SCENARIOS" :key="s.value" :value="s.value">{{ s.label }}</option>
      </MpSelect>
    </section>

    <button
      class="kp-icon-btn erp-dev__fab"
      type="button"
      :aria-expanded="isOpen"
      aria-controls="erp-dev-panel"
      aria-label="Skenario Jurnal (dev only)"
      @click="isOpen = !isOpen"
    >
      <MpIcon :name="isOpen ? 'close' : 'sliders'" size="md" />
    </button>
  </div>
</template>

<style scoped>
.erp-dev {
  position: fixed;
  right: var(--mp-spacing-6);
  bottom: var(--mp-spacing-6);
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--mp-spacing-3);
}

.erp-dev__fab {
  width: 48px;
  height: 48px;
  border-radius: var(--mp-radii-full);
  background: var(--mp-colors-background-neutral-bold);
  color: var(--mp-colors-icon-inverse);
  box-shadow: var(--mp-shadows-lg);
}
.erp-dev__fab:hover {
  background: var(--mp-colors-background-neutral-bold-hovered);
}

.erp-dev__panel {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  width: 300px;
  max-width: calc(100vw - var(--mp-spacing-10));
  padding: var(--mp-spacing-4);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-stage);
  box-shadow: var(--mp-shadows-lg);
}
</style>
