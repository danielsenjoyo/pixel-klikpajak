<script setup lang="ts">
import {
  MpButton,
  MpDrawer,
  MpDrawerBody,
  MpDrawerCloseButton,
  MpDrawerContent,
  MpDrawerFooter,
  MpDrawerHeader,
  MpDrawerOverlay,
  MpFormControl,
  MpFormErrorMessage,
  MpFormLabel,
  MpIcon,
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
  formatValue,
  headerGroups,
  newRowId,
  num,
  type Ctx,
  type FieldDef,
  type Row,
  type TableBlock,
} from '~/data/spt1771Engine'

// Lampiran table (Figma "table / lampiran N"). Two modes:
//   inline — every cell is an input, rows added/removed in place
//   drawer — read-only rows with Tindakan (Ubah/Hapus); "Tambah data" opens a form drawer
const props = defineProps<{ block: TableBlock, ctx: Ctx, idPrefix: string, isReadOnly?: boolean }>()
const rows = defineModel<Row[]>({ required: true })

const numbered = computed(() => props.block.numbered !== false)
const hasGroups = computed(() => props.block.columns.some(c => c.group))
const groups = computed(() => headerGroups(props.block.columns))
const groupedColumns = computed(() => props.block.columns.filter(c => c.group))
const hasActions = computed(() => !props.isReadOnly)
const leadCols = computed(() => (numbered.value ? 1 : 0))

const cellWidth = (c: FieldDef) => `${c.width ?? (c.type === 'currency' || c.type === 'usd' ? 184 : 160)}px`
const cellValue = (c: FieldDef, r: Row) => (c.compute ? c.compute(r, props.ctx) : r[c.key])
const isNumeric = (c: FieldDef) => c.type === 'currency' || c.type === 'usd' || !!c.compute

function columnTotal(c: FieldDef) {
  return rows.value.reduce((acc, r) => acc + num(cellValue(c, r)), 0)
}

function emptyRow(): Row {
  return { id: newRowId() }
}

// ── Inline mode ──────────────────────────────────────────────────────────────
// In-place edits (the array is the draft's own), so rapid clicks never read a stale prop.
function addRow() {
  rows.value.push(emptyRow())
}

function removeRow(id: string) {
  const i = rows.value.findIndex(r => r.id === id)
  if (i >= 0) rows.value.splice(i, 1)
}

// ── Drawer mode ──────────────────────────────────────────────────────────────
const drawerRow = ref<Row | null>(null)
const isEditing = ref(false)
const showErrors = ref(false)
const drawerTitle = computed(() => `${isEditing.value ? 'Ubah' : 'Tambah'} data ${props.block.emptyLabel ?? props.block.title ?? ''}`.trim())

/** Drawer fields grouped under their column group heading. */
const drawerSections = computed(() => {
  const out: { title?: string, fields: FieldDef[] }[] = []
  for (const c of props.block.columns) {
    const last = out[out.length - 1]
    if (last && last.title === c.group) last.fields.push(c)
    else out.push({ title: c.group, fields: [c] })
  }
  return out
})

const missingRequired = computed(() => {
  const r = drawerRow.value
  if (!r) return []
  return props.block.columns.filter(c => c.required && (r[c.key] == null || r[c.key] === '')).map(c => c.key)
})

function openDrawer(row?: Row) {
  isEditing.value = !!row
  drawerRow.value = row ? { ...row } : emptyRow()
  showErrors.value = false
}

function closeDrawer() {
  drawerRow.value = null
}

function saveDrawer() {
  const r = drawerRow.value
  if (!r) return
  if (missingRequired.value.length) {
    showErrors.value = true
    return
  }
  const i = rows.value.findIndex(x => x.id === r.id)
  if (i >= 0) rows.value.splice(i, 1, r)
  else rows.value.push(r)
  closeDrawer()
  toast.notify({ id: `toast-${props.idPrefix}-saved`, variant: 'success', title: 'Data berhasil disimpan' })
}

function deleteRow(row: Row) {
  removeRow(row.id)
  toast.notify({ id: `toast-${props.idPrefix}-deleted`, variant: 'success', title: 'Data berhasil dihapus' })
}
</script>

