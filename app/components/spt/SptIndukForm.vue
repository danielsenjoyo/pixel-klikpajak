<script setup lang="ts">
import {
  MpBanner,
  MpBannerDescription,
  MpFormControl,
  MpFormHelpText,
  MpFormLabel,
  MpInput,
  MpRadio,
  MpSelect,
  MpTab,
  MpTabList,
  MpTabPanel,
  MpTabPanels,
  MpTabs,
  MpTag,
  MpText,
} from '@mekari/pixel3'
import type { Company } from '~/data/session'
import type { SectionData } from '~/data/spt1771Engine'
import { SEKTOR_USAHA } from '~/data/spt1771Lampiran1'
import {
  INDUK_TABS,
  LAMPIRAN_LAINNYA,
  LINK_ORIGIN,
  OPINI_AUDITOR,
  TARIF_OPTIONS,
  TARIF_PASAL,
  TARIF_SHORT,
  type HasilSpt,
  type IndukTab,
  type IndukTotals,
  type LinkedKey,
  type SptIndukData,
} from '~/data/spt1771Induk'

// SPT Induk (Figma "SPT / induk", sections A–J) across the four tabs of brief §6.
//
// Field states follow the provenance contract (brief §10) exactly:
//   RO-DJP     — identitas A, Tahun, Status SPT, rekening 19b: MpFormControl is-read-only
//                plus a help text naming DJP as the owner. Changed in Coretax, not here.
//   RO-signer  — J. NIK/NPWP, Nama, Jabatan: same treatment, owned by the Coretax signer.
//   RO-computed — every "= …" line and every roll-up from a lampiran: rendered as a value
//                with a source chip (SptAmountValue), never as an input.
//   INPUT      — metode pembukuan, sektor, tarif, angsuran 25, STP, 17b, 18a, 19a,
//                berkas, tanggal, tanda tangan and every gating answer.
const form = defineModel<SptIndukData>({ required: true })
const tab = defineModel<IndukTab>('tab', { default: 'ringkasan' })
/** B.1 — the sector is chosen here and Lampiran 1 follows it (brief §6.1 B). */
const sektor = defineModel<string>('sektor', { required: true })

const props = defineProps<{
  totals: IndukTotals
  hasil: HasilSpt
  year: number
  /** Page heading, so the Induk is titled like every lampiran page. */
  title: string
  isPembetulan: boolean
  /** Rekening on the Coretax profile, for F.19b. */
  bankAccounts: Company['bankAccounts']
  /** Section → URL, so "Isi Lampiran" and source chips can be real links. */
  hrefFor: (key: string) => string
  /** Entity is a bentuk usaha tetap — decides two of the Bagian I attachments. */
  isBut?: boolean
  /** Every lampiran's data — Bagian I asks whether 12B and 14 carry anything. */
  lampiran: Record<string, SectionData>
}>()

const tabIndex = computed({
  get: () => Math.max(0, INDUK_TABS.findIndex(t => t.key === tab.value)),
  set: (i: number) => { tab.value = INDUK_TABS[i]?.key ?? 'ringkasan' },
})

/**
 * PER-11 Bagian I decides which documents this return must carry from the answers it
 * makes, so the list marks them as the answers change rather than only at Lapor SPT.
 */
const mandatoryBerkas = computed(() => {
  const ctx = { induk: form.value, isBut: !!props.isBut, lampiran: props.lampiran }
  return new Set(LAMPIRAN_LAINNYA.filter(l => l.mandatoryWhen?.(ctx)).map(l => l.key))
})

const FROM_DJP = 'Diambil dari data DJP — ubah melalui Coretax'
const FROM_SIGNER = 'Diambil dari penandatangan Coretax'
const FROM_PROFILE = 'Mengikuti rekening yang dipilih pada profil Coretax'

const origin = (key: LinkedKey) => ({ label: LINK_ORIGIN[key].label, href: props.hrefFor(LINK_ORIGIN[key].section) })

