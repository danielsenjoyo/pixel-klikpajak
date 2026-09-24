<script setup lang="ts">
import { MpText } from '@mekari/pixel3'

// Page title bar on the surface background (Figma "Page Title"): optional
// breadcrumb, page title on the left, page actions on the right.
defineProps<{ title: string, breadcrumbs?: { label: string, to?: string }[] }>()
</script>

<template>
  <div class="kp-page-header">
    <div class="kp-page-header__left">
      <nav v-if="breadcrumbs?.length" class="kp-page-header__breadcrumb" aria-label="Breadcrumb">
        <template v-for="(crumb, i) in breadcrumbs" :key="crumb.label">
          <NuxtLink v-if="crumb.to" :to="crumb.to" class="kp-page-header__crumb">{{ crumb.label }}</NuxtLink>
          <span v-else class="kp-page-header__crumb kp-page-header__crumb--current">{{ crumb.label }}</span>
          <span v-if="i < breadcrumbs.length - 1" class="kp-page-header__sep" aria-hidden="true">/</span>
        </template>
      </nav>
      <MpText as="h1" size="h1" weight="semiBold" class="kp-page-header__title">{{ title }}</MpText>
    </div>
    <div v-if="$slots.actions" class="kp-page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.kp-page-header {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-6);
  min-height: 72px;
  padding: var(--mp-spacing-4) var(--mp-spacing-6);
}

.kp-page-header__left {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.kp-page-header__breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-spacing-1);
  font-size: var(--mp-font-sizes-md);
  line-height: var(--mp-line-heights-md);
}

.kp-page-header__crumb {
  color: var(--mp-colors-text-link);
  text-decoration: none;
}
a.kp-page-header__crumb:hover {
  text-decoration: underline;
}
.kp-page-header__crumb--current {
  color: var(--mp-colors-text-secondary);
}

.kp-page-header__sep {
  color: var(--mp-colors-text-secondary);
}

.kp-page-header__title {
  margin: 0;
}

.kp-page-header__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
}
</style>
