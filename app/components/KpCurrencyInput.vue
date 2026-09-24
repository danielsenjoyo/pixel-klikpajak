<script setup lang="ts">
import { MpInput, MpInputGroup, MpInputLeftAddon, MpText } from '@mekari/pixel3'
import { formatNumber } from '~/utils/currency'

// Rupiah amount field (Figma "Input" with "Rp" prefix). Shows "1.234.567,00" at rest
// and raw digits while focused. Disabled = computed / not-applicable (grey, as in Figma).
const props = withDefaults(defineProps<{
  id: string
  modelValue?: number | null
  isDisabled?: boolean
  isInvalid?: boolean
  size?: 'sm' | 'md'
  placeholder?: string
}>(), { modelValue: null, size: 'md', placeholder: '' })

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

const isFocused = ref(false)
const text = computed(() => {
  if (props.modelValue == null) return ''
  return isFocused.value ? String(props.modelValue) : formatNumber(props.modelValue)
})

function onInput(value: string | number) {
  const digits = String(value).replace(/\D/g, '')
  emit('update:modelValue', digits === '' ? null : Number(digits))
}
</script>

<template>
  <MpInputGroup :id="`${id}-group`" :size="size" class="kp-currency" @focusin="isFocused = true" @focusout="isFocused = false">
    <MpInputLeftAddon :id="`${id}-addon`" has-background>
      <MpText :size="size === 'sm' ? 'label-small' : 'label'" weight="semiBold" :color="isDisabled ? 'text.disabled' : 'text.default'">Rp</MpText>
    </MpInputLeftAddon>
    <MpInput
      :id="id"
      :model-value="text"
      :size="size"
      :is-disabled="isDisabled"
      :is-invalid="isInvalid"
      :placeholder="placeholder"
      inputmode="numeric"
      autocomplete="off"
      @update:model-value="onInput"
    />
  </MpInputGroup>
</template>

<style scoped>
.kp-currency :deep(input) {
  font-variant-numeric: tabular-nums;
}
</style>
