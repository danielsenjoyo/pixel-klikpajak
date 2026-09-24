<script setup lang="ts">
import { MpButton, MpIcon } from '@mekari/pixel3'
import logo from '~/assets/images/logo-klikpajak.svg'

// Fixed 56px top bar. Source: components/Pixel/Header/Bar —
// [logo] .......... [Daftar Efin] [+ Akses cepat] [Switch app] [burger (mobile) | account]
const { session } = useSession()
const { isMobileOpen } = useSidebar()
</script>

<template>
  <header class="kp-header">
    <NuxtLink to="/main/home" class="kp-header__logo" aria-label="Klikpajak — Dasbor">
      <img :src="logo" alt="Klikpajak" height="40" />
    </NuxtLink>

    <div class="kp-header__actions">
      <MpButton
        v-if="!session.isEfinRegistered"
        id="kp-register-efin"
        size="sm"
        @click="navigateTo('/main/efin/register')"
      >
        Daftar Efin
      </MpButton>
      <KpQuickAccess />
      <KpSwitchApp v-if="!session.isJurnalUser" />
      <button
        v-tooltip="{ label: 'Menu', placement: 'bottom' }"
        type="button"
        class="kp-icon-btn kp-header__burger"
        aria-label="Menu"
        @click="isMobileOpen = true"
      >
        <MpIcon name="burger" size="md" />
      </button>
      <KpAccountMenu class="kp-header__account" />
    </div>
  </header>
</template>

<style scoped>
.kp-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--kp-header-height);
  padding: var(--mp-spacing-2xs) var(--mp-spacing-6);
  border-bottom: 1px solid var(--mp-colors-border-default);
  background: var(--mp-colors-background-stage);
}

.kp-header__logo {
  display: inline-flex;
  height: 40px;
}

.kp-header__actions {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
}

.kp-header__burger {
  display: none;
}

@media (max-width: 991px) {
  .kp-header {
    padding: var(--mp-spacing-2xs) var(--mp-spacing-4);
  }
  .kp-header__burger {
    display: inline-flex;
  }
  .kp-header__account {
    display: none;
  }
}
</style>
