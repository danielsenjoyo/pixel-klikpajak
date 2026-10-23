<script setup lang="ts">
import {
  MpButton,
  MpCheckbox,
  MpIcon,
  MpInput,
  MpInputGroup,
  MpInputLeftAddon,
  MpSegmentedControl,
  MpSelect,
  MpTable,
  MpTableBody,
  MpTableCell,
  MpTableContainer,
  MpTableHead,
  MpTableRow,
  MpText,
} from '@mekari/pixel3'
import {
  CLASS_LABEL,
  COA_COL_LABEL,
  FISCAL_PROMPT,
  allowedDjp,
  coaFiskal,
  coaTidakFinal,
  editableCols,
  isProfitLoss,
  logChange,
  needsCode,
  type CoaCol,
  type CoaLine,
  type ErpWorkspace,
} from '~/data/coaMapping'
import type { CoaClass } from '~/data/jurnalErp'
import { KODE_KOREKSI_FISKAL } from '~/data/taxCodes'
import SptCoaTransactionsDrawer from '~/components/spt/l1/SptCoaTransactionsDrawer.vue'
import { formatRp, n } from '~/utils/currency'

// Per-CoA grid, spreadsheet-style (L1 PRD §6A + round-1 F1–F5): one compact row per Jurnal
// CoA — akun DJP, then every Lampiran 1A column (3)–(10) typed in place. Akun Jurnal and
// Akun DJP freeze on the left while the value columns scroll sideways. Transactions behind a
// CoA open in a row under it to tick from — no drawer, no popup.
const props = defineProps<{
  statement: 'laba-rugi' | 'posisi-keuangan'
  sektor: string
  isReadOnly?: boolean
}>()
const ws = defineModel<ErpWorkspace>({ required: true })

const isLabaRugi = computed(() => props.statement === 'laba-rugi')
const CLASSES: Record<typeof props.statement, CoaClass[]> = {
  'laba-rugi': ['pendapatan', 'beban'],
  'posisi-keuangan': ['aset', 'liabilitas', 'ekuitas'],
}

/** Value columns after (3), in DJP order; (6) and (10) are computed. */
const COLS: { key: CoaCol | 'c6' | 'c9' | 'c10', label: string, no: string }[] = [
  { key: 'c4', label: 'Non objek pajak', no: '(4)' },
  { key: 'c5', label: 'Dikenakan PPh Final', no: '(5)' },
  { key: 'c6', label: 'Tidak final', no: '(6) = (3) − (4) − (5)' },
  { key: 'c7', label: 'Penyesuaian fiskal positif', no: '(7)' },
  { key: 'c8', label: 'Penyesuaian fiskal negatif', no: '(8)' },
  { key: 'c9', label: 'Kode penyesuaian fiskal', no: '(9)' },
  { key: 'c10', label: 'Nilai fiskal (sebelum fasilitas)', no: '(10) = (6) + (7) − (8)' },
]

// ── Filter ───────────────────────────────────────────────────────────────────
const keyword = ref('')
const filter = ref<'all' | 'unmapped' | 'corrected'>('all')

const statementLines = computed(() => ws.value.lines.filter(l => isProfitLoss(l.cls) === isLabaRugi.value))
const hasCorrection = (l: CoaLine) => (['c4', 'c5', 'c7', 'c8'] as const).some(c => n(l[c]) !== 0)
const unmappedCount = computed(() => statementLines.value.filter(l => !l.djp).length)
const correctedCount = computed(() => statementLines.value.filter(hasCorrection).length)

const visible = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  return statementLines.value.filter(l =>
    (filter.value === 'all' || (filter.value === 'unmapped' ? !l.djp : hasCorrection(l)))
    && (!q || l.coa.includes(q) || l.name.toLowerCase().includes(q)))
})
const groups = computed(() => CLASSES[props.statement]
  .map(cls => ({ cls, lines: visible.value.filter(l => l.cls === cls).sort((a, b) => a.coa.localeCompare(b.coa)) }))
  .filter(g => g.lines.length))

