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
  MpBanner,
  MpBannerDescription,
  MpCheckbox,
  toast,
} from '@mekari/pixel3'
import blankSlateImage from '~/assets/images/blankslate-spt.png'
import { formatRp } from '~/utils/currency'
import { applyIssues, missingSections, requiredLampiran, sectionStates } from '~/data/spt1771Checkpoints'
import { isRowFilled, type Row } from '~/data/spt1771Engine'
import { computeInduk, gatingAnswers, hasilSpt, isIndukTab, type IndukTab } from '~/data/spt1771Induk'
import { blockingIssues, validateSpt, warningIssues } from '~/data/spt1771Validation'
import type { Issue } from '~/data/spt1771Engine'
import { lampiranDef, lampiranLinks } from '~/data/spt1771LampiranDefs'
import { labaKomersial, penghasilanNetoFiskal, penyusutanKomersial } from '~/data/spt1771Lampiran1'
import { LIST_PATH, detailPath, findSection, isLocked, masaLabel, postedAtLabel, sectionHeading, sectionNumber } from '~/data/sptTahunanBadan'

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
const { get, post, submit } = useSptTahunanBadan()
// BUT status is a property of the entity, not the return — it opens Lampiran 12A/12B.
const { company } = useSession()
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
const { draft, isDirty, save, discard, refreshPrefill } = useSpt1771Form(id)
const isPembetulan = computed(() => (spt.value?.revision ?? 0) > 0)
const isReadOnly = computed(() => !!spt.value && isLocked(spt.value))

const totals = computed(() => computeInduk(draft.value.induk, penghasilanNetoFiskal(draft.value.lampiran1), isPembetulan.value, lampiranLinks(draft.value.lampiran)))

/** What every lampiran renders against — and, so the two agree, what its field rules see. */
const lampiranCtx = computed(() => ({
  year: spt.value?.year ?? 0,
  pkp: totals.value.pkp,
  pkpAngka9: totals.value.d9,
  penghasilanNeto: totals.value.d4,
  pphTerutang: totals.value.d12,
  labaKomersial: labaKomersial(draft.value.lampiran1),
  penyusutanKomersial: penyusutanKomersial(draft.value.lampiran1),
  lampiran: draft.value.lampiran,
  answers: gatingAnswers(draft.value.induk),
  entityType: company.value.entityType,
}))

/**
 * Three passes, in order: what has data → what is wrong → the menu ticks, with any
 * section carrying an error downgraded so a green tick never sits next to a blocker.
 */
const dataStates = computed(() => sectionStates({
  induk: draft.value.induk,
  lampiran1: draft.value.lampiran1,
  lampiran: draft.value.lampiran,
  isBut: !!company.value.isBut,
}))
const issues = computed(() => validateSpt({
  induk: draft.value.induk,
  totals: totals.value,
  lampiran1: draft.value.lampiran1,
  lampiran: draft.value.lampiran,
  isBut: !!company.value.isBut,
  entityType: company.value.entityType,
  missingSections: missingSections(dataStates.value),
  ctx: lampiranCtx.value,
}))
const errors = computed(() => blockingIssues(issues.value))
const states = computed(() => applyIssues(dataStates.value, issues.value))
const isComplete = computed(() => errors.value.length === 0)

// Brief §5: the result of angka 17c is the headline of the whole return. It stays an
// estimate until nothing is missing, and rides along in the section menu (§4.2).
const hasil = computed(() => hasilSpt(totals.value, isComplete.value, isPembetulan.value))
const activeLampiran = computed(() => [...requiredLampiran({
  induk: draft.value.induk,
  lampiran: draft.value.lampiran,
  isBut: !!company.value.isBut,
})])

// Which Induk tab is open, and which lampiran part. Held by the page (not the forms) so
// an issue can be jumped to from anywhere, and so both survive section switches — the
// page instance is keyed on the SPT id, not the section.
const indukTab = ref<IndukTab>(isIndukTab(route.query.tab) ? route.query.tab : 'ringkasan')
const lampiranPart = ref('')
watch(sectionKey, () => { lampiranPart.value = '' })

