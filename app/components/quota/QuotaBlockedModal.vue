<script setup lang="ts">
import {
  MpButton,
  MpModal,
  MpModalBody,
  MpModalCloseButton,
  MpModalContent,
  MpModalFooter,
  MpModalHeader,
  MpModalOverlay,
  MpText,
} from '@mekari/pixel3'
import {
  CUMULATIVE_MIN_MONTHS,
  type ModuleId,
  PURCHASE_URL,
  QUOTA_RESET_DAY,
  SUPPORT_URL,
  TOPUP_LAST_DAY,
  moduleLabel,
  remaining,
} from '~/data/subscription'
import { formatCount } from '~/utils/currency'
import { formatDmyLong } from '~/utils/date'

/**
 * The one modal behind every "kuota habis" dead end, in four variants.
 * Source layout: jurnal-tax organisms/error/UploadLimit ("Kuota upload tidak mencukupi").
 *
 * The variant is not chosen here — `useSubscription().route` derives it from the package
 * and the renewal distance (BR-021 / BR-022 / BR-023). The only branch that matters to a
 * reader: a Standard customer within 21 days of renewal is handed to an Account Manager
 * and is deliberately NOT offered a self-serve top-up, because that quota would expire at
 * the next reset anyway. Cumulative keeps self-serve top-up at any point in its term.
 */
const props = defineProps<{ isOpen: boolean, moduleId: ModuleId | null }>()
const emit = defineEmits<{ close: [] }>()

const { subscription, renewalDays, route } = useSubscription()

const label = computed(() => (props.moduleId ? moduleLabel(props.moduleId) : 'upload'))
const quota = computed(() => (props.moduleId ? subscription.value.quota[props.moduleId] : null))

const title = computed(() =>
  route.value === 'upgrade' ? `Kuota ${label.value} habis` : 'Kuota upload tidak mencukupi',
)
</script>

<template>
  <MpModal
    id="quota-blocked-modal"
    :is-open="isOpen"
    size="md"
    @close="emit('close')"
  >
    <MpModalContent>
      <MpModalHeader>
        {{ title }}
        <MpModalCloseButton />
      </MpModalHeader>

      <MpModalBody>
        <div class="quota-blocked">
          <!-- Shared facts: what package, and what is left. -->
          <dl class="quota-blocked__facts">
            <div class="quota-blocked__row">
              <dt><MpText size="label" color="text.secondary">Paket kuota aktif</MpText></dt>
              <dd><MpText size="label">{{ subscription.packageName }}</MpText></dd>
            </div>
            <div v-if="quota" class="quota-blocked__row">
              <dt><MpText size="label" color="text.secondary">Sisa kuota {{ label }}</MpText></dt>
              <dd><MpText size="label" weight="semiBold">{{ formatCount(remaining(quota)) }}</MpText></dd>
            </div>
          </dl>

          <!-- Freemium / legacy → the two paid packages (AC-009).
               BR-017: Cumulative is never the default, so neither card is preselected or
               marked recommended, and Standard is listed first. -->
          <template v-if="route === 'upgrade'">
            <MpText size="label" color="text.secondary">
              Pilih paket berbayar untuk melanjutkan. Harga paket berlaku untuk ketiga modul sekaligus.
            </MpText>
            <div class="quota-blocked__packages">
              <div class="quota-blocked__package">
                <MpText size="label" weight="semiBold">Klikpajak Quota</MpText>
                <MpText size="label-small" color="text.secondary">
                  Kuota direset setiap tanggal {{ QUOTA_RESET_DAY }} tiap bulan.
                </MpText>
              </div>
              <div class="quota-blocked__package">
                <MpText size="label" weight="semiBold">Klikpajak Quota - Cumulative</MpText>
                <MpText size="label-small" color="text.secondary">
                  Kuota tidak direset selama masa langganan. Tersedia untuk masa langganan minimal
                  {{ CUMULATIVE_MIN_MONTHS }} bulan.
                </MpText>
              </div>
            </div>
          </template>

          <!-- Standard, subscription still active → self-serve top-up (BR-021 / AC-004). -->
          <template v-else-if="route === 'topup'">
            <MpText size="label">Silakan tambah kuota untuk melanjutkan upload ke DJP.</MpText>
            <MpText size="label-small" color="text.secondary">
              Kuota tambahan hanya berlaku sampai tanggal {{ TOPUP_LAST_DAY }}, sebelum kuota direset
              pada tanggal {{ QUOTA_RESET_DAY }}.
            </MpText>
          </template>

          <!-- Standard, within 21 days of renewal → Account Manager, no top-up (BR-022 / AC-005). -->
          <template v-else-if="route === 'contact-am'">
            <MpText size="label">
              Langganan Anda berakhir dalam {{ renewalDays }} hari, pada
              {{ formatDmyLong(subscription.endDate) }}.
            </MpText>
            <MpText size="label-small" color="text.secondary">
              Hubungi Account Manager Anda untuk memperpanjang langganan beserta kuotanya.
            </MpText>
          </template>

          <!-- Cumulative → top-up stays available, tied to the main end date (BR-023 / AC-006). -->
          <template v-else>
            <MpText size="label">Silakan tambah kuota untuk melanjutkan upload ke DJP.</MpText>
            <MpText size="label-small" color="text.secondary">
              Kuota tambahan berlaku sampai {{ formatDmyLong(subscription.endDate) }}, mengikuti masa
              langganan utama.
            </MpText>
          </template>
        </div>
      </MpModalBody>

      <MpModalFooter>
        <div class="quota-blocked__actions">
          <MpButton id="quota-blocked-cancel" variant="ghost" @click="emit('close')">Nanti saja</MpButton>
          <MpButton
            v-if="route === 'contact-am'"
            id="quota-blocked-contact"
            as="a"
            :href="SUPPORT_URL"
            target="_blank"
            rel="noopener"
          >
            Hubungi Account Manager
          </MpButton>
          <MpButton
            v-else
            id="quota-blocked-purchase"
            as="a"
            :href="PURCHASE_URL"
            target="_blank"
            rel="noopener"
          >
            {{ route === 'upgrade' ? 'Lihat paket' : 'Tambah kuota' }}
          </MpButton>
        </div>
      </MpModalFooter>
    </MpModalContent>
    <MpModalOverlay />
  </MpModal>
</template>

<style scoped>
.quota-blocked {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
}

.quota-blocked__facts {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  margin: 0;
  padding: var(--mp-spacing-3);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-neutral);
}

.quota-blocked__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
}

/* Without this the label wraps mid-phrase ("Paket kuota" / "aktif") in a narrow modal. */
.quota-blocked__row dt {
  flex: 0 0 auto;
  white-space: nowrap;
}

.quota-blocked__row dd {
  margin: 0;
  text-align: right;
}

.quota-blocked__packages {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-spacing-3);
}

.quota-blocked__package {
  display: flex;
  flex: 1 1 200px;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  padding: var(--mp-spacing-3);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
}

.quota-blocked__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-spacing-2);
  width: 100%;
}
</style>
