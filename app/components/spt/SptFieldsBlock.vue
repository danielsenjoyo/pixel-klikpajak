<script setup lang="ts">
import { MpCheckbox, MpFormControl, MpFormLabel, MpText } from '@mekari/pixel3'
import type { BlockValues, Ctx, FieldDef, FieldsBlock } from '~/data/spt1771Engine'

// Labelled inputs in the 640px form column (Figma Lampiran 12B, 13A), grouped under
// headings; a field's `group` adds a sub-heading above it.
const props = defineProps<{ block: FieldsBlock, ctx: Ctx, idPrefix: string, isReadOnly?: boolean }>()
const values = defineModel<BlockValues>({ required: true })

const showsSubheading = (fields: FieldDef[], i: number) => !!fields[i]!.group && fields[i]!.group !== fields[i - 1]?.group
const computedValue = (f: FieldDef) => f.compute!(values.value, props.ctx)
</script>

<template>
  <section class="spt-fields">
    <MpText v-if="block.title" as="h4" weight="semiBold">{{ block.title }}</MpText>

    <div v-for="(g, gi) in block.groups" :key="gi" class="spt-fields__group">
      <MpText v-if="g.title" as="h4" weight="semiBold">{{ g.title }}</MpText>
      <div class="spt-fields__grid">
        <template v-for="(f, fi) in g.fields" :key="f.key">
          <MpText v-if="showsSubheading(g.fields, fi)" as="p" weight="semiBold" class="spt-fields__sub">{{ f.group }}</MpText>
          <MpCheckbox
            v-if="f.type === 'checkbox'"
            :id="`${idPrefix}-${f.key}`"
            :is-checked="values[f.key] === true"
            :is-disabled="isReadOnly"
            class="spt-fields__full"
            @change="(checked: boolean) => (values[f.key] = checked)"
          >
            {{ f.label }}
          </MpCheckbox>
          <MpFormControl v-else :id="`${idPrefix}-${f.key}-control`" :class="{ 'spt-fields__full': f.full }">
            <MpFormLabel>{{ f.label }}</MpFormLabel>
            <KpCurrencyInput
              v-if="f.compute"
              :id="`${idPrefix}-${f.key}`"
              :model-value="computedValue(f)"
              :prefix="f.type === 'usd' ? '$' : 'Rp'"
              is-disabled
            />
            <SptField
              v-else
              :id="`${idPrefix}-${f.key}`"
              v-model="values[f.key]"
              :type="f.type"
              :options="f.options"
              :placeholder="f.placeholder"
              :is-disabled="isReadOnly"
            />
          </MpFormControl>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
.spt-fields {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-5);
  max-width: 640px;
  padding-bottom: var(--mp-spacing-6);
}

.spt-fields__group {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  padding-bottom: var(--mp-spacing-5);
  border-bottom: 1px solid var(--mp-colors-border-default);
}

.spt-fields__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--mp-spacing-4);
}

.spt-fields__sub,
.spt-fields__full {
  grid-column: 1 / -1;
}

@media (max-width: 767px) {
  .spt-fields__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
