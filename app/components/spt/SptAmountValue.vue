<script setup lang="ts">
import { MpButton, MpTag, MpText } from '@mekari/pixel3'
import { formatRp } from '~/utils/currency'

// A computed line of the Induk (brief §10 "Computed"): rendered as a value, never as
// an input, with a chip saying where it comes from — a formula for lines the Induk
// works out itself, a link to the lampiran for lines rolled up from one.
defineProps<{
  id: string
  value: number
  /** e.g. "= 4 − 5 − 6" — how the Induk derives this line itself. */
  formula?: string
  /** Where the number is rolled up from; `href` makes the chip a drill-through. */
  source?: { label: string, href?: string }
}>()
</script>

<template>
  <div :id="id" class="spt-amount">
    <MpText as="p" size="h3" weight="semiBold" class="spt-amount__value">{{ formatRp(value) }}</MpText>
    <div class="spt-amount__meta">
      <MpTag v-if="formula" :id="`${id}-formula`" as="span" size="sm">{{ formula }}</MpTag>
      <MpButton
        v-if="source?.href"
        :id="`${id}-source`"
        as="a"
        variant="textLink"
        size="sm"
        right-icon="newtab"
        :href="source.href"
        target="_blank"
        rel="noopener"
      >
        dari {{ source.label }}
      </MpButton>
      <MpTag v-else-if="source" :id="`${id}-source`" as="span" size="sm">dari {{ source.label }}</MpTag>
    </div>
  </div>
</template>

<style scoped>
.spt-amount {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--mp-spacing-2) var(--mp-spacing-3);
  padding: var(--mp-spacing-2) 0;
}

.spt-amount__value {
  margin: 0;
  font-variant-numeric: tabular-nums;
}

.spt-amount__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-2);
}
</style>
