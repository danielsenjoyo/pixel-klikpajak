<script setup lang="ts">
import { MpTab, MpTabList, MpTabs, MpText } from '@mekari/pixel3'
import {
  SEKTOR_USAHA,
  penghasilanNetoFiskal,
  posisiKeuanganValue,
  sectorRows,
  type Lampiran1Data,
} from '~/data/spt1771Lampiran1'
import { formatRp } from '~/utils/currency'

// Lampiran 1 (Figma "SPT / lampiran 1A / A|B"): business sector, then tabs for
// A. Laporan Laba Rugi and B. Laporan Posisi Keuangan.
defineProps<{ isReadOnly?: boolean }>()
const data = defineModel<Lampiran1Data>({ required: true })

const tab = ref(0)
const sektor = computed(() => SEKTOR_USAHA.find(s => s.value === data.value.sektor) ?? SEKTOR_USAHA[0]!)
const rows = computed(() => sectorRows(data.value.sektor))
// BC01's totals are hand-verified against Figma; BC02–BC12 are derived from the DJP
// workbook and still awaiting Tax/Legal sign-off (see spt1771Lampiran1Sectors.ts).
const isDerived = computed(() => data.value.sektor !== 'BC01')

const jumlahAset = computed(() => posisiKeuanganValue(data.value, '1700'))
const jumlahPasiva = computed(() => posisiKeuanganValue(data.value, '3300'))
const isBalanced = computed(() => jumlahAset.value === jumlahPasiva.value)
</script>

<template>
  <div class="spt-l1">
    <MpText as="h2" size="h2" weight="semiBold" class="spt-l1__title">Lampiran {{ sektor.lampiran }} — Rekonsiliasi Laporan Keuangan</MpText>
    <MpText as="p" size="body" color="text.secondary" class="spt-l1__subtitle-variant">
      Sektor usaha: <strong>{{ sektor.label }}</strong> — dipilih pada SPT Induk bagian B
    </MpText>

    <p v-if="isDerived" class="spt-l1__note" role="status">
      Subtotal pada Lampiran {{ sektor.lampiran }} dihitung dari struktur formulir DJP dan masih menunggu verifikasi. Periksa kembali sebelum melapor.
    </p>

    <MpTabs id="l1-tabs" v-model="tab" is-manual>
      <MpTabList>
        <MpTab id="l1-tab-a">A. Laporan Laba Rugi</MpTab>
        <MpTab id="l1-tab-b">B. Laporan Posisi Keuangan</MpTab>
      </MpTabList>
    </MpTabs>

    <template v-if="tab === 0">
      <MpText as="h3" size="h3" weight="semiBold" class="spt-l1__subtitle">A. Laporan Laba Rugi</MpText>
      <SptAccountTable v-model="data" mode="laba-rugi" :rows="rows.labaRugi" :is-read-only="isReadOnly" />
      <div class="spt-l1__summary">
        <MpText size="body" weight="semiBold">Penghasilan neto fiskal sebelum fasilitas — kolom (10)</MpText>
        <MpText size="body" weight="semiBold">{{ formatRp(penghasilanNetoFiskal(data)) }}</MpText>
      </div>
    </template>
    <template v-else>
      <MpText as="h3" size="h3" weight="semiBold" class="spt-l1__subtitle">B. Laporan Posisi Keuangan</MpText>
      <SptAccountTable v-model="data" mode="posisi-keuangan" :rows="rows.posisiKeuangan" :is-read-only="isReadOnly" />
      <div class="spt-l1__summary">
        <MpText size="body" weight="semiBold">Jumlah aset</MpText>
        <MpText size="body" weight="semiBold">{{ formatRp(jumlahAset) }}</MpText>
      </div>
      <div class="spt-l1__summary">
        <MpText size="body" weight="semiBold">Jumlah liabilitas dan ekuitas</MpText>
        <MpText size="body" weight="semiBold">{{ formatRp(jumlahPasiva) }}</MpText>
      </div>
      <p v-if="!isBalanced" class="spt-l1__warning" role="status">
        Jumlah aset ({{ formatRp(jumlahAset) }}) belum sama dengan jumlah liabilitas dan ekuitas ({{ formatRp(jumlahPasiva) }}).
      </p>
    </template>
  </div>
</template>

<style scoped>
.spt-l1 {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spt-l1__title {
  margin: 0 0 var(--mp-spacing-4);
}

.spt-l1__subtitle-variant {
  margin: 0 0 var(--mp-spacing-5);
}

.spt-l1__subtitle {
  margin: 0 0 var(--mp-spacing-4);
}

/* Same "Jumlah …" footer the lampiran tables use (SptTableBlock summary). */
.spt-l1__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-4) 0;
  border-top: 1px solid var(--mp-colors-border-default);
}
.spt-l1__summary:last-of-type {
  border-bottom: 1px solid var(--mp-colors-border-default);
}

.spt-l1__note {
  margin: var(--mp-spacing-3) 0 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-md);
}

.spt-l1__warning {
  margin: var(--mp-spacing-3) 0 0;
  color: var(--mp-colors-text-danger);
  font-size: var(--mp-font-sizes-md);
}
</style>
