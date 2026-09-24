<script setup lang="ts">
import { MpDivider, MpText } from '@mekari/pixel3'

// Form section (Figma "block"): H3 title, fields, divider. Content column is 640px.
defineProps<{ id?: string, title: string, level?: 'h2' | 'h3' }>()
</script>

<template>
  <section :id="id" class="kp-form-section">
    <MpText :as="level ?? 'h3'" :size="level === 'h2' ? 'h2' : 'h3'" weight="semiBold" class="kp-form-section__title">{{ title }}</MpText>
    <div class="kp-form-section__body">
      <slot />
    </div>
    <MpDivider class="kp-form-section__divider" />
  </section>
</template>

<style scoped>
.kp-form-section {
  display: flex;
  flex-direction: column;
  max-width: 640px;
  padding-bottom: var(--mp-spacing-4);
}

.kp-form-section__title {
  margin: 0;
  padding-bottom: var(--mp-spacing-4);
}

.kp-form-section__body {
  display: flex;
  flex-direction: column;
}

.kp-form-section__divider {
  margin-top: var(--mp-spacing-1);
}
</style>
