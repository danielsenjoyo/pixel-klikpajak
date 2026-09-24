<script setup lang="ts">
import { MpAvatar, MpDivider, MpDrawer, MpDrawerBody, MpDrawerContent, MpDrawerOverlay, MpIcon, MpText } from '@mekari/pixel3'
import { activeLeafPath, sidebarGroups, type NavModule } from '~/data/navigation'

// Below the desktop breakpoint the sidebar moves into a drawer opened from the
// header burger. Source: components/Pixel/SidebarMobile — company header, every
// module with its second-level items inlined, then Keluar.
const route = useRoute()
const { session, company, logout } = useSession()
const { module, isMobileOpen } = useSidebar()

const activePath = computed(() => activeLeafPath(route.path, module.value))

function isActive(item: NavModule) {
  return module.value?.id === item.id
}

function close() {
  isMobileOpen.value = false
}

</script>

<template>
  <MpDrawer id="kp-sidebar-mobile" :is-open="isMobileOpen" placement="right" size="sm" @close="close">
    <MpDrawerOverlay />
    <MpDrawerContent>
      <MpDrawerBody class="kp-sbm">
        <div class="kp-sbm__company">
          <MpAvatar :name="company.name" size="md" variant-color="pink" />
          <span class="kp-sbm__company-text">
            <MpText weight="semiBold">{{ company.name }}</MpText>
            <MpText size="body-small" color="text.secondary">{{ company.npwp }}</MpText>
          </span>
        </div>

        <nav class="kp-sbm__menu" aria-label="Menu utama">
          <template v-for="(group, index) in sidebarGroups" :key="index">
            <template v-for="item in group" :key="item.id">
              <NuxtLink
                :to="item.path"
                class="kp-sbm__item"
                :class="{ 'kp-sbm__item--active': isActive(item) }"
                :aria-current="isActive(item) ? 'page' : undefined"
                @click="close"
              >
                <MpIcon :name="item.icon" size="md" :variant="isActive(item) ? 'fill' : 'outline'" />
                {{ item.label }}
              </NuxtLink>
              <div v-for="section in item.sections ?? []" :key="section.title" class="kp-sbm__section">
                <div v-if="(item.sections?.length ?? 0) > 1" class="kp-sbm__title">{{ section.title }}</div>
                <KpSidebarItem
                  v-for="child in section.items"
                  :key="child.id"
                  :item="child"
                  :active-path="activePath"
                  @navigate="close"
                />
              </div>
            </template>
            <MpDivider v-if="index < sidebarGroups.length - 1" class="kp-sbm__divider" />
          </template>

          <template v-if="!session.isJurnalUser">
            <MpDivider class="kp-sbm__divider" />
            <!-- pixel-police-allow: menu row styled like the nav links above (rules.md → exceptions) -->
            <button type="button" class="kp-sbm__item" @click="close(); logout()">
              <MpIcon name="sign-out" size="md" />
              Keluar
            </button>
          </template>
        </nav>
      </MpDrawerBody>
    </MpDrawerContent>
  </MpDrawer>
</template>

<style scoped>
.kp-sbm__company {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  margin-bottom: var(--mp-spacing-6);
  padding: var(--kp-sidebar-inset) var(--mp-spacing-2);
}
.kp-sbm__company-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kp-sbm__item {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  width: 100%;
  padding: var(--mp-spacing-2) var(--kp-sidebar-inset);
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  color: var(--mp-colors-text-default);
  font: inherit;
  font-size: var(--mp-font-sizes-md);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.kp-sbm__item:hover {
  color: var(--mp-colors-text-selected);
}
.kp-sbm__item--active {
  background: var(--mp-colors-background-brand);
  color: var(--mp-colors-text-selected);
  font-weight: var(--mp-font-weights-semi-bold);
}

.kp-sbm__section {
  padding-left: var(--mp-spacing-6);
}
.kp-sbm__title {
  padding: var(--mp-spacing-2);
  color: var(--mp-colors-text-selected);
  font-size: var(--mp-font-sizes-sm);
  font-weight: var(--mp-font-weights-semi-bold);
  letter-spacing: var(--mp-letter-spacings-widest);
  text-transform: uppercase;
}

.kp-sbm__divider {
  margin: var(--mp-spacing-3) 0;
}
</style>
