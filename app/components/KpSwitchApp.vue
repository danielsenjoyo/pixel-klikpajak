<script setup lang="ts">
import { MpButton, MpDivider, MpDrawer, MpDrawerBody, MpDrawerCloseButton, MpDrawerContent, MpDrawerOverlay, MpIcon, MpText } from '@mekari/pixel3'
import { switchAppGroups } from '~/data/headerMenus'

// Mekari app switcher. Source: Header/Bar/Action/SwitchApp (+ Drawer, Item) —
// a right drawer listing Mekari products. Hidden for Jurnal add-on users.
const isOpen = ref(false)

const groups = switchAppGroups
</script>

<template>
  <button
    v-tooltip="{ label: 'Switch app', placement: 'bottom' }"
    type="button"
    class="kp-icon-btn"
    aria-label="Switch app"
    @click="isOpen = true"
  >
    <MpIcon name="shortcuts" size="md" />
  </button>

  <MpDrawer id="kp-switch-app" :is-open="isOpen" placement="right" size="sm" @close="isOpen = false">
    <MpDrawerOverlay />
    <MpDrawerContent>
      <MpDrawerCloseButton />
      <MpDrawerBody>
        <div class="kp-apps">
          <template v-for="(group, index) in groups" :key="group.title">
            <MpDivider v-if="index > 0" />
            <MpText>{{ group.title }}</MpText>
            <div v-for="app in group.items" :key="app.label" class="kp-apps__item">
              <MpIcon :name="app.icon" size="md" />
              <span class="kp-apps__text">
                <MpText weight="semiBold">{{ app.label }}</MpText>
                <MpText size="body-small" color="text.secondary">{{ app.desc }}</MpText>
              </span>
              <MpIcon name="newtab" size="sm" color="icon.subtle" />
            </div>
          </template>
          <MpButton id="kp-switch-app-marketplace" variant="secondary" class="kp-apps__more">
            Lainnya dari Mekari Marketplace
          </MpButton>
        </div>
      </MpDrawerBody>
    </MpDrawerContent>
  </MpDrawer>
</template>

<style scoped>
.kp-apps {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  padding-top: var(--mp-spacing-12);
}

.kp-apps__item {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-3);
  padding: var(--mp-spacing-2);
  border-radius: var(--mp-radii-md);
  cursor: pointer;
}
.kp-apps__item:hover {
  background: var(--mp-colors-background-neutral-hovered);
}

.kp-apps__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.kp-apps__more {
  width: 100%;
  margin-top: var(--mp-spacing-2);
}
</style>
