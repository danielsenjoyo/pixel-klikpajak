<script setup lang="ts">
import {
  MpBanner,
  MpBannerDescription,
  MpButton,
  MpModal,
  MpModalBody,
  MpModalCloseButton,
  MpModalContent,
  MpModalFooter,
  MpModalHeader,
  MpModalOverlay,
  MpSegmentedControl,
  MpTab,
  MpTabList,
  MpTabs,
  MpText,
  toast,
} from '@mekari/pixel3'
import SptCoaTable from '~/components/spt/l1/SptCoaTable.vue'
import SptErpSourceCard from '~/components/spt/l1/SptErpSourceCard.vue'
import {
  buildWorkspace,
  isProfitLoss,
  mappingOf,
  remapForSektor,
  rollUp,
  sektorFromIndustry,
  unmappedLines,
} from '~/data/coaMapping'
import type { Company } from '~/data/session'
import type { ImportCtx } from '~/data/spt1771Import'
import { lampiran1Import, type L1Payload } from '~/data/spt1771ImportSpecs'
import {
  EXPENSE_C10_NOTE,
  SEKTOR_USAHA,
  penghasilanNetoFiskal,
  posisiKeuanganValue,
  sectorRows,
  type Lampiran1Data,
} from '~/data/spt1771Lampiran1'
import { postedAtLabel } from '~/data/sptTahunanBadan'
import { formatRp } from '~/utils/currency'

// Lampiran 1 (Figma "SPT / lampiran 1A / A|B"): business sector, then tabs for
// A. Laporan Laba Rugi and B. Laporan Posisi Keuangan.
//
// Two ways in (L1 — Fiscal Reconciliation PRD):
//  - books connected to Jurnal → "Tarik data dari Jurnal": a per-CoA workspace (each CoA mapped
//    to DJP, then its fiscal correction under the same row) whose roll-up is written into `labaRugi` / `posisiKeuangan`,
//    so Induk D.4, Lampiran 11B and validation read it exactly as they read a typed grid;
//  - not connected → the DJP grid typed by hand or imported from DJP's template (AC-005).
const props = defineProps<{ importCtx: ImportCtx, company: Company, isReadOnly?: boolean }>()
const data = defineModel<Lampiran1Data>({ required: true })
/** Open tab as a letter ("a" | "b"), held by the page so an issue can jump to it. */
const part = defineModel<string>('part', { default: '' })

const TAB_KEYS = ['a', 'b']
const tab = computed({
  get: () => Math.max(0, TAB_KEYS.indexOf(part.value)),
  set: (i: number) => { part.value = TAB_KEYS[i] ?? 'a' },
})
const sektor = computed(() => SEKTOR_USAHA.find(s => s.value === data.value.sektor) ?? SEKTOR_USAHA[0]!)
const rows = computed(() => sectorRows(data.value.sektor))
// BC01's totals are hand-verified against Figma; BC02–BC12 are derived from the DJP
// workbook and still awaiting Tax/Legal sign-off (see spt1771Lampiran1Sectors.ts).
const isDerived = computed(() => data.value.sektor !== 'BC01')

const jumlahAset = computed(() => posisiKeuanganValue(data.value, '1700'))
const jumlahPasiva = computed(() => posisiKeuanganValue(data.value, '3300'))
const isBalanced = computed(() => jumlahAset.value === jumlahPasiva.value)

// ── Import laporan keuangan (DJP template CIT_L1x, one per sektor) ───────────
const isImportOpen = ref(false)
const importSpec = computed(() => lampiran1Import(data.value))
const hasValue = (v: unknown) => v !== null && v !== undefined && v !== ''
/** Accounts already carrying a value — the modal offers "Ganti" only when there are some. */
const filledAccounts = computed(() =>
  Object.values(data.value.labaRugi).filter(v => Object.values(v).some(hasValue)).length
  + Object.values(data.value.posisiKeuangan).filter(hasValue).length)

/**
 * "Perbarui" writes only the accounts in the file. "Ganti" first clears each statement
 * the file carries — a file with only the Laba Rugi sheet leaves the neraca alone.
 */
function applyImport(payload: L1Payload, mode: 'append' | 'replace') {
  const labaRugi = mode === 'replace' && payload.hasLabaRugi ? {} : { ...data.value.labaRugi }
  const posisi = mode === 'replace' && payload.hasPosisi ? {} : { ...data.value.posisiKeuangan }
  for (const [code, v] of Object.entries(payload.labaRugi)) labaRugi[code] = { ...labaRugi[code], ...v }
  Object.assign(posisi, payload.posisiKeuangan)
  data.value = { ...data.value, labaRugi, posisiKeuangan: posisi }
  const n = Object.keys(payload.labaRugi).length + Object.keys(payload.posisiKeuangan).length
  toast.notify({ id: 'toast-l1-imported', variant: 'success', title: `${n} akun berhasil diimpor` })
}