let flashTimer: ReturnType<typeof setTimeout> | undefined
let flashed: Element | null = null

/**
 * Take the preparer to whatever an issue points at: open its tab or part, route to its
 * section, then scroll the control into view, focus it and flash it.
 */
async function goToIssue(issue: Pick<Issue, 'section' | 'tab' | 'target'>) {
  if (issue.tab) {
    if (issue.section === 'induk') { if (isIndukTab(issue.tab)) indukTab.value = issue.tab }
    else lampiranPart.value = issue.tab
  }
  if (sectionKey.value !== issue.section) await navigateTo(detailPath({ id }, issue.section))
  await nextTick()
  if (!issue.target) return
  const el = document.getElementById(issue.target)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  ;(el.matches('input, select, textarea') ? el : el.querySelector('input, select, textarea'))
    ?.dispatchEvent(new Event('focus'))
  flashed?.classList.remove('kp-flash')
  el.classList.add('kp-flash')
  flashed = el
  clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { el.classList.remove('kp-flash'); flashed = null }, 2000)
}

const jumpToHasil = () => goToIssue({ section: 'induk', tab: 'perhitungan', target: 'induk-hasil' })
onBeforeUnmount(() => clearTimeout(flashTimer))

const status = computed(() => {
  if (isReadOnly.value) return { label: 'Sudah dilaporkan', type: 'information' as const }
  return isComplete.value ? { label: 'Lengkap', type: 'completed' as const } : { label: 'Belum lengkap', type: 'warning' as const }
})

const lampiranPage = computed(() => (spt.value ? lampiranDef(sectionKey.value, spt.value.year) : undefined))

// ── Lampiran 2 (PRD F4) ──────────────────────────────────────────────────────
const l2 = computed(() => draft.value.lampiran['lampiran-2'] ?? {})
const l2Rows = (key: string) => (Array.isArray(l2.value[key]) ? (l2.value[key] as Row[]).filter(isRowFilled) : [])

/** "Tarik ulang data" on a DJP-owned roster — which one depends on the section in view. */
function onRefreshPrefill() {
  const n = refreshPrefill(sectionKey.value)
  const what = sectionKey.value === 'lampiran-5' ? 'tempat kegiatan usaha' : 'pemilik'
  toast.notify({
    id: `toast-${sectionKey.value}-prefill`,
    variant: n ? 'success' : 'info',
    title: n ? `${n} data ${what} diperbarui dari DJP` : `Tidak ada data ${what} dari DJP`,
  })
}

/**
 * §2 retain-and-hide: turning H.21.c/d to "Tidak" while Lampiran 2B holds data hides
 * the tab but keeps the rows, so re-answering "Ya" brings them back. Nothing is deleted.
 */
const hideL2bPrompt = ref<{ key: 'c' | 'd' } | null>(null)
watch(() => [draft.value.induk.h21?.c, draft.value.induk.h21?.d] as const, ([c, d], [prevC, prevD]) => {
  if (!l2Rows('penyertaan').length) return
  const turnedOff = (prevC && !c) ? 'c' : (prevD && !d) ? 'd' : null
  // Only prompt once the last activating answer is switched off.
  if (turnedOff && !c && !d) hideL2bPrompt.value = { key: turnedOff }
})

function keepL2bHidden() {
  hideL2bPrompt.value = null
  toast.notify({ id: 'toast-l2b-hidden', variant: 'information', title: 'Data Lampiran 2B disembunyikan dan tetap tersimpan' })
}

function restoreL2bAnswer() {
  const key = hideL2bPrompt.value?.key
  if (key) draft.value.induk.h21 = { ...draft.value.induk.h21, [key]: true }
  hideL2bPrompt.value = null
}

/**
 * What to say at the top of the section the preparer is on, rendered from the issue list
 * rather than restated here — a second copy of a rule drifts the first time Tax revises it.
 *
 * Warnings have no other home: they never reach the Lapor gate, so without this banner they
 * would be computed and never seen. Document-level blockers (a missing lampiran, a field
 * already marked red in the grid) are left out; this is for what the section cannot show.
 */
