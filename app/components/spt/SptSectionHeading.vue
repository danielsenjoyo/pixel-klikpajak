<script setup lang="ts">
// One heading style for every section of the SPT Induk: a band carrying the DJP
// letter and the section name. Used by KpFormSection and by the gating grid so the
// four tabs read as one document rather than four layouts.
defineProps<{ code?: string, title: string }>()
</script>

<template>
  <h3 class="spt-section-heading">
    <template v-if="code">{{ code }}. </template>{{ title }}
  </h3>
</template>

<style scoped>
.spt-section-heading {
  margin: 0 0 var(--mp-spacing-1);
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border-radius: var(--mp-radii-sm);
  background: var(--mp-colors-background-neutral-subtle);
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
  font-weight: var(--mp-font-weights-semi-bold);
  line-height: var(--mp-line-heights-md);
}
</style>
