<script setup lang="ts">
import { MpSelect, MpTable, MpTableBody, MpTableCell, MpTableContainer, MpTableHead, MpTableRow } from '@mekari/pixel3'
import {
  GRAND_TOTAL_CODE,
  GRAND_TOTAL_COLS,
  LAMPIRAN1_COLUMNS,
  TOTAL_COLS,
  labaRugiValue,
  missingKoreksiCode,
  posisiKeuanganValue,
  type AccountRow,
  type L1Col,
  type Lampiran1Data,
  type RowValues,
} from '~/data/spt1771Lampiran1'
import { KODE_KOREKSI_FISKAL } from '~/data/taxCodes'
import { formatRp } from '~/utils/currency'

// Lampiran 1 account table (Figma "table / lampiran 1a / A|B").
// laba-rugi: 10 columns; (6)=(3)-(4)-(5) and (10)=(6)+(7)-(8) are computed per row.
// posisi-keuangan: one "Nilai (3)" column. Total rows compute from their formula.
const props = defineProps<{ mode: 'laba-rugi' | 'posisi-keuangan', rows: AccountRow[], isReadOnly?: boolean }>()
const data = defineModel<Lampiran1Data>({ required: true })

const numericCols = LAMPIRAN1_COLUMNS

/**
 * Only Laba Rugi scrolls sideways (8 value columns), so only it freezes its two
 * identity columns. Posisi Keuangan has a single value column and fits as it is.
 */
const isFrozen = computed(() => props.mode === 'laba-rugi')
const freeze1 = computed(() => (isFrozen.value ? 'spt-account-table__freeze-1' : ''))
const freeze2 = computed(() => (isFrozen.value ? 'spt-account-table__freeze-2' : ''))

// Read never creates the row entry: mutating during render would mark the whole
// SPT draft dirty just from opening Lampiran 1. The entry is created on edit.
const cell = <K extends keyof RowValues>(code: string, col: K): RowValues[K] => data.value.labaRugi[code]?.[col]

function setCell<K extends keyof RowValues>(code: string, col: K, value: RowValues[K]) {
  data.value.labaRugi[code] = { ...data.value.labaRugi[code], [col]: value }
}

function isEditable(row: AccountRow, col: L1Col | 'c9') {
  if (row.kind !== 'input') return false
  if (col === 'c6' || col === 'c10') return false
  if (col === 'c4' || col === 'c5') return row.variant === 'full'
  return true
}

/** Rows whose kolom (7)/(8) carry a correction with no kolom (9) code to justify it. */
const needsKoreksiCode = computed(() => new Set(missingKoreksiCode(data.value)))

function showTotal(row: AccountRow, col: L1Col | 'c9') {
  if (col === 'c9') return false
  return (row.kind === 'total' && row.code === GRAND_TOTAL_CODE ? GRAND_TOTAL_COLS : TOTAL_COLS).includes(col)
}
</script>

