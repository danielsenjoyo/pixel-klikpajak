<script setup lang="ts">
import { MpIcon, MpPopover, MpPopoverContent, MpPopoverList, MpPopoverListItem, MpPopoverTrigger } from '@mekari/pixel3'

// "+" quick-access menu. Source: Header/Bar/Action/Quick — a dark popover with
// Buat / Lapor / Upload shortcuts (each gated by a create/view permission).
const actions = [
  {
    title: 'Buat',
    items: [
      { label: 'ID Billing', path: '/main/ebilling/create' },
      { label: 'Faktur keluaran', path: '/main/efaktur-v2/out/create' },
    ],
  },
  { title: 'Lapor', items: [{ label: 'SPT Tahunan', path: '/main/efiling/report/spt' }] },
  { title: 'Upload', items: [{ label: 'Bukti potong', path: '/main/ebupot-v2/unifikasi/domestic/create' }] },
]

function go(path: string, close: () => void) {
  close()
  navigateTo(path)
}
</script>

<template>
  <MpPopover id="kp-quick-access" placement="bottom-end" trigger="click" use-portal is-close-on-escape v-slot="{ onClosePopover }">
    <MpPopoverTrigger>
      <button
        v-tooltip="{ label: 'Akses cepat', placement: 'bottom' }"
        type="button"
        class="kp-icon-btn"
        aria-label="Akses cepat"
      >
        <MpIcon name="add" size="md" />
      </button>
    </MpPopoverTrigger>
    <MpPopoverContent class="kp-quick-panel">
      <MpPopoverList v-for="action in actions" :key="action.title">
        <div class="kp-quick__title">{{ action.title }}</div>
        <MpPopoverListItem v-for="item in action.items" :key="item.path" class="kp-quick__item" @click="go(item.path, onClosePopover)">
          {{ item.label }}
        </MpPopoverListItem>
      </MpPopoverList>
    </MpPopoverContent>
  </MpPopover>
</template>

<style scoped>
.kp-quick__title {
  align-self: stretch;
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  color: var(--mp-colors-text-inverse);
  opacity: 0.72;
  font-size: var(--mp-font-sizes-sm);
  text-transform: uppercase;
}
.kp-quick__item {
  align-self: stretch;
  background: transparent;
  color: var(--mp-colors-text-inverse);
}
.kp-quick__item:hover {
  background: var(--mp-colors-background-neutral-bold-hovered);
  color: var(--mp-colors-text-inverse);
}
</style>

<style>
/* Unscoped: MpPopoverContent is teleported, so a scoped class on it doesn't match. */
.kp-quick-panel {
  width: 224px;
  padding: var(--mp-spacing-1) 0;
  border-color: transparent;
  background: var(--mp-colors-background-neutral-bold);
}
</style>
