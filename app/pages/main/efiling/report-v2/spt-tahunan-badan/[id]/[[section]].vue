<script setup lang="ts">
import {
  MpButton,
  MpModal,
  MpModalBody,
  MpModalCloseButton,
  MpModalContent,
  MpModalFooter,
  MpModalHeader,
  MpModalOverlay,
  MpText,
  toast,
} from '@mekari/pixel3'
import blankSlateImage from '~/assets/images/blankslate-spt.png'
import { missingLampiran, sectionStates } from '~/data/spt1771Checkpoints'
import { blockValues, num } from '~/data/spt1771Engine'
import { computeInduk, missingFields } from '~/data/spt1771Induk'
import { lampiranDef } from '~/data/spt1771LampiranDefs'
import { SEKTOR_USAHA, penghasilanNetoFiskal } from '~/data/spt1771Lampiran1'
import { LIST_PATH, detailPath, findSection, isLocked, masaLabel } from '~/data/sptTahunanBadan'

// Lapor SPT Tahunan Badan — Figma "SPT-Tahunan-Badan › --> SPT":
// page title (breadcrumb, Download petunjuk pengisian, Lapor SPT), in-page section
// menu with checkpoints, SPT Induk / Lampiran 1 (bespoke) and Lampiran 2–14 (engine), Simpan.
definePageMeta({
  // Keep one instance across sections so the unsaved draft survives section switches.
  key: route => String(route.params.id),
  sidebarPanel: 'collapsed',
})

const route = useRoute()
const id = String(route.params.id)
const { get, submit } = useSptTahunanBadan()
const spt = computed(() => get(id))

const sectionKey = computed(() => {
  const key = String(route.params.section ?? 'induk')
  const s = findSection(key)
  // Group keys (lampiran-10…13) open their first part.
  return s ? (s.children?.[0]?.key ?? key) : 'induk'
})
const section = computed(() => findSection(sectionKey.value)!)

useHead({ title: () => (spt.value ? `Lapor SPT Tahunan Badan ${masaLabel(spt.value)} · Klikpajak` : 'SPT tidak ditemukan · Klikpajak') })

// ── Form state ───────────────────────────────────────────────────────────────
const { draft, isDirty, save, discard } = useSpt1771Form(id)
const isPembetulan = computed(() => (spt.value?.revision ?? 0) > 0)
const isReadOnly = computed(() => !!spt.value && isLocked(spt.value))
const sektorLabel = computed(() => SEKTOR_USAHA.find(s => s.value === draft.value.lampiran1.sektor)?.label ?? '')

const pasal31eBruto = computed(() => num(blockValues(draft.value.lampiran['lampiran-8'] ?? {}, 'pasal31e').bruto))
const totals = computed(() => computeInduk(draft.value.induk, penghasilanNetoFiskal(draft.value.lampiran1), isPembetulan.value, pasal31eBruto.value))
const indukMissing = computed(() => missingFields(draft.value.induk, totals.value))
const states = computed(() => sectionStates({
  induk: draft.value.induk,
  indukMissing: indukMissing.value,
  lampiran1: draft.value.lampiran1,
  lampiran: draft.value.lampiran,
}))
const missing = computed(() => [...indukMissing.value, ...missingLampiran(states.value)])
const isComplete = computed(() => missing.value.length === 0)

const status = computed(() => {
  if (isReadOnly.value) return { label: 'Sudah dilaporkan', type: 'information' as const }
  return isComplete.value ? { label: 'Lengkap', type: 'completed' as const } : { label: 'Belum lengkap', type: 'warning' as const }
})

const lampiranPage = computed(() => (spt.value ? lampiranDef(sectionKey.value, spt.value.year) : undefined))
const lampiranCtx = computed(() => ({ year: spt.value?.year ?? 0, pkp: totals.value.pkp, penghasilanNeto: totals.value.d4 }))

const isNavCollapsed = ref(false)
const hrefFor = (key: string) => detailPath({ id }, key)

