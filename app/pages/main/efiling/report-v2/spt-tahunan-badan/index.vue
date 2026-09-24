<script setup lang="ts">
import {
  MpBadge,
  MpButton,
  MpDatePicker,
  MpFormControl,
  MpFormErrorMessage,
  MpFormLabel,
  MpIcon,
  MpInput,
  MpInputGroup,
  MpInputLeftAddon,
  MpModal,
  MpModalBody,
  MpModalCloseButton,
  MpModalContent,
  MpModalFooter,
  MpModalHeader,
  MpModalOverlay,
  MpPopover,
  MpPopoverContent,
  MpPopoverList,
  MpPopoverListItem,
  MpPopoverTrigger,
  MpTable,
  MpTableBody,
  MpTableCell,
  MpTableContainer,
  MpTableHead,
  MpTableRow,
  MpText,
  toast,
} from '@mekari/pixel3'
import blankSlateImage from '~/assets/images/blankslate-spt.png'
import {
  LAPOR_STATUS,
  canDelete,
  canDownloadBpe,
  detailPath,
  masaLabel,
  statusSptLabel,
  type SptTahunanBadan,
} from '~/data/sptTahunanBadan'

// Lapor Pajak › SPT Tahunan Badan (Coretax) index.
// Figma: SPT-Tahunan-Badan › "--> Index" (default / blank / modal / toast frames).
// Source: jurnal-tax pages/efiling/Report/sptTahunan/badan/List.
useHead({ title: 'SPT Tahunan Badan · Klikpajak' })

// Breadcrumb: the Lapor Pajak module entry (sidebar target).
const LAPOR_PAJAK_PATH = '/main/efiling/report-v2'

const { sorted, hasOpenSpt, create, remove } = useSptTahunanBadan()

// ── Filters ──────────────────────────────────────────────────────────────────
const filterYear = ref<string | null>(null)
const keyword = ref('')

const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return sorted.value.filter(spt =>
    (!filterYear.value || String(spt.year) === filterYear.value)
    && (!q || masaLabel(spt).includes(q) || (spt.ntte ?? '').includes(q) || String(spt.year).includes(q)),
  )
})
const isFiltering = computed(() => !!filterYear.value || !!keyword.value.trim())

// ── Pagination ───────────────────────────────────────────────────────────────
const page = ref(1)
const perPage = ref(10)
const rows = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))
watch([filterYear, keyword], () => { page.value = 1 })
// Keep the page valid after a delete empties it.
watch(() => filtered.value.length, (n) => {
  const last = Math.max(1, Math.ceil(n / perPage.value))
  if (page.value > last) page.value = last
})

// ── Create (modal) ───────────────────────────────────────────────────────────
const isCreateOpen = ref(false)
const createYear = ref<string | null>(null)
const createError = ref('')

// Annual SPT can only be reported for a tax year that has ended.
const lastReportableYear = new Date().getFullYear() - 1
const disableYear = (year: number) => year > lastReportableYear

function openCreate() {
  createYear.value = null
  createError.value = ''
  isCreateOpen.value = true
}

function closeCreate() {
  isCreateOpen.value = false
}

function submitCreate() {
  if (!createYear.value) {
    createError.value = 'Masa pajak wajib diisi.'
    return
  }
  const year = Number(createYear.value)
  if (hasOpenSpt(year)) {
    createError.value = `SPT Tahunan Badan ${masaLabel({ year })} masih dalam proses. Selesaikan SPT tersebut terlebih dulu.`
    return
  }
  const spt = create(year)
  isCreateOpen.value = false
  toast.notify({ id: 'toast-spt-created', variant: 'success', title: 'SPT Tahunan Badan berhasil dibuat' })
  // Lapor SPT flow continues on the new SPT's form (SPT Induk).
  navigateTo(detailPath(spt))
}

watch(createYear, (v) => { if (v) createError.value = '' })

// ── Row actions ──────────────────────────────────────────────────────────────
const deleteTarget = ref<SptTahunanBadan | null>(null)

