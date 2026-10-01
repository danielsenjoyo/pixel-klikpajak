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
  MpInput,
  MpModal,
  MpModalBody,
  MpModalCloseButton,
  MpModalContent,
  MpModalFooter,
  MpModalHeader,
  MpModalOverlay,
  MpTable,
  MpTableBody,
  MpTableCell,
  MpTableContainer,
  MpTableHead,
  MpTableRow,
  MpText,
  MpBanner,
  MpBannerCloseButton,
  MpBannerDescription,
  MpUpload,
  toast,
} from '@mekari/pixel3'
import {
  fieldErrors,
  formatValue,
  headerGroups,
  isRowFilled,
  newRowId,
  normalizeOptions,
  num,
  type BlockValues,
  type Ctx,
  type FieldDef,
  type MatrixRow,
  type Row,
  type TableBlock,
} from '~/data/spt1771Engine'
import { downloadCsv, parseCsv, parseNumber, toCsv } from '~/utils/csv'
import { formatRp } from '~/utils/currency'

// Lampiran table (Figma "table / lampiran N"). Two modes:
//   inline — every cell is an input, rows added/removed in place
//   drawer — read-only rows with Tindakan (Ubah/Hapus); "Tambah data" opens a form drawer
// `canAdd` / `canDelete` / `form: 'modal'` narrow drawer mode for rosters whose
// membership is owned upstream (Lampiran 2A: edit-only, via a modal).
const props = defineProps<{ block: TableBlock, ctx: Ctx, idPrefix: string, isReadOnly?: boolean }>()
const emit = defineEmits<{ refreshPrefill: [] }>()
const rows = defineModel<Row[]>({ required: true })
/** Values of the recap rows (Lampiran 5B baris a–g), keyed `${row}.${column}`. */
const recapValues = defineModel<BlockValues>('recap', { default: () => ({}) })

const numbered = computed(() => props.block.numbered !== false)
/** Columns whose `when` gate passes — e.g. modal disetor is dropped for Yayasan/KIK. */
const allFields = computed(() => props.block.columns.filter(c => !c.when || c.when(props.ctx)))
const columns = computed(() => allFields.value.filter(c => !c.formOnly))
const summaries = computed(() => (props.block.summaries ?? []).filter(s => !s.when || s.when(props.ctx)))
const hasGroups = computed(() => columns.value.some(c => c.group))
const groups = computed(() => headerGroups(columns.value))
const groupedColumns = computed(() => columns.value.filter(c => c.group))
const derived = computed(() => props.block.derivedFrom)
const canAdd = computed(() => props.block.canAdd !== false && !derived.value && props.block.readOnly !== true)
const canDelete = computed(() => props.block.canDelete !== false && !derived.value && props.block.readOnly !== true)

/**
 * Keep a derived table in step with its source: one row per source key, in source
 * order. Typed values follow their key, so reordering bagian A never loses data.
 */
watchEffect(() => {
  const d = derived.value
  if (!d) return
  const source = props.ctx.section[d.block]
  if (!Array.isArray(source)) return
  const src = source.filter(isRowFilled).filter(r => String(r[d.key] ?? '').trim())
  const byKey = new Map(rows.value.map(r => [String(r[d.key] ?? '').trim(), r]))
  const next = src.map((sr) => {
    const k = String(sr[d.key] ?? '').trim()
    const existing = byKey.get(k) ?? { id: newRowId(), [d.key]: k }
    // Labels stay in step with the source; typed values are left alone.
    for (const f of d.copy ?? []) existing[f] = sr[f]
    return existing
  })
  const same = next.length === rows.value.length
    && next.every((r, i) => r.id === rows.value[i]?.id && (d.copy ?? []).every(f => r[f] === rows.value[i]?.[f]))
  if (!same) rows.value = next
})
const asModal = computed(() => props.block.form === 'modal')
/** Locked because the SPT is filed, or because this roster is DJP's and never edited here. */
const locked = computed(() => !!props.isReadOnly || props.block.readOnly === true)
const hasActions = computed(() => !locked.value && (canDelete.value || props.block.mode === 'drawer'))
/**
 * "Tarik ulang data" outlives the lock: a DJP-owned roster is exactly the one the preparer
 * cannot fix here, so re-pulling it after correcting Coretax is the only move left. A filed
 * SPT still refuses, since nothing about it may change.
 */
const canRefresh = computed(() => props.block.refreshable === true && !props.isReadOnly)
const hasHeadActions = computed(() => props.block.mode === 'drawer' && (canRefresh.value || !locked.value))
const leadCols = computed(() => (numbered.value ? 1 : 0))