const filterOptions = computed(() => [
  { id: `l1-${props.statement}-filter-all`, label: 'Semua akun', value: 'all' },
  { id: `l1-${props.statement}-filter-unmapped`, label: `Belum dipetakan (${unmappedCount.value})`, value: 'unmapped' },
  ...(isLabaRugi.value ? [{ id: `l1-${props.statement}-filter-corrected`, label: `Ada koreksi (${correctedCount.value})`, value: 'corrected' }] : []),
])

/** Frozen: checkbox + Akun Jurnal + Akun DJP; then (3) and, on Laba Rugi, (4)–(10) + transaksi. */
const colCount = computed(() => (props.isReadOnly ? 0 : 1) + 2 + 1 + (isLabaRugi.value ? COLS.length + 1 : 0))

// ── Mapping and value (each edit logged — PRD §4 audit trail) ───────────────
const options = (cls: CoaClass) => allowedDjp(cls, props.sektor)

function setDjp(line: CoaLine, code: string) {
  const next = code || null
  logChange(ws.value, line.coa, 'Akun DJP', line.djp, next)
  line.djp = next
  line.djpSource = next ? 'user' : null
}
function setValue(line: CoaLine, value: number | null) {
  logChange(ws.value, line.coa, 'Nilai komersial', line.value, value)
  line.value = value
}
function setCol(l: CoaLine, col: CoaCol, value: number | null) {
  logChange(ws.value, l.coa, COA_COL_LABEL[col], l[col], value)
  l[col] = value
}
function setCode(l: CoaLine, code: string) {
  logChange(ws.value, l.coa, 'Kode koreksi fiskal', l.c9, code)
  l.c9 = code
}

/** Where the DJP account came from, as a tooltip on the select — kept out of the row's height. */
function sourceLabel(l: CoaLine) {
  if (l.isMissing && l.value === null) return 'Gagal ditarik dari Jurnal — isi nilainya manual'
  if (!l.djp) return 'Belum dipetakan'
  if (l.djpSource === 'user') return 'Diubah manual'
  if (l.djpSource === 'reuse') return 'Dipakai ulang dari pemetaan sebelumnya'
  return 'Terdeteksi otomatis'
}
const valueNote = (l: CoaLine) => (l.value === l.jurnalValue
  ? null
  : l.jurnalValue === null ? 'Diisi manual — tidak terbaca dari Jurnal' : `Diubah dari Jurnal ${formatRp(l.jurnalValue)}`)

const canEdit = (l: CoaLine, col: CoaCol) => !props.isReadOnly && !!l.djp && editableCols(l, props.sektor).includes(col)
const prompt = (l: CoaLine) => FISCAL_PROMPT[l.coa]
const promptTip = (l: CoaLine) => {
  const p = prompt(l)!
  return `Cek ${COA_COL_LABEL[p.col].toLowerCase()}${p.code ? ` (${p.code})` : ''}. ${p.basis}`
}

// ── Bulk set (AC-010b) ───────────────────────────────────────────────────────
const selected = ref<string[]>([])
watch(() => props.statement, () => {
  selected.value = []
  keyword.value = ''
  filter.value = 'all'
})
const selectedLines = computed(() => statementLines.value.filter(l => selected.value.includes(l.coa)))
/** One DJP account takes CoA of one class only — the class guard holds in bulk too. */
const bulkClass = computed(() => {
  const classes = new Set(selectedLines.value.map(l => l.cls))
  return classes.size === 1 ? [...classes][0]! : null
})
const bulkCode = ref('')
watch(bulkClass, () => { bulkCode.value = '' })

const visibleCodes = computed(() => visible.value.map(l => l.coa))
const allVisibleSelected = computed(() => visibleCodes.value.length > 0 && visibleCodes.value.every(c => selected.value.includes(c)))
const someVisibleSelected = computed(() => !allVisibleSelected.value && visibleCodes.value.some(c => selected.value.includes(c)))
function toggleAll(checked: boolean) {
  selected.value = checked
    ? [...new Set([...selected.value, ...visibleCodes.value])]
    : selected.value.filter(c => !visibleCodes.value.includes(c))
}
function toggleSelect(coa: string, checked: boolean) {
  selected.value = checked ? [...selected.value, coa] : selected.value.filter(c => c !== coa)
}
function applyBulk() {
  if (!bulkCode.value) return
  for (const l of selectedLines.value) setDjp(l, bulkCode.value)
  selected.value = []
  bulkCode.value = ''
}

