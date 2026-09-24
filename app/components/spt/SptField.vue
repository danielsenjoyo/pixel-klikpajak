<script setup lang="ts">
import { MpCheckbox, MpDatePicker, MpInput, MpInputGroup, MpInputRightAddon, MpSelect, MpText } from '@mekari/pixel3'
import { normalizeOptions, type FieldType, type Options } from '~/data/spt1771Engine'

// One lampiran control, chosen by field type. Used in inline table cells (size sm),
// the "Tambah data" drawer, form sheets and field groups.
const props = withDefaults(defineProps<{
  id: string
  type: FieldType
  modelValue?: unknown
  options?: Options
  label?: string
  placeholder?: string
  size?: 'sm' | 'md'
  isDisabled?: boolean
  isInvalid?: boolean
  /** Accessible name when no <label for> points at the control (table cells). */
  ariaLabel?: string
}>(), { size: 'md', modelValue: null })

const emit = defineEmits<{ 'update:modelValue': [value: unknown] }>()
const selectOptions = computed(() => normalizeOptions(props.options))
const asNumber = computed(() => (typeof props.modelValue === 'number' ? props.modelValue : null))
const asString = computed(() => (props.modelValue == null ? '' : String(props.modelValue)))

function onNumberText(value: string | number, decimals: boolean) {
  const raw = String(value).replace(',', '.').replace(decimals ? /[^\d.]/g : /\D/g, '')
  emit('update:modelValue', raw === '' ? null : Number(raw))
}

const DATE_FORMAT: Record<string, string> = { date: 'DD/MM/YYYY', month: 'MM/YYYY', year: 'YYYY' }
const DATE_PLACEHOLDER: Record<string, string> = { date: 'Pilih tanggal', month: 'Pilih bulan', year: 'Pilih tahun' }
</script>

<template>
  <KpCurrencyInput
    v-if="type === 'currency' || type === 'usd'"
    :id="id"
    :model-value="asNumber"
    :prefix="type === 'usd' ? '$' : 'Rp'"
    :size="size"
    :is-disabled="isDisabled"
    :is-invalid="isInvalid"
    :placeholder="placeholder"
    :aria-label="ariaLabel"
    @update:model-value="emit('update:modelValue', $event)"
  />

  <MpInputGroup v-else-if="type === 'percent'" :id="`${id}-group`" :size="size">
    <MpInput
      :id="id"
      :model-value="asString"
      :size="size"
      :is-disabled="isDisabled"
      :is-invalid="isInvalid"
      :placeholder="placeholder ?? '0'"
      :aria-label="ariaLabel"
      inputmode="decimal"
      autocomplete="off"
      @update:model-value="onNumberText($event, true)"
    />
    <MpInputRightAddon :id="`${id}-addon`" has-background>
      <MpText :size="size === 'sm' ? 'label-small' : 'label'" weight="semiBold" :color="isDisabled ? 'text.disabled' : 'text.default'">%</MpText>
    </MpInputRightAddon>
  </MpInputGroup>

  <MpInput
    v-else-if="type === 'number'"
    :id="id"
    :model-value="asString"
    :size="size"
    :is-disabled="isDisabled"
    :is-invalid="isInvalid"
    :placeholder="placeholder"
    :aria-label="ariaLabel"
    inputmode="numeric"
    autocomplete="off"
    @update:model-value="onNumberText($event, false)"
  />

  <MpDatePicker
    v-else-if="type === 'date' || type === 'month' || type === 'year'"
    :id="id"
    :model-value="asString || null"
    :type="type"
    value-type="string"
    :format="DATE_FORMAT[type]"
    :placeholder="placeholder ?? DATE_PLACEHOLDER[type]"
    :is-disabled="isDisabled"
    :is-invalid="isInvalid"
    :input-attr="ariaLabel ? { 'aria-label': ariaLabel } : {}"
    use-portal
    @update:model-value="emit('update:modelValue', $event || null)"
  />

  <MpSelect
    v-else-if="type === 'select'"
    :id="id"
    :model-value="asString"
    :size="size"
    :is-disabled="isDisabled"
    :is-invalid="isInvalid"
    :aria-label="ariaLabel"
    is-full-width
    @update:model-value="emit('update:modelValue', $event || null)"
  >
    <option value="">{{ placeholder ?? 'Pilih' }}</option>
    <option v-for="o in selectOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
  </MpSelect>

  <KpYesNo
    v-else-if="type === 'yesno'"
    :id="id"
    :model-value="modelValue === true"
    :is-disabled="isDisabled"
    @update:model-value="emit('update:modelValue', $event)"
  />

  <MpCheckbox
    v-else-if="type === 'checkbox'"
    :id="id"
    :is-checked="modelValue === true"
    :is-disabled="isDisabled"
    @change="(checked: boolean) => emit('update:modelValue', checked)"
  >
    {{ label }}
  </MpCheckbox>

  <MpInput
    v-else
    :id="id"
    :model-value="asString"
    :size="size"
    :is-disabled="isDisabled"
    :is-invalid="isInvalid"
    :placeholder="placeholder"
    :aria-label="ariaLabel"
    autocomplete="off"
    @update:model-value="emit('update:modelValue', $event === '' ? null : $event)"
  />
</template>