const cellWidth = (c: FieldDef) => `${c.width ?? (c.type === 'currency' || c.type === 'usd' ? 184 : 160)}px`
const cellValue = (c: FieldDef, r: Row) => (c.compute ? c.compute(r, props.ctx) : c.derive ? c.derive(r) : r[c.key])
/** "Nama baris 2" — table cells have no <label>, so each control is named after its column. */
const cellLabel = (c: FieldDef, i: number) => `${c.label.replace(/\s*\(\d+\)$/, '')} baris ${i + 1}`
const isNumeric = (c: FieldDef) => c.type === 'currency' || c.type === 'usd' || !!c.compute

function columnTotal(c: FieldDef) {
  return rows.value.reduce((acc, r) => acc + num(cellValue(c, r)), 0)
}

function emptyRow(): Row {
  return { id: newRowId() }
}

// ── Inline mode ──────────────────────────────────────────────────────────────
/**
 * Inline grids validate as they are typed in; the drawer waits for Simpan (`showErrors`).
 * Blank rows are skipped — "Tambah baris" appends one, and `isRowFilled` is the same rule
 * `tableRows` applies, so clicking the button never paints a fresh row red.
 */
const inlineErrors = computed<Record<string, Record<string, string>>>(() => {
  if (props.block.mode !== 'inline') return {}
  const out: Record<string, Record<string, string>> = {}
  for (const r of rows.value) {
    if (!isRowFilled(r)) continue
    const e = fieldErrors(columns.value, r, props.ctx)
    if (Object.keys(e).length) out[r.id] = e
  }
  return out
})
const cellError = (row: Row, key: string) => inlineErrors.value[row.id]?.[key]

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
const drawerTitle = computed(() => (canAdd.value
  ? `${isEditing.value ? 'Ubah' : 'Tambah'} data ${props.block.emptyLabel ?? props.block.title ?? ''}`.trim()
  : 'Ubah data'))

/** Drawer fields grouped under their column group heading. */
const drawerSections = computed(() => {
  const out: { title?: string, fields: FieldDef[] }[] = []
  for (const c of allFields.value) {
    const last = out[out.length - 1]
    if (last && last.title === c.group) last.fields.push(c)
    else out.push({ title: c.group, fields: [c] })
  }
  return out
})

/** V-I4: a counterparty already in the grid cannot be entered again. */
const duplicateOf = computed(() => {
  const key = props.block.dedupeKey
  const r = drawerRow.value
  if (!key || !r) return null
  const v = String(r[key] ?? '').trim()
  if (!v) return null
  return rows.value.find(x => x.id !== r.id && String(x[key] ?? '').trim() === v) ?? null
})

const duplicateMessage = computed(() => {
  const d = duplicateOf.value
  if (!d) return undefined
  const label = props.block.columns.find(c => c.key === props.block.dedupeKey)?.label.replace(/\s*\(\d+\)$/, '') ?? 'Data'
  const name = String(d[props.block.columns[0]!.key] ?? '').trim()
  return `${label} ini sudah terdaftar${name ? ` atas nama ${name}` : ''}. Satu ${label} hanya boleh dimasukkan satu kali.`
})

const drawerErrors = computed(() => (drawerRow.value ? fieldErrors(allFields.value, drawerRow.value, props.ctx) : {}))

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
  // Read-only columns are owned upstream — restore them from the stored row.
  const original = rows.value.find(x => x.id === r.id)
  if (original) for (const c of props.block.columns) if (c.readOnly) r[c.key] = original[c.key]
  if (Object.keys(drawerErrors.value).length || duplicateOf.value) {
    showErrors.value = true
    return
  }
  const i = rows.value.findIndex(x => x.id === r.id)
  if (i >= 0) rows.value.splice(i, 1, r)
  else rows.value.push(r)
  closeDrawer()
  toast.notify({ id: `toast-${props.idPrefix}-saved`, variant: 'success', title: 'Data berhasil disimpan' })
}

// ── Recap rows (Lampiran 5B baris a–g) ───────────────────────────────────────
const recap = computed(() => props.block.recap)
const recapCell = (rowKey: string, colKey: string) => `${rowKey}.${colKey}`
const recapActive = (row: MatrixRow, colKey: string) =>
  row.valueKey ? colKey === row.valueKey : (row.monthly !== false || colKey === recap.value?.totalKey)

