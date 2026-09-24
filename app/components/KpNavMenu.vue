<script setup lang="ts">
import { MpBadge, MpIcon, MpPopover, MpPopoverContent, MpPopoverList, MpPopoverListItem, MpPopoverTrigger } from '@mekari/pixel3'
import { isNavItemActive, navigation, visibleItems, type NavItem } from '~/data/navigation'

// Desktop top-level menu. Source: organisms/main/nav/MainMenu + Dropdown.
// Items with children open a popover. Deeper levels (up to 3, e.g. E-Faktur ›
// Arsip › Faktur › Faktur Keluaran) are flattened into labelled groups with
// indented items, so the menu never needs popovers inside popovers.
const route = useRoute()
const items = computed(() => visibleItems(navigation))

interface Row { item: NavItem, depth: number, isGroup: boolean }

function flatten(children: NavItem[], depth = 0): Row[] {
  return children.flatMap(child => child.children
    ? [{ item: child, depth, isGroup: true }, ...flatten(child.children, depth + 1)]
    : [{ item: child, depth, isGroup: false }])
}

function go(item: NavItem, close?: () => void) {
  if (!item.path) return
  close?.()
  navigateTo(item.path)
}
</script>

<template>
  <nav class="kp-nav" aria-label="Menu utama">
    <template v-for="item in items" :key="item.key">
      <MpPopover
        v-if="item.children"
        :id="`kp-nav-${item.key}`"
        placement="bottom-start"
        trigger="click"
        use-portal
        is-close-on-escape
        v-slot="{ onClosePopover }"
      >
        <MpPopoverTrigger>
          <button
            type="button"
            class="kp-nav__item"
            :class="{ 'kp-nav__item--active': isNavItemActive(item, route.path) }"
          >
            {{ item.label }}
            <MpIcon name="caret-down" size="sm" />
          </button>
        </MpPopoverTrigger>
        <MpPopoverContent class="kp-nav-panel">
          <MpPopoverList>
            <template v-for="row in flatten(item.children)" :key="`${row.depth}-${row.item.path ?? row.item.label}`">
              <div
                v-if="row.isGroup"
                class="kp-nav__group"
                :class="`kp-nav--depth-${row.depth}`"
              >
                {{ row.item.label }}
              </div>
              <MpPopoverListItem
                v-else
                class="kp-nav__row"
                :class="`kp-nav--depth-${row.depth}`"
                :is-active="row.item.path === route.path"
                @click="go(row.item, onClosePopover)"
              >
                <span class="kp-nav__label">
                  {{ row.item.label }}
                  <MpBadge v-if="row.item.isNew" for="tableStatus" type="announcement">Baru</MpBadge>
                  <MpBadge v-if="row.item.isPremium" for="tableStatus" type="warning">Premium</MpBadge>
                </span>
              </MpPopoverListItem>
            </template>
          </MpPopoverList>
        </MpPopoverContent>
      </MpPopover>

      <NuxtLink
        v-else
        :to="item.path"
        class="kp-nav__item"
        :class="{ 'kp-nav__item--active': isNavItemActive(item, route.path) }"
      >
        {{ item.label }}
      </NuxtLink>
    </template>
  </nav>
</template>

<style scoped>
.kp-nav {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.kp-nav__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--mp-spacing-1);
  height: 100%;
  padding: 0 var(--mp-spacing-4);
  border: 0;
  background: transparent;
  color: var(--mp-colors-text-default);
  font: inherit;
  font-size: var(--mp-font-sizes-md);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
}
.kp-nav__item:hover {
  color: var(--mp-colors-text-selected);
}
.kp-nav__item:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}

/* Source: 4px bar with rounded top corners under the active item. */
.kp-nav__item--active {
  color: var(--mp-colors-text-selected);
  font-weight: var(--mp-font-weights-semi-bold);
}
.kp-nav__item--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4px;
  border-radius: var(--mp-radii-sm) var(--mp-radii-sm) 0 0;
  background: var(--mp-colors-border-brand);
}

.kp-nav__group {
  align-self: stretch;
  padding-top: var(--mp-spacing-2);
  padding-bottom: var(--mp-spacing-1);
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  font-weight: var(--mp-font-weights-semi-bold);
}
.kp-nav__row {
  align-self: stretch;
}

/* Indent per nesting level (menu data goes 3 levels deep). */
.kp-nav--depth-0 { padding-left: var(--mp-spacing-3); }
.kp-nav--depth-1 { padding-left: var(--mp-spacing-6); }
.kp-nav--depth-2 { padding-left: var(--mp-spacing-10); }

.kp-nav__label {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-spacing-2);
}
</style>

<style>
/* Unscoped: MpPopoverContent is teleported, so a scoped class on it doesn't match. */
.kp-nav-panel {
  min-width: 252px;
  max-height: min(70vh, 560px);
  overflow-y: auto;
}
</style>
