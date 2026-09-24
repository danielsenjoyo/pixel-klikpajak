<script setup lang="ts">
import { MpCheckbox, MpFormControl, MpFormLabel, MpText } from '@mekari/pixel3'
import type { BlockValues, StatementsBlock } from '~/data/spt1771Engine'

// Declarations (Figma Lampiran 10B/10C/10D, 11B III): numbered groups of statements,
// each answered Tidak/Ya or ticked; optional dated fields after the list.
defineProps<{ block: StatementsBlock, idPrefix: string, isReadOnly?: boolean }>()
const values = defineModel<BlockValues>({ required: true })
</script>

<template>
  <section class="spt-statements">
    <MpText v-if="block.title" as="h4" weight="semiBold">{{ block.title }}</MpText>

    <div v-for="(g, gi) in block.groups" :key="gi" class="spt-statements__group">
      <MpText v-if="g.title" as="h5" weight="semiBold">{{ g.no ? `${g.no}. ` : '' }}{{ g.title }}</MpText>
      <MpText v-if="g.intro" size="body" color="text.secondary">{{ g.intro }}</MpText>

      <ul class="spt-statements__list">
        <li v-for="s in g.items" :key="s.key" class="spt-statements__item">
          <template v-if="block.control === 'yesno'">
            <KpQuestion :label="s.letter ? `${s.letter}. ${s.label}` : s.label">
              <ul v-if="s.subItems" class="spt-statements__sub">
                <li v-for="sub in s.subItems" :key="sub">{{ sub }}</li>
              </ul>
              <KpYesNo
                :id="`${idPrefix}-${s.key}`"
                :model-value="values[s.key] === true"
                :is-disabled="isReadOnly"
                @update:model-value="values[s.key] = $event"
              />
            </KpQuestion>
          </template>
          <MpCheckbox
            v-else
            :id="`${idPrefix}-${s.key}`"
            :is-checked="values[s.key] === true"
            :is-disabled="isReadOnly"
            @change="(checked: boolean) => (values[s.key] = checked)"
          >
            {{ s.letter ? `${s.letter}. ` : '' }}{{ s.label }}
          </MpCheckbox>
        </li>
      </ul>
    </div>

    <div v-if="block.fields?.length" class="spt-statements__fields">
      <MpFormControl v-for="f in block.fields" :id="`${idPrefix}-${f.key}-control`" :key="f.key">
        <MpFormLabel>{{ f.label }}</MpFormLabel>
        <SptField :id="`${idPrefix}-${f.key}`" v-model="values[f.key]" :type="f.type" :is-disabled="isReadOnly" />
      </MpFormControl>
    </div>
  </section>
</template>

<style scoped>
.spt-statements {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4);
  max-width: 640px;
  padding-bottom: var(--mp-spacing-6);
}

.spt-statements__group {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  padding-bottom: var(--mp-spacing-2);
  border-bottom: 1px solid var(--mp-colors-border-default);
}

.spt-statements__list {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  margin: var(--mp-spacing-2) 0 0;
  padding: 0;
  list-style: none;
}

.spt-statements__sub {
  margin: 0;
  padding-left: var(--mp-spacing-6);
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
  line-height: var(--mp-line-heights-md);
}

.spt-statements__fields {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4);
  max-width: 320px;
}
</style>