function recapValue(row: MatrixRow, colKey: string): number {
  if (!recapActive(row, colKey)) return 0
  if (row.compute) return row.compute(recapValues.value, props.ctx, colKey)
  if (row.valueKey) return num(recapValues.value[recapCell(row.key, row.valueKey)])
  if (colKey === recap.value?.totalKey) {
    return columns.value
      .filter(c => c.key !== recap.value?.totalKey)
      .reduce((acc, c) => acc + num(recapValues.value[recapCell(row.key, c.key)]), 0)
  }
  return num(recapValues.value[recapCell(row.key, colKey)])
}

/** Monthly rows are typed per month; a non-monthly row holds its one value in the total. */
function recapEditable(row: MatrixRow, colKey: string) {
  if (locked.value || row.compute || !recapActive(row, colKey)) return false
  if (row.valueKey) return colKey === row.valueKey
  return row.monthly === false ? colKey === recap.value?.totalKey : colKey !== recap.value?.totalKey
}

function setRecap(rowKey: string, colKey: string, value: number | null) {
  recapValues.value = { ...recapValues.value, [recapCell(rowKey, colKey)]: value }
}

// ── Body layout ──────────────────────────────────────────────────────────────
type BodyItem =
  | { kind: 'heading', label: string }
  | { kind: 'group', label: string }
  | { kind: 'data', row: Row, index: number }
  | { kind: 'recap', row: MatrixRow }

/** Groups render in DJP's order, each followed by its rows and any recap rows. */
const inFooter = computed(() => recap.value?.placement === 'footer')
const footerRecap = computed(() => (inFooter.value ? recap.value?.rows ?? [] : []))

const bodyItems = computed<BodyItem[]>(() => {
  const out: BodyItem[] = []
  const recapRows = inFooter.value ? [] : recap.value?.rows ?? []
  const g = props.block.groupBy
  if (g) {
    let index = 0
    for (const opt of g.options) {
      if (opt.heading) out.push({ kind: 'heading', label: opt.heading })
      out.push({ kind: 'group', label: opt.label })
      for (const row of rows.value) {
        if (String(row[g.key] ?? '') === opt.value) out.push({ kind: 'data', row, index: index++ })
      }
      for (const r of recapRows.filter(r => r.after === opt.value)) out.push({ kind: 'recap', row: r })
    }
    for (const r of recapRows.filter(r => !r.after)) out.push({ kind: 'recap', row: r })
    return out
  }
  rows.value.forEach((row, index) => out.push({ kind: 'data', row, index }))
  for (const r of recapRows) out.push({ kind: 'recap', row: r })
  return out
})

const fullSpan = computed(() => leadCols.value + columns.value.length + (hasActions.value ? 1 : 0))
/** Columns the recap label spans before its value column. */
const recapTrailing = (row: MatrixRow) => {
  const at = columns.value.findIndex(c => c.key === row.valueKey)
  return at < 0 ? [] : columns.value.slice(at + 1)
}
const recapLabelSpan = (row: MatrixRow) => {
  if (!row.valueKey) return 1
  return leadCols.value + columns.value.findIndex(c => c.key === row.valueKey)
}

// ── Frozen columns ───────────────────────────────────────────────────────────
const stickyStart = computed(() => props.block.sticky?.start ?? 0)
const stickyEnd = computed(() => props.block.sticky?.end ?? 0)
const colWidth = (c: FieldDef) => c.width ?? (c.type === 'currency' || c.type === 'usd' ? 184 : 160)
const NUM_COL_WIDTH = 56

/** Offset from the left edge for a pinned leading column (row number is index -1). */
function stickyLeft(index: number) {
  if (index >= stickyStart.value) return undefined
  let px = numbered.value ? NUM_COL_WIDTH : 0
  for (let i = 0; i < index; i++) px += colWidth(columns.value[i]!)
  return `${px}px`
}

function stickyRight(index: number) {
  const from = columns.value.length - stickyEnd.value
  if (stickyEnd.value === 0 || index < from) return undefined
  let px = hasActions.value ? 96 : 0
  for (let i = columns.value.length - 1; i > index; i--) px += colWidth(columns.value[i]!)
  return `${px}px`
}

/** Each header group with the column index it starts at, so it can be pinned. */
const groupsIndexed = computed(() => {
  let col = 0
  return groups.value.map((g) => {
    const start = col
    col += g.span
    return { ...g, start }
  })
})

const stickyClass = (index: number) => ({
  'spt-table-block__sticky': index < stickyStart.value || index >= columns.value.length - stickyEnd.value,
})

