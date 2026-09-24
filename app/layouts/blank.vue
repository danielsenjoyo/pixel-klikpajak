<script setup lang="ts">
import { MpToastManager } from '@mekari/pixel3'

// No-chrome shell for auth, onboarding, public and print pages
// (source layouts: Blank / Plain / MekariPixelPlain).
// Use via definePageMeta({ layout: 'blank' }).
</script>

<template>
  <div class="kp-blank">
    <slot />
    <MpToastManager />
  </div>
</template>

<style scoped>
.kp-blank {
  min-height: 100dvh;
  background: var(--mp-colors-background-stage);
}
</style>
