<script setup lang="ts">
import { MpTab, MpTabList, MpTabs, MpText } from '@mekari/pixel3'
import type { BlockValues, Ctx, LampiranDef, Row, SectionData } from '~/data/spt1771Engine'

// Renders one lampiran definition (data/spt1771LampiranDefs.ts): title, part tabs
// (Figma "Tabs"), then each part's blocks.
const props = defineProps<{ def: LampiranDef, ctx: Omit<Ctx, 'section'>, isReadOnly?: boolean }>()
const data = defineModel<SectionData>({ required: true })

// Make sure every block has a slot to bind to.
watch(() => props.def, (def) => {
  for (const part of def.parts) {
    for (const b of part.blocks) {
      if (data.value[b.key] === undefined) data.value[b.key] = b.kind === 'table' ? [] : {}
    }
  }
}, { immediate: true })

const tabbed = computed(() => props.def.parts.some(p => p.tab))
const tab = ref(0)
watch(() => props.def.section, () => (tab.value = 0))
const visibleParts = computed(() => (tabbed.value ? [props.def.parts[tab.value]!] : props.def.parts))

const fullCtx = computed<Ctx>(() => ({ ...props.ctx, section: data.value }))
const rowsOf = (key: string) => data.value[key] as Row[]
const valuesOf = (key: string) => data.value[key] as BlockValues
</script>

<template>
  <div class="spt-lampiran">
    <MpText as="h2" size="h2" weight="semiBold" class="spt-lampiran__title">{{ def.title }}</MpText>

    <MpTabs v-if="tabbed" :id="`${def.section}-tabs`" v-model="tab" is-manual class="spt-lampiran__tabs">
      <MpTabList>
        <MpTab v-for="p in def.parts" :id="`${def.section}-tab-${p.key}`" :key="p.key">{{ p.tab }}</MpTab>
      </MpTabList>
    </MpTabs>

    <section v-for="p in visibleParts" :key="`${def.section}-${p.key}`" class="spt-lampiran__part">
      <MpText v-if="p.title" as="h3" size="h3" weight="semiBold" class="spt-lampiran__subtitle">{{ p.title }}</MpText>

      <template v-for="b in p.blocks" :key="b.key">
        <template v-if="data[b.key] !== undefined">
          <SptTableBlock
            v-if="b.kind === 'table'"
            :model-value="rowsOf(b.key)"
            :block="b"
            :ctx="fullCtx"
            :id-prefix="`${def.section}-${b.key}`"
            :is-read-only="isReadOnly"
            @update:model-value="data[b.key] = $event"
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
