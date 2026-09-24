<script setup lang="ts">
import { MpIcon } from '@mekari/pixel3'
import { activeLeafPath } from '~/data/navigation'

// Second-level panel for the active module. Source: Sidebar/Container/Child (+ Action).
// Section titles are uppercase brand-coloured labels; Shift+C collapses the
// panel to a thin strip that expands again on click.
const route = useRoute()
const { module, isParentCollapsed, isChildCollapsed, toggleChild } = useSidebar()

const activePath = computed(() => activeLeafPath(route.path, module.value))
const isSingleSection = computed(() => module.value?.sections?.length === 1)

function onStripClick() {
  if (isChildCollapsed.value) toggleChild()
}
</script>

<template>
  <section
    v-if="module?.sections"
    class="kp-panel"
    :class="{ 'kp-panel--collapsed': isChildCollapsed, 'kp-panel--beside-rail': isParentCollapsed }"
    :aria-label="module.label"
    @click="onStripClick"
  >
    <div class="kp-panel__body" :aria-hidden="isChildCollapsed">
      <div v-for="section in module.sections" :key="section.title" class="kp-panel__section">
        <div class="kp-panel__title">
          {{ isSingleSection ? (module.panelTitle ?? section.title) : section.title }}
        </div>
        <KpSidebarItem
          v-for="item in section.items"
          :key="item.id"
          :item="item"
          :active-path="activePath"
        />
      </div>
    </div>

    <div class="kp-panel__footer">
      <button
        v-tooltip="{
          label: isChildCollapsed ? 'Tampilkan daftar fitur (shift + c)' : 'Sembunyikan daftar fitur (shift + c)',
          placement: 'right',
        }"
        type="button"
        class="kp-icon-btn kp-icon-btn--compact kp-panel__toggle"
        :aria-label="isChildCollapsed ? 'Tampilkan daftar fitur' : 'Sembunyikan daftar fitur'"
        @click.stop="toggleChild"
      >
        <MpIcon :name="isChildCollapsed ? 'chevrons-right' : 'chevrons-previous'" size="sm" />
      </button>
    </div>
  </section>
</template>

<style scoped>
.kp-panel {
  position: fixed;
  top: var(--kp-header-height);
  bottom: 0;
  left: 216px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 232px;
  background: var(--mp-colors-background-surface);
  transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1), width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.kp-panel--beside-rail {
  left: 60px;
}
.kp-panel--collapsed {
  width: 8px;
  border-right: 1px solid var(--mp-colors-border-default);
  cursor: pointer;
}
.kp-panel--collapsed:hover {
  background: var(--mp-colors-background-neutral-subtle);
}

.kp-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--mp-spacing-4) var(--mp-spacing-2) var(--mp-spacing-2);
  transition: opacity 300ms ease;
}
.kp-panel--collapsed .kp-panel__body {
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.kp-panel__title {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: var(--mp-spacing-2);
  color: var(--mp-colors-text-selected);
  font-size: var(--mp-font-sizes-sm);
  font-weight: var(--mp-font-weights-semi-bold);
  letter-spacing: var(--mp-letter-spacings-widest);
  text-transform: uppercase;
}

.kp-panel__footer {
  display: flex;
  justify-content: flex-end;
  padding: var(--mp-spacing-2);
}
.kp-panel--collapsed .kp-panel__footer {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: var(--mp-spacing-2) 0;
}

.kp-panel__toggle {
  padding: var(--mp-spacing-2) var(--kp-sidebar-inset);
  transition: transform 300ms ease;
}
.kp-panel__toggle:hover {
  background: var(--mp-colors-background-brand);
}
/* Collapsed: the toggle becomes a half-round tab sticking out of the strip. */
.kp-panel--collapsed .kp-panel__toggle {
  border-radius: 0 50% 50% 0;
  background: var(--mp-colors-background-stage);
  box-shadow: var(--mp-shadows-sm);
}
.kp-panel--collapsed .kp-panel__toggle:hover {
  transform: translateX(10px);
}
</style>