// ── Transactions: a year of activity per CoA, picked in a drawer ────────────
const txOf = (l: CoaLine) => ws.value.transactions[l.coa] ?? []
const drawerCoa = ref<string | null>(null)
const drawerLine = computed(() => statementLines.value.find(l => l.coa === drawerCoa.value) ?? null)
/** Account name opens the drawer too — only where there is something to pick and the row is mapped. */
const canOpenTx = (l: CoaLine) => isLabaRugi.value && !!l.djp && txOf(l).length > 0

function applyTx(patch: { picked: string[], col: CoaCol, amount: number | null, code: string }) {
  const l = drawerLine.value
  if (!l) return
  l.picked = patch.picked
  l.pickCol = patch.col
  setCol(l, patch.col, patch.amount)
  if (patch.code) setCode(l, patch.code)
  drawerCoa.value = null
}
</script>

<template>
  <div class="spt-coa">
    <div class="spt-coa__toolbar">
      <MpSegmentedControl :id="`l1-${statement}-filter`" v-model="filter" :name="`l1-${statement}-filter`" :data="filterOptions" />
      <MpInputGroup :id="`l1-${statement}-search-group`" class="spt-coa__search">
        <MpInputLeftAddon :id="`l1-${statement}-search-addon`">
          <MpIcon name="search" size="sm" />
        </MpInputLeftAddon>
        <!-- is-clearable emits undefined on clear; keep keyword a string. -->
        <MpInput
          :id="`l1-${statement}-search`"
          :model-value="keyword"
          placeholder="Cari kode atau nama akun"
          aria-label="Cari akun Jurnal"
          is-clearable
          @update:model-value="keyword = $event ?? ''"
        />
      </MpInputGroup>
    </div>

    <div v-if="selected.length && !isReadOnly" class="spt-coa__bulk" role="region" aria-label="Atur akun DJP untuk akun terpilih">
      <MpText size="body-small" weight="semiBold">{{ selected.length }} akun dipilih</MpText>
      <template v-if="bulkClass">
        <MpSelect :id="`l1-${statement}-bulk-djp`" v-model="bulkCode" size="sm" aria-label="Akun DJP untuk akun terpilih" class="spt-coa__bulk-select">
          <option value="">Pilih akun DJP</option>
          <option v-for="o in options(bulkClass)" :key="o.value" :value="o.value">{{ o.label }}</option>
        </MpSelect>
        <MpButton :id="`l1-${statement}-bulk-apply`" size="sm" :is-disabled="!bulkCode" @click="applyBulk">Terapkan</MpButton>
      </template>
      <MpText v-else size="body-small" color="text.secondary">Pilih akun dengan kelas yang sama untuk mengatur satu akun DJP sekaligus.</MpText>
      <MpButton :id="`l1-${statement}-bulk-clear`" size="sm" variant="ghost" @click="selected = []">Batal pilih</MpButton>
    </div>

    <MpTableContainer class="spt-coa__scroll">
      <MpTable :is-hoverable="false" class="spt-coa__table" :class="{ 'spt-coa__table--wide': isLabaRugi, 'spt-coa__table--edit': !isReadOnly }">
        <MpTableHead>
          <MpTableRow>
            <MpTableCell v-if="!isReadOnly" scope="col" class="spt-coa__f0">
              <MpCheckbox
                :id="`l1-${statement}-check-all`"
                :is-checked="allVisibleSelected"
                :is-indeterminate="someVisibleSelected"
                aria-label="Pilih semua akun yang tampil"
                @change="toggleAll"
              />
            </MpTableCell>
            <MpTableCell scope="col" class="spt-coa__f1">Akun Jurnal</MpTableCell>
            <MpTableCell scope="col" class="spt-coa__f2">Akun DJP</MpTableCell>
            <MpTableCell scope="col" class="spt-coa__num">{{ isLabaRugi ? 'Nilai komersial' : 'Nilai' }}</MpTableCell>
            <template v-if="isLabaRugi">
              <MpTableCell v-for="c in COLS" :key="c.key" scope="col" :class="c.key === 'c9' ? 'spt-coa__kode' : 'spt-coa__num'">{{ c.label }}</MpTableCell>
              <MpTableCell scope="col" class="spt-coa__tx-col">Transaksi</MpTableCell>
            </template>
          </MpTableRow>
          <!-- DJP's numbering row, with the arithmetic the grid runs for every CoA. -->
          <MpTableRow class="spt-coa__no">
            <MpTableCell v-if="!isReadOnly" scope="col" class="spt-coa__f0" />
            <MpTableCell scope="col" class="spt-coa__f1" />
            <MpTableCell scope="col" class="spt-coa__f2">(1) · (2)</MpTableCell>
            <MpTableCell scope="col" class="spt-coa__num">(3)</MpTableCell>
            <template v-if="isLabaRugi">
              <MpTableCell v-for="c in COLS" :key="c.key" scope="col">{{ c.no }}</MpTableCell>
              <MpTableCell scope="col" class="spt-coa__tx-col" />
            </template>
          </MpTableRow>
        </MpTableHead>
        <MpTableBody>
          <template v-for="g in groups" :key="g.cls">
            <MpTableRow class="spt-coa__group">
              <MpTableCell as="td" :colspan="colCount">
                <span class="spt-coa__group-label">{{ CLASS_LABEL[g.cls] }}</span>
              </MpTableCell>
            </MpTableRow>

            <template v-for="l in g.lines" :key="l.coa">
              <MpTableRow :id="`l1-coa-item-${l.coa}`" :class="{ 'spt-coa__row--open': drawerCoa === l.coa }">
                <MpTableCell v-if="!isReadOnly" as="td" class="spt-coa__f0">
                  <MpCheckbox
                    :id="`l1-coa-${l.coa}-select`"
                    :is-checked="selected.includes(l.coa)"
                    :aria-label="`Pilih ${l.name}`"
                    @change="toggleSelect(l.coa, $event)"
                  />
                </MpTableCell>
                <MpTableCell as="td" class="spt-coa__f1">
                  <span class="spt-coa__acct">
                    <span class="spt-coa__acct-code">{{ l.coa }}</span>
                    <!-- pixel-police-allow: account name as a text link into its transactions — no Pixel inline-link button -->
                    <button
                      v-if="canOpenTx(l)"
                      :id="`l1-coa-${l.coa}-name`"
                      type="button"
                      class="spt-coa__acct-name spt-coa__acct-link"
                      :title="`${l.name} — lihat transaksi`"
                      @click="drawerCoa = l.coa"
                    >
                      {{ l.name }}
                    </button>
                    <span v-else class="spt-coa__acct-name" :title="l.name">{{ l.name }}</span>
                    <span
                      v-if="isLabaRugi && prompt(l)"
                      v-tooltip="{ label: promptTip(l), placement: 'right' }"
                      class="spt-coa__tip"
                      tabindex="0"
                      :aria-label="promptTip(l)"
                    >
                      <MpIcon name="info" size="sm" />
                    </span>
                  </span>
                </MpTableCell>
                <MpTableCell as="td" class="spt-coa__f2">
                  <span v-tooltip="{ label: sourceLabel(l), placement: 'top' }" class="spt-coa__djp">
                    <MpSelect
                      :id="`l1-coa-${l.coa}-djp`"
                      :model-value="l.djp ?? ''"
                      size="sm"
                      :is-disabled="isReadOnly"
                      :is-invalid="!l.djp"
                      :aria-label="`${l.name} — akun DJP (${sourceLabel(l)})`"
                      @update:model-value="setDjp(l, String($event ?? ''))"
                    >
                      <option value="">Pilih akun DJP</option>
                      <option v-for="o in options(l.cls)" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </MpSelect>
                  </span>
                </MpTableCell>
                <MpTableCell as="td" class="spt-coa__num">
                  <span class="spt-coa__value">
                    <KpCurrencyInput
                      :id="`l1-coa-${l.coa}-value`"
                      :model-value="l.value"
                      size="sm"
                      :is-disabled="isReadOnly"
                      :is-invalid="l.isMissing && l.value === null"
                      :aria-label="`${l.name} — nilai`"
                      @update:model-value="setValue(l, $event)"
                    />
                    <span
                      v-if="valueNote(l)"
                      v-tooltip="{ label: valueNote(l)!, placement: 'top' }"
                      class="spt-coa__tip spt-coa__tip--changed"
                      tabindex="0"
                      :aria-label="valueNote(l)!"
                    >
                      <MpIcon name="edit" size="sm" />
                    </span>
                  </span>
                </MpTableCell>

                <template v-if="isLabaRugi">
                  <MpTableCell v-for="c in COLS" :key="c.key" as="td" :class="c.key === 'c9' ? 'spt-coa__kode' : 'spt-coa__num'">
                    <span v-if="c.key === 'c6'" class="spt-coa__amount">{{ formatRp(coaTidakFinal(l)) }}</span>
                    <span v-else-if="c.key === 'c10'" class="spt-coa__amount spt-coa__amount--strong">{{ formatRp(coaFiskal(l)) }}</span>
                    <template v-else-if="c.key === 'c9'">
                      <MpSelect
                        v-if="l.djp"
                        :id="`l1-coa-${l.coa}-c9`"
                        :model-value="l.c9 ?? ''"
                        size="sm"
                        :is-disabled="isReadOnly"
                        :is-invalid="needsCode(l)"
                        :aria-label="`${l.name} — kode koreksi fiskal${needsCode(l) ? ' (wajib dipilih)' : ''}`"
                        @update:model-value="setCode(l, String($event ?? ''))"
                      >
                        <option value="">-</option>
                        <option v-for="k in KODE_KOREKSI_FISKAL" :key="k.code" :value="k.code">{{ k.code }} — {{ k.name }}</option>
                      </MpSelect>
                    </template>
                    <KpCurrencyInput
                      v-else-if="canEdit(l, c.key)"
                      :id="`l1-coa-${l.coa}-${c.key}`"
                      :model-value="l[c.key]"
                      size="sm"
                      :aria-label="`${l.name} — ${c.label}`"
                      @update:model-value="setCol(l, c.key as CoaCol, $event)"
                    />
                  </MpTableCell>
                  <MpTableCell as="td" class="spt-coa__tx-col">
                    <MpButton
                      v-if="canOpenTx(l)"
                      :id="`l1-coa-${l.coa}-tx`"
                      size="sm"
                      variant="ghost"
                      @click="drawerCoa = l.coa"
                    >
                      {{ l.picked?.length ? `${l.picked.length} dari ${txOf(l).length}` : `${txOf(l).length} transaksi` }}
                    </MpButton>
                  </MpTableCell>
                </template>
              </MpTableRow>

            </template>
          </template>

          <MpTableRow v-if="!groups.length">
            <MpTableCell as="td" :colspan="colCount" class="spt-coa__empty">
              {{ keyword ? 'Tidak ada akun yang cocok dengan pencarian.' : filter === 'unmapped' ? 'Semua akun sudah dipetakan ke akun DJP.' : 'Belum ada akun dengan koreksi fiskal.' }}
            </MpTableCell>
          </MpTableRow>
        </MpTableBody>
      </MpTable>
    </MpTableContainer>

    <!-- Mounted per open: MpModal opens on is-open=true but never closes on false, so a
         prop-closed drawer would stay "open" inside and ignore the next open. -->
    <SptCoaTransactionsDrawer
      v-if="drawerLine"
      :key="drawerLine.coa"
      :line="drawerLine"
      :transactions="drawerLine ? txOf(drawerLine) : []"
      :sektor="sektor"
      :is-read-only="isReadOnly"
      @close="drawerCoa = null"
      @apply="applyTx"
    />
  </div>
