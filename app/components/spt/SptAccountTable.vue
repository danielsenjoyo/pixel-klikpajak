<script setup lang="ts">
import { MpInput, MpTable, MpTableBody, MpTableCell, MpTableContainer, MpTableHead, MpTableRow } from '@mekari/pixel3'
import {
  GRAND_TOTAL_CODE,
  GRAND_TOTAL_COLS,
  LAMPIRAN1_COLUMNS,
  TOTAL_COLS,
  labaRugiValue,
  posisiKeuanganValue,
  type AccountRow,
  type L1Col,
  type Lampiran1Data,
} from '~/data/spt1771Lampiran1'
import { formatRp } from '~/utils/currency'

// Lampiran 1 account table (Figma "table / lampiran 1a / A|B").
// laba-rugi: 10 columns; (6)=(3)-(4)-(5) and (10)=(6)+(7)-(8) are computed per row.
// posisi-keuangan: one "Nilai (3)" column. Total rows compute from their formula.
defineProps<{ mode: 'laba-rugi' | 'posisi-keuangan', rows: AccountRow[], isReadOnly?: boolean }>()
const data = defineModel<Lampiran1Data>({ required: true })

const numericCols = LAMPIRAN1_COLUMNS

function labaRugiEntry(code: string) {
  if (!data.value.labaRugi[code]) data.value.labaRugi[code] = {}
  return data.value.labaRugi[code]!
}

function isEditable(row: AccountRow, col: L1Col | 'c9') {
  if (row.kind !== 'input') return false
  if (col === 'c6' || col === 'c10') return false
  if (col === 'c4' || col === 'c5') return row.variant === 'full'
  return true
}

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
          <MpTableCell scope="col" class="spt-account-table__code">Kode akun (1)</MpTableCell>
          <MpTableCell scope="col" class="spt-account-table__name">Nama akun (2)</MpTableCell>
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
            <MpTableCell as="td" />
            <MpTableCell as="td" class="spt-account-table__strong">{{ row.label }}</MpTableCell>
            <MpTableCell as="td" :colspan="mode === 'laba-rugi' ? numericCols.length : 1" />
          </MpTableRow>

          <!-- Laba rugi -->
          <MpTableRow v-else-if="mode === 'laba-rugi'" :class="{ 'spt-account-table__total': row.kind === 'total' }">
            <MpTableCell as="td" :class="{ 'spt-account-table__strong': row.kind === 'total' }">{{ row.code }}</MpTableCell>
            <MpTableCell as="td" :class="{ 'spt-account-table__strong': row.kind === 'total', 'spt-account-table__indent': row.kind === 'input' && row.indent }">{{ row.label }}</MpTableCell>
            <MpTableCell v-for="c in numericCols" :key="c.key" as="td" class="spt-account-table__num">
              <template v-if="row.kind === 'input'">
                <MpInput
                  v-if="c.key === 'c9'"
                  :id="`l1a-${row.code}-c9`"
                  v-model="labaRugiEntry(row.code).c9"
                  size="sm"
                  :is-disabled="isReadOnly"
                  :aria-label="`${row.label} — kode koreksi fiskal`"
                />
                <KpCurrencyInput
                  v-else-if="isEditable(row, c.key)"
                  :id="`l1a-${row.code}-${c.key}`"
                  v-model="labaRugiEntry(row.code)[c.key as 'c3']"
                  size="sm"
                  :is-disabled="isReadOnly"
                />
                <KpCurrencyInput
                  v-else-if="c.computed"
                  :id="`l1a-${row.code}-${c.key}`"
                  :model-value="labaRugiValue(data, row.code, c.key as L1Col)"
                  size="sm"
                  is-disabled
                />
              </template>
              <span v-else-if="showTotal(row, c.key)" class="spt-account-table__amount">
                {{ formatRp(labaRugiValue(data, row.code, c.key as L1Col)) }}
              </span>
            </MpTableCell>
          </MpTableRow>

          <!-- Posisi keuangan -->
          <MpTableRow v-else :class="{ 'spt-account-table__total': row.kind === 'total' }">
            <MpTableCell as="td" :class="{ 'spt-account-table__strong': row.kind === 'total' }">{{ row.code }}</MpTableCell>
            <MpTableCell as="td" :class="{ 'spt-account-table__strong': row.kind === 'total', 'spt-account-table__indent': row.kind === 'input' && row.indent }">{{ row.label }}</MpTableCell>
            <MpTableCell as="td" class="spt-account-table__num spt-account-table__num--wide">
              <KpCurrencyInput
                v-if="row.kind === 'input'"
                :id="`l1b-${row.code}`"
                v-model="data.posisiKeuangan[row.code]"
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

.spt-account-table__code {
  width: 88px;
  min-width: 88px;
}

.spt-account-table__name {
  min-width: 200px;
}

.spt-account-table__num {
  width: 184px;
  min-width: 184px;
}
.spt-account-table__num--wide {
  width: 240px;
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
