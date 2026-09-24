<script setup lang="ts">
import { MpDrawer, MpDrawerBody, MpDrawerCloseButton, MpDrawerContent, MpDrawerHeader, MpDrawerOverlay, MpIcon } from '@mekari/pixel3'
import { isNavItemActive, navigation, visibleItems, type NavItem } from '~/data/navigation'

// Below 1024px the top-level menu collapses into a burger + left drawer.
// Source: organisms/main/nav/MobileMenu (also the only place "Scan Faktur" shows).
const route = useRoute()
const isOpen = ref(false)
const items = computed(() => visibleItems(navigation, { mobile: true }))

function go(item: NavItem) {
  if (!item.path) return
  isOpen.value = false
  navigateTo(item.path)
}
</script>

<template>
  <button type="button" class="kp-burger" aria-label="Buka menu" @click="isOpen = true">
    <MpIcon name="burger" size="md" />
  </button>

  <MpDrawer id="kp-mobile-menu" :is-open="isOpen" placement="left" size="sm" @close="isOpen = false">
    <MpDrawerOverlay />
    <MpDrawerContent>
      <MpDrawerHeader>Menu</MpDrawerHeader>
      <MpDrawerCloseButton />
      <MpDrawerBody>
        <ul class="kp-mnav">
          <li v-for="item in items" :key="item.key">
            <button
              type="button"
              class="kp-mnav__link kp-mnav__link--top"
              :class="{ 'kp-mnav__link--active': isNavItemActive(item, route.path) }"
              @click="go(item)"
            >
              {{ item.label }}
            </button>
            <ul v-if="item.children" class="kp-mnav kp-mnav--nested">
              <li v-for="child in item.children" :key="child.key ?? child.label">
                <button
                  type="button"
                  class="kp-mnav__link"
                  :class="{ 'kp-mnav__link--active': child.path === route.path }"
                  @click="go(child)"
                >
                  {{ child.label }}
                </button>
                <ul v-if="child.children" class="kp-mnav kp-mnav--nested">
                  <li v-for="leaf in child.children" :key="leaf.path">
                    <button
                      type="button"
                      class="kp-mnav__link"
                      :class="{ 'kp-mnav__link--active': leaf.path === route.path }"
                      @click="go(leaf)"
                    >
                      {{ leaf.label }}
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </li>
        </ul>
      </MpDrawerBody>
    </MpDrawerContent>
  </MpDrawer>
</template>

<style scoped>
.kp-burger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  color: var(--mp-colors-icon-default);
  cursor: pointer;
}
.kp-burger:hover {
  background: var(--mp-colors-background-neutral-hovered);
}
@media (max-width: 1023px) {
  .kp-burger {
    display: inline-flex;
  }
}

.kp-mnav {
  margin: 0;
  padding: 0;
  list-style: none;
}
.kp-mnav--nested {
  padding-left: var(--mp-spacing-4);
}

.kp-mnav__link {
  display: block;
  width: 100%;
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  color: var(--mp-colors-text-default);
  font: inherit;
  font-size: var(--mp-font-sizes-md);
  text-align: left;
  cursor: pointer;
}
.kp-mnav__link:hover {
  background: var(--mp-colors-background-neutral-hovered);
}
.kp-mnav__link--top {
  font-weight: var(--mp-font-weights-semi-bold);
}
.kp-mnav__link--active {
  background: var(--mp-colors-background-brand);
  color: var(--mp-colors-text-selected);
}
</style>
