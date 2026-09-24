<script setup lang="ts">
import { MpRadio } from '@mekari/pixel3'

// "Tidak / Ya" radio pair used throughout the SPT forms (Figma: Tidak first, default Tidak).
const props = defineProps<{ id: string, modelValue: boolean, isDisabled?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const value = computed({
  get: () => (props.modelValue ? 'ya' : 'tidak'),
  set: v => emit('update:modelValue', v === 'ya'),
})
</script>

<template>
  <div class="kp-yes-no" role="radiogroup">
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
</style>
