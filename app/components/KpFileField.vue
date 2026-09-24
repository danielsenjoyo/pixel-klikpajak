<script setup lang="ts">
import { MpUpload } from '@mekari/pixel3'

// File picker (Figma: "Pilih file | Tidak ada file terpilih" + format hint).
// The prototype stores the chosen file's name only.
const props = withDefaults(defineProps<{
  id: string
  modelValue?: string | null
  accept?: string
  hint?: string
  isDisabled?: boolean
  isInvalid?: boolean
}>(), { modelValue: null, accept: '.xbrl,.xls,.xlsx', hint: 'xbrl/xls/xlsx file' })

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

function onChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  emit('update:modelValue', file ? file.name : null)
}
</script>

<template>
  <div class="kp-file-field">
    <MpUpload
      :id="id"
      :accept="accept"
      button-text="Pilih file"
      :placeholder="props.modelValue ?? 'Tidak ada file terpilih'"
      :is-disabled="isDisabled"
      :is-invalid="isInvalid"
      is-full-width
      @change="onChange"
      @clear="emit('update:modelValue', null)"
    />
    <p v-if="hint" class="kp-file-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.kp-file-field {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
}

.kp-file-field__hint {
  margin: 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-sm);
}
</style>
