<script setup lang="ts">
import { MpIcon, MpPopover, MpPopoverContent, MpPopoverTrigger, MpText } from '@mekari/pixel3'

// Mekari product switcher. Source: organisms/main/nav/ProductSelector (a slide-in
// panel there; a popover here). Hidden for Jurnal add-on users.
const groups = [
  {
    title: 'Produk Mekari yang Anda gunakan',
    items: [{ label: 'Mekari Klikpajak', desc: 'Aplikasi pengelolaan pajak terdaftar DJP', icon: 'klikpajak-brand' }],
  },
  {
    title: 'Produk Mekari lainnya',
    items: [
      { label: 'Mekari Talenta', desc: 'Aplikasi payroll & HRIS terautomasi', icon: 'talenta-brand' },
      { label: 'Mekari Jurnal', desc: 'Aplikasi akuntansi online terintegrasi', icon: 'jurnal-brand' },
      { label: 'Mekari Qontak', desc: 'Aplikasi omnichannel CRM terautomasi', icon: 'qontak-brand' },
      { label: 'Mekari Flex', desc: 'Aplikasi manajemen tunjangan karyawan yang fleksibel', icon: 'flex-brand' },
      { label: 'Mekari e-Sign', desc: 'Aplikasi penyelenggara layanan e-Signature', icon: 'sign-brand' },
    ],
  },
  {
    title: 'Lainnya dari Mekari',
    items: [{ label: 'Mekari University', desc: 'Platform belajar profesional', icon: 'university-brand' }],
  },
]
</script>

<template>
  <MpPopover id="kp-product-selector" placement="bottom-end" trigger="click" use-portal is-close-on-escape>
    <MpPopoverTrigger>
      <button type="button" class="kp-products__trigger" aria-label="Produk Mekari">
        <MpIcon name="application" size="md" />
      </button>
    </MpPopoverTrigger>
    <MpPopoverContent class="kp-products-panel">
      <section v-for="group in groups" :key="group.title" class="kp-products__group">
        <MpText size="body-small" color="text.secondary">{{ group.title }}</MpText>
        <div v-for="p in group.items" :key="p.label" class="kp-products__item">
          <MpIcon :name="p.icon" size="md" />
          <span class="kp-products__text">
            <MpText size="label" weight="semiBold">{{ p.label }}</MpText>
            <MpText size="body-small" color="text.secondary">{{ p.desc }}</MpText>
          </span>
          <MpIcon name="newtab" size="sm" />
        </div>
      </section>
    </MpPopoverContent>
  </MpPopover>
</template>

<style scoped>
.kp-products__trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--mp-radii-md);
  background: transparent;
  color: var(--mp-colors-icon-default);
  cursor: pointer;
}
.kp-products__trigger:hover {
  background: var(--mp-colors-background-neutral-hovered);
}
.kp-products__trigger:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}

.kp-products__group {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
  padding: var(--mp-spacing-2) var(--mp-spacing-4);
}
.kp-products__group + .kp-products__group {
  border-top: 1px solid var(--mp-colors-border-default);
}

.kp-products__item {
  display: flex;
  align-items: center;
  gap: var(--mp-spacing-3);
  padding: var(--mp-spacing-2) 0;
}

.kp-products__text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
</style>

<style>
/* Unscoped: MpPopoverContent is teleported, so a scoped class on it doesn't match. */
.kp-products-panel {
  width: 340px;
  padding: var(--mp-spacing-2) 0;
}
</style>