// ── Jurnal (ERP) ─────────────────────────────────────────────────────────────
const erp = useJurnalErp()
/** Rekonsiliasi fiskal from Jurnal ships in 27Q1; 26Q4 is the manual grid + DJP import only. */
const { has } = usePrototypeVersion()
const hasJurnal = computed(() => has('27Q1'))
const isConnected = computed(() => hasJurnal.value && erp.isConnected(props.company))
const isPulling = ref(false)
const pullError = ref<string | null>(null)

async function pull() {
  isPulling.value = true
  pullError.value = null
  try {
    const result = await erp.pull(props.importCtx.year)
    const saved = erp.savedMapping(props.company, data.value.sektor)
    const ws = buildWorkspace(result, data.value.sektor, saved, data.value.erp)
    data.value = { ...data.value, erp: ws }
    const reused = ws.lines.filter(l => l.djpSource === 'reuse').length
    toast.notify({
      id: 'toast-l1-pulled',
      variant: 'success',
      title: `${result.accounts.length} akun ditarik dari Jurnal${reused ? ` · ${reused} memakai pemetaan sebelumnya` : ''}`,
    })
  }
  catch (e) {
    // AC-006: the draft is untouched — only the message changes.
    pullError.value = e instanceof Error ? e.message : 'Terjadi kesalahan.'
  }
  finally {
    isPulling.value = false
  }
}

/** Roll the per-CoA reconciliation up into the DJP Lampiran 1A the rest of the return reads. */
watch(() => data.value.erp && JSON.stringify([data.value.erp.lines, data.value.sektor]), () => {
  const ws = data.value.erp
  if (!ws) return
  const next = rollUp(ws, data.value.sektor)
  if (JSON.stringify(next.labaRugi) !== JSON.stringify(data.value.labaRugi)) data.value.labaRugi = next.labaRugi
  if (JSON.stringify(next.posisiKeuangan) !== JSON.stringify(data.value.posisiKeuangan)) data.value.posisiKeuangan = next.posisiKeuangan
}, { immediate: true })

/** Induk B.1 changed: re-map the lines the new sektor's schema cannot take. */
watch(() => data.value.sektor, (s) => {
  if (data.value.erp) data.value.erp = remapForSektor(data.value.erp, s, erp.savedMapping(props.company, s))
})

/** PRD §8 — the sektor from company setup and Induk B.1 disagree: say so, let the preparer choose. */
const suggestedSektor = computed(() => {
  const code = sektorFromIndustry(props.company.industry)
  return code && code !== data.value.sektor ? SEKTOR_USAHA.find(s => s.value === code) : undefined
})
function useSuggestedSektor() {
  if (suggestedSektor.value) data.value.sektor = suggestedSektor.value.value
}

/** Unmapped CoA per tab, so the header never counts accounts the open tab does not show. */
const unmapped = computed(() => {
  const lines = data.value.erp ? unmappedLines(data.value.erp) : []
  const lr = lines.filter(l => isProfitLoss(l.cls)).length
  return { lr, pk: lines.length - lr }
})
const unmappedLabel = computed(() => {
  const { lr, pk } = unmapped.value
  const parts = [lr && `${lr} di laba rugi`, pk && `${pk} di posisi keuangan`].filter(Boolean)
  return parts.length ? `Belum dipetakan: ${parts.join(' · ')}` : ''
})
const pulledAtLabel = computed(() => (data.value.erp ? postedAtLabel({ postedAt: data.value.erp.pulledAt }) : null))

/** AC-007: the confirmed mapping is remembered for this company and sektor (US-006). */
function confirmMapping() {
  if (!data.value.erp) return
  const mapping = mappingOf(data.value.erp)
  erp.confirmMapping(props.company, data.value.sektor, mapping)
  toast.notify({
    id: 'toast-l1-mapping',
    variant: 'success',
    title: `Pemetaan ${Object.keys(mapping).length} akun disimpan untuk SPT berikutnya`,
  })
}

const isDetachOpen = ref(false)
/** Back to the DJP grid; the rolled-up figures stay so nothing typed is lost. */
function detach() {
  const { erp: _erp, ...rest } = data.value
  data.value = rest
  isDetachOpen.value = false
  part.value = 'a'
}

