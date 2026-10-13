<script setup lang="ts">
import {
  MpBadge,
  MpTable,
  MpTableBody,
  MpTableCell,
  MpTableContainer,
  MpTableHead,
  MpTableRow,
  MpText,
} from '@mekari/pixel3'
import blankSlateImage from '~/assets/images/blankslate-spt.png'
import { MODULES, type PurchaseRow } from '~/data/subscription'
import { formatCount, formatRp } from '~/utils/currency'
import { formatDmyLong, parseDmyDate } from '~/utils/date'

// Riwayat pembelian paket kuota.
// Source: jurnal-tax organisms/setting/Account/uploadQuota/SubscriptionHistory.
const props = withDefaults(defineProps<{ rows: PurchaseRow[], showAmount?: boolean }>(), { showAmount: true })

/**
 * Active package first, then newest start date. Seed order is meaningless and stays
 * meaningless as rows accumulate, so a purchase history has to impose its own order
 * before pagination starts hiding rows behind page 2.
 */
const sorted = computed(() => [...props.rows].sort((a, b) => {
  if (a.isActive !== b.isActive) return a.isActive ? -1 : 1
  return (parseDmyDate(b.startDate)?.getTime() ?? 0) - (parseDmyDate(a.startDate)?.getTime() ?? 0)
}))

const page = ref(1)
const perPage = ref(10)
const paged = computed(() => sorted.value.slice((page.value - 1) * perPage.value, page.value * perPage.value))

// Keep the page valid when the row set shrinks (switching to a company with fewer rows).
watch(() => props.rows.length, (n) => {
  const last = Math.max(1, Math.ceil(n / perPage.value))
  if (page.value > last) page.value = last
})
watch(() => props.rows, () => { page.value = 1 })

function periode(row: PurchaseRow): string {
  if (!row.startDate) return '—'
  if (!row.endDate) return 'Seumur hidup'
  return `${formatDmyLong(row.startDate)} – ${formatDmyLong(row.endDate)}`
}
</script>

<template>
  <section class="quota-history">
    <MpText as="h2" size="h2" weight="semiBold" class="quota-history__title">Riwayat pembelian paket kuota</MpText>

    <MpTableContainer v-if="rows.length">
      <MpTable>
        <MpTableHead>
          <MpTableRow>
            <MpTableCell scope="col">Paket</MpTableCell>
            <MpTableCell scope="col">Masa aktif</MpTableCell>
            <MpTableCell v-for="m in MODULES" :key="m.id" scope="col" class="quota-history__num">
              Kuota {{ m.label }}
            </MpTableCell>
            <MpTableCell scope="col">Status paket</MpTableCell>
            <MpTableCell v-if="showAmount" scope="col" class="quota-history__num">Jumlah pembayaran</MpTableCell>
          </MpTableRow>
        </MpTableHead>
        <MpTableBody>
          <MpTableRow v-for="row in paged" :key="row.id">
            <MpTableCell as="td" scope="row">{{ row.packageName }}</MpTableCell>
            <MpTableCell as="td">{{ periode(row) }}</MpTableCell>
            <MpTableCell v-for="m in MODULES" :key="m.id" as="td" class="quota-history__num">
              {{ row.quota[m.id] === undefined ? '—' : formatCount(row.quota[m.id]) }}
            </MpTableCell>
            <MpTableCell as="td">
              <MpBadge for="tableStatus" :type="row.isActive ? 'completed' : 'announcement'">
                {{ row.isActive ? 'Aktif' : 'Expired' }}
              </MpBadge>
            </MpTableCell>
            <MpTableCell v-if="showAmount" as="td" class="quota-history__num">
              {{ row.amount === null ? '—' : formatRp(row.amount) }}
            </MpTableCell>
          </MpTableRow>
        </MpTableBody>
      </MpTable>
    </MpTableContainer>

    <KpBlankSlate
      v-else
      :image="blankSlateImage"
      title="Daftar riwayat pembelian akan muncul di sini"
      description="Untuk menambah kuota upload, klik &quot;Tambah kuota&quot;."
    />

    <KpPagination
      v-if="rows.length"
      id="quota-history-pagination"
      v-model:page="page"
      v-model:per-page="perPage"
      :total="rows.length"
    />
  </section>
</template>

<style scoped>
.quota-history {
  display: flex;
  flex-direction: column;
}

.quota-history__title {
  margin: 0 0 var(--mp-spacing-3);
}

/* Counts and money read as columns only when right-aligned. */
.quota-history__num {
  text-align: right;
}
</style>