const selectedAccount = computed(() => props.bankAccounts.find(a => a.id === form.value.bankAccountId))

/**
 * §2 hide-and-explain: a facility the return does not claim has no line on the ladder.
 * The banner names the numbers that went away so the gap is never silent.
 */
const OPTIONAL_ROWS = [
  { no: '5', on: () => form.value.d5 },
  { no: '6', on: () => form.value.d6 },
  { no: '8', on: () => form.value.d8 },
  { no: '10', on: () => form.value.d10 },
  { no: '13', on: () => form.value.e13 },
  { no: '16', on: () => form.value.e16 },
]
const hiddenRows = computed(() => OPTIONAL_ROWS.filter(r => !r.on()).map(r => r.no))

const tarifRate = computed(() => TARIF_OPTIONS.find(t => t.value === form.value.tarif)?.rate ?? 0.22)
const tarifPercent = computed(() => `${Math.round(tarifRate.value * 100)}%`)
const tarifBadge = computed(() => `${tarifPercent.value} · ${TARIF_PASAL[form.value.tarif]}`)
const tarifFormula = computed(() => `${tarifPercent.value} × (9 − 10)`)
/**
 * PER-11 makes the Rp 50 miliar ceiling an eligibility condition on choosing the Pasal
 * 31E tarif, not a term in the Lampiran 8 formula — so the option is closed, not zeroed.
 */
const tarifHint = computed(() => (props.totals.is31eEligible
  ? undefined
  : 'Tarif Pasal 31E tidak tersedia: peredaran bruto pada Lampiran 8 melebihi Rp50.000.000.000.'))
</script>

