<script setup lang="ts">
import { MpBanner, MpBannerDescription, MpBannerIcon, MpBannerTitle, MpButton } from '@mekari/pixel3'

/**
 * Shown when the package/quota data cannot be loaded.
 *
 * Two deliberate decisions, both about not causing a wrong purchase:
 *   1. No numbers. A failed load that renders 0 reads as "quota habis", and the natural
 *      response to that is to buy quota the customer may already have.
 *   2. No "Tambah kuota" CTA. Buying is exactly what nobody should do while the real
 *      balance is unknown, so the only action offered is to try again.
 */
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="quota-error">
    <MpBanner id="quota-load-error" variant="danger">
      <MpBannerIcon id="quota-load-error-icon" />
      <MpBannerTitle id="quota-load-error-title">Gagal memuat data kuota</MpBannerTitle>
      <MpBannerDescription id="quota-load-error-desc">
        Kami belum bisa mengambil data langganan dan kuota Anda. Jumlah kuota sengaja tidak
        ditampilkan agar Anda tidak menambah kuota berdasarkan data yang belum tentu benar.
      </MpBannerDescription>
    </MpBanner>

    <div class="quota-error__action">
      <MpButton id="quota-load-error-retry" variant="secondary" left-icon="refresh" @click="emit('retry')">
        Coba lagi
      </MpButton>
    </div>
  </div>
</template>

<style scoped>
.quota-error {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4);
  align-items: flex-start;
}
</style>
