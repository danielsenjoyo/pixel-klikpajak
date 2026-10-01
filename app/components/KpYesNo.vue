<script setup lang="ts">
import { MpRadio } from '@mekari/pixel3'

// "Tidak / Ya" radio pair used throughout the SPT forms (Figma: Tidak first, default Tidak).
//
// `null` is unanswered: neither radio is selected, so "belum dijawab" stops looking exactly
// like "Tidak". The Induk gating questions seed every answer to `false` and keep their
// Tidak-preselected behaviour unchanged; only Lampiran 10B's declarations start at null.
const props = defineProps<{ id: string, modelValue: boolean | null, isDisabled?: boolean, isInvalid?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const value = computed({
  get: () => (props.modelValue == null ? '' : props.modelValue ? 'ya' : 'tidak'),
  set: v => emit('update:modelValue', v === 'ya'),
})
</script>

<template>
  <div class="kp-yes-no" :class="{ 'kp-yes-no--invalid': isInvalid }" role="radiogroup">
    <MpRadio :id="`${id}-tidak`" :name="id" value="tidak" v-model="value" :is-disabled="isDisabled">Tidak</MpRadio>
    <MpRadio :id="`${id}-ya`" :name="id" value="ya" v-model="value" :is-disabled="isDisabled">Ya</MpRadio>
  </div>
</template>

<style scoped>
.kp-yes-no {
  display: flex;
  gap: var(--mp-spacing-6);
  padding: var(--mp-spacing-1) 0;
}

/* An unanswered radio group has nothing to outline, so the pair carries the state. */
.kp-yes-no--invalid {
  padding-left: var(--mp-spacing-3);
  border-left: 2px solid var(--mp-colors-border-danger);
}
</style>
