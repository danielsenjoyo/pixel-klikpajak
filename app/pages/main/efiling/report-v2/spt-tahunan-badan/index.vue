<script setup lang="ts">
import {
  MpBadge,
  MpButton,
  MpDatePicker,
  MpFormControl,
  MpFormErrorMessage,
  MpFormHelpText,
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
  MIN_TAX_YEAR,
  bookYearEnd,
  canDelete,
  canDownloadBpe,
  createdAtLabel,
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
// The user picks the first month of the periode buku; the book year runs 12 months, so the
// last month follows from it. The tax year is the year the book year starts in.
const isCreateOpen = ref(false)
const createStart = ref<string | null>(null) // "MM-YYYY"
const createError = ref('')

const parseStart = (v: string | null) => {
  const m = v ? /^(\d{2})-(\d{4})$/.exec(v) : null
  return m ? { month: Number(m[1]), year: Number(m[2]) } : null
}
const start = computed(() => parseStart(createStart.value))
const endLabel = computed(() => {
  if (!start.value) return ''
  const end = bookYearEnd(start.value.year, start.value.month)
  return `${String(end.month).padStart(2, '0')}-${end.year}`
})

// Annual SPT can only be reported once the book year has ended (its last month is over),
// and Coretax starts at Tahun Pajak MIN_TAX_YEAR. Months counted as year * 12 + (month - 1).
const now = new Date()
const lastStartIndex = now.getFullYear() * 12 + now.getMonth() - 12
const minStartIndex = MIN_TAX_YEAR * 12
const disableMonth = (month0: number, year: number) => {
  const idx = year * 12 + month0
  return idx < minStartIndex || idx > lastStartIndex
}
const disableYear = (year: number) => year < MIN_TAX_YEAR || year * 12 > lastStartIndex

function openCreate() {
  createStart.value = null
  createError.value = ''
  isCreateOpen.value = true
}

function closeCreate() {
  isCreateOpen.value = false
}

function submitCreate() {
  const s = start.value
  if (!s) {
    createError.value = 'Periode buku wajib diisi.'
    return
  }
  if (s.year < MIN_TAX_YEAR) {
    createError.value = `SPT hanya dapat dibuat untuk Tahun Pajak ${MIN_TAX_YEAR} dan seterusnya.`
    return
  }
  if (s.year * 12 + s.month - 1 > lastStartIndex) {
    createError.value = 'Periode buku belum berakhir. SPT dapat dibuat setelah bulan akhir periode buku selesai.'
    return
  }
  if (hasOpenSpt(s.year)) {
    createError.value = `SPT Tahunan Badan Tahun Pajak ${s.year} masih dalam proses. Selesaikan SPT tersebut terlebih dulu.`
    return
  }
  const spt = create(s.year, s.month)
  isCreateOpen.value = false
  toast.notify({ id: 'toast-spt-created', variant: 'success', title: 'SPT Tahunan Badan berhasil dibuat' })
  // Lapor SPT flow continues on the new SPT's form (SPT Induk).
  navigateTo(detailPath(spt))
}

watch(createStart, (v) => { if (v) createError.value = '' })

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
            :input-attr="{ 'aria-label': 'Filter masa pajak' }"
            use-portal
          />
        </div>
        <div class="spt-filter__field">
          <MpInputGroup id="spt-search-group">
            <MpInputLeftAddon id="spt-search-addon">
              <MpIcon name="search" size="sm" />
            </MpInputLeftAddon>
            <!-- is-clearable emits undefined on clear; keep keyword a string. -->
            <MpInput
              id="spt-search"
              :model-value="keyword"
              placeholder="Cari SPT"
              aria-label="Cari SPT"
              is-clearable
              @update:model-value="keyword = $event ?? ''"
            />
          </MpInputGroup>
        </div>
      </div>

      <!-- Table -->
      <div class="spt-table">
        <MpTableContainer>
          <MpTable>
            <MpTableHead>
              <MpTableRow>
                <MpTableCell scope="col">Masa pajak</MpTableCell>
                <MpTableCell scope="col">Tanggal pembuatan</MpTableCell>
                <MpTableCell scope="col">Status SPT</MpTableCell>
                <MpTableCell scope="col">Status Lapor</MpTableCell>
                <MpTableCell scope="col">NTTE</MpTableCell>
                <MpTableCell scope="col">Keterangan</MpTableCell>
                <MpTableCell scope="col" class="spt-table__action-col"><span class="kp-visually-hidden">Tindakan</span></MpTableCell>
              </MpTableRow>
            </MpTableHead>
            <MpTableBody v-if="rows.length">
              <MpTableRow v-for="spt in rows" :key="spt.id">
                <MpTableCell as="td" scope="row">
                  <NuxtLink :to="detailPath(spt)" class="spt-table__link">{{ masaLabel(spt) }}</NuxtLink>
                </MpTableCell>
                <MpTableCell as="td">{{ createdAtLabel(spt) }}</MpTableCell>
                <MpTableCell as="td">{{ statusSptLabel(spt) }}</MpTableCell>
                <MpTableCell as="td">
                  <MpBadge for="tableStatus" :type="LAPOR_STATUS[spt.status].badge">{{ LAPOR_STATUS[spt.status].label }}</MpBadge>
                </MpTableCell>
                <MpTableCell as="td">{{ spt.ntte ?? '-' }}</MpTableCell>
                <MpTableCell as="td" class="spt-table__note-col">
                  <span class="spt-table__note" :title="spt.note ?? undefined">{{ spt.note ?? '-' }}</span>
                </MpTableCell>
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
          <MpFormControl id="spt-create-period-control" :is-invalid="!!createError">
            <MpFormLabel>Periode buku</MpFormLabel>
            <div class="spt-modal__period">
              <MpDatePicker
                id="spt-create-start"
                v-model="createStart"
                type="month"
                value-type="string"
                format="MM-YYYY"
                placeholder="Bulan awal"
                :disabled-month="disableMonth"
                :disabled-year="disableYear"
                :is-invalid="!!createError"
                :input-attr="{ 'aria-label': 'Bulan dan tahun awal periode buku' }"
                use-portal
              />
              <span class="spt-modal__period-sep" aria-hidden="true">–</span>
              <!-- Own control: MpFormControl stamps its id on every input inside it. -->
              <MpFormControl id="spt-create-end" is-disabled>
                <MpInput
                  :model-value="endLabel"
                  placeholder="Bulan akhir"
                  aria-label="Bulan dan tahun akhir periode buku"
                  is-disabled
                />
              </MpFormControl>
            </div>
            <MpFormHelpText v-if="!createError">Pilih bulan awal. Bulan akhir otomatis 12 bulan setelahnya.</MpFormHelpText>
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

/* DJP's messages can run long (stack traces): two lines, full text on hover — as SPT Masa PPN. */
.spt-table__note-col {
  max-width: 280px;
}
.spt-table__note {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: normal; /* MpTableCell sets nowrap */
  word-break: break-word;
}

.spt-table__action-col {
  width: 143px;
  text-align: right;
}

.spt-modal__period {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
}
.spt-modal__period > * {
  flex: 1;
  min-width: 0;
}
.spt-modal__period > .spt-modal__period-sep {
  flex: none;
  color: var(--mp-colors-text-secondary);
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
