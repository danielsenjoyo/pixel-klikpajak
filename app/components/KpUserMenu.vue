<script setup lang="ts">
import { MpIcon, MpPopover, MpPopoverContent, MpPopoverList, MpPopoverListItem, MpPopoverTrigger, MpText } from '@mekari/pixel3'

// Company / account menu. Source: organisms/main/nav/UserMenu — trigger shows the
// active company name + NPWP; the menu holds Settings, Jurnal integration (non
// add-on users only), the company switcher, and Logout.
const { session, companies, company, switchCompany } = useSession()

function pickCompany(id: number, close: () => void) {
  switchCompany(id)
  close()
}

function go(path: string, close: () => void) {
  close()
  navigateTo(path)
}
</script>

<template>
  <MpPopover
    id="kp-user-menu"
    placement="bottom-end"
    trigger="click"
    use-portal
    is-close-on-escape
    v-slot="{ onClosePopover }"
  >
    <MpPopoverTrigger>
      <button type="button" class="kp-user" aria-label="Buka menu akun">
        <span class="kp-user__meta">
          <MpText size="label" weight="semiBold" is-truncated>{{ company.name }}</MpText>
          <MpText size="body-small" color="text.secondary">{{ company.npwp }}</MpText>
        </span>
        <MpIcon name="caret-down" size="sm" />
      </button>
    </MpPopoverTrigger>

    <MpPopoverContent class="kp-user-panel">
      <MpPopoverList>
        <MpPopoverListItem @click="go('/main/setting/account', onClosePopover)">
          <span class="kp-user__row">
            <MpIcon name="settings" size="md" />
            Pengaturan
            <span v-if="!session.isEmailVerified" class="kp-user__dot" aria-label="Email belum diverifikasi" />
          </span>
        </MpPopoverListItem>
        <MpPopoverListItem v-if="!session.isAddonUser" @click="go('/main/setting/jurnal-integration', onClosePopover)">
          <span class="kp-user__row">
            <MpIcon name="jurnal-brand" size="md" />
            Tentang integrasi Jurnal
          </span>
        </MpPopoverListItem>
      </MpPopoverList>

      <div class="kp-user__section">Daftar Perusahaan</div>
      <MpPopoverList>
        <MpPopoverListItem
          v-for="c in companies"
          :key="c.id"
          :is-active="c.id === company.id"
          @click="pickCompany(c.id, onClosePopover)"
        >
          <span class="kp-user__row kp-user__row--spread">
            <span class="kp-user__company">
              <span>{{ c.name }}</span>
              <MpText size="body-small" color="text.secondary">{{ c.npwp }}</MpText>
            </span>
            <MpIcon v-if="c.id === company.id" name="check" size="md" color="icon.brand" />
          </span>
        </MpPopoverListItem>
      </MpPopoverList>

      <div class="kp-user__divider" />
      <MpPopoverList>
        <MpPopoverListItem @click="onClosePopover()">
          <span class="kp-user__row">
            <MpIcon name="sign-out" size="md" />
            Keluar
          </span>
        </MpPopoverListItem>
      </MpPopoverList>
    </MpPopoverContent>
  </MpPopover>
</template>

<style scoped>
.kp-user {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-2) var(--mp-spacing-3);
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  font: inherit;
  cursor: pointer;
}
.kp-user:hover {
  background: var(--mp-colors-background-neutral-hovered);
}
.kp-user:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}

.kp-user__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 220px;
  text-align: right;
}

.kp-user__row {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  width: 100%;
}
.kp-user__row--spread {
  justify-content: space-between;
}

.kp-user__company {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kp-user__dot {
  width: 8px;
  height: 8px;
  border-radius: var(--mp-radii-full);
  background: var(--mp-colors-icon-danger);
}

.kp-user__section {
  padding: var(--mp-spacing-3) var(--mp-spacing-3) var(--mp-spacing-1);
  border-top: 1px solid var(--mp-colors-border-default);
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  font-weight: var(--mp-font-weights-semi-bold);
}

.kp-user__divider {
  border-top: 1px solid var(--mp-colors-border-default);
}
</style>

<style>
/* Unscoped: MpPopoverContent is teleported, so a scoped class on it doesn't match. */
.kp-user-panel {
  width: 300px;
}
</style>
