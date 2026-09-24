<script setup lang="ts">
import { MpAvatar, MpDivider, MpIcon, MpPopover, MpPopoverContent, MpPopoverList, MpPopoverListItem, MpPopoverTrigger, MpText } from '@mekari/pixel3'

// Company / account switcher. Source: Header/Bar/Action/SwitchAccount (+ Info,
// CompanyList). Trigger: avatar + company name + NPWP. Menu: company header,
// Pengaturan akun, Daftar perusahaan (sub-view), Keluar.
const { session, companies, company, switchCompany, logout } = useSession()
const view = ref<'main' | 'companies'>('main')

function go(path: string, close: () => void) {
  close()
  navigateTo(path)
}

function pickCompany(id: number, close: () => void) {
  switchCompany(id)
  close()
}
</script>

<template>
  <MpPopover
    id="kp-account-menu"
    placement="bottom-end"
    trigger="click"
    use-portal
    is-close-on-escape
    v-slot="{ onClosePopover }"
    @close="view = 'main'"
  >
    <MpPopoverTrigger>
      <button type="button" class="kp-account" aria-label="Buka menu akun">
        <MpAvatar :name="company.name" size="md" variant-color="pink" />
        <span class="kp-account__meta">
          <MpText weight="semiBold" is-truncated>{{ company.name }}</MpText>
          <MpText size="body-small" color="text.secondary">{{ company.npwp }}</MpText>
        </span>
      </button>
    </MpPopoverTrigger>

    <MpPopoverContent class="kp-account-panel">
      <template v-if="view === 'main'">
        <div class="kp-account__head">
          <MpAvatar :name="company.name" size="lg" variant-color="pink" />
          <MpText weight="semiBold">{{ company.name }}</MpText>
          <MpText color="text.secondary">{{ company.npwp }}</MpText>
        </div>
        <MpPopoverList>
          <MpPopoverListItem class="kp-account__row" @click="go('/main/setting/account/profile', onClosePopover)">
            Pengaturan akun
          </MpPopoverListItem>
          <MpPopoverListItem v-if="!session.isJurnalUser" class="kp-account__row" is-arrow @click="view = 'companies'">
            Daftar perusahaan
          </MpPopoverListItem>
        </MpPopoverList>
        <template v-if="!session.isJurnalUser">
          <MpDivider />
          <MpPopoverList>
            <MpPopoverListItem class="kp-account__row" @click="onClosePopover(); logout()">Keluar</MpPopoverListItem>
          </MpPopoverList>
        </template>
      </template>

      <template v-else>
        <div class="kp-account__subhead">
          <button type="button" class="kp-account__back" aria-label="Kembali" @click="view = 'main'">
            <MpIcon name="arrows-left" size="sm" />
          </button>
          <MpText weight="semiBold">Company list</MpText>
        </div>
        <div class="kp-account__list">
          <MpPopoverList>
            <MpPopoverListItem
              v-for="c in companies"
              :key="c.id"
              class="kp-account__row"
              @click="pickCompany(c.id, onClosePopover)"
            >
              <span class="kp-account__company">
                <span class="kp-account__company-text">
                  <span>{{ c.name }}</span>
                  <MpText size="body-small" color="text.secondary">Company ID: {{ c.id }}</MpText>
                </span>
                <MpIcon v-if="c.id === company.id" name="check" size="sm" />
              </span>
            </MpPopoverListItem>
          </MpPopoverList>
        </div>
        <MpDivider />
        <MpPopoverList>
          <MpPopoverListItem class="kp-account__row" @click="go('/main/setting/account/company/list', onClosePopover)">
            Lihat perusahaan terdaftar
          </MpPopoverListItem>
        </MpPopoverList>
      </template>
    </MpPopoverContent>
  </MpPopover>
</template>

<style scoped>
.kp-account {
  display: inline-flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-1) var(--mp-spacing-2);
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 200ms ease;
}
.kp-account:hover {
  background: var(--mp-colors-background-surface);
}
.kp-account:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}

.kp-account__meta {
  display: flex;
  flex-direction: column;
  max-width: 200px;
}

.kp-account__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-spacing-1);
  padding: var(--mp-spacing-4);
  border-bottom: 1px solid var(--mp-colors-border-default);
  background: var(--mp-colors-background-surface);
  text-align: center;
}

.kp-account__row {
  align-self: stretch;
}

.kp-account__subhead {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-2);
  padding: var(--mp-spacing-3) var(--mp-spacing-4);
  border-bottom: 1px solid var(--mp-colors-border-default);
}
.kp-account__back {
  display: inline-flex;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--mp-colors-icon-default);
  cursor: pointer;
}

.kp-account__list {
  max-height: 360px;
  overflow-y: auto;
}

.kp-account__company {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mp-spacing-2);
  width: 100%;
}
.kp-account__company-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
</style>

<style>
/* Unscoped: MpPopoverContent is teleported, so a scoped class on it doesn't match. */
.kp-account-panel {
  width: 260px;
  overflow: hidden;
}
</style>