</template>

<style scoped>
.spt-coa {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  min-width: 0;
}

.spt-coa p {
  margin: 0;
}

.spt-coa__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-3);
}

.spt-coa__search {
  width: 280px;
  max-width: 100%;
}

.spt-coa__bulk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-3);
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-brand);
}

.spt-coa__bulk-select {
  width: 320px;
  max-width: 100%;
}

/* ── Grid ── */
.spt-coa__table--wide {
  min-width: 1720px;
}

/* DJP numbering row under the heads. */
.spt-coa__no :deep(th),
.spt-coa__no :deep(td) {
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  font-weight: var(--mp-font-weights-regular);
  text-align: center;
  white-space: nowrap;
}

/* Compact rows: one input high. */
.spt-coa__table :deep(td),
.spt-coa__table :deep(th) {
  padding-top: var(--mp-spacing-1);
  padding-bottom: var(--mp-spacing-1);
}

/* Frozen: checkbox (40) + Akun Jurnal (300) + Akun DJP (240), border-box so offsets add up. */
.spt-coa__f0,
.spt-coa__f1,
.spt-coa__f2 {
  position: sticky;
  z-index: 3;
  box-sizing: border-box;
  background: var(--mp-colors-background-stage);
}
thead .spt-coa__f0,
thead .spt-coa__f1,
thead .spt-coa__f2 {
  z-index: 4;
  background: var(--mp-colors-background-surface);
}
.spt-coa__f0 {
  left: 0;
  width: 40px;
  min-width: 40px;
  max-width: 40px;
}
.spt-coa__f1 {
  left: 0;
  width: 300px;
  min-width: 300px;
  max-width: 300px;
}
.spt-coa__table--edit .spt-coa__f1 {
  left: 40px;
}
.spt-coa__f2 {
  left: 300px;
  width: 240px;
  min-width: 240px;
  max-width: 240px;
  box-shadow: inset -1px 0 0 var(--mp-colors-border-default);
}
.spt-coa__table--edit .spt-coa__f2 {
  left: 340px;
}

