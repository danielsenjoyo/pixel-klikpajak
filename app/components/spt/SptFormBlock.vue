<script setup lang="ts">
import { MpTable, MpTableBody, MpTableCell, MpTableContainer, MpTableHead, MpTableRow, MpText } from '@mekari/pixel3'
import type { BlockValues, Ctx, FormBlock, FormItem } from '~/data/spt1771Engine'

// Calculation sheet (Figma "No. | Rincian | Nilai"): numbered rows with a Nilai control;
// computed rows are grey read-only amounts, heading rows have no control.
const props = defineProps<{ block: FormBlock, ctx: Ctx, idPrefix: string, isReadOnly?: boolean }>()
const values = defineModel<BlockValues>({ required: true })

const headers = computed(() => props.block.headers ?? ['No.', 'Rincian', 'Nilai'])
const isComputed = (item: FormItem) => item.type === 'computed' || !!item.compute
</script>

<template>
  <section class="spt-form-block">
    <MpText v-if="block.title" as="h4" weight="semiBold" class="spt-form-block__title">{{ block.title }}</MpText>
    <MpTableContainer>
      <MpTable :is-hoverable="false">
        <MpTableHead>
          <MpTableRow>
            <MpTableCell scope="col" class="spt-form-block__no">{{ headers[0] }}</MpTableCell>
            <MpTableCell scope="col">{{ headers[1] }}</MpTableCell>
            <MpTableCell scope="col" class="spt-form-block__value">{{ headers[2] }}</MpTableCell>
          </MpTableRow>
        </MpTableHead>
        <MpTableBody>
          <MpTableRow
            v-for="(item, i) in block.items"
            :key="item.key ?? `h-${i}`"
            :class="{ 'spt-form-block__row--computed': isComputed(item) && !item.indent }"
          >
            <MpTableCell as="td" class="spt-form-block__no" :class="{ 'spt-form-block__strong': item.heading }">
              {{ item.indent ? '' : item.no }}
            </MpTableCell>
            <MpTableCell as="td">
              <div class="spt-form-block__label" :class="[`spt-form-block__label--indent-${item.indent ?? 0}`]">
                <span v-if="item.indent && item.no" class="spt-form-block__letter">{{ item.no }}</span>
                <div>
                  <label
                    v-if="item.key && !item.heading"
                    :for="`${idPrefix}-${item.key}`"
                    :class="{ 'spt-form-block__strong': isComputed(item) && !item.indent }"
                  >{{ item.label }}</label>
                  <span v-else class="spt-form-block__strong">{{ item.label }}</span>
                  <p v-if="item.hint" class="spt-form-block__hint">{{ item.hint }}</p>
                </div>
              </div>
            </MpTableCell>
            <MpTableCell as="td" class="spt-form-block__value">
              <template v-if="item.key && !item.heading">
                <KpCurrencyInput
                  v-if="isComputed(item)"
                  :id="`${idPrefix}-${item.key}`"
                  :model-value="item.compute ? item.compute(values, ctx) : 0"
                  size="sm"
                  is-disabled
                />
                <SptField
                  v-else
                  :id="`${idPrefix}-${item.key}`"
                  v-model="values[item.key]"
                  :type="(item.type as never) ?? 'currency'"
                  :options="item.options"
                  size="sm"
                  :is-disabled="isReadOnly"
                />
              </template>
            </MpTableCell>
          </MpTableRow>
        </MpTableBody>
      </MpTable>
    </MpTableContainer>
  </section>
</template>

<style scoped>
.spt-form-block {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-3);
  max-width: 960px;
  padding-bottom: var(--mp-spacing-6);
}

.spt-form-block__title {
  margin: 0;
}

.spt-form-block__no {
  width: 64px;
  min-width: 64px;
  vertical-align: top;
}

.spt-form-block__value {
  width: 280px;
  min-width: 240px;
  vertical-align: top;
}

.spt-form-block__label {
  display: flex;
  gap: var(--mp-spacing-2);
}
.spt-form-block__label--indent-1 {
  padding-left: var(--mp-spacing-2);
}
.spt-form-block__label--indent-2 {
  padding-left: var(--mp-spacing-8);
}

.spt-form-block__letter {
  flex-shrink: 0;
  min-width: 20px;
}

.spt-form-block__strong {
  font-weight: var(--mp-font-weights-semi-bold);
}

.spt-form-block__hint {
  margin: var(--mp-spacing-1) 0 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-sm);
}

.spt-form-block__row--computed {
  background: var(--mp-colors-background-neutral-subtle);
}
</style>
