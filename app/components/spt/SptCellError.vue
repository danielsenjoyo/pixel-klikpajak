<script setup lang="ts">
// Validation message under a grid cell's input.
//
// Not MpFormControl + MpFormErrorMessage: that pair replaces the id of the input it
// wraps, and both the cell's aria-label addressing and the issue navigation's
// getElementById depend on the id staying exactly what the column asked for.
defineProps<{ message: string }>()
</script>

<template>
  <span class="spt-cell-error">{{ message }}</span>
</template>

<style scoped>
.spt-cell-error {
  display: block;
  margin-top: var(--mp-spacing-1);
  color: var(--mp-colors-text-danger);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-sm);
  text-align: left;
  white-space: normal;
}
</style>
