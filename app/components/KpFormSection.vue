<script setup lang="ts">
// Form section of the SPT Induk. The title is the shared band heading so every
// section — including the gating grid on Kondisi & Transaksi — looks the same.
// `code` carries the DJP letter when the title does not already start with one.
defineProps<{ id?: string, code?: string, title: string }>()
</script>

<template>
  <section :id="id" class="kp-form-section">
    <SptSectionHeading :code="code" :title="title" />
    <div class="kp-form-section__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.kp-form-section {
  display: flex;
  flex-direction: column;
  max-width: 880px;
  padding-bottom: var(--mp-spacing-5);
}

.kp-form-section__body {
  display: flex;
  flex-direction: column;
  padding-top: var(--mp-spacing-3);
}
</style>
