<script setup lang="ts">
import { MpToastManager } from '@mekari/pixel3'

// Logged-in shell (source layouts: Main / MekariPixel / LayoutContainer):
// top nav + centred content column.
</script>

<template>
  <div class="kp-shell">
    <KpHeader />
    <main class="kp-content">
      <slot />
    </main>
    <MpToastManager />
  </div>
</template>

<style scoped>
.kp-shell {
  min-height: 100dvh;
  background: var(--mp-colors-background-surface);
}

.kp-content {
  width: 100%;
  max-width: var(--kp-content-max-width);
  margin: 0 auto;
  padding: var(--mp-spacing-6) var(--mp-spacing-8);
}

@media (max-width: 1023px) {
  .kp-content {
    padding: var(--mp-spacing-6) var(--mp-spacing-4);
  }
}
</style>
