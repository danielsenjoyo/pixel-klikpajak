<script setup lang="ts">
import { MpText } from '@mekari/pixel3'

// Empty / filtered-empty state (Figma "Blank Slate"): illustration, title, description.
defineProps<{ image: string, title: string, description?: string }>()
</script>

<template>
  <div class="kp-blank-slate">
    <img :src="image" alt="" class="kp-blank-slate__image" width="288" height="240" />
    <MpText as="p" weight="semiBold" class="kp-blank-slate__title">{{ title }}</MpText>
    <MpText v-if="description" as="p" color="text.secondary">{{ description }}</MpText>
    <div v-if="$slots.default" class="kp-blank-slate__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.kp-blank-slate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-spacing-1);
  padding: var(--mp-spacing-5) var(--mp-spacing-6) var(--mp-spacing-10);
  text-align: center;
}

.kp-blank-slate__image {
  width: 288px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.kp-blank-slate__title {
  font-size: var(--mp-font-sizes-lg);
  line-height: var(--mp-line-heights-lg);
}

.kp-blank-slate__actions {
  margin-top: var(--mp-spacing-3);
}
</style>