<template>
  <section class="spt-table-block">
    <div v-if="block.title || (block.mode === 'drawer' && rows.length && !isReadOnly)" class="spt-table-block__head">
      <div>
        <MpText v-if="block.title" as="h4" weight="semiBold">{{ block.title }}</MpText>
        <MpText v-if="block.description" size="body-small" color="text.secondary">{{ block.description }}</MpText>
      </div>
      <MpButton
        v-if="block.mode === 'drawer' && rows.length && !isReadOnly"
        :id="`${idPrefix}-add`"
        variant="secondary"
        left-icon="add"
        @click="openDrawer()"
      >
        Tambah data
      </MpButton>
    </div>

    <!-- Drawer mode, no rows yet: blank slate -->
    <div v-if="block.mode === 'drawer' && !rows.length" class="spt-table-block__empty">
      <KpBlankSlate
        :image="blankSlateImage"
        :title="`Data ${block.emptyLabel ?? 'lampiran'} akan muncul di sini`"
        :description="isReadOnly ? undefined : `Anda bisa menambah data ${block.emptyLabel ?? 'lampiran'} melalui tombol Tambah data.`"
      >
        <MpButton v-if="!isReadOnly" :id="`${idPrefix}-add`" left-icon="add" @click="openDrawer()">Tambah data</MpButton>
      </KpBlankSlate>
    </div>

    <template v-else>
      <MpTableContainer class="spt-table-block__table">
        <MpTable :is-hoverable="false">
          <MpTableHead>
            <MpTableRow>
              <MpTableCell v-if="numbered" scope="col" :rowspan="hasGroups ? 2 : 1" class="spt-table-block__no">No. (1)</MpTableCell>
              <MpTableCell
                v-for="(g, i) in groups"
                :key="`${g.label}-${i}`"
                scope="col"
                :colspan="g.span"
                :rowspan="hasGroups && !g.grouped ? 2 : 1"
                :class="{ 'spt-table-block__group': g.grouped }"
                :style="g.grouped ? undefined : { minWidth: cellWidth(block.columns.find(c => c.label === g.label)!) }"
              >
                {{ g.label }}
              </MpTableCell>
              <MpTableCell v-if="hasActions" scope="col" :rowspan="hasGroups ? 2 : 1" class="spt-table-block__actions">
                {{ block.mode === 'drawer' ? 'Tindakan' : '' }}
              </MpTableCell>
            </MpTableRow>
            <MpTableRow v-if="hasGroups">
              <MpTableCell v-for="c in groupedColumns" :key="c.key" scope="col" :style="{ minWidth: cellWidth(c) }">{{ c.label }}</MpTableCell>
            </MpTableRow>
          </MpTableHead>

          <MpTableBody>
            <MpTableRow v-for="(r, i) in rows" :key="r.id">
              <MpTableCell v-if="numbered" as="td">{{ i + 1 }}</MpTableCell>

              <MpTableCell v-for="c in block.columns" :key="c.key" as="td" :class="{ 'spt-table-block__num': block.mode === 'drawer' && isNumeric(c) }">
                <template v-if="block.mode === 'inline'">
                  <SptField
                    v-if="!c.compute"
                    :id="`${idPrefix}-${i}-${c.key}`"
                    v-model="r[c.key]"
                    :type="c.type"
                    :options="c.options"
                    :placeholder="c.placeholder"
                    size="sm"
                    :is-disabled="isReadOnly"
                  />
                  <KpCurrencyInput
                    v-else
                    :id="`${idPrefix}-${i}-${c.key}`"
                    :model-value="cellValue(c, r) as number"
                    :prefix="c.type === 'usd' ? '$' : 'Rp'"
                    size="sm"
                    is-disabled
                  />
                </template>
                <template v-else>{{ formatValue(c.compute ? (c.type === 'usd' ? 'usd' : 'computed') : c.type, cellValue(c, r)) }}</template>
              </MpTableCell>

              <MpTableCell v-if="hasActions" as="td" class="spt-table-block__actions">
                <div v-if="block.mode === 'drawer'" class="spt-table-block__row-actions">
                  <MpButton :id="`${idPrefix}-${i}-edit`" variant="ghost" size="sm" @click="openDrawer(r)">Ubah</MpButton>
                  <MpButton :id="`${idPrefix}-${i}-delete`" variant="ghost" size="sm" @click="deleteRow(r)">Hapus</MpButton>
                </div>
                <button
                  v-else
                  v-tooltip="{ label: 'Hapus baris', placement: 'top' }"
                  type="button"
                  class="kp-icon-btn spt-table-block__delete"
                  :aria-label="`Hapus baris ${i + 1}`"
                  @click="removeRow(r.id)"
                >
                  <MpIcon name="delete" size="sm" />
                </button>
              </MpTableCell>
            </MpTableRow>

            <MpTableRow v-if="!rows.length">
              <MpTableCell as="td" :colspan="leadCols + block.columns.length + (hasActions ? 1 : 0)" class="spt-table-block__none">
                Belum ada data.
              </MpTableCell>
            </MpTableRow>

            <MpTableRow v-if="block.totals?.length && rows.length" class="spt-table-block__total">
              <MpTableCell v-if="numbered" as="td" />
              <MpTableCell v-for="(c, ci) in block.columns" :key="c.key" as="td" :class="{ 'spt-table-block__num': block.totals?.includes(c.key) }">
                <template v-if="block.totals?.includes(c.key)">{{ formatValue(c.type === 'usd' ? 'usd' : 'rp', columnTotal(c)) }}</template>
                <template v-else-if="ci === 0">Jumlah</template>
              </MpTableCell>
              <MpTableCell v-if="hasActions" as="td" />
            </MpTableRow>
          </MpTableBody>
        </MpTable>
      </MpTableContainer>

      <MpButton
        v-if="block.mode === 'inline' && !isReadOnly"
        :id="`${idPrefix}-add-row`"
        variant="secondary"
        left-icon="add"
        class="spt-table-block__add"
        @click="addRow"
      >
        Tambah baris
      </MpButton>
    </template>

    <dl v-if="block.summaries?.length" class="spt-table-block__summaries">
      <div v-for="s in block.summaries" :key="s.label" class="spt-table-block__summary">
        <dt>{{ s.label }}</dt>
        <dd>{{ formatValue(s.format ?? 'rp', s.value(rows, ctx)) }}</dd>
      </div>
    </dl>

    <!-- Tambah / Ubah data drawer -->
    <MpDrawer :id="`${idPrefix}-drawer`" :is-open="!!drawerRow" size="lg" @close="closeDrawer">
      <MpDrawerContent>
        <MpDrawerHeader>
          {{ drawerTitle }}
          <MpDrawerCloseButton />
        </MpDrawerHeader>
        <MpDrawerBody>
          <form v-if="drawerRow" :id="`${idPrefix}-form`" class="spt-table-block__form" @submit.prevent="saveDrawer">
            <fieldset v-for="(s, si) in drawerSections" :key="si" class="spt-table-block__form-group">
              <legend v-if="s.title" class="spt-table-block__form-legend">{{ s.title }}</legend>
              <MpFormControl
                v-for="c in s.fields"
                :id="`${idPrefix}-f-${c.key}-control`"
                :key="c.key"
                :is-required="c.required"
                :is-invalid="showErrors && missingRequired.includes(c.key)"
              >
                <MpFormLabel>{{ c.label.replace(/\s*\(\d+\)$/, '') }}</MpFormLabel>
                <SptField
                  v-if="!c.compute"
                  :id="`${idPrefix}-f-${c.key}`"
                  v-model="drawerRow[c.key]"
                  :type="c.type"
                  :options="c.options"
                  :placeholder="c.placeholder"
                  :is-invalid="showErrors && missingRequired.includes(c.key)"
                />
                <KpCurrencyInput
                  v-else
                  :id="`${idPrefix}-f-${c.key}`"
                  :model-value="c.compute(drawerRow, ctx)"
                  :prefix="c.type === 'usd' ? '$' : 'Rp'"
                  is-disabled
                />
                <MpFormErrorMessage>Wajib diisi</MpFormErrorMessage>
              </MpFormControl>
            </fieldset>
          </form>
        </MpDrawerBody>
        <MpDrawerFooter>
          <div class="spt-table-block__drawer-actions">
            <MpButton :id="`${idPrefix}-drawer-cancel`" variant="ghost" @click="closeDrawer">Batalkan</MpButton>
            <MpButton :id="`${idPrefix}-drawer-save`" @click="saveDrawer">Simpan</MpButton>
          </div>
        </MpDrawerFooter>
      </MpDrawerContent>
      <MpDrawerOverlay />
    </MpDrawer>
  </section>