function onSave() {
  save()
  toast.notify({ id: 'toast-spt-saved', variant: 'success', title: 'SPT berhasil disimpan' })
}

function downloadGuide() {
  toast.notify({ id: 'toast-spt-guide', variant: 'success', title: 'Petunjuk pengisian berhasil diunduh' })
}

// ── Lapor SPT ────────────────────────────────────────────────────────────────
const isConfirmOpen = ref(false)

function confirmLapor() {
  save()
  submit(id)
  isConfirmOpen.value = false
  toast.notify({ id: 'toast-spt-submitted', variant: 'success', title: 'SPT Tahunan Badan berhasil dilaporkan' })
  navigateTo(LIST_PATH)
}

// ── Unsaved changes guard ────────────────────────────────────────────────────
const pendingLeave = ref<string | null>(null)

onBeforeRouteLeave((to) => {
  if (!isDirty.value || isReadOnly.value || pendingLeave.value === to.fullPath) return true
  pendingLeave.value = to.fullPath
  return false
})

function leaveWithoutSaving() {
  const to = pendingLeave.value
  discard()
  if (to) navigateTo(to)
}

function saveAndLeave() {
  const to = pendingLeave.value
  save()
  if (to) navigateTo(to)
}

function onBeforeUnload(e: BeforeUnloadEvent) {
  if (isDirty.value && !isReadOnly.value) e.preventDefault()
}
onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))
</script>

