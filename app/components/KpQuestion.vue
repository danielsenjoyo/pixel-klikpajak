<script setup lang="ts">
// Question block (Figma "Form" > "radio"): bold question, control(s), grey hint lines.
defineProps<{ label?: string, hints?: string[] }>()
</script>

<template>
  <fieldset class="kp-question">
    <legend v-if="label" class="kp-question__label">{{ label }}</legend>
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
  float: left;
  width: 100%;
  margin-bottom: var(--mp-spacing-3);
  padding: 0;
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
  font-weight: var(--mp-font-weights-semi-bold);
  line-height: var(--mp-line-heights-md);
}

.kp-question__body {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  clear: both;
}

.kp-question__hint {
  margin: calc(-1 * var(--mp-spacing-2)) 0 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-sm);
}
</style>
