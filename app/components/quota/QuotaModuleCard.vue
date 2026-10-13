<script setup lang="ts">
import { MpButton, MpIcon, MpProgress, MpText } from '@mekari/pixel3'
import { type ModuleId, type ModuleQuota, type QuotaState, remaining, remainingPercent } from '~/data/subscription'
import { formatCount } from '~/utils/currency'

/**
 * One module's quota. Source layout: jurnal-tax QuotaSection product cards
 * ("Sisa kuota" / "Kuota terpakai").
 *
 * BR-006 and AC-010: modules are independent — this card reads only its own balance, so
 * one module running out never changes how the other two render.
 */
const props = defineProps<{
  moduleId: ModuleId
  label: string
  quota: ModuleQuota
  state: QuotaState
  /** What period the balance covers — monthly, the Cumulative term, or lifetime. */
  periodLabel: string
}>()

const emit = defineEmits<{ addQuota: [ModuleId] }>()

// The bar tracks what is LEFT, so it drains alongside the headline figure instead of
// filling against it. MpProgress takes `value` as a string, not a number.
const percent = computed(() => String(remainingPercent(props.quota)))

const progressColor = computed(() => {
  if (props.state === 'exhausted') return 'negative'
  return props.state === 'low' ? 'warning' : 'information'
})

const note = computed(() => {
  if (props.state === 'exhausted') return 'Kuota upload habis, silakan tambah kuota.'
  if (props.state === 'low') return 'Kuota upload hampir habis, silakan tambah kuota.'
  return ''
})
</script>

<template>
  <div class="quota-module" :class="`quota-module--${state}`">
    <MpText size="label" weight="semiBold">{{ label }}</MpText>

    <div class="quota-module__figure">
      <MpText size="h2" weight="semiBold" class="quota-module__remaining">{{ formatCount(remaining(quota)) }}</MpText>
      <MpText size="label-small" color="text.secondary">dari {{ formatCount(quota.total) }}</MpText>
    </div>
    <MpText size="label-small" color="text.secondary">{{ periodLabel }}</MpText>

    <!-- MpProgress renders role="progressbar" but no accessible name, so all three bars
         would announce as a bare percentage. Name it after its module, and say "sisa"
         so the value is not mistaken for consumption. -->
    <MpProgress
      class="quota-module__bar"
      :value="percent"
      :color="progressColor"
      size="sm"
      :aria-label="`Sisa kuota ${label}`"
    />

    <MpText size="label-small" color="text.secondary">Kuota terpakai {{ formatCount(quota.used) }}</MpText>

    <div v-if="note" class="quota-module__note">
      <MpIcon
        name="warning-triangle"
        size="sm"
        :color="state === 'exhausted' ? 'icon.danger' : 'icon.warning'"
      />
      <MpText size="label-small" :color="state === 'exhausted' ? 'text.danger' : 'text.warning'">{{ note }}</MpText>
    </div>

    <div v-if="state !== 'healthy'" class="quota-module__action">
      <MpButton
        :id="`quota-module-add-${moduleId}`"
        variant="secondary"
        size="sm"
        is-full-width
        @click="emit('addQuota', moduleId)"
      >
        Tambah kuota {{ label }}
      </MpButton>
    </div>
  </div>
</template>

<style scoped>
.quota-module {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  padding: var(--mp-spacing-4);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
}

.quota-module--low {
  border-color: var(--mp-colors-border-warning);
}
.quota-module--exhausted {
  border-color: var(--mp-colors-border-danger);
}

.quota-module__figure {
  display: flex;
  align-items: baseline;
  gap: var(--mp-spacing-2);
  margin-top: var(--mp-spacing-2);
}

.quota-module__remaining {
  margin: 0;
}

.quota-module__bar {
  margin: var(--mp-spacing-2) 0 var(--mp-spacing-1);
}

.quota-module__note {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-spacing-1);
  margin-top: var(--mp-spacing-2);
}

/* Pushes the action to the card's bottom edge so cards in a row stay aligned. */
.quota-module__action {
  margin-top: auto;
  padding-top: var(--mp-spacing-3);
}
</style>
