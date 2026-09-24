<script setup lang="ts">
import { MpButton, MpIcon, MpPopover, MpPopoverContent, MpPopoverList, MpPopoverListItem, MpPopoverTrigger } from '@mekari/pixel3'

// "Lapor SPT" primary action on Lapor Pajak pages (Figma "spt masa tahunan / modal"):
// SPT Masa ▸ and SPT Tahunan ▸ open a flyout to the left of the menu.
export interface LaporSptItem {
  key: string
  label: string
  path?: string
  children?: LaporSptItem[]
}

const emit = defineEmits<{ select: [item: LaporSptItem] }>()

const items: LaporSptItem[] = [
  {
    key: 'spt-masa',
    label: 'SPT Masa',
    children: [
      { key: 'spt-masa-ppn', label: 'SPT Masa PPN', path: '/main/efiling/report-v2/spt-masa/ppn' },
      { key: 'spt-masa-unifikasi', label: 'SPT Masa PPh Unifikasi', path: '/main/efiling/report-v2/spt-masa/unifikasi' },
      { key: 'spt-masa-2126', label: 'SPT Masa PPh 21/26', path: '/main/efiling/report-v2/spt-masa/pph2126' },
    ],
  },
  {
    key: 'spt-tahunan',
    label: 'SPT Tahunan',
    children: [
      { key: 'spt-tahunan-badan', label: 'SPT Tahunan Badan', path: '/main/efiling/report-v2/spt-tahunan-badan' },
      { key: 'spt-tahunan-pribadi', label: 'SPT Tahunan Pribadi', path: '/main/efiling/report-v2/spt-tahunan-pribadi' },
    ],
  },
  { key: 'spt-bea-meterai', label: 'SPT Pemungut Bea Meterai', path: '/main/efiling/report-v2/spt-bea-meterai' },
  { key: 'spop-pbb', label: 'SPOP PBB', path: '/main/efiling/report-v2/spop-pbb' },
]

const openKey = ref<string | null>(null)

function pick(item: LaporSptItem, close: () => void) {
  if (item.children) {
    openKey.value = openKey.value === item.key ? null : item.key
    return
  }
  close()
  openKey.value = null
  emit('select', item)
}
</script>

<template>
  <MpPopover
    id="kp-lapor-spt"
    placement="bottom-end"
    trigger="click"
    use-portal
    is-close-on-escape
    v-slot="{ onClosePopover }"
    @close="openKey = null"
  >
    <MpPopoverTrigger>
      <MpButton id="kp-lapor-spt-trigger" right-icon="caret-down">Lapor SPT</MpButton>
    </MpPopoverTrigger>
    <MpPopoverContent class="kp-lapor-panel">
      <MpPopoverList>
        <div
          v-for="item in items"
          :key="item.key"
          class="kp-lapor__row"
          @mouseenter="openKey = item.children ? item.key : null"
        >
          <MpPopoverListItem
            class="kp-lapor__item"
            :is-active="openKey === item.key"
            :is-arrow="!!item.children"
            :aria-expanded="item.children ? openKey === item.key : undefined"
            @click="pick(item, onClosePopover)"
          >
            {{ item.label }}
          </MpPopoverListItem>

          <div v-if="item.children && openKey === item.key" class="kp-lapor__sub" role="menu">
            <button
              v-for="child in item.children"
              :key="child.key"
              type="button"
              class="kp-lapor__sub-item"
              role="menuitem"
              @click="pick(child, onClosePopover)"
            >
              {{ child.label }}
            </button>
          </div>
        </div>
      </MpPopoverList>
    </MpPopoverContent>
  </MpPopover>
</template>

<style scoped>
.kp-lapor__row {
  position: relative;
  align-self: stretch;
}

.kp-lapor__item {
  width: 100%;
}

/* Flyout opens to the left — the trigger sits at the right edge of the page. */
.kp-lapor__sub {
  position: absolute;
  top: calc(-1 * var(--mp-spacing-3));
  right: calc(100% + var(--mp-spacing-1));
  display: flex;
  flex-direction: column;
  width: 224px;
  padding: var(--mp-spacing-3) 0 var(--mp-spacing-2);
  border: 1px solid var(--mp-colors-border-bold);
  border-radius: var(--mp-radii-md);
  background: var(--mp-colors-background-stage);
  box-shadow: var(--mp-shadows-lg);
}

.kp-lapor__sub-item {
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border: 0;
  background: transparent;
  color: var(--mp-colors-text-default);
  font: inherit;
  font-size: var(--mp-font-sizes-md);
  line-height: var(--mp-line-heights-md);
  text-align: left;
  cursor: pointer;
}
.kp-lapor__sub-item:hover,
.kp-lapor__sub-item:focus-visible {
  outline: none;
  background: var(--mp-colors-background-brand);
}
</style>

<style>
/* Unscoped: MpPopoverContent is teleported. The flyout overflows the panel. */
.kp-lapor-panel {
  width: 220px;
  overflow: visible !important;
}
</style>
