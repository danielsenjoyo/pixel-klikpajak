<script setup lang="ts">
import {
  MpButton,
  MpCheckbox,
  MpDrawer,
  MpDrawerBody,
  MpDrawerCloseButton,
  MpDrawerContent,
  MpDrawerFooter,
  MpDrawerHeader,
  MpDrawerOverlay,
  MpIcon,
  MpInput,
  MpInputGroup,
  MpInputLeftAddon,
  MpSelect,
  MpTable,
  MpTableBody,
  MpTableCell,
  MpTableContainer,
  MpTableHead,
  MpTableRow,
  MpText,
  MpToggle,
} from '@mekari/pixel3'
import { FISCAL_PROMPT, djpRow, editableCols, type CoaCol, type CoaLine } from '~/data/coaMapping'
import { sumTransactions, type JurnalTransaction } from '~/data/jurnalErp'
import { KODE_KOREKSI_FISKAL } from '~/data/taxCodes'
import { formatRp, n } from '~/utils/currency'

// Transactions behind one CoA for the whole tax year (round-1 F5: an optional aid, mainly for
// daftar nominatif). A drawer rather than rows in the grid, because a year of activity runs to
// hundreds of lines: search, month filter, paging, "select all matching". Choices are a draft
// until Terapkan — Batalkan leaves the CoA as it was.
const props = defineProps<{ line: CoaLine | null, transactions: JurnalTransaction[], sektor: string, isReadOnly?: boolean }>()
const emit = defineEmits<{ close: [], apply: [patch: { picked: string[], col: CoaCol, amount: number | null, code: string }] }>()

const CORR_LABEL: Record<CoaCol, string> = {
  c4: 'Non objek pajak (4)',
  c5: 'Dikenakan PPh Final (5)',
  c7: 'Penyesuaian fiskal positif (7)',
  c8: 'Penyesuaian fiskal negatif (8)',
}
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// ── Draft ────────────────────────────────────────────────────────────────────
const picked = ref<Set<string>>(new Set())
const col = ref<CoaCol>('c7')
const code = ref('')
const keyword = ref('')
const month = ref('')
const onlyPicked = ref(false)
const page = ref(1)
const perPage = ref(20)

const cols = computed(() => (props.line ? editableCols(props.line, props.sektor) : []))
const needsCode = computed(() => col.value === 'c7' || col.value === 'c8')

watch(() => props.line?.coa, () => {
  const l = props.line
  if (!l) return
  const p = FISCAL_PROMPT[l.coa]
  const c = l.pickCol ?? p?.col ?? 'c7'
  col.value = editableCols(l, props.sektor).includes(c) ? c : 'c7'
  code.value = l.c9 || p?.code || ''
  picked.value = new Set(l.picked ?? [])
  keyword.value = ''
  month.value = ''
  onlyPicked.value = false
  page.value = 1
}, { immediate: true })

