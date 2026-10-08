<script setup lang="ts">
import { MpBadge, MpIcon, MpText } from '@mekari/pixel3'
import type { CheckState } from '~/data/spt1771Checkpoints'
import type { HasilSpt } from '~/data/spt1771Induk'
import { SPT_SECTIONS, type SptSection } from '~/data/sptTahunanBadan'
import { formatRp } from '~/utils/currency'

// In-page section menu of the Lapor SPT page (Figma "menu"): lapor status, then
// SPT Induk and Lampiran 1–14 with a checkpoint per section; Lampiran 10–13 expand
// into their parts. Collapses to a 24px strip (Figma "collapse sidemenu").
// The <aside> column stretches to the stage height (full-height divider); the menu inside is sticky.
const props = defineProps<{
  activeKey: string
  hrefFor: (key: string) => string
  status: { label: string, type: 'warning' | 'completed' | 'information' }
  /** When DJP last ran Posting, already formatted; null while it never has. */
  postedAt: string | null
  states: Record<string, CheckState>
  /** Angka 17c, shown as an ambient chip so the result stays visible everywhere (brief §4.2). */
  hasil: HasilSpt
  /** Lampiran keys the current answers activate (brief §4.3). */
  required: string[]
}>()
const emit = defineEmits<{ 'jump-hasil': [] }>()
const isCollapsed = defineModel<boolean>('collapsed', { default: false })

const CHECK: Record<CheckState, { icon: string, color: string, variant?: 'fill', label: string }> = {
  done: { icon: 'done', color: 'icon.success', variant: 'fill', label: 'Sudah diisi' },
  required: { icon: 'warning-circular', color: 'icon.warning', variant: 'fill', label: 'Wajib diisi' },
  optional: { icon: '', color: 'icon.subtle', label: 'Opsional' },
}
const check = (key: string) => CHECK[props.states[key] ?? 'optional']
/** Only the states that actually draw an icon are worth explaining. */
const legend = Object.values(CHECK).filter(c => c.icon)

/**
 * §4.3/§4.4 — the list carries only what the return actually needs: the Induk, every
 * activated lampiran, anything already filled, and whatever the preparer is looking at.
 * The rest moves behind a collapse rather than being dropped, so orientation survives.
 */
const keysOf = (s: SptSection) => (s.children ? s.children.map(c => c.key) : [s.key])
const isRelevant = (s: SptSection) =>
  s.key === 'induk' || keysOf(s).some(k => k === props.activeKey || props.required.includes(k) || props.states[k] === 'done')

const relevant = computed(() => SPT_SECTIONS.filter(isRelevant))

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
  <aside class="spt-nav-col" :class="{ 'spt-nav-col--collapsed': isCollapsed }">
    <nav class="spt-nav" aria-label="Bagian SPT">
      <button
        v-tooltip="{ label: isCollapsed ? 'Tampilkan daftar bagian' : 'Sembunyikan daftar bagian', placement: 'right' }"
        type="button"
        class="kp-icon-btn kp-icon-btn--compact spt-nav__toggle"
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
        </div>

        <!-- pixel-police-allow: ambient result chip — Pixel 3 has no nav component (rules.md → exceptions) -->
        <button type="button" class="spt-nav__hasil" :class="`spt-nav__hasil--${hasil.state}`" @click="emit('jump-hasil')">
          <MpText size="label-small" weight="semiBold">Hasil SPT (angka {{ hasil.line }})</MpText>
          <MpText size="label" weight="semiBold" class="spt-nav__hasil-amount" :class="{ 'spt-nav__hasil-amount--estimasi': !hasil.isFinal }">
            {{ hasil.state === 'nihil' ? hasil.label : `${hasil.label} ${formatRp(hasil.amount)}` }}
          </MpText>
          <MpText size="label-small" color="text.secondary">{{ hasil.isFinal ? 'final' : 'estimasi sementara' }}</MpText>
        </button>

        <!-- Label and timestamp on their own lines, as SPT Masa PPN prints it. -->
        <div class="spt-nav__posted">
          <MpText as="p" size="label-small" color="text.secondary" weight="semiBold">Waktu posting terakhir:</MpText>
          <MpText as="p" size="label-small" color="text.secondary">{{ postedAt ?? 'Belum ada' }}</MpText>
        </div>

        <ul class="spt-nav__list">
          <li v-for="s in relevant" :key="s.key">
            <!-- pixel-police-allow: expand/collapse nav group — Pixel 3 has no nav component (rules.md → exceptions) -->
            <button
              v-if="s.children"
              type="button"
              class="spt-nav__item"
              :class="{ 'spt-nav__item--within': s.children.some(c => c.key === activeKey) }"
              :aria-expanded="openGroups.has(s.key)"
              @click="toggleGroup(s)"
            >
              <span class="spt-nav__label">
                <MpIcon v-if="check(s.key).icon" :name="check(s.key).icon" :variant="check(s.key).variant" :color="check(s.key).color" size="sm" aria-hidden="true" />
                {{ s.label }}
                <span class="kp-sr-only">({{ check(s.key).label }})</span>
              </span>
              <MpIcon :name="openGroups.has(s.key) ? 'caret-up' : 'caret-down'" size="sm" />
            </button>
            <NuxtLink
              v-else
              :to="hrefFor(s.key)"
              class="spt-nav__item"
              :class="{ 'spt-nav__item--active': s.key === activeKey }"
              :aria-current="s.key === activeKey ? 'page' : undefined"
            >
              <span class="spt-nav__label">
                <MpIcon v-if="check(s.key).icon" :name="check(s.key).icon" :variant="check(s.key).variant" :color="check(s.key).color" size="sm" aria-hidden="true" />
                {{ s.label }}
                <span class="kp-sr-only">({{ check(s.key).label }})</span>
              </span>
            </NuxtLink>
            <ul v-if="s.children && openGroups.has(s.key)" class="spt-nav__list spt-nav__list--nested">
              <li v-for="c in s.children" :key="c.key">
                <NuxtLink
                  :to="hrefFor(c.key)"
                  class="spt-nav__item"
                  :class="{ 'spt-nav__item--active': c.key === activeKey }"
                  :aria-current="c.key === activeKey ? 'page' : undefined"
                >
                  <span class="spt-nav__label">
                    <MpIcon v-if="check(c.key).icon" :name="check(c.key).icon" :variant="check(c.key).variant" :color="check(c.key).color" size="sm" aria-hidden="true" />
                    {{ c.label }}
                    <span class="kp-sr-only">({{ check(c.key).label }})</span>
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </li>
        </ul>

        <ul class="spt-nav__legend" aria-label="Keterangan">
          <li v-for="c in legend" :key="c.label">
            <MpIcon :name="c.icon" :variant="c.variant" :color="c.color" size="sm" aria-hidden="true" />
            <MpText size="label-small" color="text.secondary">{{ c.label }}</MpText>
          </li>
        </ul>
      </template>
    </nav>
  </aside>
