<script setup lang="ts">
import { MpButton, MpIcon, MpText } from '@mekari/pixel3'
import { findNavTrail } from '~/data/navigation'

// Placeholder for any route whose module hasn't been ported yet. Shows where the
// route sits in the nav and the source path to port from (docs/ROADMAP.md).
const props = defineProps<{ title?: string }>()
const route = useRoute()
const trail = computed(() => findNavTrail(route.path) ?? [])
const heading = computed(() => props.title ?? trail.value.at(-1) ?? route.path)
</script>

<template>
  <section class="kp-np">
    <MpText v-if="trail.length > 1" size="body-small" color="text.secondary">
      {{ trail.slice(0, -1).join(' / ') }}
    </MpText>
    <MpText as="h1" size="h2" weight="semiBold">{{ heading }}</MpText>

    <div class="kp-np__card">
      <MpIcon name="progress" size="md" color="icon.subtle" />
      <MpText size="h3" weight="semiBold">Halaman ini belum dipindahkan</MpText>
      <MpText color="text.secondary">
        Modul ini akan dibangun ulang dengan Pixel 3 (token 2.4). Rute sumber:
        <code class="kp-np__path">{{ route.path }}</code>
      </MpText>
      <MpButton id="kp-np-home" variant="secondary" @click="navigateTo('/main/home')">
        Kembali ke Dasbor
      </MpButton>
    </div>
  </section>
</template>

<style scoped>
.kp-np {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-1);
}

.kp-np__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mp-spacing-3);
  margin-top: var(--mp-spacing-5);
  padding: var(--mp-spacing-16) var(--mp-spacing-6);
  border: 1px solid var(--mp-colors-border-default);
  border-radius: var(--mp-radii-lg);
  background: var(--mp-colors-background-stage);
  text-align: center;
}

.kp-np__path {
  padding: 0 var(--mp-spacing-1);
  border-radius: var(--mp-radii-sm);
  background: var(--mp-colors-background-neutral-subtle);
  font-family: var(--mp-fonts-mono);
}
</style>