// ── Import (US-5): CSV template out, validated rows in ───────────────────────
const importResult = ref<{ imported: number, rejected: { row: number, reason: string }[] } | null>(null)
const importable = computed(() => props.block.importable === true && !locked.value)
const importColumns = computed(() => columns.value.filter(c => !c.compute && !c.derive))
/** Grouped columns repeat labels ("Nilai" x3), so the template qualifies them. */
const plain = (c: FieldDef) => {
  const label = c.label.replace(/\s*\(\d+\)$/, '')
  return c.group ? `${c.group} — ${label}` : label
}

function downloadTemplate() {
  const header = importColumns.value.map(plain)
  const example = importColumns.value.map((c) => {
    if (c.type === 'currency' || c.type === 'usd') return '1000000'
    if (c.type === 'year') return String(new Date().getFullYear() - 1)
    if (c.type === 'percent') return '10'
    if (c.type === 'id') return '0123456789012345'
    if (c.type === 'select') return String(normalizeOptions(c.options ?? [])[0]?.value ?? '')
    return 'Contoh'
  })
  downloadCsv(`template-${(props.block.emptyLabel ?? props.idPrefix).replace(/\s+/g, '-')}.csv`, toCsv([header, example]))
}

async function onImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const lines = parseCsv(await file.text())
  input.value = ''
  const cols = importColumns.value

  // V-I1: header must match the template, else the whole file is rejected.
  const expected = cols.map(c => plain(c).toLowerCase())
  const got = (lines[0] ?? []).map(h => h.trim().toLowerCase())
  if (expected.length !== got.length || expected.some((h, i) => h !== got[i])) {
    importResult.value = { imported: 0, rejected: [{ row: 0, reason: 'Format kolom tidak sesuai template. Unduh template lalu coba lagi.' }] }
    return
  }

  const key = props.block.dedupeKey
  const existing = new Set(key ? rows.value.map(r => String(r[key] ?? '').trim()).filter(Boolean) : [])
  const seen = new Set<string>()
  const accepted: Row[] = []
  const rejected: { row: number, reason: string }[] = []

  lines.slice(1).forEach((cells, i) => {
    const row: Row = { id: newRowId() }
    let bad: string | null = null
    cols.forEach((c, ci) => {
      const raw = (cells[ci] ?? '').trim()
      if (c.type === 'currency' || c.type === 'usd' || c.type === 'percent' || c.type === 'year') {
        const n = parseNumber(raw)
        if (n === null) bad ??= `${plain(c)} bukan angka yang valid`
        else if (n < 0) bad ??= `${plain(c)} tidak boleh negatif`
        else row[c.key] = c.type === 'year' && raw === '' ? null : n
      }
      else row[c.key] = raw
    })
    // V-B1: required columns
    for (const c of cols) {
      if (c.required && !c.readOnly && (row[c.key] == null || row[c.key] === '')) bad ??= `${plain(c)} wajib diisi`
    }
    // V-I4: dedupe against the grid and within the file itself
    if (!bad && key) {
      const v = String(row[key] ?? '').trim()
      if (existing.has(v)) bad = `${v} sudah terdaftar di tabel`
      else if (seen.has(v)) bad = `${v} muncul lebih dari satu kali di file`
      else seen.add(v)
    }
    if (bad) rejected.push({ row: i + 2, reason: bad })
    else accepted.push(row)
  })

  // Append-only (OI-12): valid rows are added, nothing is replaced.
  rows.value.push(...accepted)
  importResult.value = { imported: accepted.length, rejected }
}

// ── Delete confirmation (same pattern as "Hapus SPT" on the index page) ──────
const deleteTarget = ref<{ row: Row, index: number } | null>(null)

/** "Acme Holdings Pte Ltd" — the row's first column, so the modal names what is deleted. */
const deleteName = computed(() => {
  const t = deleteTarget.value
  const first = columns.value[0]
  if (!t || !first) return ''
  const v = cellValue(first, t.row)
  return v === null || v === undefined || v === '' ? '' : formatValue(first.derive ? 'text' : first.type, v, first)
})

/** Rows with data ask first; an empty row added by mistake just goes. */
function askDelete(row: Row, index: number) {
  if (!isRowFilled(row)) {
    removeRow(row.id)
    return
  }
  deleteTarget.value = { row, index }
}

function confirmDelete() {
  if (!deleteTarget.value) return
  removeRow(deleteTarget.value.row.id)
  deleteTarget.value = null
  toast.notify({ id: `toast-${props.idPrefix}-deleted`, variant: 'success', title: 'Data berhasil dihapus' })
}
</script>

