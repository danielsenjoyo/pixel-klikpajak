<script setup lang="ts">
import { MpBanner, MpBannerDescription, MpTab, MpTabList, MpTabs, MpText } from '@mekari/pixel3'
import type { BlockValues, Ctx, LampiranDef, Row, SectionData } from '~/data/spt1771Engine'
import { seedSection } from '~/data/spt1771LampiranDefs'

// Renders one lampiran definition (data/spt1771LampiranDefs.ts): title, part tabs
// (Figma "Tabs"), then each part's blocks.
const props = defineProps<{ def: LampiranDef, title?: string, ctx: Omit<Ctx, 'section'>, isReadOnly?: boolean }>()
const emit = defineEmits<{ refreshPrefill: [] }>()
const data = defineModel<SectionData>({ required: true })

// Make sure every block has a slot to bind to. The empty draft is seeded by the same
// helper, so opening a section adds nothing and never marks the SPT as changed.
watch(() => props.def, def => seedSection(def, data.value), { immediate: true })

/** Parts whose `when` gate passes — e.g. Lampiran 2B hides unless H.21.c/d = Ya. */
const activeParts = computed(() => props.def.parts.filter(p => !p.when || p.when(props.ctx)))
const tabbed = computed(() => activeParts.value.some(p => p.tab))
/**
 * The open part is addressed by *key*, not index, and owned by the page — an issue can
 * then deep-link to a field behind a tab, and a `when` gate hiding a part cannot silently
 * shift which one is open.
 */
const part = defineModel<string>('part', { default: '' })
const partIndex = computed({
  get: () => Math.max(0, activeParts.value.findIndex(p => p.key === part.value)),
  set: (i: number) => { part.value = activeParts.value[i]?.key ?? '' },
})
const visibleParts = computed(() => {
  if (!activeParts.value.length) return []
  return tabbed.value ? [activeParts.value[partIndex.value] ?? activeParts.value[0]!] : activeParts.value
})

/**
 * Every part is gated off, so the lampiran has nothing to ask. Retain-and-hide: whatever
 * was typed stays in the draft and comes back when the Induk answer does.
 */
const inactive = computed(() => !activeParts.value.length)

const fullCtx = computed<Ctx>(() => ({ ...props.ctx, section: data.value }))
/** Blocks whose own gate passes — Lampiran 12B's V–VIII follow the bentuk ticked in IV.a. */
const blocksOf = (part: LampiranDef['parts'][number]) => part.blocks.filter(b => !b.when || b.when(fullCtx.value))
const rowsOf = (key: string) => data.value[key] as Row[]
const valuesOf = (key: string) => data.value[key] as BlockValues
</script>

<template>
  <div class="spt-lampiran">
    <MpText as="h2" size="h2" weight="semiBold" class="spt-lampiran__title">{{ title || def.title }}</MpText>

    <MpBanner v-if="inactive" :id="`${def.section}-inactive`" variant="information" is-inline class="spt-lampiran__inactive">
      <MpBannerDescription>
        Lampiran ini tidak berlaku karena pertanyaan terkait pada SPT Induk dijawab “Tidak”.
        Data yang sudah diisi tetap tersimpan dan akan muncul kembali jika jawabannya diubah.
      </MpBannerDescription>
    </MpBanner>

    <MpTabs v-if="tabbed" :id="`${def.section}-tabs`" v-model="partIndex" is-manual class="spt-lampiran__tabs">
      <MpTabList>
        <MpTab v-for="p in activeParts" :id="`${def.section}-tab-${p.key}`" :key="p.key">{{ p.tab }}</MpTab>
      </MpTabList>
    </MpTabs>

    <section v-for="p in visibleParts" :key="`${def.section}-${p.key}`" class="spt-lampiran__part">
      <MpText v-if="p.title" as="h3" size="h3" weight="semiBold" class="spt-lampiran__subtitle">{{ p.title }}</MpText>

      <template v-for="b in blocksOf(p)" :key="b.key">
        <template v-if="data[b.kind === 'table' ? b.dataKey ?? b.key : b.key] !== undefined">
          <SptTableBlock
            v-if="b.kind === 'table'"
            :model-value="rowsOf(b.dataKey ?? b.key)"
            :block="b"
            :ctx="fullCtx"
            :id-prefix="`${def.section}-${b.key}`"
            :is-read-only="isReadOnly"
            :recap="b.recap ? valuesOf(b.recap.key) : undefined"
            @update:model-value="data[b.dataKey ?? b.key] = $event"
            @update:recap="b.recap && (data[b.recap.key] = $event)"
            @refresh-prefill="emit('refreshPrefill')"
          />
          <SptFormBlock
            v-else-if="b.kind === 'form'"
            :model-value="valuesOf(b.key)"
            :block="b"
            :ctx="fullCtx"
            :id-prefix="`${def.section}-${b.key}`"
            :is-read-only="isReadOnly"
          />
          <SptStatementsBlock
            v-else-if="b.kind === 'statements'"
            :model-value="valuesOf(b.key)"
            :block="b"
            :id-prefix="`${def.section}-${b.key}`"
            :is-read-only="isReadOnly"
          />
          <SptFieldsBlock
            v-else
            :model-value="valuesOf(b.key)"
            :block="b"
            :ctx="fullCtx"
            :id-prefix="`${def.section}-${b.key}`"
            :is-read-only="isReadOnly"
          />
        </template>
      </template>
    </section>
  </div>
</template>

<style scoped>
.spt-lampiran {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spt-lampiran__title {
  margin: 0 0 var(--mp-spacing-4);
}

.spt-lampiran__tabs {
  margin-bottom: var(--mp-spacing-5);
}

.spt-lampiran__inactive {
  margin-bottom: var(--mp-spacing-5);
}

.spt-lampiran__part {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spt-lampiran__subtitle {
  max-width: 960px;
  margin: 0 0 var(--mp-spacing-4);
}
</style>