<template>
  <div class="spt-induk-page">
    <MpText as="h2" size="h2" weight="semiBold" class="spt-induk-page__title">{{ title }}</MpText>

    <MpTabs id="induk-tabs" v-model="tabIndex" is-manual>
    <MpTabList>
      <MpTab v-for="t in INDUK_TABS" :id="`induk-tab-${t.key}`" :key="t.key">{{ t.label }}</MpTab>
    </MpTabList>

    <MpTabPanels>
      <!-- ── 1. Ringkasan & Identitas ─────────────────────────────────────── -->
      <MpTabPanel>
        <div class="spt-induk">
          <KpFormSection id="induk-header" title="Periode & status">
            <MpText as="p" size="body" color="text.secondary" class="spt-induk__note">
              Periode dan status SPT mengikuti data DJP. Hanya metode pembukuan yang dapat diubah di sini.
            </MpText>
            <div class="spt-induk__grid">
              <MpFormControl id="induk-period-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>Tahun pajak/bagian tahun pajak</MpFormLabel>
                <MpInput id="induk-period" :model-value="form.periodType === 'bagian' ? 'Bagian tahun pajak' : 'Tahun pajak'" is-read-only aria-label="Tahun pajak atau bagian tahun pajak" />
              </MpFormControl>
              <MpFormControl id="induk-tahun-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>Tahun</MpFormLabel>
                <MpInput id="induk-tahun" :model-value="String(year)" is-read-only aria-label="Tahun pajak" />
              </MpFormControl>
              <MpFormControl id="induk-periode-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>Periode pembukuan</MpFormLabel>
                <MpInput id="induk-periode" :model-value="form.periodePembukuan" is-read-only aria-label="Periode pembukuan" />
              </MpFormControl>
              <MpFormControl id="induk-status-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>Status SPT</MpFormLabel>
                <MpInput id="induk-status" :model-value="isPembetulan ? 'Pembetulan' : 'Normal'" is-read-only aria-label="Status SPT" />
              </MpFormControl>
            </div>
            <KpQuestion inline label="Metode pembukuan" :hints="['Pembukuan stelsel kas memerlukan izin DJP']">
              <MpFormControl id="induk-metode-control">
                <MpSelect id="induk-metode" v-model="form.metodePembukuan" aria-label="Metode pembukuan" is-full-width>
                  <option value="pembukuan">Pembukuan</option>
                  <option value="kas">Pembukuan Stelsel Kas</option>
                </MpSelect>
              </MpFormControl>
            </KpQuestion>
          </KpFormSection>

          <!-- A. Identitas wajib pajak — every line is DJP's -->
          <KpFormSection id="induk-a" code="A" title="Identitas wajib pajak">
            <MpText as="p" size="body" color="text.secondary" class="spt-induk__note">
              Identitas mengikuti data DJP dan tidak dapat diubah di SPT. Perbaiki melalui Coretax bila ada yang keliru.
            </MpText>
            <div class="spt-induk__grid">
              <MpFormControl id="induk-npwp-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>1. NPWP</MpFormLabel>
                <MpInput id="induk-npwp" v-model="form.npwp" is-read-only aria-label="NPWP" />
              </MpFormControl>
              <MpFormControl id="induk-nama-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>2. Nama</MpFormLabel>
                <MpInput id="induk-nama" v-model="form.nama" is-read-only aria-label="Nama" />
              </MpFormControl>
              <MpFormControl id="induk-email-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>3. Alamat email</MpFormLabel>
                <MpInput id="induk-email" v-model="form.email" is-read-only aria-label="Alamat email" />
              </MpFormControl>
              <MpFormControl id="induk-telepon-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>4. Nomor telepon</MpFormLabel>
                <MpInput id="induk-telepon" v-model="form.telepon" is-read-only aria-label="Nomor telepon" />
              </MpFormControl>
            </div>
          </KpFormSection>

          <!-- B. Informasi laporan keuangan -->
          <KpFormSection id="induk-b" code="B" title="Informasi laporan keuangan">
            <MpFormControl id="induk-sektor-control" class="spt-induk__field">
              <MpFormLabel>1. Sektor usaha laporan keuangan pada lampiran 1</MpFormLabel>
              <MpSelect id="induk-sektor" v-model="sektor" aria-label="Sektor usaha laporan keuangan" is-full-width>
                <option v-for="s in SEKTOR_USAHA" :key="s.value" :value="s.value">{{ s.label }}</option>
              </MpSelect>
              <MpFormHelpText>Menentukan bentuk Lampiran 1 yang harus diisi</MpFormHelpText>
            </MpFormControl>

            <KpQuestion label="2. Apakah laporan keuangan diaudit oleh akuntan publik?">
              <KpYesNo id="induk-diaudit" v-model="form.diaudit" />
            </KpQuestion>

            <MpText as="p" size="body" color="text.secondary" class="spt-induk__note">
              Jika “Ya”, isilah informasi mengenai kantor akuntan publik di bawah ini:
            </MpText>

            <!-- The auditor block only exists once the statements are audited. -->
            <template v-if="form.diaudit">
              <MpFormControl id="induk-opini-control" class="spt-induk__field">
                <MpFormLabel>Opini auditor</MpFormLabel>
                <MpSelect id="induk-opini" v-model="form.opiniAuditor" placeholder="Pilih opini auditor" aria-label="Opini auditor" is-full-width>
                  <option v-for="o in OPINI_AUDITOR" :key="o" :value="o">{{ o }}</option>
                </MpSelect>
              </MpFormControl>
              <div class="spt-induk__grid">
                <MpFormControl id="induk-npwp-kap-control" class="spt-induk__field">
                  <MpFormLabel>a. NPWP kantor akuntan publik</MpFormLabel>
                  <MpInput id="induk-npwp-kap" v-model="form.npwpKap" inputmode="numeric" aria-label="NPWP kantor akuntan publik" />
                </MpFormControl>
                <MpFormControl id="induk-nama-kap-control" class="spt-induk__field">
                  <MpFormLabel>b. Nama kantor akuntan publik</MpFormLabel>
                  <MpInput id="induk-nama-kap" v-model="form.namaKap" aria-label="Nama kantor akuntan publik" />
                </MpFormControl>
              </div>
            </template>
          </KpFormSection>


          <!-- J. Pernyataan — the declaration itself is made at Lapor SPT, not here. -->
          <KpFormSection id="induk-j" code="J" title="Pernyataan">
            <KpQuestion label="Penandatangan SPT">
              <div class="spt-induk__radios">
                <MpRadio id="induk-ttd-wp" name="induk-ttd" value="wp" v-model="form.penandatangan">Wajib pajak (wakil wajib pajak)</MpRadio>
                <MpRadio id="induk-ttd-kuasa" name="induk-ttd" value="kuasa" v-model="form.penandatangan">Kuasa wajib pajak</MpRadio>
              </div>
            </KpQuestion>
            <MpText as="p" size="body" color="text.secondary" class="spt-induk__note">
              Data penandatangan diambil dari modul penandatangan Coretax.
            </MpText>
            <div class="spt-induk__grid">
              <MpFormControl id="induk-nik-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>NIK/NPWP</MpFormLabel>
                <MpInput id="induk-nik" v-model="form.nikNpwpPenandatangan" is-read-only aria-label="NIK atau NPWP penandatangan" />
              </MpFormControl>
              <MpFormControl id="induk-nama-ttd-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>Nama lengkap</MpFormLabel>
                <MpInput id="induk-nama-ttd" v-model="form.namaPenandatangan" is-read-only aria-label="Nama lengkap penandatangan" />
              </MpFormControl>
              <MpFormControl id="induk-jabatan-control" class="spt-induk__field" is-read-only>
                <MpFormLabel>Jabatan</MpFormLabel>
                <MpInput id="induk-jabatan" v-model="form.jabatan" is-read-only aria-label="Jabatan penandatangan" />
              </MpFormControl>
            </div>
          </KpFormSection>
        </div>
      </MpTabPanel>

      <!-- ── 2. Kondisi & Transaksi ────────────────────────────────────────── -->
      <MpTabPanel>
        <SptGatingGrid v-model="form" :totals="totals" :href-for="hrefFor" />
      </MpTabPanel>

      <!-- ── 3. Perhitungan PPh ────────────────────────────────────────────── -->
      <MpTabPanel>
        <div class="spt-induk spt-induk--ladder">
          <MpBanner v-if="hiddenRows.length" id="induk-ladder-hidden" variant="information" is-inline>
            <MpBannerDescription>
              Baris {{ hiddenRows.join(', ') }} disembunyikan karena dijawab “Tidak” pada tab Kondisi & Transaksi.
            </MpBannerDescription>
          </MpBanner>

          <KpFormSection id="induk-d" code="D" title="Perhitungan PPh">
            <SptLadderRow id="induk-d4" no="4." label="Penghasilan neto fiskal sebelum fasilitas" :value="totals.d4" :source="{ label: 'Lampiran 1 kolom (10)', href: hrefFor('lampiran-1') }" />
            <SptLadderRow v-if="form.d5" id="induk-d5" no="5." label="Fasilitas pengurangan penghasilan neto" :source="origin('d5')" :value="totals.amount.d5" />
            <SptLadderRow v-if="form.d6" id="induk-d6" no="6." label="Fasilitas pengurangan bruto — vokasi & pemagangan" :source="origin('d6')" :value="totals.amount.d6" />
            <SptLadderRow id="induk-d7" no="7." label="Neto fiskal setelah fasilitas" formula="4 − 5 − 6" :value="totals.d7" />
            <SptLadderRow v-if="form.d8" id="induk-d8" no="8." label="Kompensasi kerugian fiskal" :source="origin('d8')" :value="totals.amount.d8" />
            <SptLadderRow id="induk-d9" no="9." label="Penghasilan kena pajak (PKP)" formula="7 − 8" :value="totals.d9" />
            <SptLadderRow v-if="form.d10" id="induk-d10" no="10." label="Fasilitas pengurangan bruto — litbang" :source="origin('d10')" :value="totals.amount.d10" />
            <SptLadderRow no="11." label="Tarif pajak" :hint="tarifHint">
              <MpSelect id="induk-tarif" v-model="form.tarif" aria-label="Tarif pajak" is-full-width>
                <option v-for="t in TARIF_OPTIONS" :key="t.value" :value="t.value" :disabled="t.value === 'c' && !totals.is31eEligible">{{ TARIF_SHORT[t.value] }}</option>
              </MpSelect>
              <MpTag id="induk-tarif-rate" as="span" size="sm">{{ tarifBadge }}</MpTag>
            </SptLadderRow>
            <SptLadderRow
              id="induk-d12"
              no="12."
              label="PPh terutang"
              :formula="totals.d12FromLampiran8 ? undefined : tarifFormula"
              :source="totals.d12FromLampiran8 ? { label: 'Lampiran 8 angka 4', href: hrefFor('lampiran-8') } : undefined"
              :value="totals.d12"
            />
          </KpFormSection>

          <KpFormSection id="induk-e" code="E" title="Pengurang PPh terutang">
            <SptLadderRow v-if="form.e13" id="induk-e13" no="13." label="Kredit pajak dipotong / dibayar di luar negeri" :source="origin('e13')" :value="totals.amount.e13" />
            <SptLadderRow no="14." label="Angsuran PPh Pasal 25">
              <KpCurrencyInput id="induk-e14" v-model="form.e14Amount" aria-label="Angsuran PPh Pasal 25" />
            </SptLadderRow>
            <SptLadderRow no="15." label="STP PPh Pasal 25 (pokok)">
              <KpCurrencyInput id="induk-e15" v-model="form.e15Amount" aria-label="STP PPh Pasal 25 (pokok)" />
            </SptLadderRow>
            <SptLadderRow v-if="form.e16" id="induk-e16" no="16." label="Fasilitas pengurangan PPh terutang" :source="origin('e16')" :value="totals.amount.e16" />
          </KpFormSection>

          <KpFormSection id="induk-f" code="F" title="PPh kurang/lebih bayar">
            <SptLadderRow id="induk-f17a" no="17. a." label="PPh kurang / lebih bayar" formula="12 − 13 − 14 − 15 − 16" :value="totals.f17a" />
            <SptLadderRow no="17. b." label="Ada SK persetujuan pengangsuran / penundaan pembayaran?">
              <KpYesNo id="induk-f17b" v-model="form.f17b" />
              <KpCurrencyInput id="induk-f17b-amount" v-model="form.f17bAmount" :is-disabled="!form.f17b" aria-label="Jumlah pajak yang diangsur atau ditunda" />
            </SptLadderRow>
            <SptLadderRow id="induk-f17c" no="17. c." :label="`PPh masih harus / lebih dibayar — ${hasil.label.toUpperCase()}`" formula="17a − 17b" :value="totals.f17c" is-total />

            <SptHasilSpt :hasil="hasil" />

            <template v-if="isPembetulan">
              <SptLadderRow no="18. a." label="PPh kurang / lebih bayar pada SPT yang dibetulkan">
                <KpCurrencyInput id="induk-f18a" v-model="form.f18aAmount" aria-label="PPh kurang / lebih bayar pada SPT yang dibetulkan" />
              </SptLadderRow>
              <SptLadderRow id="induk-f18b" no="18. b." label="PPh kurang / lebih bayar karena pembetulan" formula="17a − 18a" :value="totals.f18b" />
            </template>

            <template v-if="totals.isLebihBayar">
              <KpQuestion label="19. a. Lebih bayar pada angka 17c atau 18b mohon untuk:">
                <div class="spt-induk__radios spt-induk__radios--stack">
                  <MpRadio id="induk-f19a-pemeriksaan" name="induk-f19a" value="pemeriksaan" v-model="form.f19a">1. Dikembalikan melalui pemeriksaan</MpRadio>
                  <MpRadio id="induk-f19a-pendahuluan" name="induk-f19a" value="pendahuluan" v-model="form.f19a">2. Dikembalikan melalui pengembalian pendahuluan</MpRadio>
                </div>
              </KpQuestion>
              <MpText as="p" weight="semiBold" class="spt-induk__subhead">19. b. Informasi rekening</MpText>
              <MpFormControl id="induk-bank-control" class="spt-induk__field">
                <MpFormLabel>Pilih rekening bank</MpFormLabel>
                <MpSelect id="induk-bank" v-model="form.bankAccountId" placeholder="Pilih rekening" is-full-width>
                  <option v-for="a in bankAccounts" :key="a.id" :value="a.id">{{ a.bank }} — {{ a.nomor }}</option>
                </MpSelect>
                <MpFormHelpText>Ubah daftar rekening di Portal Coretax</MpFormHelpText>
              </MpFormControl>
              <div class="spt-induk__grid">
                <MpFormControl id="induk-nomor-rekening-control" class="spt-induk__field" is-read-only>
                  <MpFormLabel>Nomor rekening</MpFormLabel>
                  <MpInput id="induk-nomor-rekening" :model-value="selectedAccount?.nomor ?? ''" is-read-only />
                  <MpFormHelpText>{{ FROM_PROFILE }}</MpFormHelpText>
                </MpFormControl>
                <MpFormControl id="induk-pemilik-rekening-control" class="spt-induk__field" is-read-only>
                  <MpFormLabel>Nama pemilik rekening</MpFormLabel>
                  <MpInput id="induk-pemilik-rekening" :model-value="selectedAccount?.pemilik ?? ''" is-read-only />
                  <MpFormHelpText>{{ FROM_PROFILE }}</MpFormHelpText>
                </MpFormControl>
              </div>
            </template>
          </KpFormSection>
        </div>
      </MpTabPanel>

      <!-- ── 4. Berkas Pendukung ───────────────────────────────────────────── -->
      <MpTabPanel>
        <div class="spt-induk">
          <KpFormSection id="induk-i" code="I" title="Lampiran lainnya">
            <template v-for="l in LAMPIRAN_LAINNYA" :key="l.key">
              <MpText v-if="l.group" as="p" weight="semiBold" class="spt-induk__subhead">{{ l.group }}</MpText>
              <KpQuestion inline :code="`${l.code}.`" :label="`${l.label}${mandatoryBerkas.has(l.key) ? '*' : ''}`">
                <KpFileField
                  :id="`induk-lampiran-${l.key}`"
                  v-model="form.lampiranLainnya[l.key]"
                  hint=""
                  :is-invalid="mandatoryBerkas.has(l.key) && !form.lampiranLainnya[l.key]"
                />
              </KpQuestion>
            </template>
          </KpFormSection>
        </div>
      </MpTabPanel>
    </MpTabPanels>
    </MpTabs>
  </div>
</template>

<style scoped>
.spt-induk-page {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spt-induk-page__title {
  margin: 0 0 var(--mp-spacing-4);
}

.spt-induk {
  display: flex;
  flex-direction: column;
  gap: var(--mp-spacing-4);
}

.spt-induk__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: var(--mp-spacing-6);
}

.spt-induk__field {
  padding-bottom: var(--mp-spacing-5);
}
.spt-induk__nested {
  padding-left: var(--mp-spacing-4);
}

.spt-induk__radios {
  display: flex;
  flex-wrap: wrap;
  gap: var(--mp-spacing-4) var(--mp-spacing-5);
  padding: var(--mp-spacing-1) 0;
}
.spt-induk__radios--stack {
  flex-direction: column;
  gap: var(--mp-spacing-4);
}

.spt-induk__note {
  margin: 0 0 var(--mp-spacing-3);
}

.spt-induk__subhead {
  margin: 0 0 var(--mp-spacing-3);
}

@media (max-width: 767px) {
  .spt-induk__grid {
    grid-template-columns: 1fr;
  }
}
</style>