const sectionNotices = computed(() => {
  const here = issues.value.filter(i => i.section === sectionKey.value)
  return [
    ...warningIssues(here),
    ...blockingIssues(here).filter(i => !i.target && !i.code.startsWith('lampiran/')),
  ]
})
// Lampiran number + DJP's official title; sub-parts without a title in the index fall
// back to the heading their own form definition carries.
const sectionTitle = computed(() => {
  const s = section.value
  if (s.officialTitle) return sectionHeading(s)
  const fallback = lampiranPage.value?.parts.find(p => p.title)?.title ?? lampiranPage.value?.title
  const no = sectionNumber(s.key)
  return fallback && no ? `${no} — ${fallback}` : (fallback ?? no ?? s.label)
})
const isNavCollapsed = ref(false)
const hrefFor = (key: string) => detailPath({ id }, key)

function onSave() {
  save()
  toast.notify({ id: 'toast-spt-saved', variant: 'success', title: 'SPT berhasil disimpan' })
}

/** Posting SPT: commit the draft and re-stamp "Waktu posting terakhir". Nothing goes to DJP. */
function onPosting() {
  save()
  post(id)
  toast.notify({ id: 'toast-spt-posting', variant: 'success', title: 'SPT berhasil diposting' })
}

function downloadGuide() {
  toast.notify({ id: 'toast-spt-guide', variant: 'success', title: 'Petunjuk pengisian berhasil diunduh' })
}

// ── Lapor SPT ────────────────────────────────────────────────────────────────
const isConfirmOpen = ref(false)
/** The declaration is made here, at submission — not as a field on the form. */
const isDeclared = ref(false)
const todayLabel = computed(() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
})
watch(isConfirmOpen, open => { if (open) isDeclared.value = false })