// ── List ─────────────────────────────────────────────────────────────────────
const monthOf = (t: JurnalTransaction) => t.date.slice(3, 5)
const filtered = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return props.transactions.filter(t =>
    (!q || t.description.toLowerCase().includes(q) || t.number.toLowerCase().includes(q))
    && (!month.value || monthOf(t) === month.value)
    && (!onlyPicked.value || picked.value.has(t.id)))
})
watch([keyword, month, onlyPicked, perPage], () => { page.value = 1 })
const pageRows = computed(() => filtered.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

const selection = computed(() => props.transactions.filter(t => picked.value.has(t.id)))
const total = computed(() => sumTransactions(selection.value))

const allFilteredPicked = computed(() => filtered.value.length > 0 && filtered.value.every(t => picked.value.has(t.id)))
const someFilteredPicked = computed(() => !allFilteredPicked.value && filtered.value.some(t => picked.value.has(t.id)))
function setMany(ids: string[], checked: boolean) {
  const next = new Set(picked.value)
  for (const id of ids) {
    if (checked) next.add(id)
    else next.delete(id)
  }
  picked.value = next
}
const isFiltered = computed(() => !!keyword.value.trim() || !!month.value || onlyPicked.value)

// ── Apply ────────────────────────────────────────────────────────────────────
const canApply = computed(() => !props.isReadOnly && (!needsCode.value || !picked.value.size || !!code.value))
function apply() {
  if (!canApply.value) return
  emit('apply', { picked: [...picked.value], col: col.value, amount: picked.value.size ? total.value : null, code: needsCode.value ? code.value : '' })
}

const djpLabel = computed(() => {
  const row = props.line ? djpRow(props.sektor, props.line.djp) : undefined
  return row ? `${row.code} · ${row.label}` : 'Belum dipetakan'
})
const prompt = computed(() => (props.line ? FISCAL_PROMPT[props.line.coa] : undefined))
</script>

<template>
  <MpDrawer id="l1-tx-drawer" :is-open="!!line" size="xl" @close="emit('close')">
    <MpDrawerContent>
      <MpDrawerHeader>
        Transaksi {{ line?.coa }} · {{ line?.name }}
        <MpDrawerCloseButton />
      </MpDrawerHeader>
      <MpDrawerBody>
        <div v-if="line" class="spt-coa-tx">
          <div class="spt-coa-tx__facts">
            <span><MpText as="span" size="body-small" color="text.secondary">Akun DJP</MpText> <strong>{{ djpLabel }}</strong></span>
            <span><MpText as="span" size="body-small" color="text.secondary">Nilai komersial</MpText> <strong>{{ formatRp(line.value) }}</strong></span>
            <span><MpText as="span" size="body-small" color="text.secondary">Transaksi setahun</MpText> <strong>{{ transactions.length }}</strong></span>
          </div>
          <p v-if="prompt" class="spt-coa-tx__basis">
            <MpIcon name="info" size="sm" />
            <span>{{ prompt.basis }}</span>
          </p>

          <!-- What the ticked transactions fill. -->
          <div class="spt-coa-tx__target">
            <div class="spt-coa-tx__field">
              <MpText as="span" size="body-small" weight="semiBold">Jumlahkan ke kolom</MpText>
              <MpSelect id="l1-tx-col" v-model="col" :is-disabled="isReadOnly" aria-label="Kolom yang diisi dari transaksi terpilih">
                <option v-for="c in cols" :key="c" :value="c">{{ CORR_LABEL[c] }}</option>
              </MpSelect>
            </div>
            <div v-if="needsCode" class="spt-coa-tx__field spt-coa-tx__field--wide">
              <MpText as="span" size="body-small" weight="semiBold">Kode penyesuaian fiskal</MpText>
              <MpSelect id="l1-tx-code" v-model="code" :is-disabled="isReadOnly" :is-invalid="!!picked.size && !code" aria-label="Kode penyesuaian fiskal">
                <option value="">Pilih kode</option>
                <option v-for="k in KODE_KOREKSI_FISKAL" :key="k.code" :value="k.code">{{ k.code }} — {{ k.name }}</option>
              </MpSelect>
            </div>
          </div>

          <div class="spt-coa-tx__toolbar">
            <MpInputGroup id="l1-tx-search-group" class="spt-coa-tx__search">
              <MpInputLeftAddon id="l1-tx-search-addon">
                <MpIcon name="search" size="sm" />
              </MpInputLeftAddon>
              <!-- is-clearable emits undefined on clear; keep keyword a string. -->
              <MpInput
                id="l1-tx-search"
                :model-value="keyword"
                placeholder="Cari nomor atau deskripsi"
                aria-label="Cari transaksi"
                is-clearable
                @update:model-value="keyword = $event ?? ''"
              />
            </MpInputGroup>
            <MpSelect id="l1-tx-month" v-model="month" aria-label="Bulan transaksi" class="spt-coa-tx__month">
              <option value="">Semua bulan</option>
              <option v-for="(b, i) in BULAN" :key="b" :value="String(i + 1).padStart(2, '0')">{{ b }}</option>
            </MpSelect>
            <MpToggle id="l1-tx-only-picked" :is-checked="onlyPicked" @change="onlyPicked = $event">Hanya yang dipilih</MpToggle>
          </div>

          <div class="spt-coa-tx__select-bar">
            <MpCheckbox
              id="l1-tx-all"
              :is-checked="allFilteredPicked"
              :is-indeterminate="someFilteredPicked"
              :is-disabled="isReadOnly || !filtered.length"
              @change="setMany(filtered.map(t => t.id), $event)"
            >
              Pilih semua {{ filtered.length }} transaksi{{ isFiltered ? ' hasil filter' : '' }}
            </MpCheckbox>
          </div>

          <MpTableContainer>
            <MpTable :is-hoverable="false">
              <MpTableHead>
                <MpTableRow>
                  <MpTableCell scope="col" class="spt-coa-tx__check"><span class="kp-sr-only">Pilih</span></MpTableCell>
                  <MpTableCell scope="col" class="spt-coa-tx__date">Tanggal</MpTableCell>
                  <MpTableCell scope="col" class="spt-coa-tx__no">Nomor</MpTableCell>
                  <MpTableCell scope="col">Deskripsi</MpTableCell>
                  <MpTableCell scope="col" class="spt-coa-tx__amount">Jumlah</MpTableCell>
                  <MpTableCell scope="col" class="spt-coa-tx__check"><span class="kp-sr-only">Buka di Jurnal</span></MpTableCell>
                </MpTableRow>
              </MpTableHead>
              <MpTableBody>
                <MpTableRow v-for="t in pageRows" :key="t.id">
                  <MpTableCell as="td" class="spt-coa-tx__check">
                    <MpCheckbox
                      :id="`l1-tx-${t.id}`"
                      :is-checked="picked.has(t.id)"
                      :is-disabled="isReadOnly"
                      :aria-label="`Pilih ${t.number}`"
                      @change="setMany([t.id], $event)"
                    />
                  </MpTableCell>
                  <MpTableCell as="td" class="spt-coa-tx__date">{{ t.date }}</MpTableCell>
                  <MpTableCell as="td" class="spt-coa-tx__no">{{ t.number }}</MpTableCell>
                  <MpTableCell as="td">{{ t.description }}</MpTableCell>
                  <MpTableCell as="td" class="spt-coa-tx__amount">{{ formatRp(t.amount) }}</MpTableCell>
                  <MpTableCell as="td" class="spt-coa-tx__check">
                    <a
                      v-tooltip="{ label: 'Buka di Jurnal', placement: 'left' }"
                      :href="t.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="kp-icon-btn kp-icon-btn--compact"
                      :aria-label="`Buka ${t.number} di Jurnal (tab baru)`"
                    >
                      <MpIcon name="newtab" size="sm" />
                    </a>
                  </MpTableCell>
                </MpTableRow>
                <MpTableRow v-if="!pageRows.length">
                  <MpTableCell as="td" colspan="6" class="spt-coa-tx__empty">Tidak ada transaksi yang cocok.</MpTableCell>
                </MpTableRow>
              </MpTableBody>
            </MpTable>
          </MpTableContainer>
          <KpPagination
            v-if="filtered.length"
            id="l1-tx-pagination"
            v-model:page="page"
            v-model:per-page="perPage"
            :total="filtered.length"
            :per-page-options="[20, 50, 100]"
          />
        </div>
      </MpDrawerBody>
      <MpDrawerFooter>
        <div class="spt-coa-tx__foot">
          <div class="spt-coa-tx__total">
            <MpText as="p" size="body-small" color="text.secondary">{{ picked.size }} transaksi dipilih</MpText>
            <MpText as="p" size="body" weight="semiBold">{{ CORR_LABEL[col] }}: {{ formatRp(total) }}</MpText>
            <MpText v-if="line && n(line[col]) !== 0 && n(line[col]) !== total" as="p" size="body-small" color="text.secondary">
              Saat ini {{ formatRp(line[col]) }} — akan diganti dengan total transaksi terpilih.
            </MpText>
          </div>
          <div class="spt-coa-tx__actions">
            <MpButton id="l1-tx-cancel" variant="ghost" @click="emit('close')">Batalkan</MpButton>
            <MpButton id="l1-tx-apply" :is-disabled="!canApply" @click="apply">Terapkan</MpButton>
          </div>
        </div>
      </MpDrawerFooter>
    </MpDrawerContent>
    <MpDrawerOverlay />
  </MpDrawer>
</template>

<!-- Drawer content is teleported: unscoped, rooted on the component's own classes. -->
<style>
.spt-coa-tx {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
}

.spt-coa-tx p {
  margin: 0;
}

.spt-coa-tx__facts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-spacing-2) var(--mp-spacing-6);
}

.spt-coa-tx__basis {
  display: flex;
  align-items: flex-start;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-information);
  font-size: var(--mp-font-sizes-sm);
}

.spt-coa-tx__target {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: var(--mp-spacing-3);
}

.spt-coa-tx__field {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  min-width: 0;
}

.spt-coa-tx__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-3);
}

.spt-coa-tx__search {
  flex: 1;
  min-width: 240px;
}

.spt-coa-tx__month {
  width: 180px;
}

.spt-coa-tx__select-bar {
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-neutral-subtle);
}

.spt-coa-tx__check {
  width: 48px;
}

.spt-coa-tx__date {
  width: 112px;
  white-space: nowrap;
}

.spt-coa-tx__no {
  width: 176px;
  white-space: nowrap;
}

.spt-coa-tx__amount {
  width: 168px;
  text-align: right;
  white-space: nowrap;
}

.spt-coa-tx__empty {
  color: var(--mp-colors-text-secondary);
  text-align: center;
}

.spt-coa-tx__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-3);
  width: 100%;
}

.spt-coa-tx__total {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4xs);
}

.spt-coa-tx__actions {
  display: flex;
  gap: var(--mp-spacing-2);
}
</style>
