<script setup lang="ts">
import { MpButton } from '@mekari/pixel3'
import logo from '~/assets/images/logo-klikpajak.svg'

// Klikpajak top bar. Source: components/templates/main/Nav —
// [mobile burger][logo][main menu] ........ [Daftar Efin][product selector][user menu]
const { session } = useSession()
</script>

<template>
  <header class="kp-header">
    <div class="kp-header__inner">
      <div class="kp-header__left">
        <KpMobileMenu />
        <NuxtLink to="/main/home" class="kp-header__logo" aria-label="Klikpajak — Dasbor">
          <img :src="logo" alt="Klikpajak" height="34" />
        </NuxtLink>
        <KpNavMenu class="kp-header__menu" />
      </div>
      <div class="kp-header__right">
        <MpButton
          v-if="session.showRegisterEfin"
          id="kp-register-efin"
          variant="secondary"
          class="kp-header__efin"
          @click="navigateTo('/main/efin/register')"
        >
          Daftar Efin
        </MpButton>
        <KpProductSelector v-if="!session.isAddonUser" />
        <KpUserMenu />
      </div>
    </div>
  </header>
</template>

<style scoped>
.kp-header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--kp-header-height);
  background: var(--mp-colors-background-stage);
  border-bottom: 1px solid var(--mp-colors-border-default);
}

.kp-header__inner {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  height: 100%;
  padding: 0 var(--mp-spacing-3);
}

.kp-header__left,
.kp-header__right {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  min-width: 0;
}
.kp-header__left {
  align-items: stretch;
}

.kp-header__logo {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--mp-spacing-3);
}

@media (max-width: 1023px) {
  .kp-header__left {
    align-items: center;
  }
  .kp-header__menu,
  .kp-header__efin {
    display: none;
  }
}
</style>
