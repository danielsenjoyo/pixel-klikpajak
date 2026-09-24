<script setup lang="ts">
import { MpIcon, MpText } from '@mekari/pixel3'

// Stand-in for lampiran whose Figma frames are not ported yet (docs/ROADMAP.md).
defineProps<{ title: string }>()
</script>

<template>
  <div class="spt-placeholder">
    <MpText as="h2" size="h2" weight="semiBold" class="spt-placeholder__title">{{ title }}</MpText>
    <div class="spt-placeholder__card">
      <MpIcon name="progress" size="md" color="icon.subtle" />
      <MpText weight="semiBold">Formulir {{ title }} belum dipindahkan</MpText>
      <MpText color="text.secondary">Bagian ini akan dibangun dari Figma SPT Tahunan Badan pada tahap berikutnya.</MpText>
    </div>
  </div>
</template>

<style scoped>
.spt-placeholder__title {
  margin: 0 0 var(--mp-spacing-4);
}

.spt-placeholder__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-spacing-2);
  max-width: 640px;
  padding: var(--mp-spacing-12) var(--mp-spacing-6);
  border: 1px dashed var(--mp-colors-border-default);
  border-radius: var(--mp-radii-lg);
  text-align: center;
}
</style>
