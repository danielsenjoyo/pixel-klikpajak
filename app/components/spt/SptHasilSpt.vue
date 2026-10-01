<script setup lang="ts">
import { MpBadge, MpBanner, MpBannerDescription, MpText } from '@mekari/pixel3'
import type { HasilSpt } from '~/data/spt1771Induk'
import { formatRp } from '~/utils/currency'

// Hasil SPT — the three-state result of angka 17c (brief §5). It sits directly under
// the 17c row rather than in a banner of its own, and stays an estimate until every
// required lampiran and field is filled.
const props = defineProps<{ hasil: HasilSpt }>()

const BADGE: Record<HasilSpt['state'], 'warning' | 'completed' | 'information'> = {
  kb: 'warning',
  nihil: 'completed',
  lb: 'information',
}
const badgeType = computed(() => BADGE[props.hasil.state])
</script>

<template>
  <div id="induk-hasil" class="spt-hasil" :class="[`spt-hasil--${hasil.state}`, { 'spt-hasil--estimasi': !hasil.isFinal }]">
    <div class="spt-hasil__head">
      <MpText size="label-small" weight="semiBold" color="text.secondary">Hasil SPT</MpText>
      <MpBadge for="additionalInformation" :type="badgeType">{{ hasil.label }}</MpBadge>
      <MpBadge for="tableStatus" :type="hasil.isFinal ? 'completed' : 'announcement'">
        {{ hasil.isFinal ? 'Final' : 'Estimasi sementara' }}
      </MpBadge>
    </div>

    <MpText v-if="hasil.state !== 'nihil'" as="p" size="h2" weight="semiBold" class="spt-hasil__amount">
      {{ formatRp(hasil.amount) }}
    </MpText>

    <MpBanner v-if="hasil.state === 'kb'" id="induk-hasil-kb" variant="warning" is-inline>
      <MpBannerDescription>Pastikan deposit pajak di Coretax mencukupi untuk lanjut ke pelaporan.</MpBannerDescription>
    </MpBanner>
    <MpText v-else-if="hasil.state === 'lb'" as="p" size="body" color="text.secondary" class="spt-hasil__note">
      Lengkapi permohonan pengembalian pada angka 19a dan informasi rekening pada angka 19b di bawah.
    </MpText>
    <MpText v-else as="p" size="body" color="text.secondary" class="spt-hasil__note">
      Tidak ada PPh yang kurang atau lebih dibayar. SPT dapat langsung dilanjutkan ke pelaporan.
    </MpText>

    <MpText v-if="!hasil.isFinal" as="p" size="body-small" color="text.secondary" class="spt-hasil__note">
      Angka ini masih berubah selama data SPT belum lengkap.
    </MpText>
  </div>
</template>

<style scoped>
.spt-hasil {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  margin-bottom: var(--mp-spacing-5);
  padding: var(--mp-spacing-4);
  border: 1px solid var(--mp-colors-border-default);
  border-left: 4px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-surface);
}
.spt-hasil--kb {
  border-left-color: var(--mp-colors-background-warning-bold);
}
.spt-hasil--lb {
  border-left-color: var(--mp-colors-background-information-bold);
}
.spt-hasil--nihil {
  border-left-color: var(--mp-colors-background-success-bold);
}

.spt-hasil__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-2);
}

.spt-hasil__amount {
  align-self: flex-start;
  margin: 0;
}
/* Dashed underline while provisional, so an estimate never reads as a settled number. */
.spt-hasil--estimasi .spt-hasil__amount {
  border-bottom: 1px dashed var(--mp-colors-border-default);
  color: var(--mp-colors-text-secondary);
}

.spt-hasil__note {
  margin: 0;
}
</style>