</template>

<style scoped>
.spt-table-block {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  min-width: 0;
  padding-bottom: var(--mp-spacing-6);
}

.spt-table-block__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
}

.spt-table-block__empty {
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
}

.spt-table-block__table {
  width: 100%;
}

.spt-table-block__no {
  width: 64px;
  min-width: 64px;
}

.spt-table-block__group {
  text-align: center !important;
}

.spt-table-block__actions {
  width: 1%;
  white-space: nowrap;
}

.spt-table-block__row-actions {
  display: flex;
  gap: var(--mp-spacing-1);
}

.spt-table-block__delete {
  width: 32px;
  height: 32px;
}

.spt-table-block__num {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.spt-table-block__none {
  color: var(--mp-colors-text-secondary);
  text-align: center;
}

.spt-table-block__total {
  background: var(--mp-colors-background-neutral-subtle);
  font-weight: var(--mp-font-weights-semi-bold);
}

.spt-table-block__add {
  align-self: flex-start;
}

.spt-table-block__summaries {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  max-width: 640px;
  margin: 0;
  margin-left: auto;
  width: 100%;
}

.spt-table-block__summary {
  display: flex;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-neutral-subtle);
  font-size: var(--mp-font-sizes-md);
}
.spt-table-block__summary dt {
  color: var(--mp-colors-text-default);
}
.spt-table-block__summary dd {
  margin: 0;
  font-weight: var(--mp-font-weights-semi-bold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.spt-table-block__form {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-5);
}

.spt-table-block__form-group {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.spt-table-block__form-legend {
  float: left;
  width: 100%;
  margin-bottom: var(--mp-spacing-1);
  padding: 0 0 var(--mp-spacing-2);
  border-bottom: 1px solid var(--mp-colors-border-default);
  font-size: var(--mp-font-sizes-md);
  font-weight: var(--mp-font-weights-semi-bold);
}
.spt-table-block__form-legend + * {
  clear: both;
}

.spt-table-block__drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-spacing-2);
  width: 100%;
}
</style>