const view = ref<'jurnal' | 'djp'>('jurnal')
const statement = computed(() => (tab.value === 1 ? 'posisi-keuangan' as const : 'laba-rugi' as const))
const viewOptions = [
  { id: 'l1-view-jurnal', label: 'Per akun Jurnal', value: 'jurnal' },
  { id: 'l1-view-djp', label: 'Per akun DJP', value: 'djp' },
]

</script>

<template>
  <div class="spt-l1">
    <div class="spt-l1__head">
      <MpText as="h2" size="h2" weight="semiBold" class="spt-l1__title">Lampiran {{ sektor.lampiran }} — Rekonsiliasi Laporan Keuangan</MpText>
      <div v-if="!isReadOnly" class="spt-l1__actions">
        <template v-if="data.erp">
          <MpButton id="l1-erp-detach" variant="ghost" @click="isDetachOpen = true">Isi manual</MpButton>
          <MpButton id="l1-erp-repull" variant="secondary" left-icon="refresh" :is-loading="isPulling" @click="pull">Tarik ulang</MpButton>
        </template>
        <MpButton v-else id="l1-import" variant="secondary" left-icon="upload" class="spt-l1__import" @click="isImportOpen = true">
          Impor laporan keuangan
        </MpButton>
      </div>
    </div>
    <MpText as="p" size="body" color="text.secondary" class="spt-l1__subtitle-variant">
      Sektor usaha: <strong>{{ sektor.label }}</strong> — dipilih pada SPT Induk bagian B
      <template v-if="data.erp"> · Sumber data: <strong>Jurnal</strong>, ditarik {{ pulledAtLabel }}</template>
    </MpText>

    <p v-if="isDerived" class="spt-l1__note" role="status">
      Subtotal pada Lampiran {{ sektor.lampiran }} dihitung dari struktur formulir DJP dan masih menunggu verifikasi. Periksa kembali sebelum melapor.
    </p>

    <SptErpSourceCard
      v-if="hasJurnal && !data.erp"
      :is-connected="isConnected"
      :is-loading="isPulling"
      :error="pullError"
      :is-read-only="isReadOnly"
      @pull="pull"
    />

    <!-- ── Data from Jurnal: per-CoA workspace ─────────────────────────────── -->
    <template v-if="data.erp">
      <MpBanner v-if="pullError" id="l1-erp-repull-error" :key="pullError" variant="critical" is-inline class="spt-l1__banner">
        <MpBannerDescription>Gagal menarik ulang data dari Jurnal: {{ pullError }} Data sebelumnya tetap dipakai.</MpBannerDescription>
      </MpBanner>
      <MpBanner v-if="suggestedSektor && !isReadOnly" :id="`l1-sektor-suggest-${suggestedSektor.value}`" :key="suggestedSektor.value" variant="information" is-inline class="spt-l1__banner">
        <MpBannerDescription>
          Industri perusahaan ({{ company.industry }}) umumnya memakai sektor <strong>{{ suggestedSektor.label }}</strong>,
          sedangkan SPT Induk memakai sektor {{ sektor.label }}.
          <!-- pixel-police-allow: inline text action inside banner copy — no Pixel inline-link button -->
          <button id="l1-sektor-suggest-apply" type="button" class="spt-l1__inline-action" @click="useSuggestedSektor">Gunakan sektor {{ suggestedSektor.label }}</button>
        </MpBannerDescription>
      </MpBanner>

      <!-- Per CoA: map to a DJP account, then (Laba Rugi) the fiscal correction under the same row. -->
      <MpTabs id="l1-tabs" v-model="tab" is-manual>
        <MpTabList>
          <MpTab id="l1-tab-a">A. Laba Rugi &amp; Koreksi Fiskal</MpTab>
          <MpTab id="l1-tab-b">B. Posisi Keuangan</MpTab>
        </MpTabList>
      </MpTabs>

      <div class="spt-l1__bar">
        <MpSegmentedControl id="l1-view" v-model="view" name="l1-view" :data="viewOptions" />
        <div class="spt-l1__bar-end">
          <MpText v-if="unmappedLabel" size="body-small" class="spt-l1__unmapped">{{ unmappedLabel }}</MpText>
          <MpButton v-if="!isReadOnly" id="l1-mapping-confirm" size="sm" variant="secondary" @click="confirmMapping">Simpan pemetaan</MpButton>
        </div>
      </div>

      <SptCoaTable
        v-if="view === 'jurnal'"
        v-model="data.erp"
        :statement="statement"
        :sektor="data.sektor"
        :is-read-only="isReadOnly"
      />
      <!-- Per akun DJP: the full Lampiran 1A as DJP gets it — every row and subtotal, rolled up from the CoA. -->
      <template v-else>
        <div class="spt-l1__djp-note">
          <MpText size="body-small" color="text.secondary">
            Lampiran {{ sektor.lampiran }} bagian {{ tab === 1 ? 'B' : 'A' }} seperti yang dilaporkan ke DJP, dijumlahkan dari akun Jurnal. Ubah isinya di Per akun Jurnal.
          </MpText>
          <MpButton v-if="!isReadOnly" id="l1-djp-view-edit" size="sm" variant="secondary" @click="view = 'jurnal'">Ubah di Per akun Jurnal</MpButton>
        </div>
        <SptAccountTable v-model="data" :mode="statement" :rows="tab === 1 ? rows.posisiKeuangan : rows.labaRugi" is-read-only display />
      </template>

      <MpText v-if="tab !== 1" as="p" size="body-small" color="text.secondary" class="spt-l1__formula-note">{{ EXPENSE_C10_NOTE }}</MpText>
      <div v-if="tab !== 1" class="spt-l1__summary">
        <MpText size="body" weight="semiBold">Penghasilan neto fiskal sebelum fasilitas — kolom (10)</MpText>
        <MpText size="body" weight="semiBold">{{ formatRp(penghasilanNetoFiskal(data)) }}</MpText>
      </div>
      <template v-else>
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

    </template>

    <!-- Outside the Jurnal block: confirming removes `erp`, which would unmount a modal still animating. -->
    <MpModal id="l1-detach-modal" :is-open="isDetachOpen" size="sm" @close="isDetachOpen = false">
      <MpModalContent>
        <MpModalHeader>
          Isi Lampiran 1 secara manual?
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText>
            Pemetaan dan rekonsiliasi per akun Jurnal akan dilepas. Nilai Lampiran 1 yang sudah terhitung tetap ada dan
            dapat Anda ubah langsung per akun DJP.
          </MpText>
        </MpModalBody>
        <MpModalFooter>
          <div class="spt-l1__modal-actions">
            <MpButton id="l1-detach-cancel" variant="ghost" @click="isDetachOpen = false">Batalkan</MpButton>
            <MpButton id="l1-detach-confirm" @click="detach">Isi manual</MpButton>
          </div>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>

    <!-- ── Manual: DJP grid (typed or imported) ─────────────────────────────── -->
    <template v-if="!data.erp">
      <MpTabs id="l1-tabs" v-model="tab" is-manual>
        <MpTabList>
          <MpTab id="l1-tab-a">A. Laporan Laba Rugi</MpTab>
          <MpTab id="l1-tab-b">B. Laporan Posisi Keuangan</MpTab>
        </MpTabList>
      </MpTabs>

      <template v-if="tab !== 1">
        <MpText as="h3" size="h3" weight="semiBold" class="spt-l1__subtitle">A. Laporan Laba Rugi</MpText>
        <SptAccountTable v-model="data" mode="laba-rugi" :rows="rows.labaRugi" :is-read-only="isReadOnly" />
        <MpText as="p" size="body-small" color="text.secondary" class="spt-l1__formula-note">{{ EXPENSE_C10_NOTE }}</MpText>
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

      <SptImportModal
        id="l1-import-modal"
        v-model:open="isImportOpen"
        :spec="importSpec"
        :ctx="importCtx"
        :existing="filledAccounts"
        @apply="applyImport"
      />
    </template>
  </div>
</template>

<style scoped>
.spt-l1 {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spt-l1__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
  margin: 0 0 var(--mp-spacing-4);
}

.spt-l1__title {
  margin: 0;
}

.spt-l1__import {
  flex-shrink: 0;
}

.spt-l1__actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--mp-spacing-2);
}

.spt-l1__banner {
  margin: 0 0 var(--mp-spacing-4);
}

.spt-l1__inline-action {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--mp-colors-text-link);
  font: inherit;
  font-weight: var(--mp-font-weights-semi-bold);
  cursor: pointer;
}

.spt-l1__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-3);
  margin: var(--mp-spacing-4) 0;
}

.spt-l1__bar-end {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-3);
}

.spt-l1__unmapped {
  color: var(--mp-colors-text-danger);
}

.spt-l1__formula-note {
  margin: var(--mp-spacing-2) 0 0;
}

.spt-l1__djp-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-3);
  margin: 0 0 var(--mp-spacing-3);
}

.spt-l1__modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-spacing-2);
  width: 100%;
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