</template>

<style scoped>
/* Column: stretches with the stage so the divider runs full height. */
.spt-nav-col {
  position: relative;
  flex-shrink: 0;
  width: 240px;
  border-right: 1px solid var(--mp-colors-border-default);
  transition: width 200ms ease;
}
.spt-nav-col--collapsed {
  width: 24px;
}

.spt-nav {
  position: sticky;
  top: var(--kp-header-height);
  max-height: calc(100dvh - var(--kp-header-height));
  overflow-y: auto;
  padding: 0 var(--mp-spacing-6) var(--mp-spacing-6);
}
.spt-nav-col--collapsed .spt-nav {
  padding: 0;
  overflow: visible;
}

.spt-nav__toggle {
  position: absolute;
  top: var(--mp-spacing-2);
  right: var(--mp-spacing-1);
  z-index: 1;
  padding: var(--mp-spacing-2xs);
  border-radius: var(--mp-radii-md);
}
.spt-nav__toggle:hover {
  background: var(--mp-colors-background-brand);
}
.spt-nav-col--collapsed .spt-nav__toggle {
  right: auto;
  left: 0;
  padding: var(--mp-spacing-2xs) var(--mp-spacing-4xs);
}

.spt-nav__status {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-4) 0;
  border-bottom: 1px solid var(--mp-colors-border-default);
}


.spt-nav__list {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4xs);
  margin: 0;
  padding: var(--mp-spacing-4) 0 0;
  list-style: none;
}
.spt-nav__list--nested {
  padding: var(--mp-spacing-4xs) 0 0 var(--mp-spacing-3);
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

.spt-nav__label {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-spacing-2);
}

/* Ambient result chip (brief §4.2): visible on every section, click jumps to 17c. */
.spt-nav__hasil {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--mp-spacing-1);
  width: 100%;
  margin-top: var(--mp-spacing-4);
  padding: var(--mp-spacing-3);
  border: 1px solid var(--mp-colors-border-default);
  border-left: 3px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-md);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.spt-nav__hasil:hover {
  background: var(--mp-colors-background-neutral-subtle);
}
.spt-nav__hasil:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}
.spt-nav__hasil--kb {
  border-left-color: var(--mp-colors-background-warning-bold);
}
.spt-nav__hasil--lb {
  border-left-color: var(--mp-colors-background-information-bold);
}
.spt-nav__hasil--nihil {
  border-left-color: var(--mp-colors-background-success-bold);
}

.spt-nav__hasil-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-spacing-2);
}

.spt-nav__posted {
  margin: var(--mp-spacing-2) 0 0;
}
.spt-nav__posted p {
  margin: 0;
}

.spt-nav__hasil-amount--estimasi {
  border-bottom: 1px dashed var(--mp-colors-border-default);
}

.spt-nav__legend {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  margin: var(--mp-spacing-4) 0 0;
  padding: var(--mp-spacing-3) 0 0;
  border-top: 1px solid var(--mp-colors-border-default);
  list-style: none;
}
.spt-nav__legend li {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
}

@media (max-width: 991px) {
  .spt-nav-col,
  .spt-nav-col--collapsed {
    width: 100%;
    border-right: 0;
    border-bottom: 1px solid var(--mp-colors-border-default);
  }
  .spt-nav {
    position: static;
    max-height: none;
  }
}
</style>
