<script setup lang="ts">
import { MpBadge, MpButton, MpText } from '@mekari/pixel3'
import { QUOTA_RESET_DAY, isCumulative, isFreemium, isLegacy } from '~/data/subscription'
import { formatDmyLong } from '~/utils/date'

/**
 * Active package summary. Source layout: jurnal-tax QuotaSection "Paket kuota aktif" card.
 *
 * The quota-behaviour line is the disclosure BR-011 requires — a Standard customer must be
 * told the quota is monthly and resets on the 3rd, and the two non-resetting packages must
 * not carry that sentence (PRD §12 item 7 explicitly removes it for Cumulative and Freemium).
 */
const emit = defineEmits<{ addQuota: [] }>()

const { subscription, hasExpired } = useSubscription()

/**
 * A subscription past its end date must not keep claiming "Aktif". Legacy packages keep
 * their own badge because they are pre-cutover, not expired (BR-015).
 */
const badge = computed(() => {
  if (isLegacy(subscription.value)) return { type: 'announcement' as const, label: 'Paket lama' }
  if (hasExpired.value) return { type: 'critical' as const, label: 'Berakhir' }
  return { type: 'completed' as const, label: 'Aktif' }
})

const behaviour = computed(() => {
  const sub = subscription.value
  if (isFreemium(sub)) return 'Kuota berlaku seumur hidup dan tidak pernah direset.'
  if (isCumulative(sub)) return 'Kuota tidak direset dan berlaku sampai masa langganan berakhir.'
  return `Kuota direset setiap tanggal ${QUOTA_RESET_DAY} tiap bulan.`
})

const validity = computed(() =>
  subscription.value.endDate ? formatDmyLong(subscription.value.endDate) : 'Seumur hidup',
)
</script>

<template>
  <div class="quota-package">
    <div class="quota-package__main">
      <MpText size="label-small" color="text.secondary">Paket kuota aktif</MpText>
      <div class="quota-package__title">
        <MpText as="h2" size="h2" weight="semiBold" class="quota-package__name">{{ subscription.packageName }}</MpText>
        <MpBadge for="tableStatus" :type="badge.type">{{ badge.label }}</MpBadge>
      </div>

      <dl class="quota-package__meta">
        <div class="quota-package__row">
          <dt><MpText size="label-small" color="text.secondary">Berlaku hingga</MpText></dt>
          <dd><MpText size="label-small">{{ validity }}</MpText></dd>
        </div>
        <div v-if="isCumulative(subscription) && subscription.termMonths" class="quota-package__row">
          <dt><MpText size="label-small" color="text.secondary">Masa langganan</MpText></dt>
          <dd><MpText size="label-small">{{ subscription.termMonths }} bulan</MpText></dd>
        </div>
      </dl>

      <MpText size="label-small" color="text.secondary">{{ behaviour }}</MpText>
    </div>

    <div class="quota-package__action">
      <MpButton id="quota-package-add" @click="emit('addQuota')">Tambah kuota</MpButton>
    </div>
  </div>
</template>

<style scoped>
.quota-package {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-5);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
}

.quota-package__main {
  display: flex;
  flex: 1 1 320px;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  min-width: 0;
}

.quota-package__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-2);
}

.quota-package__name {
  margin: 0;
}

.quota-package__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-spacing-1) var(--mp-spacing-6);
  margin: var(--mp-spacing-2) 0 var(--mp-spacing-1);
}

.quota-package__row {
  display: flex;
  align-items: baseline;
  gap: var(--mp-spacing-2);
}

.quota-package__row dd {
  margin: 0;
}

.quota-package__action {
  flex-shrink: 0;
}
</style>
