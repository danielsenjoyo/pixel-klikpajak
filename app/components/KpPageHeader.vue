<script setup lang="ts">
import { MpText } from '@mekari/pixel3'

// Page title bar on the surface background (Figma "Page Title"): module title on
// the left, primary page actions on the right.
defineProps<{ title: string }>()
</script>

<template>
  <div class="kp-page-header">
    <MpText as="h1" size="h1" weight="semiBold" class="kp-page-header__title">{{ title }}</MpText>
    <div v-if="$slots.actions" class="kp-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.kp-page-header {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-4);
  padding: 18px var(--mp-spacing-6);
}

.kp-page-header__title {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.kp-page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
}
</style>
