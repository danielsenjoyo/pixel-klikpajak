<script setup lang="ts">
import { MpSkeleton } from '@mekari/pixel3'
import { MODULES } from '~/data/subscription'

/**
 * Placeholder while the package and quota data loads.
 *
 * Mirrors the real layout (one package card, then one card per module) so the content
 * does not jump when the data lands. Like the error state it shows no figures: a
 * half-rendered 0 reads as "kuota habis", and that is the one misreading on this screen
 * that costs the customer money.
 */
</script>

<template>
  <div class="quota-loading" role="status" aria-busy="true" aria-label="Memuat data kuota">
    <div class="quota-loading__package">
      <MpSkeleton width="120px" height="12px" rounded="sm" />
      <MpSkeleton width="220px" height="24px" rounded="sm" />
      <MpSkeleton width="280px" height="12px" rounded="sm" />
    </div>

    <div class="quota-loading__modules">
      <div v-for="m in MODULES" :key="m.id" class="quota-loading__module">
        <MpSkeleton width="140px" height="14px" rounded="sm" />
        <MpSkeleton width="90px" height="24px" rounded="sm" />
        <MpSkeleton width="100%" height="6px" rounded="sm" />
        <MpSkeleton width="120px" height="12px" rounded="sm" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.quota-loading {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-6);
}

.quota-loading__package {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-5);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
}

.quota-loading__modules {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-spacing-4);
}

.quota-loading__module {
  display: flex;
  flex: 1 1 220px;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-4);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
}

@media (max-width: 991px) {
  .quota-loading__modules {
    flex-direction: column;
  }
}
</style>
