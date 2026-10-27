<script setup lang="ts">
import { MpBanner, MpBannerDescription, MpButton, MpIcon, MpText } from '@mekari/pixel3'

// Lampiran 1 before any data: where the books come from (L1 PRD US-002). Connected to
// Jurnal → pull; not connected → the manual grid and the DJP template import below (AC-005).
defineProps<{
  isConnected: boolean
  isLoading: boolean
  /** Last pull failure — the draft is untouched (AC-006). */
  error: string | null
  isReadOnly?: boolean
}>()
const emit = defineEmits<{ pull: [] }>()
</script>

<template>
  <section class="spt-erp-source" aria-labelledby="l1-erp-title">
    <span class="spt-erp-source__icon" aria-hidden="true">
      <MpIcon name="jurnal-outline" />
    </span>
    <div class="spt-erp-source__body">
      <MpText id="l1-erp-title" as="h3" size="body" weight="semiBold">
        {{ isConnected ? 'Tarik data dari Jurnal' : 'Pembukuan belum terhubung dengan Jurnal' }}
      </MpText>
      <MpText v-if="isConnected" as="p" size="body-small" color="text.secondary">
        Saldo setiap akun Jurnal tahun pajak ini ditarik dan dipetakan otomatis ke akun DJP. Anda tinggal
        memeriksa pemetaan dan mengisi penyesuaian fiskal per akun — Lampiran 1 disusun dari hasilnya.
      </MpText>
      <MpText v-else as="p" size="body-small" color="text.secondary">
        Isi Lampiran 1 di bawah secara manual, atau impor laporan keuangan dengan template DJP.
      </MpText>

      <MpBanner v-if="error" id="l1-erp-error" :key="error" variant="critical" is-inline class="spt-erp-source__error">
        <MpBannerDescription>
          Gagal menarik data dari Jurnal: {{ error }} Data yang sudah diisi tidak berubah. Coba lagi beberapa saat lagi.
        </MpBannerDescription>
      </MpBanner>
    </div>
    <MpButton
      v-if="isConnected && !isReadOnly"
      id="l1-erp-pull"
      left-icon="refresh"
      :is-loading="isLoading"
      class="spt-erp-source__action"
      @click="emit('pull')"
    >
      Tarik data dari Jurnal
    </MpButton>
  </section>
</template>

<style scoped>
.spt-erp-source {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-spacing-4);
  margin: 0 0 var(--mp-spacing-5);
  padding: var(--mp-spacing-4);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-neutral-subtle);
}

.spt-erp-source__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--mp-spacing-10);
  height: var(--mp-spacing-10);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-surface);
}

.spt-erp-source__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  min-width: 0;
}
.spt-erp-source__body p,
.spt-erp-source__body h3 {
  margin: 0;
}

.spt-erp-source__error {
  margin-top: var(--mp-spacing-2);
}

.spt-erp-source__action {
  flex-shrink: 0;
}
</style>
