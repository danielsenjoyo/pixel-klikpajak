<script setup lang="ts">
// SPT Induk amount that a lampiran can fill: read-only lampiran value while `linked`,
// otherwise the manual entry (disabled while its question is answered Tidak).
defineProps<{ id: string, linked: boolean, value: number, isDisabled?: boolean }>()
const model = defineModel<number | null>({ default: null })
</script>

<template>
  <KpCurrencyInput v-if="linked" :id="id" :model-value="value" is-disabled />
  <KpCurrencyInput v-else :id="id" v-model="model" :is-disabled="isDisabled" />
</template>