function downloadBpe(spt: SptTahunanBadan, close: () => void) {
  close()
  toast.notify({ id: `toast-bpe-${spt.id}`, variant: 'success', title: `BPE ${masaLabel(spt)} berhasil diunduh` })
}

function askDelete(spt: SptTahunanBadan, close: () => void) {
  close()
  deleteTarget.value = spt
}

function confirmDelete() {
  if (!deleteTarget.value) return
  remove(deleteTarget.value.id)
  deleteTarget.value = null
  toast.notify({ id: 'toast-spt-deleted', variant: 'success', title: 'SPT berhasil dihapus' })
}

function viewDetail(spt: SptTahunanBadan, close: () => void) {
  close()
  navigateTo(detailPath(spt))
}
</script>

<template>
  <div class="spt-page">
    <KpPageHeader title="SPT Tahunan Badan" :breadcrumbs="[{ label: 'Lapor Pajak', to: LAPOR_PAJAK_PATH }]">
      <template #actions>
        <MpButton id="spt-lapor-spt" @click="openCreate">Lapor SPT</MpButton>
      </template>
    </KpPageHeader>

    <KpStage>
      <!-- Filter bar -->
      <div class="spt-filter">
        <div class="spt-filter__field">
          <MpDatePicker
            id="spt-filter-year"
            v-model="filterYear"
            type="year"
            value-type="string"
            format="YYYY"
            placeholder="Masa pajak"
            use-portal
          />
        </div>
        <div class="spt-filter__field">
          <MpInputGroup id="spt-search-group">
            <MpInputLeftAddon id="spt-search-addon">
              <MpIcon name="search" size="sm" />
            </MpInputLeftAddon>
            <MpInput id="spt-search" v-model="keyword" placeholder="Cari SPT" is-clearable />
          </MpInputGroup>
        </div>
      </div>

      <!-- Table -->
      <div class="spt-table">
        <MpTableContainer>
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Masa/tahun pajak</MpTableCell>
                <MpTableCell scope="col">Pembetulan ke</MpTableCell>
                <MpTableCell scope="col">Status SPT</MpTableCell>
                <MpTableCell scope="col">Status lapor</MpTableCell>
                <MpTableCell scope="col">NTTE</MpTableCell>
                <MpTableCell scope="col" class="spt-table__action-col"><span class="kp-visually-hidden">Tindakan</span></MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody v-if="rows.length">
              <MpTableRow v-for="spt in rows" :key="spt.id">
                <MpTableCell as="td" scope="row">
                  <NuxtLink :to="detailPath(spt)" class="spt-table__link">{{ masaLabel(spt) }}</NuxtLink>
                </MpTableCell>
                <MpTableCell as="td">{{ spt.revision }}</MpTableCell>
                <MpTableCell as="td">
                  <MpBadge for="tableStatus" type="announcement">{{ statusSptLabel(spt) }}</MpBadge>
                </MpTableCell>
                <MpTableCell as="td">
                  <MpBadge for="tableStatus" :type="LAPOR_STATUS[spt.status].badge">{{ LAPOR_STATUS[spt.status].label }}</MpBadge>
                </MpTableCell>
                <MpTableCell as="td">{{ spt.ntte ?? '-' }}</MpTableCell>
                <MpTableCell as="td" class="spt-table__action-col">
                  <MpPopover :id="`spt-action-${spt.id}`" placement="bottom-end" trigger="click" use-portal is-close-on-escape :is-keep-alive="false" v-slot="{ onClosePopover }">
                    <MpPopoverTrigger>
                      <MpButton :id="`spt-action-btn-${spt.id}`" variant="secondary" right-icon="caret-down">Tindakan</MpButton>
                    </MpPopoverTrigger>
                    <MpPopoverContent class="spt-action-panel">
                      <MpPopoverList>
                        <MpPopoverListItem class="spt-action__item" @click="viewDetail(spt, onClosePopover)">Lihat detail</MpPopoverListItem>
                        <MpPopoverListItem v-if="canDownloadBpe(spt)" class="spt-action__item" @click="downloadBpe(spt, onClosePopover)">Download BPE</MpPopoverListItem>
                        <MpPopoverListItem v-if="canDelete(spt)" class="spt-action__item spt-action__item--danger" @click="askDelete(spt, onClosePopover)">Hapus SPT</MpPopoverListItem>
                      </MpPopoverList>
                    </MpPopoverContent>
                  </MpPopover>
                </MpTableCell>
              </MpTableRow>
            </MpTableBody>
          </MpTable>
        </MpTableContainer>

        <!-- Empty states -->
        <KpBlankSlate
          v-if="!rows.length && !isFiltering"
          :image="blankSlateImage"
          title="Daftar SPT tahunan badan akan muncul di sini"
          description="Anda bisa membuat SPT tahunan badan melalui tombol Lapor SPT."
        />
        <KpBlankSlate
          v-else-if="!rows.length"
          :image="blankSlateImage"
          title="SPT tidak ditemukan"
          description="Coba ubah masa pajak atau kata kunci pencarian Anda."
        >
          <MpButton id="spt-reset-filter" variant="secondary" @click="filterYear = null; keyword = ''">Hapus filter</MpButton>
        </KpBlankSlate>
      </div>

      <KpPagination
        v-if="filtered.length"
        id="spt-pagination"
        v-model:page="page"
        v-model:per-page="perPage"
        :total="filtered.length"
      />
    </KpStage>

    <!-- Buat SPT Tahunan Badan -->
    <MpModal id="spt-create-modal" :is-open="isCreateOpen" size="sm" @close="closeCreate">
      <MpModalContent>
        <MpModalHeader>
          Buat SPT Tahunan Badan
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpFormControl id="spt-create-year-control" :is-invalid="!!createError">
            <MpFormLabel>Masa pajak</MpFormLabel>
            <MpDatePicker
              id="spt-create-year"
              v-model="createYear"
              type="year"
              value-type="string"
              format="YYYY"
              placeholder="Pilih masa pajak"
              :disabled-year="disableYear"
              :is-invalid="!!createError"
              use-portal
            />
            <MpFormErrorMessage>{{ createError }}</MpFormErrorMessage>
          </MpFormControl>
        </MpModalBody>
        <MpModalFooter>
          <div class="spt-modal__actions">
            <MpButton id="spt-create-cancel" variant="ghost" @click="closeCreate">Batalkan</MpButton>
            <MpButton id="spt-create-submit" @click="submitCreate">Buat SPT</MpButton>
          </div>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>

    <!-- Hapus SPT (source: efiling deleteModalConfig) -->
    <MpModal id="spt-delete-modal" :is-open="!!deleteTarget" size="sm" @close="deleteTarget = null">
      <MpModalContent>
        <MpModalHeader>
          Hapus SPT
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText>
            SPT {{ deleteTarget ? masaLabel(deleteTarget) : '' }} yang dihapus tidak dapat dikembalikan.
          </MpText>
        </MpModalBody>
        <MpModalFooter>
          <div class="spt-modal__actions">
            <MpButton id="spt-delete-cancel" variant="ghost" @click="deleteTarget = null">Batalkan</MpButton>
            <MpButton id="spt-delete-submit" variant="danger" @click="confirmDelete">Hapus</MpButton>
          </div>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
  </div>
</template>

<style scoped>
.spt-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.spt-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-3);
  padding: var(--mp-spacing-4) var(--mp-spacing-6);
}
.spt-filter__field {
  width: 212px;
}

.spt-table {
  padding: 0 var(--mp-spacing-6);
}

.spt-table__link {
  color: var(--mp-colors-text-link);
  text-decoration: none;
}
.spt-table__link:hover {
  text-decoration: underline;
}

.spt-table__action-col {
  width: 143px;
  text-align: right;
}

.spt-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-spacing-2);
  width: 100%;
}

.spt-action__item {
  align-self: stretch;
}
.spt-action__item--danger {
  color: var(--mp-colors-text-danger);
}

.kp-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 991px) {
  .spt-filter__field {
    width: 100%;
  }
}
</style>

<style>
/* Unscoped: MpPopoverContent is teleported, so a scoped class on it doesn't match. */
.spt-action-panel {
  min-width: 180px;
}
</style>