function confirmLapor() {
  if (errors.value.length || !isDeclared.value) { isConfirmOpen.value = false; return }
  // DateOfSubmit is stamped at filing, which is why the form has no date field.
  draft.value.induk.tanggal = todayLabel.value
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
          <MpButton id="spt-posting" variant="secondary" :is-disabled="isReadOnly" @click="onPosting">Posting SPT</MpButton>
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
            :posted-at="spt ? postedAtLabel(spt) : null"
            :states="states"
            :hasil="hasil"
            :required="activeLampiran"
            @jump-hasil="jumpToHasil"
          />

          <div class="spt-lapor__content">
            <p v-if="isReadOnly" class="spt-lapor__locked" role="status">
              SPT ini sudah dilaporkan ke DJP ({{ spt.status === 'SUBMITTED' ? 'berhasil' : 'sedang diproses' }}), sehingga tidak dapat diubah.
            </p>

            <MpModal id="l2b-hide-modal" :is-open="!!hideL2bPrompt" size="sm" @close="restoreL2bAnswer">
              <MpModalContent>
                <MpModalHeader>
                  Sembunyikan Lampiran 2B?
                  <MpModalCloseButton />
                </MpModalHeader>
                <MpModalBody>
                  <MpText>Data Lampiran 2B akan disembunyikan tapi tetap tersimpan. Lanjutkan?</MpText>
                </MpModalBody>
                <MpModalFooter>
                  <div class="spt-lapor__modal-actions">
                    <MpButton id="l2b-hide-cancel" variant="ghost" @click="restoreL2bAnswer">Batalkan</MpButton>
                    <MpButton id="l2b-hide-confirm" @click="keepL2bHidden">Lanjutkan</MpButton>
                  </div>
                </MpModalFooter>
              </MpModalContent>
              <MpModalOverlay />
            </MpModal>

            <MpBanner
              v-for="notice in sectionNotices"
              :id="`spt-notice-${notice.code.replace(/[^a-z0-9]+/gi, '-')}`"
              :key="notice.code"
              :variant="notice.severity === 'error' ? 'critical' : 'warning'"
              is-inline
              class="spt-lapor__reminder"
            >
              <MpBannerDescription>{{ notice.message }}</MpBannerDescription>
            </MpBanner>

            <fieldset class="spt-lapor__fieldset" :disabled="isReadOnly">
              <SptIndukForm
                v-if="sectionKey === 'induk'"
                v-model="draft.induk"
                v-model:tab="indukTab"
                :totals="totals"
                :hasil="hasil"
                :year="spt.year"
                v-model:sektor="draft.lampiran1.sektor"
                :title="sectionTitle"
                :is-pembetulan="isPembetulan"
                :bank-accounts="company.bankAccounts"
                :href-for="hrefFor"
                :is-but="!!company.isBut"
                :lampiran="draft.lampiran"
              />
              <SptLampiran1 v-else-if="sectionKey === 'lampiran-1'" v-model="draft.lampiran1" :is-read-only="isReadOnly" />
              <SptLampiranPage
                v-else-if="lampiranPage"
                :key="sectionKey"
                v-model="draft.lampiran[sectionKey]"
                v-model:part="lampiranPart"
                :def="lampiranPage"
                :title="sectionTitle"
                :ctx="lampiranCtx"
                :is-read-only="isReadOnly"
                @refresh-prefill="onRefreshPrefill"
              />
              <SptLampiranPlaceholder v-else :title="sectionTitle" />
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
            <div class="spt-lapor__confirm">
              <MpText>SPT Tahunan Badan {{ masaLabel(spt) }} akan dikirim ke DJP. Setelah dilaporkan, SPT tidak dapat diubah.</MpText>

              <dl class="spt-lapor__summary">
                <dt><MpText size="label-small" color="text.secondary">Hasil SPT (angka {{ hasil.line }})</MpText></dt>
                <dd><MpText size="label" weight="semiBold">{{ hasil.state === 'nihil' ? hasil.label : `${hasil.label} ${formatRp(hasil.amount)}` }}</MpText></dd>
                <dt><MpText size="label-small" color="text.secondary">Penandatangan</MpText></dt>
                <dd><MpText size="label">{{ draft.induk.namaPenandatangan }} — {{ draft.induk.jabatan }}</MpText></dd>
                <dt><MpText size="label-small" color="text.secondary">Tanggal pelaporan</MpText></dt>
                <dd><MpText size="label">{{ todayLabel }}</MpText></dd>
              </dl>

              <MpBanner v-if="hasil.state === 'kb'" id="spt-lapor-kb" variant="warning" is-inline>
                <MpBannerDescription>Pastikan deposit pajak di Coretax mencukupi sebelum mengirim.</MpBannerDescription>
              </MpBanner>

              <p class="spt-lapor__statement">
                Dengan menyadari sepenuhnya akan segala akibatnya termasuk sanksi-sanksi sesuai dengan ketentuan
                perundang-undangan yang berlaku, saya menyatakan bahwa apa yang telah saya beritahukan di atas
                beserta lampiran-lampirannya adalah benar, lengkap dan jelas.
              </p>

              <MpCheckbox id="spt-lapor-agree" :is-checked="isDeclared" @change="isDeclared = $event">
                Saya menyatakan data di atas benar, lengkap dan jelas
              </MpCheckbox>
            </div>
          </MpModalBody>
          <MpModalFooter>
            <div class="spt-lapor__modal-actions">
              <MpButton id="spt-lapor-cancel" variant="ghost" @click="isConfirmOpen = false">Batalkan</MpButton>
              <MpButton id="spt-lapor-confirm" :is-disabled="!isDeclared" @click="confirmLapor">Kirim SPT</MpButton>
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

.spt-lapor__reminder {
  margin-bottom: var(--mp-spacing-4);
}

.spt-lapor__confirm {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4);
}

.spt-lapor__summary {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--mp-spacing-2) var(--mp-spacing-5);
  margin: 0;
}
.spt-lapor__summary dd {
  margin: 0;
}

.spt-lapor__statement {
  margin: 0;
  padding: var(--mp-spacing-3);
  border-radius: var(--mp-radii-sm);
  background: var(--mp-colors-background-neutral-subtle);
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-lg);
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