<template>
  <MpTableContainer class="spt-account-table">
    <MpTable :is-hoverable="false">
      <MpTableHead>
        <MpTableRow>
          <MpTableCell scope="col" :class="['spt-account-table__code', freeze1]">Kode akun (1)</MpTableCell>
          <MpTableCell scope="col" :class="['spt-account-table__name', freeze2]">Nama akun (2)</MpTableCell>
          <template v-if="mode === 'laba-rugi'">
            <MpTableCell v-for="c in numericCols" :key="c.key" scope="col" class="spt-account-table__num">{{ c.label }}</MpTableCell>
          </template>
          <MpTableCell v-else scope="col" class="spt-account-table__num spt-account-table__num--wide">Nilai (3)</MpTableCell>
        </MpTableRow>
      </MpTableHead>
      <MpTableBody>
        <template v-for="(row, i) in rows" :key="row.kind === 'group' ? `g-${i}` : row.code">
          <!-- Group heading -->
          <MpTableRow v-if="row.kind === 'group'" class="spt-account-table__group">
            <MpTableCell as="td" :class="freeze1" />
            <MpTableCell as="td" :class="['spt-account-table__strong', freeze2]">{{ row.label }}</MpTableCell>
            <MpTableCell as="td" :colspan="mode === 'laba-rugi' ? numericCols.length : 1" />
          </MpTableRow>

          <!-- Laba rugi -->
          <MpTableRow v-else-if="mode === 'laba-rugi'" :class="{ 'spt-account-table__total': row.kind === 'total' }">
            <MpTableCell as="td" :class="[freeze1, { 'spt-account-table__strong': row.kind === 'total' }]">{{ row.code }}</MpTableCell>
            <MpTableCell as="td" :class="[freeze2, { 'spt-account-table__strong': row.kind === 'total', 'spt-account-table__indent': row.kind === 'input' && row.indent }]">{{ row.label }}</MpTableCell>
            <MpTableCell v-for="c in numericCols" :key="c.key" as="td" class="spt-account-table__num">
              <template v-if="row.kind === 'input'">
                <MpSelect
                  v-if="c.key === 'c9'"
                  :id="`l1a-${row.code}-c9`"
                  :model-value="cell(row.code, 'c9')"
                  size="sm"
                  :is-disabled="isReadOnly"
                  :is-invalid="needsKoreksiCode.has(row.code)"
                  :aria-label="`${row.label} — kode koreksi fiskal`"
                  @update:model-value="setCell(row.code, 'c9', String($event ?? ''))"
                >
                  <option value="">-</option>
                  <option v-for="k in KODE_KOREKSI_FISKAL" :key="k.code" :value="k.code">{{ k.code }} — {{ k.name }}</option>
                </MpSelect>
                <KpCurrencyInput
                  v-else-if="isEditable(row, c.key)"
                  :id="`l1a-${row.code}-${c.key}`"
                  :model-value="cell(row.code, c.key as 'c3')"
                  :aria-label="`${row.label} — ${c.label}`"
                  size="sm"
                  :is-disabled="isReadOnly"
                  @update:model-value="setCell(row.code, c.key as 'c3', $event)"
                />
                <KpCurrencyInput
                  v-else-if="c.computed"
                  :id="`l1a-${row.code}-${c.key}`"
                  :model-value="labaRugiValue(data, row.code, c.key as L1Col)"
                  :aria-label="`${row.label} — ${c.label}`"
                  size="sm"
                  is-disabled
                />
                <SptCellError
                  v-if="c.key === 'c9' && needsKoreksiCode.has(row.code)"
                  message="Pilih kode koreksi fiskal untuk nilai di kolom (7) atau (8)."
                />
              </template>
              <span v-else-if="showTotal(row, c.key)" class="spt-account-table__amount">
                {{ formatRp(labaRugiValue(data, row.code, c.key as L1Col)) }}
              </span>
            </MpTableCell>
          </MpTableRow>

          <!-- Posisi keuangan -->
          <MpTableRow v-else :class="{ 'spt-account-table__total': row.kind === 'total' }">
            <MpTableCell as="td" :class="[freeze1, { 'spt-account-table__strong': row.kind === 'total' }]">{{ row.code }}</MpTableCell>
            <MpTableCell as="td" :class="[freeze2, { 'spt-account-table__strong': row.kind === 'total', 'spt-account-table__indent': row.kind === 'input' && row.indent }]">{{ row.label }}</MpTableCell>
            <MpTableCell as="td" class="spt-account-table__num spt-account-table__num--wide">
              <KpCurrencyInput
                v-if="row.kind === 'input'"
                :id="`l1b-${row.code}`"
                v-model="data.posisiKeuangan[row.code]"
                :aria-label="row.label"
                size="sm"
                :is-disabled="isReadOnly"
              />
              <span v-else class="spt-account-table__amount">{{ formatRp(posisiKeuanganValue(data, row.code)) }}</span>
            </MpTableCell>
          </MpTableRow>
        </template>
      </MpTableBody>
    </MpTable>
  </MpTableContainer>
</template>

<style scoped>
.spt-account-table {
  width: 100%;
}

/* Border-box so the frozen column's total width is exactly the offset column (2) uses. */
.spt-account-table__code {
  box-sizing: border-box;
  width: 124px;
  min-width: 124px;
  max-width: 124px;
}

.spt-account-table__name {
  box-sizing: border-box;
  width: 320px;
  min-width: 220px;
  max-width: 320px;
}

.spt-account-table__num {
  width: 184px;
  min-width: 184px;
}
.spt-account-table__num--wide {
  width: 240px;
}

/* Kode akun and Nama akun stay put while the value columns scroll (freeze up to (2)). */
.spt-account-table__freeze-1,
.spt-account-table__freeze-2 {
  position: sticky;
  z-index: 3;
  background: var(--mp-colors-background-stage);
}
.spt-account-table__freeze-1 {
  box-sizing: border-box;
  left: 0;
  width: 124px;
  min-width: 124px;
  max-width: 124px;
}
.spt-account-table__freeze-2 {
  left: 124px;
}
thead .spt-account-table__freeze-1,
thead .spt-account-table__freeze-2 {
  z-index: 4;
  background: var(--mp-colors-background-surface);
}

.spt-account-table__amount {
  display: block;
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.spt-account-table__strong {
  font-weight: var(--mp-font-weights-semi-bold);
}

.spt-account-table__indent {
  padding-left: var(--mp-spacing-6) !important;
}

.spt-account-table__total {
  background: var(--mp-colors-background-neutral-subtle);
}
</style>