<template>
  <section class="spt-table-block">
    <div v-if="block.title || hasHeadActions" class="spt-table-block__head">
      <div>
        <MpText v-if="block.title" as="h4" weight="semiBold">{{ block.title }}</MpText>
        <MpText v-if="block.description" size="body-small" color="text.secondary">{{ block.description }}</MpText>
      </div>
      <div v-if="hasHeadActions" class="spt-table-block__head-actions">
        <MpButton
          v-if="canRefresh"
          :id="`${idPrefix}-refresh`"
          variant="ghost"
          @click="emit('refreshPrefill')"
        >
          Tarik ulang data
        </MpButton>
        <template v-if="importable">
          <MpButton :id="`${idPrefix}-template`" variant="ghost" left-icon="download" @click="downloadTemplate">
            Unduh template
          </MpButton>
          <MpUpload
            :id="`${idPrefix}-import`"
            accept=".csv,text/csv"
            button-text="Impor data"
            placeholder="Pilih file CSV"
            class="spt-table-block__import"
            @change="onImportFile"
          />
        </template>
        <MpButton
          v-if="canAdd"
          :id="`${idPrefix}-add`"
          variant="secondary"
          left-icon="add"
          @click="openDrawer()"
        >
          Tambah data
        </MpButton>
      </div>
    </div>

    <MpBanner
      v-if="importResult"
      :id="`${idPrefix}-import-result`"
      :variant="importResult.rejected.length ? (importResult.imported ? 'warning' : 'critical') : 'success'"
      is-inline
    >
      <MpBannerDescription>
        <span>{{ importResult.imported }} baris berhasil diimpor, {{ importResult.rejected.length }} baris ditolak.</span>
        <ul v-if="importResult.rejected.length" class="spt-table-block__import-errors">
          <li v-for="(e, ei) in importResult.rejected.slice(0, 8)" :key="ei">
            <template v-if="e.row">Baris {{ e.row }}: </template>{{ e.reason }}
          </li>
          <li v-if="importResult.rejected.length > 8">dan {{ importResult.rejected.length - 8 }} baris lainnya.</li>
        </ul>
      </MpBannerDescription>
      <MpBannerCloseButton @click="importResult = null" />
    </MpBanner>

    <MpTableContainer class="spt-table-block__table">
      <MpTable :is-hoverable="false">
        <MpTableHead>
          <MpTableRow>
            <MpTableCell
              v-if="numbered"
              scope="col"
              :rowspan="hasGroups ? 2 : 1"
              class="spt-table-block__no"
              :class="{ 'spt-table-block__sticky': stickyStart > 0 }"
              :style="{ '--sticky-left': stickyStart > 0 ? '0px' : undefined }"
            >
              No. (1)
            </MpTableCell>
            <MpTableCell
              v-for="(g, i) in groupsIndexed"
              :key="`${g.label}-${i}`"
              scope="col"
              :colspan="g.span"
              :rowspan="hasGroups && !g.grouped ? 2 : 1"
              :class="[{ 'spt-table-block__group': g.grouped }, stickyClass(g.start)]"
              :style="{ '--sticky-left': stickyLeft(g.start), '--sticky-right': stickyRight(g.start), minWidth: g.grouped ? undefined : cellWidth(columns.find(c => c.label === g.label)!) }"
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
          <template v-for="(item, bi) in bodyItems" :key="bi">
            <MpTableRow v-if="item.kind === 'heading'" class="spt-table-block__section">
              <MpTableCell as="td" :colspan="fullSpan">{{ item.label }}</MpTableCell>
            </MpTableRow>
            <MpTableRow v-else-if="item.kind === 'group'" class="spt-table-block__grouprow">
              <MpTableCell as="td" :colspan="fullSpan">{{ item.label }}</MpTableCell>
            </MpTableRow>
            <MpTableRow v-else-if="item.kind === 'data'">
              <MpTableCell v-if="numbered" as="td" :class="{ 'spt-table-block__sticky': stickyStart > 0 }" :style="{ '--sticky-left': stickyStart > 0 ? '0px' : undefined }">{{ item.index + 1 }}</MpTableCell>

              <MpTableCell
                v-for="(c, ci) in columns"
                :key="c.key"
                as="td"
                :class="[{ 'spt-table-block__num': block.mode === 'drawer' && isNumeric(c) }, stickyClass(ci)]"
                :style="{ '--sticky-left': stickyLeft(ci), '--sticky-right': stickyRight(ci) }"
              >
                <!-- Addressed by row id, not position: an issue has to survive the row
                     reordering that `groupBy` does, and the renumbering a delete does. -->
                <template v-if="block.mode === 'inline'">
                  <MpInput
                    v-if="c.derive"
                    :id="`${idPrefix}-r${item.row.id}-${c.key}`"
                    :model-value="c.derive(item.row)"
                    :aria-label="cellLabel(c, item.index)"
                    size="sm"
                    is-disabled
                  />
                  <SptField
                    v-else-if="!c.compute"
                    :id="`${idPrefix}-r${item.row.id}-${c.key}`"
                    v-model="item.row[c.key]"
                    :type="c.type"
                    :options="c.options"
                    :placeholder="c.placeholder"
                    :aria-label="cellLabel(c, item.index)"
                    size="sm"
                    :is-disabled="locked || c.readOnly"
                    :is-invalid="!!cellError(item.row, c.key)"
                  />
                  <KpCurrencyInput
                    v-else
                    :id="`${idPrefix}-r${item.row.id}-${c.key}`"
                    :model-value="cellValue(c, item.row) as number"
                    :prefix="c.type === 'usd' ? '$' : 'Rp'"
                    :aria-label="cellLabel(c, item.index)"
                    size="sm"
                    is-disabled
                  />
                  <SptCellError v-if="cellError(item.row, c.key)" :message="cellError(item.row, c.key)!" />
                </template>
                <template v-else>{{ formatValue(c.compute ? (c.type === 'usd' ? 'usd' : 'computed') : c.derive ? 'text' : c.type, cellValue(c, item.row), c) }}</template>
              </MpTableCell>

              <MpTableCell v-if="hasActions" as="td" class="spt-table-block__actions">
                <div v-if="block.mode === 'drawer'" class="spt-table-block__row-actions">
                  <button
                    v-if="!canDelete"
                    :id="`${idPrefix}-${item.index}-edit`"
                    v-tooltip="{ label: 'Ubah data', placement: 'top' }"
                    type="button"
                    class="kp-icon-btn"
                    :aria-label="`Ubah data baris ${item.index + 1}`"
                    @click="openDrawer(item.row)"
                  >
                    <MpIcon name="edit" size="sm" />
                  </button>
                  <template v-else>
                    <MpButton :id="`${idPrefix}-${item.index}-edit`" variant="ghost" size="sm" @click="openDrawer(item.row)">Ubah</MpButton>
                    <MpButton :id="`${idPrefix}-${item.index}-delete`" variant="ghost" size="sm" @click="askDelete(item.row, item.index)">Hapus</MpButton>
                  </template>
                </div>
                <button
                  v-else-if="canDelete"
                  v-tooltip="{ label: 'Hapus baris', placement: 'top' }"
                  type="button"
                  class="kp-icon-btn spt-table-block__delete"
                  :aria-label="`Hapus baris ${item.index + 1}`"
                  @click="askDelete(item.row, item.index)"
                >
                  <MpIcon name="delete" size="sm" />
                </button>
              </MpTableCell>
            </MpTableRow>
            <MpTableRow v-else-if="item.kind === 'recap'" class="spt-table-block__recap">
              <!-- One value column (Lampiran 9): the label spans everything before it. -->
              <template v-if="item.row.valueKey">
                <MpTableCell as="td" :colspan="recapLabelSpan(item.row)" class="spt-table-block__recap-label">
                  <span v-if="item.row.no" class="spt-table-block__recap-no">{{ item.row.no }}</span>{{ item.row.label }}
                </MpTableCell>
                <MpTableCell as="td" class="spt-table-block__num">
                  <KpCurrencyInput
                    v-if="recapEditable(item.row, item.row.valueKey)"
                    :id="`${idPrefix}-${item.row.key}-${item.row.valueKey}`"
                    :model-value="num(recapValues[`${item.row.key}.${item.row.valueKey}`])"
                    size="sm"
                    :aria-label="item.row.label"
                    @update:model-value="setRecap(item.row.key, item.row.valueKey!, $event)"
                  />
                  <span v-else class="spt-table-block__amount">{{ formatRp(recapValue(item.row, item.row.valueKey)) }}</span>
                </MpTableCell>
                <MpTableCell v-for="c in recapTrailing(item.row)" :key="c.key" as="td" />
              </template>

              <!-- A value per column (Lampiran 5B): months plus the total. -->
              <template v-else>
                <MpTableCell
                  v-if="numbered"
                  as="td"
                  :class="{ 'spt-table-block__sticky': stickyStart > 0 }"
                  :style="{ '--sticky-left': stickyStart > 0 ? '0px' : undefined }"
                >
                  {{ item.row.no }}
                </MpTableCell>
                <MpTableCell
                  v-for="(c, ci) in columns"
                  :key="c.key"
                  as="td"
                  :class="[stickyClass(ci), ci < stickyStart ? 'spt-table-block__recap-label' : 'spt-table-block__num']"
                  :style="{ '--sticky-left': stickyLeft(ci), '--sticky-right': stickyRight(ci) }"
                >
                  <template v-if="ci === 0">{{ item.row.label }}</template>
                  <KpCurrencyInput
                    v-else-if="recapEditable(item.row, c.key)"
                    :id="`${idPrefix}-${item.row.key}-${c.key}`"
                    :model-value="num(recapValues[`${item.row.key}.${c.key}`])"
                    size="sm"
                    :aria-label="`${item.row.label} — ${c.label.replace(/\s*\(\d+\)$/, '')}`"
                    @update:model-value="setRecap(item.row.key, c.key, $event)"
                  />
                  <span v-else-if="recapActive(item.row, c.key)" class="spt-table-block__amount">{{ formatRp(recapValue(item.row, c.key)) }}</span>
                  <span v-else class="spt-table-block__recap-empty" aria-hidden="true">—</span>
                </MpTableCell>
              </template>
              <MpTableCell v-if="hasActions" as="td" />
            </MpTableRow>
          </template>

          <MpTableRow v-if="!rows.length && !recap">
            <MpTableCell as="td" :colspan="leadCols + columns.length + (hasActions ? 1 : 0)" class="spt-table-block__none">
              Belum ada data.
            </MpTableCell>
          </MpTableRow>

          <MpTableRow v-if="block.totals?.length && rows.length" class="spt-table-block__total">
            <MpTableCell v-if="numbered" as="td" />
            <MpTableCell v-for="(c, ci) in columns" :key="c.key" as="td" :class="{ 'spt-table-block__num': block.totals?.includes(c.key) }">
              <template v-if="block.totals?.includes(c.key)">{{ formatValue(c.type === 'usd' ? 'usd' : 'rp', columnTotal(c)) }}</template>
              <template v-else-if="ci === 0">Jumlah</template>
            </MpTableCell>
            <MpTableCell v-if="hasActions" as="td" />
          </MpTableRow>
        </MpTableBody>
      </MpTable>
    </MpTableContainer>

    <MpButton
      v-if="block.mode === 'inline' && !locked && canAdd"
      :id="`${idPrefix}-add-row`"
      variant="secondary"
      left-icon="add"
      class="spt-table-block__add"
      @click="addRow"
    >
      Tambah baris
    </MpButton>

    <dl v-if="summaries.length || footerRecap.length" class="spt-table-block__summaries">
      <div v-for="s in summaries" :key="s.label" class="spt-table-block__summary">
        <dt>{{ s.label }}</dt>
        <dd>{{ formatValue(s.format ?? 'rp', s.value(rows, ctx)) }}</dd>
      </div>
      <div v-for="r in footerRecap" :key="r.key" class="spt-table-block__summary">
        <dt><span v-if="r.no" class="spt-table-block__recap-no">{{ r.no }}</span>{{ r.label }}</dt>
        <dd>
          <KpCurrencyInput
            v-if="r.valueKey && recapEditable(r, r.valueKey)"
            :id="`${idPrefix}-${r.key}-${r.valueKey}`"
            :model-value="num(recapValues[`${r.key}.${r.valueKey}`])"
            size="sm"
            :aria-label="r.label"
            @update:model-value="setRecap(r.key, r.valueKey!, $event)"
          />
          <template v-else>{{ formatRp(recapValue(r, r.valueKey ?? recap!.totalKey)) }}</template>
        </dd>
      </div>
    </dl>

    <!-- Hapus data confirmation -->
    <MpModal :id="`${idPrefix}-delete-modal`" :is-open="!!deleteTarget" size="sm" @close="deleteTarget = null">
      <MpModalContent>
        <MpModalHeader>
          Hapus data
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <MpText v-if="deleteTarget">
            Data baris {{ deleteTarget.index + 1 }}<template v-if="deleteName"> ({{ deleteName }})</template> yang dihapus tidak dapat dikembalikan.
          </MpText>
        </MpModalBody>
        <MpModalFooter>
          <div class="spt-table-block__modal-actions">
            <MpButton :id="`${idPrefix}-delete-cancel`" variant="ghost" @click="deleteTarget = null">Batalkan</MpButton>
            <MpButton :id="`${idPrefix}-delete-submit`" variant="danger" @click="confirmDelete">Hapus</MpButton>
          </div>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>

    <!-- Tambah / Ubah data — side drawer, or a centred modal when form: 'modal' -->
    <MpDrawer v-if="!asModal" :id="`${idPrefix}-drawer`" :is-open="!!drawerRow" size="lg" @close="closeDrawer">
      <MpDrawerContent>
        <MpDrawerHeader>
          {{ drawerTitle }}
          <MpDrawerCloseButton />
        </MpDrawerHeader>
        <MpDrawerBody>
          <SptRowForm
            v-if="drawerRow"
            v-model="drawerRow"
            :sections="drawerSections"
            :ctx="ctx"
            :id-prefix="idPrefix"
            :show-errors="showErrors"
            :errors="drawerErrors"
            :duplicate-message="duplicateMessage"
          />
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

    <MpModal v-else :id="`${idPrefix}-edit-modal`" :is-open="!!drawerRow" size="md" @close="closeDrawer">
      <MpModalContent>
        <MpModalHeader>
          {{ drawerTitle }}
          <MpModalCloseButton />
        </MpModalHeader>
        <MpModalBody>
          <SptRowForm
            v-if="drawerRow"
            v-model="drawerRow"
            :sections="drawerSections"
            :ctx="ctx"
            :id-prefix="idPrefix"
            :show-errors="showErrors"
            :errors="drawerErrors"
            :duplicate-message="duplicateMessage"
          />
        </MpModalBody>
        <MpModalFooter>
          <div class="spt-table-block__modal-actions">
            <MpButton :id="`${idPrefix}-edit-close`" variant="ghost" @click="closeDrawer">Tutup</MpButton>
            <MpButton :id="`${idPrefix}-edit-save`" @click="saveDrawer">Simpan</MpButton>
          </div>
        </MpModalFooter>
      </MpModalContent>
      <MpModalOverlay />
    </MpModal>
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

