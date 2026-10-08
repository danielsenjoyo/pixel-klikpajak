<script setup lang="ts">
// Question block (Figma "Form" > "radio"): bold question, control(s), grey hint lines.
// `inline` puts the control in a right-hand column instead of under the label, which
// keeps the long amount ladders and file lists from running far down the page.
defineProps<{ label?: string, hints?: string[], inline?: boolean, code?: string }>()
const labelId = useId()
</script>

<template>
  <div
    v-if="inline"
    class="kp-question kp-question--inline"
    role="group"
    :aria-labelledby="label ? labelId : undefined"
  >
    <p v-if="label" :id="labelId" class="kp-question__label" :class="{ 'kp-question__label--coded': code }">
      <span v-if="code" class="kp-question__no">{{ code }}</span>
      {{ label }}
    </p>
    <div class="kp-question__body">
      <slot />
    </div>
    <p v-for="hint in hints ?? []" :key="hint" class="kp-question__hint">{{ hint }}</p>
  </div>

  <fieldset v-else class="kp-question">
    <legend v-if="label" class="kp-question__label kp-question__label--legend">{{ label }}</legend>
    <div class="kp-question__body">
      <slot />
    </div>
    <p v-for="hint in hints ?? []" :key="hint" class="kp-question__hint">{{ hint }}</p>
  </fieldset>
</template>

<style scoped>
.kp-question {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  margin: 0;
  padding: 0 0 var(--mp-spacing-5);
  border: 0;
  min-width: 0;
}

.kp-question__label {
  margin: 0 0 var(--mp-spacing-3);
  padding: 0;
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
  font-weight: var(--mp-font-weights-semi-bold);
  line-height: var(--mp-line-heights-md);
}
/* A <legend> only flows with the fieldset once it is floated. */
.kp-question__label--legend {
  float: left;
  width: 100%;
}

.kp-question__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  clear: both;
  min-width: 0;
}

.kp-question__no {
  font-weight: var(--mp-font-weights-semi-bold);
}

.kp-question__label--coded {
  padding-left: var(--mp-spacing-6);
  text-indent: calc(-1 * var(--mp-spacing-6));
}

.kp-question__hint {
  margin: calc(-1 * var(--mp-spacing-2)) 0 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-sm);
}

/* Label (and its hints) on the left, control on the right. A `code` prints DJP's own
   item number in the sentence, with wraps hanging under the text. */
.kp-question--inline {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 320px);
  align-items: start;
  column-gap: var(--mp-spacing-6);
  gap: var(--mp-spacing-1) var(--mp-spacing-6);
  padding-bottom: var(--mp-spacing-4);
  border-bottom: 1px solid var(--mp-colors-border-default);
}
.kp-question--inline + .kp-question--inline {
  padding-top: var(--mp-spacing-4);
}
.kp-question--inline .kp-question__label {
  grid-column: 1;
  margin-bottom: 0;
  font-weight: var(--mp-font-weights-regular);
}
.kp-question--inline .kp-question__body {
  grid-row: 1;
  grid-column: 2;
}
.kp-question--inline .kp-question__hint {
  grid-column: 1;
  margin-top: 0;
}

@media (max-width: 767px) {
  .kp-question--inline {
    grid-template-columns: 1fr;
  }
  .kp-question--inline .kp-question__body {
    grid-row: auto;
    grid-column: 1;
  }
}
</style>
