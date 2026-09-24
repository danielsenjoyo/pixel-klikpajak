<script setup lang="ts">
import { MpToastManager } from '@mekari/pixel3'

// Logged-in shell (source layout: MekariPixelFaktur — PixelHeader + PixelSidebar):
// fixed header, first-level sidebar, optional second-level panel, and content
// offset by their combined width.
const { contentOffset, toggleParent, toggleChild, hasChild } = useSidebar()

// Source shortcuts: Shift+X toggles the sidebar, Shift+C the second-level panel.
function onKeydown(e: KeyboardEvent) {
  if (!e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return
  const key = e.key.toLowerCase()
  if (key === 'x') toggleParent()
  else if (key === 'c' && hasChild.value) toggleChild()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="kp-shell" :style="{ '--kp-content-offset': `${contentOffset}px` }">
    <KpHeader />
    <KpSidebar class="kp-shell__sidebar" />
    <KpSidebarPanel class="kp-shell__sidebar" />
    <KpSidebarMobile />
    <main class="kp-content">
      <slot />
    </main>
    <MpToastManager />
  </div>
</template>

<style scoped>
.kp-shell {
  min-height: 100dvh;
  background: var(--mp-colors-background-surface);
}

.kp-content {
  margin-left: var(--kp-content-offset);
  padding: calc(var(--kp-header-height) + var(--mp-spacing-5)) var(--mp-spacing-6) var(--mp-spacing-6);
  transition: margin-left 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 991px) {
  .kp-shell__sidebar {
    display: none;
  }
  .kp-content {
    margin-left: 0;
    padding-right: var(--mp-spacing-4);
    padding-left: var(--mp-spacing-4);
  }
}
</style>
