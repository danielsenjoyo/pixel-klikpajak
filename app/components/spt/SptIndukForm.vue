<script setup lang="ts">
import {
  MpDatePicker,
  MpFormControl,
  MpFormLabel,
  MpInput,
  MpRadio,
  MpSelect,
  MpText,
} from '@mekari/pixel3'
import {
  BANKS,
  LAMPIRAN_LAINNYA,
  OPINI_AUDITOR,
  PERIODE_PEMBUKUAN,
  PERNYATAAN_TRANSAKSI,
  TARIF_OPTIONS,
  type IndukTotals,
  type SptIndukData,
} from '~/data/spt1771Induk'

// SPT Induk (Figma "SPT / induk", sections A–J). Amounts behind a "Ya" question are
// disabled until Ya; computed lines (4, 7, 9, 12, 17a, 17c, 18b, 21j) are read-only.
const form = defineModel<SptIndukData>({ required: true })

defineProps<{
  totals: IndukTotals
  year: number
  isPembetulan: boolean
  sektorLabel: string
}>()
</script>

<template>
  <div class="spt-induk">
    <!-- Header block -->
    <KpFormSection id="induk-header" title="SPT Induk" level="h2">
      <KpQuestion label="Tahun pajak/bagian tahun pajak">
        <div class="spt-induk__radios">
          <MpRadio id="induk-period-tahun" name="induk-period" value="tahun" v-model="form.periodType">Tahun pajak</MpRadio>
          <MpRadio id="induk-period-bagian" name="induk-period" value="bagian" v-model="form.periodType">Bagian tahun pajak</MpRadio>
        </div>
      </KpQuestion>
      <div class="spt-induk__grid">
        <MpFormControl id="induk-tahun-control" class="spt-induk__field">
          <MpFormLabel>Tahun</MpFormLabel>
          <MpInput id="induk-tahun" :model-value="String(year)" is-disabled />
        </MpFormControl>
        <MpFormControl id="induk-periode-control" class="spt-induk__field">
          <MpFormLabel>Periode pembukuan</MpFormLabel>
          <MpSelect id="induk-periode" v-model="form.periodePembukuan" is-full-width>
            <option v-for="p in PERIODE_PEMBUKUAN" :key="p" :value="p">{{ p }}</option>
          </MpSelect>
        </MpFormControl>
      </div>
      <div class="spt-induk__grid">
        <KpQuestion label="Status">
          <div class="spt-induk__radios">
            <MpRadio id="induk-status-normal" name="induk-status" value="normal" :model-value="isPembetulan ? 'pembetulan' : 'normal'" is-disabled>Normal</MpRadio>
            <MpRadio id="induk-status-pembetulan" name="induk-status" value="pembetulan" :model-value="isPembetulan ? 'pembetulan' : 'normal'" is-disabled>Pembetulan</MpRadio>
          </div>
        </KpQuestion>
        <KpQuestion label="Metode pembukuan">
          <div class="spt-induk__radios">
            <MpRadio id="induk-metode-pembukuan" name="induk-metode" value="pembukuan" v-model="form.metodePembukuan">Pembukuan</MpRadio>
            <MpRadio id="induk-metode-kas" name="induk-metode" value="kas" v-model="form.metodePembukuan">Pembukuan Stelsel kas</MpRadio>
          </div>
        </KpQuestion>
      </div>
    </KpFormSection>

    <!-- A. Identitas wajib pajak -->
    <KpFormSection id="induk-a" title="A. Identitas wajib pajak">
      <div class="spt-induk__grid">
        <MpFormControl id="induk-npwp-control" class="spt-induk__field">
          <MpFormLabel>1. NPWP</MpFormLabel>
          <MpInput id="induk-npwp" v-model="form.npwp" inputmode="numeric" />
        </MpFormControl>
        <MpFormControl id="induk-nama-control" class="spt-induk__field">
          <MpFormLabel>2. Nama</MpFormLabel>
          <MpInput id="induk-nama" v-model="form.nama" />
        </MpFormControl>
        <MpFormControl id="induk-email-control" class="spt-induk__field">
          <MpFormLabel>3. Alamat email</MpFormLabel>
          <MpInput id="induk-email" v-model="form.email" type="email" />
        </MpFormControl>
        <MpFormControl id="induk-telepon-control" class="spt-induk__field">
          <MpFormLabel>4. Nomor telepon</MpFormLabel>
          <MpInput id="induk-telepon" v-model="form.telepon" type="tel" />
        </MpFormControl>
      </div>
    </KpFormSection>

    <!-- B. Informasi laporan keuangan -->
    <KpFormSection id="induk-b" title="B. Informasi laporan keuangan">
      <MpFormControl id="induk-sektor-control" class="spt-induk__field">
        <MpFormLabel>1. Sektor usaha laporan keuangan pada lampiran 1</MpFormLabel>
        <MpInput id="induk-sektor" :model-value="sektorLabel" is-disabled />
      </MpFormControl>
      <KpQuestion label="2. Apakah laporan keuangan diaudit oleh akuntan publik?">
        <KpYesNo id="induk-diaudit" v-model="form.diaudit" />
      </KpQuestion>
      <MpText as="p" size="body" color="text.secondary" class="spt-induk__note">Jika “Ya”, isilah informasi mengenai kantor akuntan publik di bawah ini:</MpText>
      <MpFormControl id="induk-opini-control" class="spt-induk__field" :is-disabled="!form.diaudit">
        <MpFormLabel>Opini auditor</MpFormLabel>
        <MpSelect id="induk-opini" v-model="form.opiniAuditor" placeholder="Pilih opini auditor" :is-disabled="!form.diaudit" is-full-width>
          <option v-for="o in OPINI_AUDITOR" :key="o" :value="o">{{ o }}</option>
        </MpSelect>
      </MpFormControl>
      <div class="spt-induk__grid">
        <MpFormControl id="induk-npwp-kap-control" class="spt-induk__field">
          <MpFormLabel>a. NPWP kantor akuntan publik</MpFormLabel>
          <MpInput id="induk-npwp-kap" v-model="form.npwpKap" :is-disabled="!form.diaudit" inputmode="numeric" />
        </MpFormControl>
        <MpFormControl id="induk-nama-kap-control" class="spt-induk__field">
          <MpFormLabel>b. Nama kantor akuntan publik</MpFormLabel>
          <MpInput id="induk-nama-kap" v-model="form.namaKap" :is-disabled="!form.diaudit" />
        </MpFormControl>
      </div>
    </KpFormSection>

    <!-- C. PPh Final & penghasilan bukan objek pajak -->
    <KpFormSection id="induk-c" title="C. Penghasilan yang dikenakan PPh Final dan penghasilan yang tidak termasuk objek pajak">
      <KpQuestion label="1. a. Apakah wajib pajak menerima atau memperoleh penghasilan dari usaha dengan peredaran bruto tertentu yang dikenakan PPh Final?" :hints="['Jika “Ya”, isilah Lampiran 5']">
        <KpYesNo id="induk-c1a" v-model="form.c1a" />
      </KpQuestion>
      <KpQuestion label="1. b. Apakah wajib pajak semata-mata hanya penghasilan dari usaha dengan peredaran bruto tertentu yang dikenakan PPh Final?">
        <KpYesNo id="induk-c1b" v-model="form.c1b" />
      </KpQuestion>
      <KpQuestion label="2. Apakah wajib pajak menerima atau memperoleh penghasilan yang dikenakan PPh Final?" :hints="['Jika “Ya”, isilah Lampiran 4 bagian A']">
        <KpYesNo id="induk-c2" v-model="form.c2" />
        <KpCurrencyInput id="induk-c2-amount" v-model="form.c2Amount" :is-disabled="!form.c2" />
      </KpQuestion>
      <KpQuestion label="3. Apakah wajib pajak menerima atau memperoleh penghasilan yang tidak termasuk objek pajak?" :hints="['Jika “Ya”, isilah Lampiran 4 bagian B']">
        <KpYesNo id="induk-c3" v-model="form.c3" />
        <KpCurrencyInput id="induk-c3-amount" v-model="form.c3Amount" :is-disabled="!form.c3" />
      </KpQuestion>
    </KpFormSection>

    <!-- D. Perhitungan PPh -->
    <KpFormSection id="induk-d" title="D. Perhitungan PPh">
      <KpQuestion label="4. Penghasilan neto fiskal sebelum fasilitas pajak" :hints="['Diisi dari Lampiran 1 (sesuai sektor usaha) bagian A kolom (10)']">
        <KpCurrencyInput id="induk-d4" :model-value="totals.d4" is-disabled />
      </KpQuestion>
      <KpQuestion label="5. Apakah wajib pajak memperoleh fasilitas perpajakan dalam rangka penanaman modal berupa pengurangan penghasilan neto?" :hints="['Jika “Ya”, isilah Lampiran 13A']">
        <KpYesNo id="induk-d5" v-model="form.d5" />
        <KpCurrencyInput id="induk-d5-amount" v-model="form.d5Amount" :is-disabled="!form.d5" />
      </KpQuestion>
      <KpQuestion label="6. Apakah wajib pajak memperoleh fasilitas pengurangan penghasilan bruto untuk kegiatan praktik kerja, pemagangan, dan/atau pembelajaran dalam rangka pembinaan dan pengembangan sumber daya manusia berbasis kompetensi tertentu?" :hints="['Jika “Ya”, isilah Lampiran 13B']">
        <KpYesNo id="induk-d6" v-model="form.d6" />
        <KpCurrencyInput id="induk-d6-amount" v-model="form.d6Amount" :is-disabled="!form.d6" />
      </KpQuestion>
      <KpQuestion label="7. Penghasilan neto fiskal setelah fasilitas pajak (4 - 5 - 6)">
        <KpCurrencyInput id="induk-d7" :model-value="totals.d7" is-disabled />
      </KpQuestion>
      <KpQuestion label="8. Apakah terdapat kerugian fiskal yang dapat dikompensasikan?" :hints="['Jika “Ya”, isilah Lampiran 7']">
        <KpYesNo id="induk-d8" v-model="form.d8" />
        <KpCurrencyInput id="induk-d8-amount" v-model="form.d8Amount" :is-disabled="!form.d8" />
      </KpQuestion>
      <KpQuestion label="9. Penghasilan kena pajak (7 - 8)">
        <KpCurrencyInput id="induk-d9" :model-value="totals.d9" is-disabled />
      </KpQuestion>
      <KpQuestion label="10. Apakah wajib pajak memperoleh fasilitas pengurangan penghasilan bruto untuk kegiatan penelitian dan pengembangan?" :hints="['Jika “Ya”, isilah Lampiran 13B']">
        <KpYesNo id="induk-d10" v-model="form.d10" />
        <KpCurrencyInput id="induk-d10-amount" v-model="form.d10Amount" :is-disabled="!form.d10" />
      </KpQuestion>
      <KpQuestion label="11. Tarif pajak:" :hints="['Jika memilih c, isilah Lampiran 8']">
        <div class="spt-induk__radios spt-induk__radios--stack">
          <MpRadio v-for="t in TARIF_OPTIONS" :id="`induk-tarif-${t.value}`" :key="t.value" name="induk-tarif" :value="t.value" v-model="form.tarif">{{ t.label }}</MpRadio>
        </div>
      </KpQuestion>
      <KpQuestion label="12. PPh terutang (11 x (9 - 10))" :hints="totals.d12FromLampiran8 ? ['Diisi dari Lampiran 8 angka 4'] : []">
        <KpCurrencyInput id="induk-d12" :model-value="totals.d12" is-disabled />
      </KpQuestion>
    </KpFormSection>

    <!-- E. Pengurang PPh terutang -->
    <KpFormSection id="induk-e" title="E. Pengurang PPh terutang">
      <KpQuestion label="13. Apakah terdapat kredit pajak yang dibayarkan di luar negeri dan/atau dipotong/pungut oleh pihak lain?" :hints="['Jika “Ya”, isilah Lampiran 3']">
        <KpYesNo id="induk-e13" v-model="form.e13" />
        <KpCurrencyInput id="induk-e13-amount" v-model="form.e13Amount" :is-disabled="!form.e13" />
      </KpQuestion>
      <KpQuestion label="14. Angsuran PPh Pasal 25">
        <KpCurrencyInput id="induk-e14" v-model="form.e14Amount" />
      </KpQuestion>
      <KpQuestion label="15. Pokok pajak atas STP PPh Pasal 25">
        <KpCurrencyInput id="induk-e15" v-model="form.e15Amount" />
      </KpQuestion>
      <KpQuestion label="16. Apakah wajib pajak memperoleh fasilitas pengurangan PPh terutang?" :hints="['Jika “Ya”, isilah Lampiran 13C']">
        <KpYesNo id="induk-e16" v-model="form.e16" />
        <KpCurrencyInput id="induk-e16-amount" v-model="form.e16Amount" :is-disabled="!form.e16" />
      </KpQuestion>
    </KpFormSection>

    <!-- F. PPh kurang/lebih bayar -->
    <KpFormSection id="induk-f" title="F. PPh kurang/lebih bayar">
      <KpQuestion label="17. a. PPh yang kurang/lebih bayar (12 - 13 - 14 - 15 - 16)">
        <KpCurrencyInput id="induk-f17a" :model-value="totals.f17a" is-disabled />
      </KpQuestion>
      <KpQuestion label="17. b. Apakah terdapat surat keputusan persetujuan angsuran atau penundaan pembayaran pajak?" :hints="['Jika “Ya”, isilah jumlah pajak yang dapat diangsur/ditunda pembayarannya']">
        <KpYesNo id="induk-f17b" v-model="form.f17b" />
        <KpCurrencyInput id="induk-f17b-amount" v-model="form.f17bAmount" :is-disabled="!form.f17b" />
      </KpQuestion>
      <KpQuestion label="17. c. PPh yang masih harus dibayar/lebih dibayar (17a - 17b)">
        <KpCurrencyInput id="induk-f17c" :model-value="totals.f17c" is-disabled />
      </KpQuestion>
      <MpText as="p" weight="semiBold" class="spt-induk__subhead">18. Pembetulan (diisi apabila status SPT adalah pembetulan)</MpText>
      <KpQuestion label="18. a. PPh yang kurang/lebih bayar pada SPT yang dibetulkan">
        <KpCurrencyInput id="induk-f18a" v-model="form.f18aAmount" :is-disabled="!isPembetulan" />
      </KpQuestion>
      <KpQuestion label="18. b. PPh yang kurang atau lebih bayar karena pembetulan (17a - 18a)">
        <KpCurrencyInput id="induk-f18b" :model-value="totals.f18b" is-disabled />
      </KpQuestion>
      <KpQuestion label="19. a. Lebih bayar pada angka 17 atau 18b mohon untuk:" :hints="totals.isLebihBayar ? [] : ['Diisi apabila terdapat lebih bayar pada angka 17c atau 18b']">
        <div class="spt-induk__radios spt-induk__radios--stack">
          <MpRadio id="induk-f19a-pemeriksaan" name="induk-f19a" value="pemeriksaan" v-model="form.f19a" :is-disabled="!totals.isLebihBayar">1. Dikembalikan melalui pemeriksaan</MpRadio>
          <MpRadio id="induk-f19a-pendahuluan" name="induk-f19a" value="pendahuluan" v-model="form.f19a" :is-disabled="!totals.isLebihBayar">2. Dikembalikan melalui pengembalian pendahuluan</MpRadio>
        </div>
      </KpQuestion>
      <MpText as="p" weight="semiBold" class="spt-induk__subhead">19. b. Informasi rekening</MpText>
      <MpFormControl id="induk-bank-control" class="spt-induk__field">
        <MpFormLabel>Nama bank</MpFormLabel>
        <MpSelect id="induk-bank" v-model="form.bank" placeholder="Pilih bank" :is-disabled="!totals.isLebihBayar" is-full-width>
          <option v-for="b in BANKS" :key="b" :value="b">{{ b }}</option>
        </MpSelect>
      </MpFormControl>
      <div class="spt-induk__grid">
        <MpFormControl id="induk-pemilik-rekening-control" class="spt-induk__field">
          <MpFormLabel>Nama pemilik rekening</MpFormLabel>
          <MpInput id="induk-pemilik-rekening" v-model="form.namaPemilikRekening" :is-disabled="!totals.isLebihBayar" />
        </MpFormControl>
        <MpFormControl id="induk-nomor-rekening-control" class="spt-induk__field">
          <MpFormLabel>Nomor rekening</MpFormLabel>
          <MpInput id="induk-nomor-rekening" v-model="form.nomorRekening" :is-disabled="!totals.isLebihBayar" inputmode="numeric" />
        </MpFormControl>
      </div>
    </KpFormSection>

    <!-- G. Perhitungan angsuran tahun berjalan -->
    <KpFormSection id="induk-g" title="G. Perhitungan angsuran tahun berjalan">
      <KpQuestion
        label="20. Apakah wajib pajak berkewajiban menyampaikan laporan penghitungan PPh Pasal 25?"
        :hints="['Jika “Tidak”, isilah Lampiran 6', 'Jika “Ya”, pastikan Anda menyampaikan laporan penghitungan PPh Pasal 25 sesuai ketentuan perundang-undangan yang berlaku']"
      >
        <KpYesNo id="induk-g20" v-model="form.g20" />
      </KpQuestion>
    </KpFormSection>

    <!-- H. Pernyataan transaksi -->
    <KpFormSection id="induk-h" title="H. Pernyataan transaksi">
      <KpQuestion v-for="q in PERNYATAAN_TRANSAKSI" :key="q.key" :label="q.label" :hints="[q.hint]">
        <KpYesNo :id="`induk-h21${q.key}`" v-model="form.h21[q.key]!" />
      </KpQuestion>
      <KpQuestion label="21. j. Kelebihan PPh Final atas penghasilan dari usaha dengan peredaran bruto tertentu yang dapat dimintakan pengembalian" :hints="['Diisi dari Lampiran 5 (jika terdapat kelebihan PPh, silakan permohonan pengembalian pajak secara terpisah)']">
        <KpCurrencyInput id="induk-h21j" :model-value="0" is-disabled />
      </KpQuestion>
    </KpFormSection>

    <!-- I. Lampiran lainnya -->
    <KpFormSection id="induk-i" title="I. Lampiran lainnya">
      <template v-for="l in LAMPIRAN_LAINNYA" :key="l.key">
        <MpText v-if="l.group" as="p" weight="semiBold" class="spt-induk__subhead">{{ l.group }}</MpText>
        <MpFormControl :id="`induk-lampiran-${l.key}-control`" class="spt-induk__field" :class="{ 'spt-induk__field--nested': /^[fh]\d/.test(l.key) }">
          <MpFormLabel>{{ l.label }}</MpFormLabel>
          <KpFileField :id="`induk-lampiran-${l.key}`" v-model="form.lampiranLainnya[l.key]" />
        </MpFormControl>
      </template>
    </KpFormSection>

    <!-- J. Pernyataan -->
    <KpFormSection id="induk-j" title="J. Pernyataan">
      <p class="spt-induk__statement">
        Dengan menyadari sepenuhnya akan segala akibatnya termasuk sanksi-sanksi sesuai dengan ketentuan perundang-undangan yang berlaku,
        saya menyatakan bahwa apa yang telah saya beritahukan di atas beserta lampiran-lampirannya adalah benar, lengkap dan jelas.
      </p>
      <KpQuestion label="Penandatangan SPT">
        <div class="spt-induk__radios">
          <MpRadio id="induk-ttd-wp" name="induk-ttd" value="wp" v-model="form.penandatangan">Wajib pajak (wakil wajib pajak)</MpRadio>
          <MpRadio id="induk-ttd-kuasa" name="induk-ttd" value="kuasa" v-model="form.penandatangan">Kuasa wajib pajak</MpRadio>
        </div>
      </KpQuestion>
      <div class="spt-induk__grid">
        <MpFormControl id="induk-nik-control" class="spt-induk__field">
          <MpFormLabel>NIK/NPWP</MpFormLabel>
          <MpInput id="induk-nik" v-model="form.nikNpwpPenandatangan" inputmode="numeric" />
        </MpFormControl>
        <MpFormControl id="induk-nama-ttd-control" class="spt-induk__field">
          <MpFormLabel>Nama lengkap</MpFormLabel>
          <MpInput id="induk-nama-ttd" v-model="form.namaPenandatangan" />
        </MpFormControl>
        <MpFormControl id="induk-jabatan-control" class="spt-induk__field">
          <MpFormLabel>Jabatan</MpFormLabel>
          <MpInput id="induk-jabatan" v-model="form.jabatan" />
        </MpFormControl>
      </div>
      <div class="spt-induk__grid">
        <MpFormControl id="induk-tanggal-control" class="spt-induk__field">
          <MpFormLabel>Tanggal</MpFormLabel>
          <MpDatePicker id="induk-tanggal" v-model="form.tanggal" value-type="string" format="DD/MM/YYYY" placeholder="Pilih tanggal" use-portal />
        </MpFormControl>
      </div>
      <div class="spt-induk__grid">
        <MpFormControl id="induk-ttd-file-control" class="spt-induk__field">
          <MpFormLabel>Tanda tangan</MpFormLabel>
          <KpFileField id="induk-ttd-file" v-model="form.tandaTangan" accept="image/png,image/jpeg" hint="" />
        </MpFormControl>
      </div>
    </KpFormSection>
  </div>
</template>

<style scoped>
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
.spt-induk__field--nested {
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

.spt-induk__statement {
  margin: 0 0 var(--mp-spacing-5);
  padding: var(--mp-spacing-2);
  border-radius: var(--mp-radii-sm);
  background: var(--mp-colors-background-neutral-subtle);
  color: var(--mp-colors-text-default);
  font-size: var(--mp-font-sizes-md);
  line-height: var(--mp-line-heights-lg);
}

@media (max-width: 767px) {
  .spt-induk__grid {
    grid-template-columns: 1fr;
  }
}
</style>
