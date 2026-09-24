<script setup lang="ts">
import { MpBadge, MpIcon, MpText } from '@mekari/pixel3'
import { SPT_SECTIONS, type SptSection } from '~/data/sptTahunanBadan'

// In-page section menu of the Lapor SPT page (Figma "menu"): lapor status, then
// SPT Induk and Lampiran 1–14; Lampiran 10–13 expand into their parts. Collapses
// to a 24px strip (Figma "collapse sidemenu").
const props = defineProps<{
  activeKey: string
  hrefFor: (key: string) => string
  status: { label: string, type: 'warning' | 'completed' | 'information' }
  missing: string[]
}>()
const isCollapsed = defineModel<boolean>('collapsed', { default: false })

const openGroups = ref<Set<string>>(new Set())
watch(() => props.activeKey, (key) => {
  const parent = SPT_SECTIONS.find(s => s.children?.some(c => c.key === key))
  if (parent) openGroups.value = new Set([...openGroups.value, parent.key])
}, { immediate: true })

function toggleGroup(s: SptSection) {
  const next = new Set(openGroups.value)
  if (next.has(s.key)) next.delete(s.key)
  else next.add(s.key)
  openGroups.value = next
}
</script>

<template>
  <nav class="spt-nav" :class="{ 'spt-nav--collapsed': isCollapsed }" aria-label="Bagian SPT">
    <button
      v-tooltip="{ label: isCollapsed ? 'Tampilkan daftar bagian' : 'Sembunyikan daftar bagian', placement: 'right' }"
      type="button"
      class="spt-nav__toggle"
      :aria-label="isCollapsed ? 'Tampilkan daftar bagian' : 'Sembunyikan daftar bagian'"
      :aria-expanded="!isCollapsed"
      @click="isCollapsed = !isCollapsed"
    >
      <MpIcon :name="isCollapsed ? 'chevrons-right' : 'chevrons-previous'" size="sm" />
    </button>

    <template v-if="!isCollapsed">
      <div class="spt-nav__status">
        <MpText size="label-small" weight="semiBold">Status lapor:</MpText>
        <MpBadge for="additionalInformation" :type="status.type">{{ status.label }}</MpBadge>
        <MpText v-if="missing.length" size="label-small" color="text.secondary" class="spt-nav__missing">
          Lengkapi: {{ missing.slice(0, 3).join(', ') }}<template v-if="missing.length > 3"> dan {{ missing.length - 3 }} lainnya</template>
        </MpText>
      </div>

      <ul class="spt-nav__list">
        <li v-for="s in SPT_SECTIONS" :key="s.key">
          <button
            v-if="s.children"
            type="button"
            class="spt-nav__item"
            :class="{ 'spt-nav__item--within': s.children.some(c => c.key === activeKey) }"
            :aria-expanded="openGroups.has(s.key)"
            @click="toggleGroup(s)"
          >
            <span>{{ s.label }}</span>
            <MpIcon :name="openGroups.has(s.key) ? 'caret-up' : 'caret-down'" size="sm" />
          </button>
          <NuxtLink
            v-else
            :to="hrefFor(s.key)"
            class="spt-nav__item"
            :class="{ 'spt-nav__item--active': s.key === activeKey }"
            :aria-current="s.key === activeKey ? 'page' : undefined"
          >
            {{ s.label }}
          </NuxtLink>
          <ul v-if="s.children && openGroups.has(s.key)" class="spt-nav__list spt-nav__list--nested">
            <li v-for="c in s.children" :key="c.key">
              <NuxtLink
                :to="hrefFor(c.key)"
                class="spt-nav__item"
                :class="{ 'spt-nav__item--active': c.key === activeKey }"
                :aria-current="c.key === activeKey ? 'page' : undefined"
              >
                {{ c.label }}
              </NuxtLink>
            </li>
          </ul>
        </li>
      </ul>
    </template>
  </nav>
</template>

<style scoped>
.spt-nav {
  position: sticky;
  top: var(--kp-header-height);
  align-self: flex-start;
  flex-shrink: 0;
  width: 240px;
  max-height: calc(100dvh - var(--kp-header-height));
  overflow-y: auto;
  padding: 0 var(--mp-spacing-6) var(--mp-spacing-6);
  border-right: 1px solid var(--mp-colors-border-default);
  transition: width 200ms ease;
}
.spt-nav--collapsed {
  width: 24px;
  padding: 0;
  overflow: visible;
}

.spt-nav__toggle {
  position: absolute;
  top: var(--mp-spacing-2);
  right: var(--mp-spacing-1);
  display: inline-flex;
  padding: 6px;
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  color: var(--mp-colors-icon-default);
  cursor: pointer;
}
.spt-nav__toggle:hover {
  background: var(--mp-colors-background-brand);
}
.spt-nav__toggle:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}
.spt-nav--collapsed .spt-nav__toggle {
  right: auto;
  left: 0;
  padding: 6px 2px;
}

.spt-nav__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-4) 0;
  border-bottom: 1px solid var(--mp-colors-border-default);
}

.spt-nav__missing {
  line-height: var(--mp-line-heights-sm);
}

.spt-nav__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: var(--mp-spacing-4) 0 0;
  list-style: none;
}
.spt-nav__list--nested {
  padding: 2px 0 0 var(--mp-spacing-3);
}

.spt-nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-2);
  width: 100%;
  padding: var(--mp-spacing-2) var(--mp-spacing-2) var(--mp-spacing-2) var(--mp-spacing-3);
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  color: var(--mp-colors-text-default);
  font: inherit;
  font-size: var(--mp-font-sizes-md);
  line-height: var(--mp-line-heights-md);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.spt-nav__item:hover {
  color: var(--mp-colors-text-selected);
}
.spt-nav__item:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}
.spt-nav__item--active {
  background: var(--mp-colors-background-brand);
  color: var(--mp-colors-text-selected);
  font-weight: var(--mp-font-weights-semi-bold);
}
.spt-nav__item--within {
  color: var(--mp-colors-text-selected);
}
</style>
