<script setup lang="ts">
import { MpButton, MpTag, MpText } from '@mekari/pixel3'
import { formatRp } from '~/utils/currency'

// One line of the Induk calculation ladder: DJP's line number carrying the operator
// that line applies to the running total, then the label with its provenance chip,
// then the amount on the right.
//
// A row with `value` is a computed line (brief §10) — it renders the number itself and
// never an input. A row without one puts whatever the slot holds in the amount column.
defineProps<{
  id?: string
  /** DJP line number as the form prints it, e.g. "8." or "17. a.". */
  no: string
  label: string
  /** How the Induk derives the line itself, e.g. "4 − 5 − 6". */
  formula?: string
  /** Where the line is rolled up from; `href` makes the chip a drill-through. */
  source?: { label: string, href?: string }
  value?: number
  /** Grey note under the label — why a line is unavailable, or where it comes from. */
  hint?: string
  /** Renders the line as the ladder's result. */
  isTotal?: boolean
}>()
</script>

<template>
  <div class="spt-ladder-row" :class="{ 'spt-ladder-row--total': isTotal }" role="group" :aria-labelledby="`ladder-${no}-label`">
    <div class="spt-ladder-row__label">
      <MpText :id="`ladder-${no}-label`" as="p" size="body" :weight="isTotal ? 'semiBold' : 'regular'" class="spt-ladder-row__text">
        <span class="spt-ladder-row__no">{{ no }}</span>
        {{ label }}
      </MpText>
      <p v-if="hint" class="spt-ladder-row__hint">{{ hint }}</p>
      <div v-if="formula || source" class="spt-ladder-row__meta">
        <MpTag v-if="formula" :id="`ladder-${no}-formula`" as="span" size="sm">{{ formula }}</MpTag>
        <MpButton
          v-if="source?.href"
          :id="`ladder-${no}-source`"
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
        <MpTag v-else-if="source" :id="`ladder-${no}-source`" as="span" size="sm">dari {{ source.label }}</MpTag>
      </div>
    </div>

    <div class="spt-ladder-row__value">
      <p v-if="value !== undefined" :id="id" class="spt-ladder-row__amount">{{ formatRp(value) }}</p>
      <slot v-else />
    </div>
  </div>
</template>

<style scoped>
/* The value column is sized for its widest control, not for the amounts: the tarif picker
   on line 11 carries a full pasal reference, and at 260px it truncated mid-word. Amounts
   are right-aligned so they stay flush with the ladder's edge either way, and the widest
   label (17b, ~450px) still fits the column this leaves. */
.spt-ladder-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(170px, 360px);
  align-items: start;
  gap: var(--mp-spacing-2) var(--mp-spacing-4);
  padding: var(--mp-spacing-4) 0;
  border-bottom: 1px solid var(--mp-colors-border-default);
}
.spt-ladder-row--total {
  background: var(--mp-colors-background-neutral-subtle);
}

.spt-ladder-row__label {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  min-width: 0;
}

/* DJP prints the line number in the sentence; wraps hang under the text. */
.spt-ladder-row__text {
  margin: 0;
  padding-left: var(--mp-spacing-8);
  text-indent: calc(-1 * var(--mp-spacing-8));
}

.spt-ladder-row__no {
  font-weight: var(--mp-font-weights-semi-bold);
}

.spt-ladder-row__hint {
  margin: 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-sm);
}

.spt-ladder-row__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-2);
}

.spt-ladder-row__value {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  align-items: flex-end;
  min-width: 0;
}

.spt-ladder-row__amount {
  margin: 0;
  padding-top: var(--mp-spacing-4xs);
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-lg);
  font-variant-numeric: tabular-nums;
  font-weight: var(--mp-font-weights-semi-bold);
}

@media (max-width: 767px) {
  .spt-ladder-row {
    grid-template-columns: 1fr;
  }
  .spt-ladder-row__value {
    align-items: flex-start;
  }
}
</style>
