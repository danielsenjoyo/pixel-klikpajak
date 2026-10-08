<script setup lang="ts">
import { MpButton, MpText } from '@mekari/pixel3'
import {
  GATING_GROUPS,
  gatingAnswer,
  itemNo,
  setGatingAnswer,
  type GatingGroup,
  type GatingQuestion,
  type IndukTotals,
  type SptIndukData,
} from '~/data/spt1771Induk'

// Kondisi & Transaksi (brief §6.2): one aligned grid of pertanyaan · jawaban · aksi,
// grouped and numbered per the DJP Induk document. The wording is shortened for
// reading; DJP's full sentence sits on the code chip, so nothing is lost.
const form = defineModel<SptIndukData>({ required: true })
defineProps<{ totals: IndukTotals, hrefFor: (key: string) => string }>()

const answerOf = (q: GatingQuestion) => gatingAnswer(form.value, q.field)
const setAnswer = (q: GatingQuestion, value: boolean) => setGatingAnswer(form.value, q.field, value)

/** Questions whose precondition holds — C.1b only applies once C.1a is "Ya". */
const asked = (g: GatingGroup) => g.questions.filter(q => !q.when || q.when(form.value))

/**
 * A question that stops being asked must not keep driving the return from behind the
 * scenes: answering C.1a "Tidak" silently leaves C.1b "Ya" forcing a Nihil SPT.
 */
watchEffect(() => {
  for (const g of GATING_GROUPS) {
    for (const q of g.questions) {
      if (q.when && !q.when(form.value) && answerOf(q)) setAnswer(q, false)
    }
  }
})

/** G.20 opens its lampiran on "Tidak"; every other question opens on "Ya". */
const isActive = (q: GatingQuestion) => answerOf(q) === (q.activeOn !== 'tidak')

/**
 * The tooltip carries DJP's own sentence plus the exact lampiran part. Most buttons name
 * the lampiran number alone to stay short; the ones that also show an amount name the part
 * too, so the figure's provenance needs no second link of its own.
 */
function tooltipFor(q: GatingQuestion) {
  if (!q.lampiran) return q.official
  const answer = q.activeOn === 'tidak' ? '“Tidak”' : '“Ya”'
  return `${q.official} · Jika ${answer}, isilah ${q.lampiran.detail ?? q.lampiran.label}.`
}
</script>

<template>
  <div class="spt-gating">
    <MpText as="p" size="body" color="text.secondary" class="spt-gating__intro">
      Jawab yang berlaku — tombol <strong>Isi Lampiran</strong> membuka lampiran terkait di tab baru.
      Dikelompokkan &amp; dinomori mengikuti dokumen Induk DJP; arahkan kursor ke kode untuk melihat pertanyaan lengkapnya.
    </MpText>

    <section v-for="g in GATING_GROUPS" :key="g.code" class="spt-gating__group">
      <SptSectionHeading :code="g.code" :title="g.title" />

      <div v-for="q in asked(g)" :key="q.id" class="spt-gating__row" role="group" :aria-labelledby="`${q.id}-label`">
        <div class="spt-gating__question">
          <p :id="`${q.id}-label`" class="spt-gating__label">
            <span v-tooltip="{ label: tooltipFor(q), placement: 'top' }" class="spt-gating__no" tabindex="0">{{ itemNo(q.code) }}</span>
            {{ q.label }}
          </p>
          <p v-if="q.hint" class="spt-gating__hint">{{ q.hint }}</p>
          <!--
            The amount belongs to the lampiran, so the Induk only shows it. No source link:
            the row's own "Isi …" button already goes there, and it names the exact bagian
            for these rows so one link carries both the destination and the provenance.
          -->
          <SptAmountValue
            v-if="q.amountKey && answerOf(q)"
            :id="`${q.id}-amount`"
            :value="totals.amount[q.amountKey]"
            class="spt-gating__amount"
          />
        </div>

        <KpYesNo :id="q.id" class="spt-gating__control" :model-value="answerOf(q)" @update:model-value="setAnswer(q, $event)" />

        <div class="spt-gating__action">
          <MpButton
            v-if="q.lampiran"
            :id="`${q.id}-open`"
            as="a"
            variant="textLink"
            size="sm"
            right-icon="newtab"
            :href="isActive(q) ? hrefFor(q.lampiran.section) : undefined"
            target="_blank"
            rel="noopener"
            :is-disabled="!isActive(q)"
            :aria-disabled="!isActive(q)"
          >
            Isi {{ q.amountKey ? q.lampiran.detail ?? q.lampiran.label : q.lampiran.label }}
          </MpButton>
        </div>
      </div>

      <!-- H closes with a computed line rather than a question. -->
      <div v-if="g.code === 'H'" class="spt-gating__row spt-gating__row--value">
        <div class="spt-gating__question">
          <p class="spt-gating__label">
            <span class="spt-gating__no">21. j.</span>
            Kelebihan PPh Final atas peredaran bruto tertentu yang dapat dimintakan pengembalian
          </p>
          <p class="spt-gating__hint">Jika terdapat kelebihan PPh, ajukan permohonan pengembalian secara terpisah</p>
        </div>
        <SptAmountValue id="induk-h21j" class="spt-gating__value" :value="0" :source="{ label: 'Lampiran 5', href: hrefFor('lampiran-5') }" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.spt-gating {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-6);
  max-width: 960px;
}

.spt-gating__intro {
  max-width: 640px;
  margin: 0;
}

.spt-gating__group {
  display: flex;
  flex-direction: column;
}

/* pertanyaan · jawaban · aksi, so every toggle and action lines up down the column. */
.spt-gating__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(108px, 140px) minmax(120px, 170px);
  align-items: start;
  gap: var(--mp-spacing-4);
  padding: var(--mp-spacing-4) var(--mp-spacing-3);
  border-bottom: 1px solid var(--mp-colors-border-default);
}
.spt-gating__row--value .spt-gating__value {
  grid-column: 2 / -1;
}

.spt-gating__question {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-2);
  min-width: 0;
}

/* DJP prints the item number in the sentence, with the wrap hanging under the text. */
.spt-gating__no {
  font-weight: var(--mp-font-weights-semi-bold);
  cursor: help;
}
.spt-gating__no:focus-visible {
  outline: none;
  box-shadow: var(--mp-shadows-focus);
}

.spt-gating__label {
  margin: 0;
  padding-left: var(--mp-spacing-6);
  text-indent: calc(-1 * var(--mp-spacing-6));
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
  line-height: var(--mp-line-heights-lg);
}

.spt-gating__hint {
  margin: 0;
  color: var(--mp-colors-text-secondary);
  font-size: var(--mp-font-sizes-sm);
  line-height: var(--mp-line-heights-sm);
}

.spt-gating__amount {
  max-width: 280px;
}

.spt-gating__control {
  padding-top: var(--mp-spacing-4xs);
}

.spt-gating__action {
  display: flex;
  justify-content: flex-start;
}

@media (max-width: 900px) {
  .spt-gating__row {
    grid-template-columns: 1fr;
    gap: var(--mp-spacing-3);
  }
  .spt-gating__row--value .spt-gating__value {
    grid-column: auto;
  }
}
</style>
