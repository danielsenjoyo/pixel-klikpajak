<script setup lang="ts" generic="P">
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
  MpRadio,
  MpText,
  MpUpload,
} from '@mekari/pixel3'
import { readImportFile, type ImportCtx, type ImportResult, type ImportSpec } from '~/data/spt1771Import'
import { downloadBlob, writeXlsx } from '~/utils/xlsx'

// Import from a DJP template (1-pager SPT Tahunan Badan items 6–12):
//   1. Unduh template — the spec's workbook (DATA / Petunjuk Pengisian / Ref)
//   2. Unggah file    — parsed and validated at once; nothing is written yet
//   3. Review         — accepted / rejected rows with reasons, then Tambahkan or Ganti
// The parent writes the payload on `apply`, so this modal never touches SPT data.
const props = defineProps<{
  id: string
  spec: ImportSpec<P>
  ctx: ImportCtx
  /** Rows (or filled accounts) already present — offers "Ganti" when > 0. */
  existing: number
}>()
const emit = defineEmits<{ apply: [payload: P, mode: 'append' | 'replace'] }>()
const isOpen = defineModel<boolean>('open', { required: true })

const fileName = ref<string | null>(null)
const result = ref<ImportResult<P> | null>(null)
const readError = ref<string | null>(null)
const isReading = ref(false)
const mode = ref<'append' | 'replace'>('append')

watch(isOpen, (open) => {
  if (!open) return
  fileName.value = null
  result.value = null
  readError.value = null
  mode.value = 'append'
})

const fileError = computed(() => readError.value ?? result.value?.fileError ?? null)
const accepted = computed(() => (fileError.value ? 0 : result.value?.accepted ?? 0))
const rejected = computed(() => (fileError.value ? [] : result.value?.rejected ?? []))
/** Banner state also keys the banner — MpBanner caches its slot on mount (CLAUDE.md). */
const bannerVariant = computed(() => {
  if (fileError.value || !accepted.value) return 'critical'
  return rejected.value.length ? 'warning' : 'success'
})
const unit = computed(() => props.spec.unit)
/** List imports add rows; Lampiran 1 updates accounts in place, so "Tambahkan" reads differently. */
const appendLabel = computed(() => (unit.value === 'akun'
  ? 'Perbarui akun yang ada di file, akun lain tidak berubah'
  : `Tambahkan ke ${props.existing} ${unit.value} yang sudah ada`))
const replaceLabel = computed(() => (unit.value === 'akun'
  ? 'Ganti seluruh isi laporan yang ada di file'
  : `Ganti ${props.existing} ${unit.value} yang sudah ada`))

function downloadTemplate() {
  downloadBlob(props.spec.fileName(props.ctx), writeXlsx(props.spec.template(props.ctx)))
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  fileName.value = file.name
  result.value = null
  readError.value = null
  isReading.value = true
  try {
    result.value = props.spec.parse(await readImportFile(file), props.ctx)
  }
  catch (err) {
    readError.value = err instanceof Error ? err.message : 'File tidak dapat dibaca.'
  }
  finally {
    // No `input.value = ''` here: MpUpload holds the live FileList, and emptying it under
    // the component crashes its file-name render. `is-reset-on-change` clears it on the next
    // click instead, so re-picking the same (fixed) file still fires `change`.
    isReading.value = false
  }
}

function clearFile() {
  fileName.value = null
  result.value = null
  readError.value = null
}

function apply() {
  if (!result.value || !accepted.value) return
  emit('apply', result.value.payload, props.existing ? mode.value : 'append')
  isOpen.value = false
}
</script>

<template>
  <MpModal :id="id" :is-open="isOpen" size="md" @close="isOpen = false">
    <MpModalContent>
      <MpModalHeader>
        {{ spec.title }}
        <MpModalCloseButton />
      </MpModalHeader>
      <MpModalBody>
        <div class="spt-import">
          <MpText color="text.secondary">{{ spec.description }}</MpText>

          <section class="spt-import__step">
            <MpText weight="semiBold">1. Unduh template</MpText>
            <MpText size="body-small" color="text.secondary">
              Template mengikuti format impor DJP. Isi sheet sesuai petunjuk di sheet "Petunjuk Pengisian"; daftar kode ada di sheet "Ref".
            </MpText>
            <div>
              <MpButton :id="`${id}-template`" variant="secondary" left-icon="download" @click="downloadTemplate">
                Unduh template
              </MpButton>
            </div>
          </section>

          <section class="spt-import__step">
            <MpText weight="semiBold">2. Unggah file</MpText>
            <MpUpload
              :id="`${id}-file`"
              accept=".xlsx,.csv"
              button-text="Pilih file"
              :placeholder="fileName ?? 'Tidak ada file terpilih'"
              :is-loading="isReading"
              loading-text="Membaca file..."
              :is-invalid="!!fileError"
              is-full-width
              is-reset-on-change
              @change="onFile"
              @clear="clearFile"
            />
            <MpText size="body-small" color="text.secondary">Format .xlsx atau .csv, maksimal 5 MB.</MpText>
          </section>

          <MpBanner
            v-if="fileError || result"
            :id="`${id}-result`"
            :key="`${bannerVariant}-${fileName}-${accepted}-${rejected.length}`"
            :variant="bannerVariant"
            is-inline
          >
            <MpBannerDescription>
              <span v-if="fileError">{{ fileError }}</span>
              <template v-else>
                <span>{{ accepted }} {{ unit }} siap diimpor<template v-if="rejected.length">, {{ rejected.length }} baris ditolak</template>.</span>
                <ul v-if="rejected.length" class="spt-import__errors">
                  <li v-for="(e, ei) in rejected.slice(0, 8)" :key="ei">
                    <template v-if="e.sheet">{{ e.sheet }} · </template>Baris {{ e.row }}: {{ e.reason }}
                  </li>
                  <li v-if="rejected.length > 8">dan {{ rejected.length - 8 }} baris lainnya.</li>
                </ul>
                <span v-if="rejected.length && accepted"> Baris yang ditolak tidak ikut diimpor; perbaiki lalu impor ulang.</span>
              </template>
            </MpBannerDescription>
          </MpBanner>

          <section v-if="accepted && existing" class="spt-import__step" role="radiogroup" :aria-labelledby="`${id}-mode-label`">
            <MpText :id="`${id}-mode-label`" weight="semiBold">Data yang sudah ada</MpText>
            <MpRadio :id="`${id}-mode-append`" :name="`${id}-mode`" value="append" v-model="mode">{{ appendLabel }}</MpRadio>
            <MpRadio :id="`${id}-mode-replace`" :name="`${id}-mode`" value="replace" v-model="mode">{{ replaceLabel }}</MpRadio>
          </section>
        </div>
      </MpModalBody>
      <MpModalFooter>
        <div class="spt-import__actions">
          <MpButton :id="`${id}-cancel`" variant="ghost" @click="isOpen = false">Batalkan</MpButton>
          <MpButton :id="`${id}-submit`" :is-disabled="!accepted" @click="apply">
            {{ accepted ? `Impor ${accepted} ${unit}` : 'Impor' }}
          </MpButton>
        </div>
      </MpModalFooter>
    </MpModalContent>
    <MpModalOverlay />
  </MpModal>
</template>

<style scoped>
.spt-import {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-5);
}

.spt-import__step {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
}

.spt-import__errors {
  margin: var(--mp-spacing-2) 0;
  padding-left: var(--mp-spacing-5);
}

.spt-import__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-spacing-2);
  width: 100%;
}
</style>