.spt-coa__acct {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  min-width: 0;
}
.spt-coa__acct-code {
  flex-shrink: 0;
  width: 64px;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  font-variant-numeric: tabular-nums;
}
.spt-coa__acct-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spt-coa__acct-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--mp-colors-text-link);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.spt-coa__acct-link:hover {
  text-decoration: underline;
}
.spt-coa__acct-link:focus-visible {
  outline: none;
  border-radius: var(--mp-radii-sm);
  box-shadow: var(--mp-shadows-focus);
}

.spt-coa__djp {
  display: block;
}

.spt-coa__tip {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--mp-colors-icon-default);
  cursor: help;
}
.spt-coa__tip:focus-visible {
  outline: none;
  border-radius: var(--mp-radii-sm);
  box-shadow: var(--mp-shadows-focus);
}
.spt-coa__tip--changed {
  color: var(--mp-colors-text-link);
}

.spt-coa__num {
  width: 176px;
  min-width: 176px;
  text-align: right;
}

.spt-coa__value {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-1);
}

.spt-coa__kode {
  width: 200px;
  min-width: 200px;
}

.spt-coa__tx-col {
  width: 140px;
  min-width: 140px;
}

.spt-coa__amount {
  display: block;
  white-space: nowrap;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.spt-coa__amount--strong {
  font-weight: var(--mp-font-weights-semi-bold);
}

.spt-coa__group :deep(td) {
  background: var(--mp-colors-background-neutral-subtle);
  font-size: var(--mp-font-sizes-sm);
  font-weight: var(--mp-font-weights-semi-bold);
}
/* The group label rides with the frozen columns while the grid scrolls. */
.spt-coa__group-label {
  position: sticky;
  left: var(--mp-spacing-3);
}

.spt-coa__row--open :deep(td) {
  background: var(--mp-colors-background-brand);
}

.spt-coa__empty {
  color: var(--mp-colors-text-secondary);
  text-align: center;
}
</style>
