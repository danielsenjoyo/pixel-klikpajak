<script setup lang="ts">
import { MpDivider, MpIcon, MpText } from '@mekari/pixel3'
import { sidebarGroups, type NavModule } from '~/data/navigation'

// First-level sidebar. Source: components/Pixel/Sidebar/Container (+ Menu, Action).
// 216px wide, or a 60px icon rail — it auto-collapses to the rail when a module
// with a second-level panel becomes active, and the user can toggle it (Shift+X).
// Hovering the rail expands it over the content. Footer: collapse toggle + company ID.
const { company } = useSession()
const {
  module,
  hasChild,
  isParentCollapsed,
  isParentExpandedVisually,
  isHovering,
  syncWithRoute,
  resetPanelOverride,
  toggleParent,
} = useSidebar()

const route = useRoute()
watch(() => route.meta.sidebarPanel, resetPanelOverride)

// Only on module change, so an expanded choice survives navigation inside a module.
watch(() => module.value?.id, syncWithRoute, { immediate: true })

function isActive(item: NavModule) {
  return module.value?.id === item.id
}

function onEnter() {
  if (isParentCollapsed.value) isHovering.value = true
}
function onLeave() {
  isHovering.value = false
}
</script>

<template>
  <aside
    class="kp-sb"
    :class="{
      'kp-sb--collapsed': !isParentExpandedVisually,
      'kp-sb--floating': isParentCollapsed && isHovering,
      'kp-sb--with-child': hasChild,
    }"
    aria-label="Menu utama"
  >
    <nav class="kp-sb__menu" @mouseenter="onEnter" @mouseleave="onLeave">
      <template v-for="(group, index) in sidebarGroups" :key="index">
        <NuxtLink
          v-for="item in group"
          :key="item.id"
          :to="item.path"
          class="kp-sb__item"
          :class="{ 'kp-sb__item--active': isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
          :aria-label="item.label"
        >
          <MpIcon
            :name="item.icon"
            size="md"
            :variant="isActive(item) ? 'fill' : 'outline'"
            :color="isActive(item) ? 'icon.selected' : 'icon.default'"
          />
          <span class="kp-sb__label">{{ item.label }}</span>
        </NuxtLink>
        <MpDivider v-if="index < sidebarGroups.length - 1" class="kp-sb__divider" />
      </template>
    </nav>

    <div class="kp-sb__footer">
      <button
        v-tooltip="{
          label: isParentCollapsed ? 'Tampilkan daftar fitur (shift + X)' : 'Sembunyikan daftar fitur (shift + X)',
          placement: 'right',
        }"
        type="button"
        class="kp-icon-btn kp-icon-btn--compact kp-sb__toggle"
        :aria-label="isParentCollapsed ? 'Tampilkan daftar fitur' : 'Sembunyikan daftar fitur'"
        @click="toggleParent"
      >
        <MpIcon :name="isParentCollapsed ? 'arrow-expand' : 'arrow-collapse'" size="sm" />
      </button>
      <MpText v-if="isParentExpandedVisually" size="body-small" is-truncated class="kp-sb__company">
        ID perusahaan: {{ company.id }}
      </MpText>
    </div>
  </aside>
</template>

<style scoped>
.kp-sb {
  position: fixed;
  top: var(--kp-header-height);
  bottom: 0;
  left: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  width: 216px;
  background: var(--mp-colors-background-surface);
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 300ms ease;
}
.kp-sb--with-child {
  background: var(--mp-colors-background-neutral-subtle);
  border-right: 1px solid var(--mp-colors-border-default);
}
.kp-sb--collapsed {
  width: 60px;
}
.kp-sb--floating {
  z-index: 5;
  box-shadow: var(--mp-shadows-lg);
}

.kp-sb__menu {
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--mp-spacing-4) var(--mp-spacing-2) var(--mp-spacing-4);
}

.kp-sb__item {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-2) var(--kp-sidebar-inset);
  border-radius: var(--mp-radii-md);
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
  white-space: nowrap;
  text-decoration: none;
  transition: background-color 200ms ease, color 200ms ease;
}
.kp-sb__item:hover {
  color: var(--mp-colors-text-selected);
}
.kp-sb__item:hover :deep(.mp-icon) {
  --mp-icon-color: var(--mp-colors-icon-selected);
}
.kp-sb__item:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}
.kp-sb__item--active {
  background: var(--mp-colors-background-brand);
  color: var(--mp-colors-text-selected);
  font-weight: var(--mp-font-weights-semi-bold);
}

.kp-sb__label {
  overflow: hidden;
  text-overflow: ellipsis;
}
.kp-sb--collapsed .kp-sb__label {
  display: none;
}

.kp-sb__divider {
  margin: var(--mp-spacing-3) 0;
}

.kp-sb__footer {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  min-height: 52px;
  padding: var(--mp-spacing-2);
  border-top: 1px solid var(--mp-colors-border-default);
}

.kp-sb__toggle {
  flex-shrink: 0;
  padding: var(--mp-spacing-2) var(--kp-sidebar-inset);
}
.kp-sb__toggle:hover {
  background: var(--mp-colors-background-brand);
}

.kp-sb__company {
  min-width: 0;
  white-space: nowrap;
}
</style>