/* Frozen columns: the row number + leading label, and the trailing total. The
   z-index clears Pixel input addons (position: absolute; z-index: 2), which would
   otherwise paint over a frozen column once the table scrolls sideways. */
.spt-table-block__sticky {
  position: sticky;
  left: var(--sticky-left);
  right: var(--sticky-right);
  z-index: 3;
  background: var(--mp-colors-background-stage);
}

thead .spt-table-block__sticky {
  z-index: 4;
  background: var(--mp-colors-background-surface);
}

.spt-table-block__recap .spt-table-block__sticky {
  background: var(--mp-colors-background-stage);
}

.spt-table-block__recap > * {
  background: var(--mp-colors-background-neutral-subtle);
}

.spt-table-block__section > * {
  background: var(--mp-colors-background-neutral-subtle);
  font-weight: var(--mp-font-weights-semi-bold);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.spt-table-block__grouprow > * {
  padding-left: var(--mp-spacing-6);
  font-weight: var(--mp-font-weights-semi-bold);
}

.spt-table-block__recap-no {
  display: inline-block;
  min-width: var(--mp-spacing-6);
  color: var(--mp-colors-text-secondary);
}

.spt-table-block__recap-label {
  font-weight: var(--mp-font-weights-semi-bold);
}

.spt-table-block__recap-empty {
  display: block;
  text-align: right;
  color: var(--mp-colors-text-disabled);
}

.spt-table-block__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
}

.spt-table-block__table {
  width: 100%;
  overflow-x: auto;
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

/* Footer totals: full-width divided rows, label left and amount right
   (matches the SPT Masa PPN "Jumlah …" footer). */
.spt-table-block__summaries {
  display: flex;
  flex-direction: column;
  margin: 0;
  width: 100%;
}

.spt-table-block__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-4) 0;
  border-top: 1px solid var(--mp-colors-border-default);
  font-size: var(--mp-font-sizes-md);
}

.spt-table-block__summary:last-child {
  border-bottom: 1px solid var(--mp-colors-border-default);
}

.spt-table-block__summary dt {
  color: var(--mp-colors-text-default);
  font-weight: var(--mp-font-weights-semi-bold);
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

.spt-table-block__modal-actions,
.spt-table-block__drawer-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-spacing-2);
  width: 100%;
}
</style>
