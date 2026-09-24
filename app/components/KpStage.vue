<script setup lang="ts">
import { MpText } from '@mekari/pixel3'

// White content stage below the page title (Figma "Stage"): fills the remaining
// height, bordered with a rounded top-left corner, optional section title.
defineProps<{ title?: string }>()
</script>

<template>
  <section class="kp-stage">
    <header v-if="title || $slots.header" class="kp-stage__header">
      <MpText v-if="title" as="h2" size="h2" weight="semiBold" class="kp-stage__title">{{ title }}</MpText>
      <slot name="header" />
    </header>
    <slot />
  </section>
</template>

<style scoped>
.kp-stage {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  border-top: 1px solid var(--mp-colors-border-default);
  border-left: 1px solid var(--mp-colors-border-default);
  border-top-left-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-stage);
}

.kp-stage__header {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-4) var(--mp-spacing-6) 0;
}

.kp-stage__title {
  margin: 0;
}

@media (max-width: 991px) {
  .kp-stage {
    border-left: 0;
    border-top-left-radius: 0;
  }
}
</style>
