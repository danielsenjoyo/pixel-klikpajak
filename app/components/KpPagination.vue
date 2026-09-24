<script setup lang="ts">
import { MpButton, MpIcon, MpPopover, MpPopoverContent, MpPopoverList, MpPopoverListItem, MpPopoverTrigger, MpSelect, MpText } from '@mekari/pixel3'

// Table pagination (Figma "Paginations"; Pixel 3 ships none):
// [Baris per halaman 10 ▾] [Menampilkan x dari y] ........ [page ▾] dari n halaman [‹] [›]
const props = withDefaults(defineProps<{
  id: string
  page: number
  perPage: number
  total: number
  perPageOptions?: number[]
}>(), {
  perPageOptions: () => [5, 10, 20, 50],
})

const emit = defineEmits<{ 'update:page': [page: number], 'update:perPage': [perPage: number] }>()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const shown = computed(() => Math.max(0, Math.min(props.perPage, props.total - (props.page - 1) * props.perPage)))

function setPerPage(n: number, close: () => void) {
  close()
  emit('update:perPage', n)
  emit('update:page', 1)
}

function goTo(page: number) {
  emit('update:page', Math.min(Math.max(1, page), totalPages.value))
}
</script>

<template>
  <div class="kp-pagination">
    <div class="kp-pagination__left">
      <div class="kp-pagination__per-page">
        <MpText color="text.secondary">Baris per halaman</MpText>
        <MpPopover :id="`${id}-per-page`" placement="top-start" trigger="click" use-portal v-slot="{ onClosePopover }">
          <MpPopoverTrigger>
            <MpButton :id="`${id}-per-page-btn`" variant="ghost" size="sm" right-icon="caret-down" aria-label="Baris per halaman">
              {{ perPage }}
            </MpButton>
          </MpPopoverTrigger>
          <MpPopoverContent class="kp-pagination-panel">
            <MpPopoverList>
              <MpPopoverListItem
                v-for="n in perPageOptions"
                :key="n"
                :is-active="n === perPage"
                class="kp-pagination__option"
                @click="setPerPage(n, onClosePopover)"
              >
                {{ n }}
              </MpPopoverListItem>
            </MpPopoverList>
          </MpPopoverContent>
        </MpPopover>
      </div>
      <MpText color="text.secondary">Menampilkan {{ shown }} dari {{ total }}</MpText>
    </div>

    <div class="kp-pagination__right">
      <div class="kp-pagination__page">
        <div class="kp-pagination__select">
          <MpSelect
            :id="`${id}-page`"
            size="sm"
            is-full-width
            :model-value="String(page)"
            aria-label="Halaman"
            @update:model-value="goTo(Number($event))"
          >
            <option v-for="p in totalPages" :key="p" :value="String(p)">{{ p }}</option>
          </MpSelect>
        </div>
        <MpText color="text.secondary">dari {{ totalPages }} halaman</MpText>
      </div>
      <div class="kp-pagination__nav">
        <button type="button" class="kp-icon-btn kp-icon-btn--compact" :disabled="page <= 1" aria-label="Halaman sebelumnya" @click="goTo(page - 1)">
          <MpIcon name="chevrons-left" size="sm" />
        </button>
        <button type="button" class="kp-icon-btn kp-icon-btn--compact" :disabled="page >= totalPages" aria-label="Halaman berikutnya" @click="goTo(page + 1)">
          <MpIcon name="chevrons-right" size="sm" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kp-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-4) var(--mp-spacing-6);
}

.kp-pagination__left,
.kp-pagination__right {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-6);
}
.kp-pagination__right {
  gap: var(--mp-spacing-4);
}

.kp-pagination__per-page,
.kp-pagination__page {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-1);
}
.kp-pagination__page {
  gap: var(--mp-spacing-3);
}


/* Figma draws 64px; Pixel's MpSelect has an 88px min-width, so size to that. */
.kp-pagination__select {
  width: 88px;
}

.kp-pagination :deep(.mp-text) {
  white-space: nowrap;
}

.kp-pagination__option {
  align-self: stretch;
}

.kp-pagination__nav {
  display: flex;
  gap: var(--mp-spacing-2);
}

</style>

<style>
/* Unscoped: MpPopoverContent is teleported, so a scoped class on it doesn't match. */
.kp-pagination-panel {
  min-width: 80px;
}
</style>
