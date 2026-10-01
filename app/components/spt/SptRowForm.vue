<script setup lang="ts">
import { MpBanner, MpBannerDescription, MpFormControl, MpFormErrorMessage, MpFormLabel, MpInput } from '@mekari/pixel3'
import type { Ctx, FieldDef, Row } from '~/data/spt1771Engine'

// The add/edit form body for a lampiran table row, shared by the drawer and the
// modal variants of SptTableBlock so both render identical fields.
defineProps<{
  sections: { title?: string, fields: FieldDef[] }[]
  ctx: Ctx
  idPrefix: string
  showErrors: boolean
  /** Field key → the message to show under it (engine `fieldErrors`). */
  errors: Record<string, string>
  /** V-I4: set when this counterparty is already in the grid. */
  duplicateMessage?: string
}>()
const row = defineModel<Row>({ required: true })
</script>

<template>
  <form :id="`${idPrefix}-form`" class="spt-row-form" @submit.prevent>
    <MpBanner v-if="showErrors && duplicateMessage" :id="`${idPrefix}-duplicate`" variant="critical" is-inline>
      <MpBannerDescription>{{ duplicateMessage }}</MpBannerDescription>
    </MpBanner>
    <fieldset v-for="(s, si) in sections" :key="si" class="spt-row-form__group">
      <legend v-if="s.title" class="spt-row-form__legend">{{ s.title }}</legend>
      <MpFormControl
        v-for="c in s.fields"
        :id="`${idPrefix}-f-${c.key}-control`"
        :key="c.key"
        :is-required="c.required && !c.readOnly"
        :is-invalid="showErrors && !!errors[c.key]"
      >
        <MpFormLabel>{{ c.label.replace(/\s*\(\d+\)$/, '') }}</MpFormLabel>
        <!-- Prefilled identity fields stay greyed: they are owned by DJP Coretax. -->
        <MpInput v-if="c.readOnly" :id="`${idPrefix}-f-${c.key}`" :model-value="String(row[c.key] ?? '')" is-disabled />
        <MpInput v-else-if="c.derive" :id="`${idPrefix}-f-${c.key}`" :model-value="c.derive(row)" is-disabled />
        <SptField
          v-else-if="!c.compute"
          :id="`${idPrefix}-f-${c.key}`"
          v-model="row[c.key]"
          :type="c.type"
          :options="c.options"
          :placeholder="c.placeholder"
          :is-invalid="showErrors && !!errors[c.key]"
        />
        <KpCurrencyInput
          v-else
          :id="`${idPrefix}-f-${c.key}`"
          :model-value="c.compute(row, ctx)"
          :prefix="c.type === 'usd' ? '$' : 'Rp'"
          is-disabled
        />
        <MpFormErrorMessage>{{ errors[c.key] }}</MpFormErrorMessage>
      </MpFormControl>
    </fieldset>
  </form>
</template>

<style scoped>
.spt-row-form {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-5);
}

.spt-row-form__group {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4);
  border: none;
  margin: 0;
  padding: 0;
}

.spt-row-form__legend {
  padding: 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-md);
  font-weight: var(--mp-font-weights-semi-bold);
}
</style>
