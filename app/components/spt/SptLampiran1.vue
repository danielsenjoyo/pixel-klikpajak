<script setup lang="ts">
import { MpFormControl, MpFormLabel, MpSelect, MpTab, MpTabList, MpTabs, MpText } from '@mekari/pixel3'
import {
  SEKTOR_USAHA,
  labaRugiRows,
  posisiKeuanganRows,
  posisiKeuanganValue,
  type Lampiran1Data,
} from '~/data/spt1771Lampiran1'
import { formatRp } from '~/utils/currency'

// Lampiran 1 (Figma "SPT / lampiran 1A / A|B"): business sector, then tabs for
// A. Laporan Laba Rugi and B. Laporan Posisi Keuangan.
defineProps<{ isReadOnly?: boolean }>()
const data = defineModel<Lampiran1Data>({ required: true })

const tab = ref(0)
const sektor = computed(() => SEKTOR_USAHA.find(s => s.value === data.value.sektor) ?? SEKTOR_USAHA[0])

const jumlahAset = computed(() => posisiKeuanganValue(data.value, '1700'))
const jumlahPasiva = computed(() => posisiKeuanganValue(data.value, '3300'))
const isBalanced = computed(() => jumlahAset.value === jumlahPasiva.value)
</script>

<template>
  <div class="spt-l1">
    <MpText as="h2" size="h2" weight="semiBold" class="spt-l1__title">Lampiran {{ sektor.lampiran }}</MpText>

    <MpFormControl id="l1-sektor-control" class="spt-l1__sektor">
      <MpFormLabel>Jenis sektor usaha</MpFormLabel>
      <MpSelect id="l1-sektor" v-model="data.sektor" :is-disabled="isReadOnly" is-full-width>
        <option v-for="s in SEKTOR_USAHA" :key="s.value" :value="s.value">{{ s.label }}</option>
      </MpSelect>
    </MpFormControl>

    <MpTabs id="l1-tabs" v-model="tab" is-manual>
      <MpTabList>
        <MpTab id="l1-tab-a">A. Laporan Laba Rugi</MpTab>
        <MpTab id="l1-tab-b">B. Laporan Posisi Keuangan</MpTab>
      </MpTabList>
    </MpTabs>

    <template v-if="tab === 0">
      <MpText as="h3" size="h3" weight="semiBold" class="spt-l1__subtitle">A. Laporan Laba Rugi</MpText>
      <SptAccountTable v-model="data" mode="laba-rugi" :rows="labaRugiRows" :is-read-only="isReadOnly" />
    </template>
    <template v-else>
      <MpText as="h3" size="h3" weight="semiBold" class="spt-l1__subtitle">B. Laporan Posisi Keuangan</MpText>
      <SptAccountTable v-model="data" mode="posisi-keuangan" :rows="posisiKeuanganRows" :is-read-only="isReadOnly" />
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

.spt-l1__sektor {
  width: 308px;
  max-width: 100%;
  padding-bottom: var(--mp-spacing-5);
}

.spt-l1__subtitle {
  margin: 0 0 var(--mp-spacing-4);
}

.spt-l1__warning {
  margin: var(--mp-spacing-3) 0 0;
  color: var(--mp-colors-text-danger);
  font-size: var(--mp-font-sizes-md);
}
</style>