<template>
  <div class="spt-lapor">
    <template v-if="spt">
      <KpPageHeader
        :title="`Lapor SPT Tahunan Badan ${masaLabel(spt)}`"
        :breadcrumbs="[{ label: 'SPT Tahunan Badan', to: LIST_PATH }]"
      >
        <template #actions>
          <MpButton id="spt-guide" variant="secondary" left-icon="help" @click="downloadGuide">Download petunjuk pengisian</MpButton>
          <!-- v-tooltip needs an object, so the explaining wrapper only renders while incomplete. -->
          <span
            v-if="!isComplete && !isReadOnly"
            v-tooltip="{ label: 'Lengkapi data wajib SPT sebelum melapor', placement: 'bottom' }"
            class="spt-lapor__lapor-wrap"
          >
            <MpButton id="spt-lapor" is-disabled>Lapor SPT</MpButton>
          </span>
          <MpButton v-else id="spt-lapor" :is-disabled="isReadOnly" @click="isConfirmOpen = true">Lapor SPT</MpButton>
        </template>
      </KpPageHeader>

      <KpStage>
        <div class="spt-lapor__body">
          <SptSectionNav
            v-model:collapsed="isNavCollapsed"
            :active-key="sectionKey"
            :href-for="hrefFor"
            :status="status"
            :missing="isReadOnly ? [] : missing"
            :states="states"
          />

          <div class="spt-lapor__content">
            <p v-if="isReadOnly" class="spt-lapor__locked" role="status">
              SPT ini sudah dilaporkan ke DJP ({{ spt.status === 'SUBMITTED' ? 'berhasil' : 'sedang diproses' }}), sehingga tidak dapat diubah.
            </p>

            <fieldset class="spt-lapor__fieldset" :disabled="isReadOnly">
              <SptIndukForm
                v-if="sectionKey === 'induk'"
                v-model="draft.induk"
                :totals="totals"
                :year="spt.year"
                :is-pembetulan="isPembetulan"
                :sektor-label="sektorLabel"
              />
              <SptLampiran1 v-else-if="sectionKey === 'lampiran-1'" v-model="draft.lampiran1" :is-read-only="isReadOnly" />
              <SptLampiranPage
                v-else-if="lampiranPage"
                :key="sectionKey"
                v-model="draft.lampiran[sectionKey]"
                :def="lampiranPage"
                :ctx="lampiranCtx"
                :is-read-only="isReadOnly"
              />
              <SptLampiranPlaceholder v-else :title="section.label" />
            </fieldset>

            <div v-if="!isReadOnly" class="spt-lapor__actions">
              <MpText v-if="isDirty" size="body-small" color="text.secondary">Ada perubahan yang belum disimpan</MpText>
              <MpButton id="spt-save" variant="secondary" @click="onSave">Simpan</MpButton>
            </div>
          </div>
        </div>
      </KpStage>

      <!-- Lapor SPT confirmation -->
      <MpModal id="spt-lapor-modal" :is-open="isConfirmOpen" size="sm" @close="isConfirmOpen = false">
        <MpModalContent>
          <MpModalHeader>
            Lapor SPT Tahunan Badan?
            <MpModalCloseButton />
          </MpModalHeader>
          <MpModalBody>
            <MpText>SPT Tahunan Badan {{ masaLabel(spt) }} akan dikirim ke DJP. Setelah dilaporkan, SPT tidak dapat diubah.</MpText>
          </MpModalBody>
          <MpModalFooter>
            <div class="spt-lapor__modal-actions">
              <MpButton id="spt-lapor-cancel" variant="ghost" @click="isConfirmOpen = false">Batalkan</MpButton>
              <MpButton id="spt-lapor-confirm" @click="confirmLapor">Lapor SPT</MpButton>
            </div>
          </MpModalFooter>
        </MpModalContent>
        <MpModalOverlay />
      </MpModal>

      <!-- Unsaved changes -->
      <MpModal id="spt-unsaved-modal" :is-open="!!pendingLeave" size="sm" @close="pendingLeave = null">
        <MpModalContent>
          <MpModalHeader>
            Simpan perubahan?
            <MpModalCloseButton />
          </MpModalHeader>
          <MpModalBody>
            <MpText>Ada perubahan pada SPT yang belum disimpan. Perubahan akan hilang jika Anda keluar tanpa menyimpan.</MpText>
          </MpModalBody>
          <MpModalFooter>
            <div class="spt-lapor__modal-actions">
              <MpButton id="spt-unsaved-discard" variant="ghost" @click="leaveWithoutSaving">Keluar tanpa menyimpan</MpButton>
              <MpButton id="spt-unsaved-save" @click="saveAndLeave">Simpan dan keluar</MpButton>
            </div>
          </MpModalFooter>
        </MpModalContent>
        <MpModalOverlay />
      </MpModal>
    </template>

    <template v-else>
      <KpPageHeader title="SPT tidak ditemukan" :breadcrumbs="[{ label: 'SPT Tahunan Badan', to: LIST_PATH }]" />
      <KpStage>
        <KpBlankSlate
          :image="blankSlateImage"
          title="SPT tidak ditemukan"
          description="SPT ini mungkin sudah dihapus. Kembali ke daftar SPT Tahunan Badan."
        >
          <MpButton id="spt-missing-back" variant="secondary" @click="navigateTo(LIST_PATH)">Kembali ke daftar</MpButton>
        </KpBlankSlate>
      </KpStage>
    </template>
  </div>
</template>

<style scoped>
.spt-lapor {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.spt-lapor__lapor-wrap {
  display: inline-flex;
}

.spt-lapor__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.spt-lapor__content {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding: var(--mp-spacing-4) var(--mp-spacing-6) 0;
}

.spt-lapor__fieldset {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.spt-lapor__locked {
  max-width: 640px;
  margin: 0 0 var(--mp-spacing-4);
  padding: var(--mp-spacing-3) var(--mp-spacing-4);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-information);
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
}

/* Figma "Action group": Simpan bottom-right; sticky so it stays reachable on long forms. */
.spt-lapor__actions {
  position: sticky;
  bottom: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mp-spacing-3);
  margin-top: auto;
  padding: var(--mp-spacing-3) 0 var(--mp-spacing-5);
  border-top: 1px solid var(--mp-colors-border-default);
  background: var(--mp-colors-background-stage);
}

.spt-lapor__modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-spacing-2);
  width: 100%;
}

@media (max-width: 991px) {
  .spt-lapor__body {
    flex-direction: column;
  }
}
</style>
