<script setup lang="ts">
import { MpBadge, MpIcon } from '@mekari/pixel3'
import { containsPath, type NavLeaf } from '~/data/navigation'

// One second-level entry. Source: Sidebar/Container/Child/Menu — a plain link,
// or a collapsible group (open by default) whose children may nest one more level.
// `inset`: the top-level group has an icon, so nested rows indent past it.
const props = withDefaults(
  defineProps<{ item: NavLeaf, activePath?: string, depth?: number, inset?: boolean }>(),
  { depth: 0, inset: false },
)
const emit = defineEmits<{ navigate: [] }>()
const { session } = useSession()

const isOpen = ref(true)
const isActive = computed(() => !props.item.children && props.item.path === props.activePath)
const hasActiveChild = computed(() => !!props.item.children && containsPath(props.item, props.activePath))
const badgeValue = computed(() => (props.item.badge ? session.sidebarBadges[props.item.badge] : undefined))
</script>

<template>
  <div class="kp-si">
    <template v-if="item.children">
      <!-- pixel-police-allow: expand/collapse nav group — Pixel 3 has no nav component (rules.md → exceptions) -->
      <button
        type="button"
        class="kp-si__row"
        :class="[`kp-si__row--depth-${depth}`, { 'kp-si__row--inset': inset, 'kp-si__row--within': hasActiveChild && depth === 0 }]"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <MpIcon v-if="item.icon" :name="item.icon" size="md" />
        <span class="kp-si__label">{{ item.label }}</span>
        <MpIcon v-if="item.isPremium" name="upgrade" variant="fill" size="md" color="icon.brand" />
        <MpIcon :name="isOpen ? 'chevrons-up' : 'chevrons-down'" size="sm" />
      </button>
      <div v-show="isOpen">
        <KpSidebarItem
          v-for="child in item.children"
          :key="child.id"
          :item="child"
          :active-path="activePath"
          :depth="depth + 1"
          :inset="inset || !!item.icon"
          @navigate="emit('navigate')"
        />
      </div>
    </template>

    <NuxtLink
      v-else
      :to="item.path"
      class="kp-si__row"
      :class="[`kp-si__row--depth-${depth}`, { 'kp-si__row--inset': inset, 'kp-si__row--active': isActive }]"
      :aria-current="isActive ? 'page' : undefined"
      @click="emit('navigate')"
    >
      <MpIcon v-if="item.icon" :name="item.icon" size="md" />
      <span class="kp-si__label">{{ item.label }}</span>
      <MpBadge v-if="badgeValue" for="indicator" type="critical">{{ badgeValue }}</MpBadge>
    </NuxtLink>
  </div>
</template>

<style scoped>
.kp-si__row {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  width: 100%;
  padding: var(--mp-spacing-2);
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  color: var(--mp-colors-text-default);
  font: inherit;
  font-size: var(--mp-font-sizes-md);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 200ms ease, color 200ms ease;
}
.kp-si__row:hover {
  color: var(--mp-colors-text-selected);
}
.kp-si__row:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}

/* Nested rows: lighter text; indented more when the group carries an icon. */
.kp-si__row--depth-1,
.kp-si__row--depth-2 {
  color: var(--mp-colors-text-secondary);
}
.kp-si__row--depth-1 { padding-left: var(--mp-spacing-4); }
.kp-si__row--depth-2 { padding-left: var(--mp-spacing-8); }
.kp-si__row--inset.kp-si__row--depth-1 { padding-left: var(--mp-spacing-10); }
.kp-si__row--inset.kp-si__row--depth-2 { padding-left: calc(var(--mp-spacing-10) + var(--mp-spacing-4)); }

.kp-si__row--within {
  background: var(--mp-colors-background-brand);
}

.kp-si__row--active {
  background: var(--mp-colors-background-brand);
  color: var(--mp-colors-text-default);
  font-weight: var(--mp-font-weights-semi-bold);
}
.kp-si__row--depth-0.kp-si__row--active {
  color: var(--mp-colors-text-selected);
}

.kp-si__label {
  flex: 1;
  min-width: 0;
}
</style>
