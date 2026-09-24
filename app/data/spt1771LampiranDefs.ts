/**
 * Lampiran 2–14 of SPT Tahunan Badan, transcribed from Figma "SPT-Tahunan-Badan › --> SPT".
 * Rendered by components/spt/SptLampiranPage.vue through the engine in spt1771Engine.ts.
 */
import {
  blockValues,
  num,
  sumColumn,
  tableRows,
  type BlockValues,
  type Ctx,
  type FieldDef,
  type FormItem,
  type LampiranDef,
  type Row,
  type SectionData,
} from '~/data/spt1771Engine'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const METODE_PENYUSUTAN = ['Garis lurus', 'Saldo menurun'] as const
const KATEGORI_KREDIT = ['Kurang lancar', 'Diragukan', 'Macet'] as const

const sumOf = (key: string) => (rows: Row[]) => rows.reduce((a, r) => a + num(r[key]), 0)
const text = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'text', ...extra })
const rp = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'currency', ...extra })
const item = (no: string | undefined, label: string, key?: string, extra: Partial<FormItem> = {}): FormItem => ({ no, label, key, type: key ? 'currency' : undefined, ...extra })

// ── Cross-lampiran values ────────────────────────────────────────────────────
/** Lampiran 7 jumlah kolom 9 (kompensasi tahun pajak berjalan); null while Lampiran 7 is empty. */
function kompensasiBerjalanLampiran7(lampiran: Record<string, SectionData>): number | null {
  const rows = tableRows(lampiran['lampiran-7'] ?? {}, 'kompensasi')
  return rows.length ? sumColumn(rows, 'kBerjalan') : null
}
/** Lampiran 6 angka 2 — from Lampiran 7 when it has rows, else as entered. */
const kompensasi6 = (v: BlockValues, ctx: Ctx) => kompensasiBerjalanLampiran7(ctx.lampiran) ?? num(v.kompensasi)
const pkp6 = (v: BlockValues, ctx: Ctx) => Math.max(0, num(v.dasar) - kompensasi6(v, ctx))
const bayar6 = (v: BlockValues, ctx: Ctx) => Math.round(0.22 * pkp6(v, ctx)) - num(v.kredit)

/** Lampiran 13A angka 5b: 1/6 x persentase x realisasi penanaman modal. */
const nilaiFasilitas13A = (v: BlockValues) => Math.round(num(v.fasPersentase) / 100 * num(v.realisasiAkumulasi) / 6)
/** Lampiran 13B III kolom 7 total: tambahan pengurangan litbang. */
const tambahanLitbang = (rows: Row[]) => rows.reduce((a, r) => a + Math.round(num(r.biaya) * num(r.persen) / 100), 0)
/** Lampiran 13B IV angka 3 (1 - 2): bagian III total less what earlier years already used; never below 0. */
const sisaLitbang = (tambahan: number, sebelumnya: unknown) => Math.max(0, tambahan - num(sebelumnya))
const belumLitbang = (v: BlockValues, ctx: Ctx) => sisaLitbang(tambahanLitbang(tableRows(ctx.section, 'litbang')), v.sebelumnya)
/** Lampiran 13B IV angka 5: usable this year, at most 40% of SPT Induk angka 9. */
export function litbangDimanfaatkan(belum: number, pkpAngka9: number): number {
  return Math.max(0, Math.min(Math.round(0.4 * Math.max(0, pkpAngka9)), belum))
}
/** Lampiran 13C kolom 11 per row. */
const fasilitas13C = (r: Row) => Math.round(num(r.persen) / 100 * 0.22 * num(r.pkp))

// ── Lampiran 2 ───────────────────────────────────────────────────────────────
const lampiran2: LampiranDef = {
  section: 'lampiran-2',
  title: 'Lampiran 2',
  parts: [
    {
      key: 'a',
      tab: 'A. Daftar Pemegang Saham/Pemilik Modal',
      title: 'A. Daftar Pemegang Saham/Pemilik Modal dan Jumlah Dividen/Pembagian Laba yang Dibagikan Serta Daftar Susunan Pengurus dan Komisaris',
      blocks: [{
        kind: 'table',
        key: 'pemegangSaham',
        mode: 'inline',
        columns: [
          text('nama', 'Nama (2)', { width: 200, required: true }),
          text('alamat', 'Alamat (3)', { width: 260 }),
          text('kodeNegara', 'Kode Negara (4)', { width: 120 }),
          { key: 'npwp', label: 'NPWP/TIN (5)', type: 'id', width: 180 },
          text('jabatan', 'Jabatan (6)', { width: 160 }),
          rp('modal', 'Nilai (7)', { group: 'Modal disetor' }),
          { key: 'persen', label: '% (8)', type: 'percent', group: 'Modal disetor', width: 100 },
          rp('dividen', 'Dividen/pembagian laba (9)'),
        ],
        summaries: [
          { label: 'Jumlah modal disetor', value: sumOf('modal') },
          { label: 'Persentase (%)', value: sumOf('persen'), format: 'percent' },
          { label: 'Jumlah dividen/pembagian laba', value: sumOf('dividen') },
        ],
      }],
    },
    {
      key: 'b',
      tab: 'B. Daftar Penyertaan Modal',
      title: 'B. Daftar Penyertaan Modal, Utang, Dan/Atau Piutang Pada Perusahaan Afiliasi',
      blocks: [{
        kind: 'table',
        key: 'penyertaan',
        mode: 'drawer',
        emptyLabel: 'lampiran 2B',
        columns: [
          text('nama', 'Nama (2)', { required: true, width: 200 }),
          text('kodeNegara', 'Kode Negara (3)', { width: 120 }),
          { key: 'npwp', label: 'NPWP/TIN (4)', type: 'id', width: 180 },
          rp('modal', 'Nilai (5)', { group: 'Penyertaan modal' }),
          { key: 'persen', label: '% (6)', type: 'percent', group: 'Penyertaan modal', width: 100 },
          rp('utang', 'Nilai (7)', { group: 'Utang' }),
          { key: 'utangTahun', label: 'Tahun (8)', type: 'year', group: 'Utang', width: 110 },
          rp('utangBunga', 'Bunga/tahun (9)', { group: 'Utang' }),
          rp('piutang', 'Nilai (10)', { group: 'Piutang' }),
          { key: 'piutangTahun', label: 'Tahun (11)', type: 'year', group: 'Piutang', width: 110 },
          rp('piutangBunga', 'Bunga/tahun (12)', { group: 'Piutang' }),
        ],
      }],
    },
  ],
}

// ── Lampiran 3 ───────────────────────────────────────────────────────────────
const lampiran3: LampiranDef = {
  section: 'lampiran-3',
  title: 'Lampiran 3',
  parts: [
    {
      key: 'a',
      tab: 'A. Penghasilan Dari Luar Negeri',
      title: 'A. Penghasilan Dari Luar Negeri',
      blocks: [{
        kind: 'table',
        key: 'luarNegeri',
        mode: 'drawer',
        emptyLabel: 'lampiran 3A',
        columns: [
          text('nama', 'Nama (2)', { group: 'Pemotong pajak', required: true, width: 200 }),
          text('kodeNegara', 'Kode negara (3)', { group: 'Pemotong pajak', width: 120 }),
          { key: 'tanggal', label: 'Tanggal transaksi/pembayaran PPh (4)', type: 'date', width: 170 },
          text('kodePenghasilan', 'Kode penghasilan (5)', { width: 140 }),
          rp('netto', 'Penghasilan netto (6)'),
          rp('pajakNilai', 'Nilai (7)', { group: 'Pajak terutang/dibayar di luar negeri' }),
          { key: 'valas', label: 'Valas (8)', type: 'select', options: ['USD', 'SGD', 'EUR', 'JPY', 'CNY', 'AUD'], group: 'Pajak terutang/dibayar di luar negeri', width: 110 },
          { key: 'pajakValas', label: 'Nilai (dalam valas) (9)', type: 'usd', group: 'Pajak terutang/dibayar di luar negeri' },
          rp('kredit', 'Kredit pajak yang dapat diperhitungkan (10)'),
        ],
        totals: ['netto', 'pajakNilai', 'kredit'],
      }],
    },
    {
      key: 'b',
      tab: 'B. PPh yang Dipotong/Dipungut Pihak Lain',
      title: 'B. PPh yang Dipotong/Dipungut Pihak Lain',
      blocks: [{
        kind: 'table',
        key: 'dipotong',
        mode: 'drawer',
        emptyLabel: 'lampiran 3B',
        columns: [
          text('nama', 'Nama (2)', { group: 'Pemotong/pemungut pajak', required: true, width: 200 }),
          { key: 'npwp', label: 'NPWP (3)', type: 'id', group: 'Pemotong/pemungut pajak', width: 180 },
          { key: 'jenisPajak', label: 'Jenis pajak (4)', type: 'select', options: ['PPh Pasal 22', 'PPh Pasal 23', 'PPh Pasal 26', 'PPh Pasal 4 ayat (2)'], width: 150 },
          rp('dpp', 'Dasar pengenaan pajak (5)'),
          rp('pph', 'PPh yang dipotong/dipungut (6)'),
          text('nomorBukti', 'Nomor (7)', { group: 'Bukti pemotongan/pemungutan', width: 160 }),
          { key: 'tanggalBukti', label: 'Tanggal (8)', type: 'date', group: 'Bukti pemotongan/pemungutan', width: 150 },
        ],
        totals: ['dpp', 'pph'],
      }],
    },
  ],
}

// ── Lampiran 4 ───────────────────────────────────────────────────────────────
const lampiran4: LampiranDef = {
  section: 'lampiran-4',
  title: 'Lampiran 4',
  parts: [
    {
      key: 'a',
      tab: 'A. Penghasilan yang Dikenakan PPh Final',
      title: 'A. Penghasilan yang Dikenakan PPh Final',
      blocks: [{
        kind: 'table',
        key: 'final',
        mode: 'inline',
        columns: [
          text('kodeObjek', 'Kode objek pajak (2)', { width: 150, required: true }),
          text('objek', 'Objek pajak (3)', { width: 240 }),
          rp('dpp', 'Dasar pengenaan pajak (4)'),
          { key: 'tarif', label: 'Tarif (5)', type: 'percent', width: 100 },
          { key: 'pph', label: 'PPh terutang (6)', type: 'currency', compute: r => Math.round(num(r.dpp) * num(r.tarif) / 100) },
        ],
        summaries: [
          { label: 'Jumlah dasar pengenaan pajak', value: sumOf('dpp') },
          { label: 'Jumlah PPh terutang', value: rows => rows.reduce((a, r) => a + Math.round(num(r.dpp) * num(r.tarif) / 100), 0) },
        ],
      }],
    },
    {
      key: 'b',
      tab: 'B. Penghasilan yang Tidak Termasuk Objek Pajak',
      title: 'B. Penghasilan yang Tidak Termasuk Objek Pajak',
      blocks: [{
        kind: 'table',
        key: 'nonObjek',
        mode: 'inline',
        columns: [
          text('kodeJenis', 'Kode jenis penghasilan (2)', { width: 170, required: true }),
          text('jenis', 'Jenis penghasilan (3)', { width: 240 }),
          text('sumber', 'Sumber penghasilan (4)', { width: 220 }),
          rp('bruto', 'Penghasilan bruto (5)'),
        ],
        summaries: [{ label: 'Jumlah', value: sumOf('bruto') }],
      }],
    },
  ],
}

// ── Lampiran 5 ───────────────────────────────────────────────────────────────
const monthCols: FieldDef[] = MONTHS.map((m, i) => rp(`m${i + 1}`, `${m} (${i + 3})`, { group: 'Masa', width: 170 }))
const lampiran5: LampiranDef = {
  section: 'lampiran-5',
  title: 'Lampiran 5',
  parts: [
    {
      key: 'a',
      tab: 'A. Daftar Tempat Kegiatan Usaha (TKU)',
      title: 'A. Daftar Tempat Kegiatan Usaha (TKU)',
      blocks: [{
        kind: 'table',
        key: 'tku',
        mode: 'inline',
        columns: [
          text('idTku', 'ID TKU (2)', { width: 150, required: true }),
          text('namaTku', 'Nama TKU (3)', { width: 200 }),
          text('alamat', 'Alamat (4)', { width: 240 }),
          text('kelurahan', 'Kelurahan (5)', { width: 150 }),
          text('kecamatan', 'Kecamatan (6)', { width: 150 }),
          text('kota', 'Kota/kabupaten (7)', { width: 160 }),
          text('provinsi', 'Provinsi (8)', { width: 150 }),
        ],
      }],
    },
    {
      key: 'b',
      tab: 'B. Rekapitulasi Peredaran Bruto',
      title: 'B. Rekapitulasi Peredaran Bruto',
      blocks: [{
        kind: 'table',
        key: 'peredaran',
        mode: 'drawer',
        emptyLabel: 'lampiran 5B',
        columns: [
          text('idTku', 'ID TKU (2)', { width: 150, required: true }),
          ...monthCols,
          { key: 'jumlah', label: 'Jumlah (15)', type: 'currency', compute: r => MONTHS.reduce((a, _, i) => a + num(r[`m${i + 1}`]), 0) },
        ],
        totals: ['jumlah'],
      }],
    },
  ],
}

// ── Lampiran 6 ───────────────────────────────────────────────────────────────
const lampiran6: LampiranDef = {
  section: 'lampiran-6',
  title: 'Lampiran 6',
  parts: [{
    key: 'main',
    title: 'Penghitungan Angsuran PPh Pasal 25 Tahun Pajak Berjalan',
    blocks: [{
      kind: 'form',
      key: 'angsuran',
      headers: ['No.', 'Angsuran PPh tahun pajak berjalan', 'Nilai'],
      items: [
        item('1', 'Penghasilan yang menjadi dasar penghitungan angsuran', 'dasar'),
        item('2', 'Kompensasi kerugian fiskal', 'kompensasi', { hint: 'Diisi dari Formulir Lampiran-07 Jumlah kolom 9', linked: ctx => kompensasiBerjalanLampiran7(ctx.lampiran) }),
        item('3', 'Penghasilan kena pajak (1 - 2)', 'pkp', { type: 'computed', compute: pkp6 }),
        item('4', 'PPh yang terutang (tarif x 3)', 'pph', { type: 'computed', compute: (v, ctx) => Math.round(0.22 * pkp6(v, ctx)) }),
        item('5', 'Kredit pajak tahun pajak yang lalu atas penghasilan yang termasuk dalam angka 1 yang dipotong/dipungut pihak lain', 'kredit'),
        item('6', 'PPh yang harus dibayar sendiri (4 - 5)', 'bayar', { type: 'computed', compute: bayar6 }),
        item('7', 'Angsuran tahun pajak berjalan (1/12 x 6)', 'angsuran', { type: 'computed', compute: (v, ctx) => Math.round(bayar6(v, ctx) / 12) }),
      ],
    }],
  }],
}

// ── Lampiran 7 ───────────────────────────────────────────────────────────────
/** Year columns are relative to the SPT year (Figma draws 2019–2024 for SPT 2023). */
const lampiran7 = (year: number): LampiranDef => ({
  section: 'lampiran-7',
  title: 'Lampiran 7',
  parts: [{
    key: 'main',
    title: 'Penghitungan Kompensasi Kerugian Fiskal',
    blocks: [{
      kind: 'table',
      key: 'kompensasi',
      mode: 'drawer',
      emptyLabel: 'lampiran 7',
      columns: [
        { key: 'tahun', label: 'Tahun (2)', type: 'year', group: 'Laba (Rugi) netto fiskal', required: true, width: 110 },
        rp('nilai', 'Nilai (3)', { group: 'Laba (Rugi) netto fiskal' }),
        ...[4, 3, 2, 1].map((d, i) => rp(`k${i}`, `Tahun ${year - d} — Nilai (${i + 4})`, { group: 'Kompensasi kerugian fiskal' })),
        rp('kIni', `Tahun ${year} — Tahun pajak ini nilai (8)`, { group: 'Kompensasi kerugian fiskal' }),
        rp('kBerjalan', `Tahun ${year + 1} — Tahun pajak berjalan nilai (9)`, { group: 'Kompensasi kerugian fiskal' }),
      ],
      totals: ['kIni', 'kBerjalan'],
    }],
  }],
})

// ── Lampiran 8 ───────────────────────────────────────────────────────────────
const BATAS_31E = 4_800_000_000
/** Pasal 31E: 50% rate cut on the PKP share of the first Rp4,8 miliar of gross turnover. */
export function hitungLampiran8(bruto: number, pkp: number) {
  const fasilitas = bruto > 0 ? Math.round(Math.min(1, BATAS_31E / bruto) * pkp) : 0
  const nonFasilitas = pkp - fasilitas
  const pph3a = Math.round(0.5 * 0.22 * fasilitas)
  const pph3b = Math.round(0.22 * nonFasilitas)
  return { fasilitas, nonFasilitas, pph3a, pph3b, total: pph3a + pph3b }
}
const lampiran8: LampiranDef = {
  section: 'lampiran-8',
  title: 'Lampiran 8',
  parts: [{
    key: 'main',
    blocks: [{
      kind: 'form',
      key: 'pasal31e',
      headers: ['No.', 'Perhitungan fasilitas pengurangan tarif PPh bagi wajib pajak badan dalam negeri berdasarkan pasal 31E ayat 1 undang-undang PPh', 'Nilai'],
      items: [
        item('1', 'Peredaran bruto', undefined, { heading: true }),
        item(undefined, 'Jumlah peredaran bruto', 'bruto', { indent: 1 }),
        item('2', 'Penghasilan kena pajak', 'pkp', { type: 'computed', compute: (_, ctx) => ctx.pkp, hint: 'Diisi dari SPT Induk (angka 9 - angka 10)' }),
        item('a', 'Penghasilan kena pajak dari bagian peredaran bruto yang memperoleh fasilitas', 'a2', { indent: 1, type: 'computed', hint: '((Rp4.800.000.000 / jumlah peredaran bruto) x penghasilan kena pajak)', compute: (v, ctx) => hitungLampiran8(num(v.bruto), ctx.pkp).fasilitas }),
        item('b', 'Penghasilan kena pajak dari bagian peredaran bruto yang tidak memperoleh fasilitas', 'b2', { indent: 1, type: 'computed', hint: '(penghasilan kena pajak - penghasilan kena pajak dari bagian peredaran bruto yang memperoleh fasilitas)', compute: (v, ctx) => hitungLampiran8(num(v.bruto), ctx.pkp).nonFasilitas }),
        item('3', 'PPh terutang', undefined, { heading: true }),
        item('a', 'PPh terutang atas penghasilan kena pajak dari bagian peredaran bruto yang memperoleh fasilitas', 'a3', { indent: 1, type: 'computed', hint: '(50% x 22% x penghasilan kena pajak dari bagian peredaran bruto yang memperoleh fasilitas)', compute: (v, ctx) => hitungLampiran8(num(v.bruto), ctx.pkp).pph3a }),
        item('b', 'PPh terutang atas penghasilan kena pajak dari bagian peredaran bruto yang tidak memperoleh fasilitas', 'b3', { indent: 1, type: 'computed', hint: '(22% x penghasilan kena pajak dari bagian peredaran bruto yang tidak memperoleh fasilitas)', compute: (v, ctx) => hitungLampiran8(num(v.bruto), ctx.pkp).pph3b }),
        item('4', 'Jumlah PPh terutang (3a + 3b)', 'total', { type: 'computed', compute: (v, ctx) => hitungLampiran8(num(v.bruto), ctx.pkp).total }),
      ],
    }],
  }],
}

// ── Lampiran 9 ───────────────────────────────────────────────────────────────
const asetColumns: FieldDef[] = [
  text('kode', 'Kode aset (1)', { width: 120, required: true }),
  text('jenis', 'Kelompok/jenis aset (2)', { width: 200 }),
  { key: 'perolehan', label: 'Bulan/tahun perolehan (3)', type: 'month', width: 160 },
  rp('biaya', 'Biaya perolehan (4)'),
  rp('sisaBuku', 'Nilai sisa buku fiskal pada awal tahun (5)'),
  { key: 'metodeKomersial', label: 'Komersial (6)', type: 'select', options: METODE_PENYUSUTAN, group: 'Metode penyusutan/amortisasi', width: 150 },
  { key: 'metodeFiskal', label: 'Fiskal (7)', type: 'select', options: METODE_PENYUSUTAN, group: 'Metode penyusutan/amortisasi', width: 150 },
  rp('penyusutan', 'Penyusutan/amortisasi fiskal tahun ini (8)'),
  text('keterangan', 'Keterangan (9)', { width: 180 }),
]
const asetTable = (key: string, title: string) => ({ kind: 'table' as const, key, title, mode: 'drawer' as const, emptyLabel: `lampiran 9 ${title.replace(/^[A-Z]\. /, '').toLowerCase()}`, numbered: false, columns: asetColumns })
const harta = ['hk1', 'hk2', 'hk3', 'hk4', 'bp', 'bt']
const takBerwujud = ['tk1', 'tk2', 'tk3', 'tk4']
const penyusutanFiskal = (ctx: Ctx, keys: string[]) => keys.reduce((a, k) => a + sumColumn(tableRows(ctx.section, k), 'penyusutan'), 0)
const lampiran9: LampiranDef = {
  section: 'lampiran-9',
  title: 'Lampiran 9',
  parts: [
    { key: 'i', title: 'I. Harta Berwujud', blocks: [1, 2, 3, 4].map(k => asetTable(`hk${k}`, `${'ABCD'[k - 1]}. Kelompok ${k}`)) },
    {
      key: 'ii',
      title: 'II. Kelompok Bangunan',
      blocks: [
        asetTable('bp', 'A. Permanen'),
        asetTable('bt', 'B. Tidak permanen'),
        {
          kind: 'form',
          key: 'rekapBerwujud',
          headers: ['', 'Rekapitulasi harta berwujud dan bangunan', 'Nilai'],
          items: [
            item('a', 'Jumlah penyusutan fiskal', 'fiskal', { type: 'computed', compute: (_, ctx) => penyusutanFiskal(ctx, harta) }),
            item('b', 'Jumlah penyusutan komersial', 'komersial'),
            item('c', 'Selisih penyusutan (a - b)', 'selisih', { type: 'computed', compute: (v, ctx) => penyusutanFiskal(ctx, harta) - num(v.komersial) }),
          ],
        },
      ],
    },
    {
      key: 'iii',
      title: 'III. Harta Tak Berwujud',
      blocks: [
        ...[1, 2, 3, 4].map(k => asetTable(`tk${k}`, `${'ABCD'[k - 1]}. Kelompok ${k}`)),
        {
          kind: 'form',
          key: 'rekapTakBerwujud',
          headers: ['', 'Rekapitulasi harta tak berwujud', 'Nilai'],
          items: [
            item('d', 'Jumlah amortisasi fiskal', 'fiskal', { type: 'computed', compute: (_, ctx) => penyusutanFiskal(ctx, takBerwujud) }),
            item('e', 'Jumlah amortisasi komersial', 'komersial'),
            item('f', 'Selisih amortisasi (d - e)', 'selisih', { type: 'computed', compute: (v, ctx) => penyusutanFiskal(ctx, takBerwujud) - num(v.komersial) }),
          ],
        },
      ],
    },
  ],
}

// ── Lampiran 10 ──────────────────────────────────────────────────────────────
const lampiran10a: LampiranDef = {
  section: 'lampiran-10a',
  title: 'Lampiran 10A',
  parts: [{
    key: 'main',
    title: 'Transaksi Hubungan Istimewa',
    blocks: [{
      kind: 'table',
      key: 'transaksi',
      mode: 'drawer',
      emptyLabel: 'lampiran 10A',
      columns: [
        text('nama', 'Nama (2)', { width: 200, required: true }),
        { key: 'npwp', label: 'NPWP/TIN (3)', type: 'id', width: 180 },
        text('kodeNegara', 'Kode negara (4)', { width: 120 }),
        text('kodeHubungan', 'Kode bentuk hubungan (5)', { width: 170 }),
        text('kegiatan', 'Kegiatan usaha (6)', { width: 180 }),
        text('kodeTransaksi', 'Kode jenis transaksi (7)', { width: 170 }),
        rp('nilai', 'Nilai transaksi (8)'),
        text('kodeHarga', 'Kode penetapan harga yang digunakan (9)', { width: 220 }),
        text('alasan', 'Alasan penggunaan metode (10)', { width: 240, full: true }),
      ],
      totals: ['nilai'],
    }],
  }],
}

const yaTidak = (key: string, letter: string, label: string, subItems?: string[]) => ({ key, letter, label, subItems })
const lampiran10b: LampiranDef = {
  section: 'lampiran-10b',
  title: 'Lampiran 10B',
  parts: [{
    key: 'main',
    blocks: [{
      kind: 'statements',
      key: 'dokumentasi',
      title: 'Dokumentasi penetapan harga wajar transaksi',
      control: 'yesno',
      groups: [
        {
          no: '1',
          title: 'Mengenai gambaran perusahaan secara rinci',
          intro: 'Bahwasanya kami telah membuat catatan tentang:',
          items: [
            yaTidak('1a', 'a', 'struktur kepemilikan yang menunjukkan keterkaitan antara semua perusahaan dalam satu kelompok perusahaan multinasional'),
            yaTidak('1b', 'b', 'struktur organisasi perusahaan wajib pajak'),
            yaTidak('1c', 'c', 'aspek-aspek operasional kegiatan usaha wajib pajak termasuk rincian fungsi-fungsi yang diselenggarakan oleh unit-unit yang berada dalam organisasi perusahaan wajib pajak'),
            yaTidak('1d', 'd', 'gambaran lingkungan usaha secara rinci'),
          ],
        },
        {
          no: '2',
          title: 'Mengenai transaksi',
          intro: 'Bahwasanya kami telah membuat catatan tentang:',
          items: [
            yaTidak('2a', 'a', 'transaksi wajib pajak dengan perusahaan yang mempunyai hubungan istimewa'),
            yaTidak('2b', 'b', 'transaksi wajib pajak dengan perusahaan yang tidak dipengaruhi oleh hubungan istimewa atau informasi mengenai transaksi pembanding'),
            yaTidak('2c', 'c', 'dalam hal wajib pajak bertindak sebagai pihak yang menjual, menyerahkan, atau meminjamkan dalam transaksi-transaksi sebagaimana disebutkan di atas, kami telah menyelenggarakan catatan sebagai berikut:', [
              'kebijakan penentuan harga dan daftar harga selama 5 (lima) tahun terakhir',
              'rincian biaya pabrikasi atau harga perolehan atau biaya penyiapan jasa',
            ]),
          ],
        },
        {
          no: '3',
          title: 'Mengenai catatan hasil analisis kesebandingan',
          intro: 'Bahwasanya kami telah membuat catatan tentang:',
          items: [
            yaTidak('3a', 'a', 'karakteristik dari produk (barang, jasa, pinjaman, instrumen keuangan, dan lain-lain)'),
            yaTidak('3b', 'b', 'analisis fungsional yang menjadi pertimbangan dilakukannya transaksi antara wajib pajak dengan perusahaan yang mempunyai hubungan istimewa, semua risiko-risiko diasumsikan dan aktiva-aktiva digunakan dalam transaksi tersebut'),
            yaTidak('3c', 'c', 'kondisi-kondisi ekonomi pada saat terjadinya transaksi'),
            yaTidak('3d', 'd', 'syarat-syarat transaksi (terms of transactions), termasuk juga perjanjian sesuai kontrak antara wajib pajak dengan pihak-pihak yang masih mempunyai hubungan istimewa di luar negeri'),
            yaTidak('3e', 'e', 'strategi bisnis wajib pajak pada saat melakukan transaksi afiliasi'),
          ],
        },
        {
          no: '4',
          title: 'Mengenai catatan atas penentuan harga wajar',
          intro: 'Bahwasanya kami telah membuat catatan tentang:',
          items: [
            yaTidak('4a', 'a', 'metodologi penentuan harga yang diterapkan oleh wajib pajak, yang menunjukkan bagaimana harga yang wajar diperoleh, dan alasan metode tersebut dipilih dibandingkan dengan metode-metode lainnya'),
            yaTidak('4b', 'b', 'data pembanding yang digunakan oleh wajib pajak untuk menentukan harga transfer'),
            yaTidak('4c', 'c', 'aplikasi metodologi penentuan harga transfer dan penggunaan data pembanding harga transfer'),
          ],
        },
      ],
    }],
  }],
}

const lampiran10c: LampiranDef = {
  section: 'lampiran-10c',
  title: 'Lampiran 10C',
  parts: [{
    key: 'main',
    blocks: [
      {
        kind: 'table',
        key: 'taxHaven',
        title: 'I. Dalam hal wajib pajak dalam tahun pajak ini melakukan transaksi dengan pihak-pihak yang merupakan penduduk Tax Haven Country',
        mode: 'inline',
        columns: [
          text('mitra', 'Nama mitra transaksi (2)', { width: 220, required: true }),
          text('jenis', 'Jenis transaksi (3)', { width: 200 }),
          text('kodeNegara', 'Kode negara (4)', { width: 130 }),
          rp('nilai', 'Nilai transaksi (5)'),
        ],
        summaries: [{ label: 'Jumlah nilai transaksi', value: sumOf('nilai') }],
      },
      {
        kind: 'statements',
        key: 'kewajaran',
        control: 'yesno',
        groups: [{ items: [{ key: 'ii', label: 'II. Penetapan transaksi di atas, ditetapkan dengan menggunakan prinsip kewajaran dan kelaziman usaha' }] }],
      },
    ],
  }],
}

const lampiran10d: LampiranDef = {
  section: 'lampiran-10d',
  title: 'Lampiran 10D',
  parts: [{
    key: 'main',
    blocks: [{
      kind: 'statements',
      key: 'ikhtisar',
      title: 'Ikhtisar dokumen induk dan dokumen lokal',
      control: 'checkbox',
      groups: [
        {
          no: 'I',
          title: 'Ikhtisar dokumen induk',
          intro: 'Bahwasanya kami telah menyelenggarakan dokumen induk yang menjadi dasar penerapan prinsip kewajaran dan kelaziman usaha (arm’s length principle), yang memuat informasi mengenai grup usaha sebagai berikut:',
          items: [
            { key: 'i1', label: 'Struktur dan bagan kepemilikan grup usaha serta negara atau yurisdiksi masing-masing anggota grup usaha' },
            { key: 'i2', label: 'Kegiatan usaha yang dilakukan oleh grup usaha' },
            { key: 'i3', label: 'Harta tidak berwujud yang dimiliki grup usaha' },
            { key: 'i4', label: 'Aktivitas pembiayaan dan keuangan dalam grup usaha' },
            { key: 'i5', label: 'Laporan keuangan konsolidasi entitas induk dan informasi perpajakan terkait transaksi afiliasi' },
          ],
        },
        {
          no: 'II',
          title: 'Ikhtisar dokumen lokal',
          intro: 'Bahwasanya kami telah menyelenggarakan dokumen lokal yang menjadi dasar penerapan prinsip kewajaran dan kelaziman usaha (arm’s length principle), yang memuat informasi mengenai grup usaha sebagai berikut:',
          items: [
            { key: 'ii1', label: 'Identitas dan kegiatan usaha yang dilakukan wajib pajak' },
            { key: 'ii2', label: 'Informasi transaksi afiliasi dan transaksi independen yang dilakukan wajib pajak' },
            { key: 'ii3', label: 'Penerapan prinsip kewajaran dan kelaziman usaha' },
            { key: 'ii4', label: 'Informasi keuangan wajib pajak' },
            { key: 'ii5', label: 'Peristiwa-peristiwa/kejadian-kejadian/fakta-fakta non keuangan yang mempengaruhi pembentukan harga atau tingkat laba' },
          ],
        },
        {
          no: 'III',
          title: 'Pernyataan penyelenggaraan dan penyediaan dokumen induk dan dokumen lokal',
          intro: 'Bahwasanya kami telah menyelenggarakan dokumen induk dan dokumen lokal berdasarkan data dan informasi yang tersedia saat dilakukannya transaksi afiliasi, dan:',
          items: [],
        },
      ],
      fields: [
        { key: 'tglInduk', label: '1. Dokumen induk telah tersedia pada tanggal', type: 'date' },
        { key: 'tglLokal', label: '2. Dokumen lokal telah tersedia pada tanggal', type: 'date' },
      ],
    }],
  }],
}

// ── Lampiran 11 ──────────────────────────────────────────────────────────────
const idCol = (label = 'Nomor identitas (NPWP/NIK/lainnya) (2)'): FieldDef => ({ key: 'identitas', label, type: 'id', width: 200 })
const lampiran11a: LampiranDef = {
  section: 'lampiran-11a',
  title: 'Lampiran 11A',
  parts: [
    {
      key: 'i',
      tab: 'I. Biaya promosi',
      title: 'I. Daftar nominatif biaya promosi',
      blocks: [{
        kind: 'table',
        key: 'promosi',
        mode: 'inline',
        columns: [
          { ...idCol(), group: 'Data penerima' },
          text('nama', 'Nama (3)', { group: 'Data penerima', width: 200, required: true }),
          text('alamat', 'Alamat (4)', { group: 'Data penerima', width: 220 }),
          { key: 'tanggal', label: 'Tanggal (5)', type: 'date', width: 160 },
          text('bentuk', 'Bentuk dan jenis biaya (6)', { width: 200 }),
          rp('nilai', 'Nilai (7)'),
          text('keterangan', 'Keterangan (8)', { width: 180 }),
          rp('pph', 'PPh (9)', { group: 'Pemotongan/pemungutan PPh' }),
          text('nomorBukti', 'Nomor bukti potong/pungut (10)', { group: 'Pemotongan/pemungutan PPh', width: 200 }),
        ],
        totals: ['nilai', 'pph'],
      }],
    },
    {
      key: 'ii',
      tab: 'II. Biaya entertainment',
      title: 'II. Daftar nominatif biaya entertainment',
      blocks: [{
        kind: 'table',
        key: 'entertainment',
        mode: 'inline',
        columns: [
          { key: 'tanggal', label: 'Tanggal (2)', type: 'date', group: 'Pemberian entertainment', width: 160, required: true },
          text('tempat', 'Tempat (3)', { group: 'Pemberian entertainment', width: 180 }),
          text('alamat', 'Alamat (4)', { group: 'Pemberian entertainment', width: 220 }),
          text('jenis', 'Jenis (5)', { group: 'Pemberian entertainment', width: 160 }),
          rp('nilai', 'Nilai (6)', { group: 'Pemberian entertainment' }),
          text('nama', 'Nama (7)', { group: 'Relasi usaha yang diberikan entertainment', width: 180 }),
          text('jabatan', 'Jabatan (8)', { group: 'Relasi usaha yang diberikan entertainment', width: 160 }),
          text('perusahaan', 'Nama perusahaan (9)', { group: 'Relasi usaha yang diberikan entertainment', width: 200 }),
          text('jenisUsaha', 'Jenis usaha (10)', { group: 'Relasi usaha yang diberikan entertainment', width: 180 }),
          text('keterangan', 'Keterangan (11)', { width: 180 }),
        ],
        totals: ['nilai'],
      }],
    },
    {
      key: 'iii',
      tab: 'III. Piutang yang tidak dapat ditagih',
      title: 'III. Daftar piutang yang nyata-nyata tidak dapat ditagih',
      blocks: [{
        kind: 'table',
        key: 'piutang',
        mode: 'inline',
        columns: [
          idCol(),
          text('nama', 'Nama (3)', { width: 200, required: true }),
          text('alamat', 'Alamat (4)', { width: 220 }),
          rp('plafon', 'Plafon piutang (5)'),
          rp('tidakTertagih', 'Piutang yang nyata-nyata tidak dapat ditagih (6)'),
        ],
        totals: ['plafon', 'tidakTertagih'],
      }],
    },
    {
      key: 'iv',
      tab: 'IV. Rincian bagi pemberi natura',
      title: 'IV. Rincian bagi wajib pajak pemberi natura',
      blocks: [
        {
          kind: 'table',
          key: 'sarana',
          title: 'IV.A Daftar sarana dan fasilitas serta penyusutannya',
          mode: 'inline',
          columns: [
            text('jenis', 'Jenis harta berwujud (2)', { width: 220, required: true }),
            { key: 'tahun', label: 'Tahun perolehan (3)', type: 'year', width: 140 },
            rp('nilai', 'Nilai perolehan (4)'),
            rp('lalu', 'S.d tahun lalu (5)', { group: 'Penyusutan' }),
            rp('ini', 'Tahun ini (6)', { group: 'Penyusutan' }),
            { key: 'sdIni', label: 'S.d tahun ini (7)', type: 'currency', group: 'Penyusutan', compute: r => num(r.lalu) + num(r.ini) },
          ],
          totals: ['nilai', 'ini', 'sdIni'],
        },
        {
          kind: 'form',
          key: 'natura',
          title: 'IV.B Rincian penggantian atau imbalan dalam bentuk natura atau kenikmatan yang diberikan berkenaan dengan pelaksanaan pekerjaan di daerah tertentu',
          items: [
            item('1', 'Alamat lokasi', 'alamat', { type: 'text' }),
            item('2', 'Keputusan Penetapan Daerah Tertentu', undefined, { heading: true }),
            item(undefined, 'Nomor', 'penetapanNomor', { type: 'text', indent: 1 }),
            item(undefined, 'Tanggal', 'penetapanTanggal', { type: 'date', indent: 1 }),
            item('3', 'Keputusan Perpanjangan Penetapan Daerah Tertentu', undefined, { heading: true }),
            item(undefined, 'Nomor', 'perpanjanganNomor', { type: 'text', indent: 1 }),
            item(undefined, 'Tanggal', 'perpanjanganTanggal', { type: 'date', indent: 1 }),
            item('4', 'Biaya yang dikeluarkan untuk:', undefined, { heading: true }),
            item('a', 'tempat tinggal, termasuk perumahan untuk pegawai dan keluarganya', 'b4a', { indent: 1 }),
            item('b', 'pelayanan kesehatan', 'b4b', { indent: 1 }),
            item('c', 'pendidikan bagi pegawai dan keluarganya', 'b4c', { indent: 1 }),
            item('d', 'peribadatan', 'b4d', { indent: 1 }),
            item('e', 'pengangkutan bagi pegawai dan keluarganya', 'b4e', { indent: 1 }),
            item('f', 'olahraga bagi pegawai dan keluarganya, tidak termasuk golf, power boating, pacuan kuda, dan terbang layang', 'b4f', { indent: 1 }),
            item(undefined, 'Jumlah biaya yang dikeluarkan (4a + 4b + 4c + 4d + 4e + 4f)', 'jumlah', { type: 'computed', compute: v => ['b4a', 'b4b', 'b4c', 'b4d', 'b4e', 'b4f'].reduce((a, k) => a + num(v[k]), 0) }),
          ],
        },
      ],
    },
    {
      key: 'v',
      tab: 'V. Debitur kredit kurang lancar',
      title: 'V. Daftar debitur kredit kurang lancar',
      blocks: [{
        kind: 'table',
        key: 'debitur',
        mode: 'inline',
        columns: [
          idCol(),
          text('nama', 'Nama debitur (3)', { width: 200, required: true }),
          text('alamat', 'Alamat (4)', { width: 220 }),
          rp('awal', 'Awal tahun buku (5)', { group: 'Nilai kredit kurang lancar' }),
          rp('akhir', 'Akhir tahun buku (6)', { group: 'Nilai kredit kurang lancar' }),
          rp('bunga', 'Jumlah bunga pada tahun buku (akrual) (7)'),
          { key: 'kategori', label: 'Kategori (8)', type: 'select', options: KATEGORI_KREDIT, width: 160 },
        ],
        totals: ['awal', 'akhir', 'bunga'],
      }],
    },
  ],
}

const avg12 = (r: Record<string, unknown>) => Math.round(Array.from({ length: 12 }, (_, i) => num(r[`b${i + 1}`])).reduce((a, b) => a + b, 0) / 12)
const bulanCols = (offset: number): FieldDef[] => Array.from({ length: 12 }, (_, i) => rp(`b${i + 1}`, `Bulan ke-${i + 1} (${i + offset})`, { group: 'Saldo utang tiap akhir bulan (dalam jutaan rupiah)', width: 170 }))
const avgRows = (ctx: Ctx, key: string) => tableRows(ctx.section, key).reduce((a, r) => a + avg12(r), 0)
const lampiran11b: LampiranDef = {
  section: 'lampiran-11b',
  title: 'Lampiran 11B',
  parts: [
    {
      key: 'i',
      tab: 'I. Penghitungan EBITDA',
      title: 'I. Penghitungan EBITDA',
      blocks: [{
        kind: 'form',
        key: 'ebitda',
        items: [
          item('1', 'Penghasilan neto komersial', 'neto'),
          item('2', 'Beban penyusutan dan amortisasi', 'penyusutan'),
          item('3', 'Beban pajak penghasilan', 'pajak'),
          item('4', 'Beban biaya pinjaman', 'pinjaman'),
          item('5', 'EBITDA', 'ebitda', { type: 'computed', compute: v => num(v.neto) + num(v.penyusutan) + num(v.pajak) + num(v.pinjaman) }),
          item('6', 'EBITDA (25%)', 'ebitda25', { type: 'computed', compute: v => Math.round(0.25 * (num(v.neto) + num(v.penyusutan) + num(v.pajak) + num(v.pinjaman))) }),
        ],
      }],
    },
    {
      key: 'ii',
      tab: 'II. Perbandingan utang dan modal',
      title: 'II. Besarnya perbandingan antara utang dan modal (debt to equity ratio)',
      blocks: [
        {
          kind: 'table',
          key: 'modal',
          title: 'B. Penghitungan rata-rata saldo modal',
          mode: 'inline',
          numbered: false,
          columns: [
            text('rincian', 'Rincian modal (1)', { width: 200, required: true }),
            ...bulanCols(2),
            { key: 'rata', label: 'Rata-rata (14)', type: 'currency', compute: avg12 },
          ],
          totals: ['rata'],
        },
        {
          kind: 'table',
          key: 'utang',
          title: 'A. Penghitungan rata-rata saldo utang',
          mode: 'inline',
          numbered: false,
          columns: [
            { key: 'identitas', label: 'Nomor identitas (NPWP/NIK/lainnya) (1)', type: 'id', group: 'Pemberi pinjaman', width: 200 },
            text('nama', 'Nama (2)', { group: 'Pemberi pinjaman', width: 200, required: true }),
            text('hubungan', 'Hubungan (3)', { group: 'Pemberi pinjaman', width: 160 }),
            ...bulanCols(4),
            { key: 'rata', label: 'Rata-rata (16)', type: 'currency', compute: avg12 },
          ],
          totals: ['rata'],
        },
        {
          kind: 'form',
          key: 'der',
          title: 'C. Penghitungan besarnya perbandingan antara utang dan modal (debt to equity ratio)',
          headers: ['', 'Rincian', 'Nilai'],
          items: [
            item(undefined, 'Jumlah saldo rata-rata utang', 'utang', { type: 'computed', compute: (_, ctx) => avgRows(ctx, 'utang') }),
            item(undefined, 'Jumlah saldo rata-rata modal', 'modal', { type: 'computed', compute: (_, ctx) => avgRows(ctx, 'modal') }),
            item(undefined, 'Debt to equity ratio (DER) — utang : modal', 'der', { type: 'computed', hint: 'Ditampilkan sebagai rasio (x 100)', compute: (_, ctx) => { const m = avgRows(ctx, 'modal'); return m ? Math.round(avgRows(ctx, 'utang') / m * 100) : 0 } }),
          ],
        },
      ],
    },
    {
      key: 'iii',
      tab: 'III. Penghitungan biaya pinjaman',
      title: 'III. Penghitungan biaya pinjaman',
      blocks: [
        {
          kind: 'table',
          key: 'biayaPinjaman',
          mode: 'inline',
          numbered: false,
          columns: [
            text('pemberi', 'Pemberi pinjaman (1)', { width: 220, required: true }),
            rp('saldo', 'Saldo rata-rata utang (2)'),
            rp('bunga', 'Biaya pinjaman (bunga) (3)'),
            rp('dapat', 'Biaya pinjaman yang dapat diperhitungkan dalam menghitung penghasilan kena pajak (4)', { width: 240 }),
            { key: 'tidak', label: 'Biaya pinjaman yang tidak dapat dikurangkan (5)', type: 'currency', width: 220, compute: r => num(r.bunga) - num(r.dapat) },
          ],
          totals: ['saldo', 'bunga', 'dapat', 'tidak'],
        },
        {
          kind: 'statements',
          key: 'utangLn',
          control: 'yesno',
          groups: [{ items: [{ key: 'swastaLn', label: 'Apakah Anda mempunyai utang swasta luar negeri? Jika “Ya”, isilah Lampiran 11C' }] }],
        },
      ],
    },
  ],
}

const lampiran11c: LampiranDef = {
  section: 'lampiran-11c',
  title: 'Lampiran 11C',
  parts: [{
    key: 'main',
    title: 'Daftar Utang Swasta Luar Negeri',
    blocks: [{
      kind: 'table',
      key: 'utangLn',
      mode: 'inline',
      columns: [
        text('nama', 'Nama (2)', { group: 'Pemberi pinjaman', width: 200, required: true }),
        text('alamat', 'Alamat (3)', { group: 'Pemberi pinjaman', width: 220 }),
        text('negara', 'Negara/yuridiksi (4)', { group: 'Pemberi pinjaman', width: 160 }),
        text('kodeValas', 'Kode (5)', { group: 'Mata uang', width: 100 }),
        rp('kurs', 'Kurs akhir tahun (6)', { group: 'Mata uang' }),
        { key: 'awal', label: 'Awal tahun (7)', type: 'usd', group: 'Pokok utang (USD)' },
        { key: 'tambah', label: 'Penambahan (8)', type: 'usd', group: 'Pokok utang (USD)' },
        { key: 'kurang', label: 'Pengurangan (9)', type: 'usd', group: 'Pokok utang (USD)' },
        { key: 'akhir', label: 'Akhir tahun (10)', type: 'usd', group: 'Pokok utang (USD)', compute: r => num(r.awal) + num(r.tambah) - num(r.kurang) },
        { key: 'mulai', label: 'Tanggal mulai (11)', type: 'date', group: 'Jangka waktu pinjaman', width: 160 },
        { key: 'jatuhTempo', label: 'Tanggal jatuh tempo (12)', type: 'date', group: 'Jangka waktu pinjaman', width: 170 },
        { key: 'tingkat', label: 'Tingkat (%) (13)', type: 'percent', group: 'Bunga', width: 110 },
        { key: 'bunga', label: 'Jumlah (USD) (14)', type: 'usd', group: 'Bunga' },
        { key: 'biayaLain', label: 'Biaya terkait perolehan pinjaman selain bunga (USD) (15)', type: 'usd', width: 230 },
        text('peruntukan', 'Peruntukan pinjaman (16)', { width: 200 }),
      ],
      totals: ['awal', 'tambah', 'kurang', 'akhir', 'bunga', 'biayaLain'],
    }],
  }],
}

// ── Lampiran 12 ──────────────────────────────────────────────────────────────
const lampiran12a: LampiranDef = {
  section: 'lampiran-12a',
  title: 'Lampiran 12A',
  parts: [{
    key: 'main',
    blocks: [{
      kind: 'form',
      key: 'pph26',
      headers: ['No.', 'Penghitungan PPh Pasal 26 Ayat (4)', 'Nilai'],
      items: [
        item(undefined, 'Kode negara kantor pusat', 'kodeNegara', { type: 'text' }),
        item('1', 'Penghasilan neto fiskal', 'neto', { type: 'computed', compute: (_, ctx) => ctx.penghasilanNeto, hint: 'Diisi dari SPT Induk angka 4' }),
        item('2', 'PPh badan terutang', 'pphBadan'),
        item('3', 'Dasar pengenaan pajak PPh Pasal 26 Ayat (4) (1 - 2)', 'dpp', { type: 'computed', compute: (v, ctx) => ctx.penghasilanNeto - num(v.pphBadan) }),
        item('4', 'PPh Pasal 26 Ayat (4)', undefined, { heading: true }),
        item('a', 'Terutang: tarif x jumlah pada angka (3)', 'tarif', { indent: 1, type: 'percent', hint: 'Isi tarif (%) sesuai UU PPh atau P3B' }),
        item(undefined, 'PPh Pasal 26 Ayat (4) terutang', 'terutang', { indent: 1, type: 'computed', compute: (v, ctx) => Math.round(num(v.tarif) / 100 * (ctx.penghasilanNeto - num(v.pphBadan))) }),
        item('b', 'Tidak terutang, berdasarkan:', undefined, { heading: true, indent: 1 }),
        item('1)', 'Ketentuan P3B Indonesia - (kode negara)', 'p3b', { indent: 2, type: 'text' }),
        item('2)', 'Ditanamkan kembali seluruhnya di Indonesia', undefined, { heading: true, indent: 2 }),
        item('a)', 'Ditanamkan kembali pada perusahaan baru di Indonesia — NPWP', 'npwpBaru', { indent: 2, type: 'id' }),
        item('b)', 'Ditanamkan kembali pada perusahaan yang sudah berdiri di Indonesia — NPWP', 'npwpLama', { indent: 2, type: 'id' }),
        item('c)', 'Ditanamkan kembali dalam bentuk perolehan aset tetap', 'asetTetap', { indent: 2 }),
        item('d)', 'Ditanamkan kembali dalam bentuk aset tak berwujud', 'asetTakBerwujud', { indent: 2 }),
      ],
    }],
  }],
}

const lampiran12b: LampiranDef = {
  section: 'lampiran-12b',
  title: 'Lampiran 12B',
  parts: [{
    key: 'main',
    blocks: [{
      kind: 'fields',
      key: 'but',
      groups: [
        {
          title: 'I. Identitas wajib pajak bentuk usaha tetap',
          fields: [
            { key: 'butNpwp', label: 'a. NPWP', type: 'id' },
            text('butNama', 'b. Nama'),
            text('butAlamat', 'c. Alamat', { full: true }),
            text('butJenis', 'd. Jenis usaha'),
          ],
        },
        {
          title: 'II. Identitas wajib pajak induk bentuk usaha tetap',
          fields: [
            text('indukNama', 'a. Nama'),
            { key: 'indukNpwp', label: 'b. NPWP', type: 'id' },
            text('indukAlamat', 'c. Alamat', { full: true }),
            text('indukJenis', 'd. Jenis usaha'),
          ],
        },
        {
          title: 'III. Laba bersih setelah dikurangi pajak',
          fields: [
            { key: 'tahun', label: 'a. Tahun pajak', type: 'year' },
            rp('pkp', 'b. Penghasilan kena pajak'),
            rp('pph', 'c. Pajak penghasilan'),
            { key: 'setelahPajak', label: 'd. Penghasilan kena pajak sesudah dikurangi pajak (IIIb - IIIc)', type: 'currency', compute: v => num(v.pkp) - num(v.pph) },
          ],
        },
      ],
    }],
  }],
}

// ── Lampiran 13 ──────────────────────────────────────────────────────────────
const lampiran13a: LampiranDef = {
  section: 'lampiran-13a',
  title: 'Lampiran 13A',
  parts: [{
    key: 'main',
    blocks: [{
      kind: 'fields',
      key: 'penanamanModal',
      groups: [
        {
          title: '1. Dalam hal perusahaan mendapat fasilitas perpajakan dalam rangka penanaman modal, jelaskan',
          fields: [
            text('kmkPemberianNomor', '1) Nomor', { group: 'a. Keputusan menteri keuangan pemberian fasilitas' }),
            { key: 'kmkPemberianTanggal', label: '2) Tanggal', type: 'date', group: 'a. Keputusan menteri keuangan pemberian fasilitas' },
            text('kmkPemanfaatanNomor', '1) Nomor', { group: 'b. Keputusan menteri keuangan pemanfaatan fasilitas' }),
            { key: 'kmkPemanfaatanTanggal', label: '2) Tanggal', type: 'date', group: 'b. Keputusan menteri keuangan pemanfaatan fasilitas' },
          ],
        },
        {
          title: '2.a. Jumlah penanaman modal yang disetujui',
          fields: [
            { key: 'modalValas', label: '1) Dalam valas', type: 'usd' },
            rp('modalEkuivalen', '2) Ekuivalen'),
            rp('modalRupiah', '3) Dalam Rupiah'),
            { key: 'modalJumlah', label: '4) Jumlah', type: 'currency', compute: v => num(v.modalEkuivalen) + num(v.modalRupiah) },
          ],
        },
        {
          fields: [
            { key: 'bentuk', label: '2.b. Bentuk penanaman modal', type: 'select', options: ['Baru', 'Perluasan'] },
            text('bidang', '2.c. Di bidang dan/atau daerah'),
          ],
        },
        {
          title: '2.d. Fasilitas yang diberikan',
          fields: [
            { key: 'fasPengurangan', label: '1) Pengurangan penghasilan neto', type: 'checkbox' },
            { key: 'fasPersentase', label: 'i. Persentase', type: 'percent' },
            { key: 'fasPenyusutan', label: '2) Penyusutan/amortisasi dipercepat', type: 'checkbox' },
            { key: 'fasKompensasi', label: '3) Kompensasi kerugian', type: 'checkbox' },
            { key: 'fasKompensasiTahun', label: 'ii. Tahun', type: 'number' },
            { key: 'fasDividen', label: '4) PPh atas dividen yang dibayarkan kepada wajib pajak luar negeri selain bentuk usaha tetap di Indonesia sebesar 10% atau tarif yang lebih rendah menurut P3B yang berlaku', type: 'checkbox', full: true },
          ],
        },
        {
          title: '3. Realisasi penanaman modal',
          fields: [
            rp('realisasiTahunIni', 'a. Tahun ini'),
            rp('realisasiAkumulasi', 'b. Akumulasi s.d. tahun ini'),
          ],
        },
        {
          title: '4. Saat mulai berproduksi komersial',
          fields: [{ key: 'mulaiProduksi', label: 'Tanggal', type: 'date' }],
        },
        {
          title: '5. Fasilitas pengurangan penghasilan neto',
          fields: [
            { key: 'tahunKe', label: 'a. Tahun ke-', type: 'number' },
            { key: 'nilaiFasilitas', label: 'b. Nilai (1/6 x persentase x realisasi penanaman modal s.d. saat mulai berproduksi komersial)', type: 'currency', compute: nilaiFasilitas13A, full: true },
          ],
        },
      ],
    }],
  }],
}

const lampiran13b: LampiranDef = {
  section: 'lampiran-13b',
  title: 'Lampiran 13B',
  parts: [
    {
      key: 'i',
      tab: 'I. Pengurangan bruto untuk praktik kerja',
      title: 'I. Dalam hal perusahaan mendapat fasilitas pengurangan penghasilan bruto untuk kegiatan praktik kerja, pemagangan, dan/atau pembelajaran dalam rangka pembinaan dan pengembangan sumber daya manusia berbasis kompetensi tertentu',
      blocks: [{
        kind: 'table',
        key: 'kerjaSama',
        mode: 'inline',
        columns: [
          text('nomor', 'Nomor (2)', { group: 'Uraian kerja sama', width: 180, required: true }),
          { key: 'tanggal', label: 'Tanggal (3)', type: 'date', group: 'Uraian kerja sama', width: 160 },
          text('mitra', 'Mitra kegiatan (4)', { width: 220 }),
          text('keterangan', 'Keterangan (5)', { width: 220 }),
        ],
      }],
    },
    {
      key: 'ii',
      tab: 'II. Rekapitulasi biaya praktik kerja',
      title: 'II. Rekapitulasi biaya kegiatan praktik kerja, pemagangan, dan/atau pembelajaran dalam rangka pembinaan dan pengembangan sumber daya manusia berbasis kompetensi tertentu',
      blocks: [{
        kind: 'form',
        key: 'rekap',
        headers: ['No.', 'Uraian', 'Nilai'],
        items: [
          item('1', 'Biaya kegiatan praktik kerja, pemagangan, dan/atau pembelajaran dalam rangka pembinaan dan pengembangan sumber daya manusia berbasis kompetensi tertentu', undefined, { heading: true }),
          item('a', 'Biaya penyediaan fasilitas fisik khusus berupa workshop atau tempat pelatihan sejenis lainnya terkait praktik kerja dan/atau pemagangan', 'a', { indent: 1 }),
          item('b', 'Biaya instruktur atau pengajar sebagai tenaga pembimbing pelaksanaan praktik kerja, pemagangan, dan/atau pembelajaran', 'b', { indent: 1 }),
          item('c', 'Barang dan/atau bahan untuk keperluan pelaksanaan praktik kerja, pemagangan, dan/atau pembelajaran', 'c', { indent: 1 }),
          item('d', 'Honorarium atau pembayaran sejenis yang diberikan kepada peserta praktik kerja dan/atau pemagangan', 'd', { indent: 1 }),
          item('e', 'Biaya sertifikasi serta biaya listrik, air, dan bahan bakar untuk keperluan pelaksanaan praktik kerja dan/atau pemagangan', 'e', { indent: 1 }),
          item('2', 'Total biaya terkait kegiatan-kegiatan praktik kerja, pemagangan, dan/atau pembelajaran dalam rangka pembinaan dan pengembangan sumber daya manusia berbasis kompetensi tertentu', 'total', { type: 'computed', hint: '(1a + 1b + 1c + 1d + 1e)', compute: v => ['a', 'b', 'c', 'd', 'e'].reduce((a, k) => a + num(v[k]), 0) }),
        ],
      }],
    },
    {
      key: 'iii',
      tab: 'III. Pengurangan bruto untuk penelitian',
      title: 'III. Dalam hal perusahaan mendapat fasilitas pengurangan penghasilan bruto untuk penelitian dan pengembangan',
      blocks: [{
        kind: 'table',
        key: 'litbang',
        mode: 'inline',
        numbered: false,
        columns: [
          text('proposal', 'Nomor proposal (1)', { width: 180, required: true }),
          { key: 'dari', label: 'Dari tahun (2)', type: 'year', group: 'Jangka waktu pengakuan', width: 130 },
          { key: 'sampai', label: 'Sampai tahun (3)', type: 'year', group: 'Jangka waktu pengakuan', width: 130 },
          rp('biaya', 'Total biaya (4)'),
          { key: 'tahunHaki', label: 'Tahun perolehan haki/komersialisasi (5)', type: 'year', width: 180 },
          { key: 'persen', label: 'Persentase fasilitas (6)', type: 'percent', width: 130 },
          { key: 'tambahan', label: 'Tambahan pengurangan penghasilan bruto penelitian dan pengembangan (7)', type: 'currency', width: 260, compute: r => Math.round(num(r.biaya) * num(r.persen) / 100) },
        ],
        summaries: [{ label: 'Jumlah tambahan pengurangan penghasilan bruto penelitian dan pengembangan', value: tambahanLitbang }],
      }],
    },
    {
      key: 'iv',
      tab: 'IV. Tambahan pengurang bruto',
      title: 'IV. Penghitungan tambahan pengurang penghasilan bruto tahun berjalan',
      blocks: [{
        kind: 'form',
        key: 'tambahan',
        headers: ['No.', 'Uraian', 'Nilai'],
        items: [
          item('1', 'Jumlah tambahan pengurangan penghasilan bruto penelitian dan pengembangan', 'jumlah', { type: 'computed', hint: 'Diisi dari bagian III', compute: (_, ctx) => tambahanLitbang(tableRows(ctx.section, 'litbang')) }),
          item('2', 'Jumlah tambahan pengurangan penghasilan bruto penelitian dan pengembangan yang termanfaatkan tahun-tahun sebelumnya', 'sebelumnya'),
          item('3', 'Jumlah tambahan pengurangan penghasilan bruto penelitian dan pengembangan yang belum termanfaatkan tahun berjalan (1 - 2)', 'belum', { type: 'computed', compute: belumLitbang }),
          item('4', '40% x penghasilan kena pajak sebelum fasilitas', 'batas', { type: 'computed', hint: 'Dari SPT Induk angka 9', compute: (_, ctx) => Math.round(0.4 * Math.max(0, ctx.pkpAngka9)) }),
          item('5', 'Tambahan pengurang penghasilan bruto penelitian dan pengembangan yang belum termanfaatkan tahun berjalan (maksimal sebesar angka (4))', 'dimanfaatkan', { type: 'computed', hint: 'Mengisi SPT Induk angka 10', compute: (v, ctx) => litbangDimanfaatkan(belumLitbang(v, ctx), ctx.pkpAngka9) }),
          item('6', 'Sisa tambahan pengurangan penghasilan bruto penelitian dan pengembangan yang belum termanfaatkan tahun berjalan (3 - 5)', 'sisa', { type: 'computed', compute: (v, ctx) => belumLitbang(v, ctx) - litbangDimanfaatkan(belumLitbang(v, ctx), ctx.pkpAngka9) }),
        ],
      }],
    },
  ],
}

const lampiran13c: LampiranDef = {
  section: 'lampiran-13c',
  title: 'Lampiran 13C',
  parts: [{
    key: 'main',
    title: 'Fasilitas Pengurangan PPh Terutang',
    blocks: [{
      kind: 'table',
      key: 'fasilitas',
      mode: 'inline',
      columns: [
        text('pemberianNomor', 'Nomor (2)', { group: 'Keputusan menteri keuangan pemberian fasilitas', width: 170, required: true }),
        { key: 'pemberianTanggal', label: 'Tanggal (3)', type: 'date', group: 'Keputusan menteri keuangan pemberian fasilitas', width: 160 },
        text('pemanfaatanNomor', 'Nomor (4)', { group: 'Keputusan menteri keuangan pemanfaatan fasilitas', width: 170 }),
        { key: 'pemanfaatanTanggal', label: 'Tanggal (5)', type: 'date', group: 'Keputusan menteri keuangan pemanfaatan fasilitas', width: 160 },
        { key: 'jangka', label: 'Jangka waktu fasilitas (tahun) (6)', type: 'number', width: 170 },
        { key: 'tahunKe', label: 'Pemanfaatan tahun ke- (7)', type: 'number', width: 150 },
        { key: 'persen', label: 'Persentase pengurangan PPh (8)', type: 'percent', width: 170 },
        rp('pkp', 'Penghasilan kena pajak (9)', { group: 'Perhitungan PPh terutang' }),
        { key: 'pph', label: 'PPh terutang (10)', type: 'currency', group: 'Perhitungan PPh terutang', compute: r => Math.round(0.22 * num(r.pkp)) },
        { key: 'fasilitas', label: 'Besaran fasilitas pengurangan PPh terutang (11)', type: 'currency', width: 230, compute: r => fasilitas13C(r as Row) },
      ],
      summaries: [{ label: 'Jumlah fasilitas pengurangan PPh terutang', value: rows => rows.reduce((a, r) => a + fasilitas13C(r), 0) }],
    }],
  }],
}

// ── Lampiran 14 ──────────────────────────────────────────────────────────────
const sisaBelum = (r: Record<string, unknown>) => num(r.penyediaan) - ['t1', 't2', 't3', 't4'].reduce((a, k) => a + num(r[k]), 0)
const lampiran14: LampiranDef = {
  section: 'lampiran-14',
  title: 'Lampiran 14',
  parts: [{
    key: 'main',
    title: 'Penghitungan Penggunaan Sisa Lebih',
    blocks: [{
      kind: 'table',
      key: 'sisaLebih',
      mode: 'inline',
      numbered: false,
      columns: [
        { key: 'tahun', label: 'Tahun pajak (1)', type: 'year', width: 130, required: true },
        rp('penyediaan', 'Penyediaan sisa lebih untuk ditanamkan kembali selama 4 tahun (2)', { width: 260 }),
        text('bentuk', 'Bentuk penanaman kembali sisa lebih (3)', { width: 220 }),
        ...[1, 2, 3, 4].map(i => rp(`t${i}`, `Tahun ke-${i} (${i + 3})`, { group: 'Penggunaan sisa lebih untuk pembangunan dan pengadaan sarana dan prasarana' })),
        { key: 'jumlah', label: 'Jumlah penggunaan sisa lebih (8)', type: 'currency', width: 200, compute: r => ['t1', 't2', 't3', 't4'].reduce((a, k) => a + num(r[k]), 0) },
        { key: 'belum', label: 'Sisa lebih yang belum ditanamkan kembali (9)', type: 'currency', width: 220, compute: sisaBelum },
        rp('lewat', 'Sisa lebih yang melewati jangka waktu penanaman kembali dalam jangka waktu 4 tahun (10)', { width: 300 }),
      ],
      summaries: [
        { label: 'Jumlah sisa lebih yang belum ditanamkan kembali', value: rows => rows.reduce((a, r) => a + sisaBelum(r), 0) },
        { label: 'Jumlah sisa lebih yang melewati jangka waktu penanaman kembali dalam jangka waktu 4 tahun', value: sumOf('lewat') },
        { label: 'Sisa lebih yang dapat digunakan kembali', value: rows => rows.reduce((a, r) => a + sisaBelum(r), 0) - rows.reduce((a, r) => a + num(r.lewat), 0) },
      ],
    }],
  }],
}

/** Definition for a section key, or undefined (Induk / Lampiran 1 have bespoke components). */
export function lampiranDef(section: string, year: number): LampiranDef | undefined {
  const defs: Record<string, LampiranDef> = {
    'lampiran-2': lampiran2,
    'lampiran-3': lampiran3,
    'lampiran-4': lampiran4,
    'lampiran-5': lampiran5,
    'lampiran-6': lampiran6,
    'lampiran-7': lampiran7(year),
    'lampiran-8': lampiran8,
    'lampiran-9': lampiran9,
    'lampiran-10a': lampiran10a,
    'lampiran-10b': lampiran10b,
    'lampiran-10c': lampiran10c,
    'lampiran-10d': lampiran10d,
    'lampiran-11a': lampiran11a,
    'lampiran-11b': lampiran11b,
    'lampiran-11c': lampiran11c,
    'lampiran-12a': lampiran12a,
    'lampiran-12b': lampiran12b,
    'lampiran-13a': lampiran13a,
    'lampiran-13b': lampiran13b,
    'lampiran-13c': lampiran13c,
    'lampiran-14': lampiran14,
  }
  return defs[section]
}

/**
 * Lampiran amounts that fill SPT Induk, keyed by Induk item. `null` = that lampiran has no
 * data yet, so the Induk amount stays manual.
 */
export interface LampiranLinks {
  /** Lampiran 8 angka 1 — D.12 uses Lampiran 8 when tarif (c) and this is filled. */
  pasal31eBruto: number
  /** C.2 — Lampiran 4A jumlah dasar pengenaan pajak (kolom 4). */
  c2: number | null
  /** C.3 — Lampiran 4B jumlah penghasilan bruto (kolom 5). */
  c3: number | null
  /** D.5 — Lampiran 13A angka 5b. */
  d5: number | null
  /** D.6 — Lampiran 13B bagian II angka 2. */
  d6: number | null
  /** D.8 — Lampiran 7 jumlah kolom 8 (kompensasi kerugian tahun pajak ini). */
  d8: number | null
  /** D.10 source — Lampiran 13B bagian IV angka 3; computeInduk applies the 40% cap (angka 5). */
  litbangBelum: number | null
  /** E.13 — Lampiran 3A jumlah kolom 10 + Lampiran 3B jumlah kolom 6. */
  e13: number | null
  /** E.16 — Lampiran 13C jumlah fasilitas pengurangan PPh terutang. */
  e16: number | null
}

const hasAny = (v: BlockValues, keys: string[]) => keys.some(k => v[k] !== null && v[k] !== undefined && v[k] !== '')

export function lampiranLinks(lampiran: Record<string, SectionData>): LampiranLinks {
  const at = (key: string) => lampiran[key] ?? {}
  const l3a = tableRows(at('lampiran-3'), 'luarNegeri')
  const l3b = tableRows(at('lampiran-3'), 'dipotong')
  const l4a = tableRows(at('lampiran-4'), 'final')
  const l4b = tableRows(at('lampiran-4'), 'nonObjek')
  const l7 = tableRows(at('lampiran-7'), 'kompensasi')
  const l13a = blockValues(at('lampiran-13a'), 'penanamanModal')
  const rekap13b = blockValues(at('lampiran-13b'), 'rekap')
  const litbang = tableRows(at('lampiran-13b'), 'litbang')
  const tambahan13b = blockValues(at('lampiran-13b'), 'tambahan')
  const l13c = tableRows(at('lampiran-13c'), 'fasilitas')
  const biaya13b = ['a', 'b', 'c', 'd', 'e']
  return {
    pasal31eBruto: num(blockValues(at('lampiran-8'), 'pasal31e').bruto),
    c2: l4a.length ? sumColumn(l4a, 'dpp') : null,
    c3: l4b.length ? sumColumn(l4b, 'bruto') : null,
    d5: hasAny(l13a, ['fasPersentase', 'realisasiAkumulasi']) ? nilaiFasilitas13A(l13a) : null,
    d6: hasAny(rekap13b, biaya13b) ? biaya13b.reduce((acc, k) => acc + num(rekap13b[k]), 0) : null,
    d8: l7.length ? sumColumn(l7, 'kIni') : null,
    litbangBelum: litbang.length || hasAny(tambahan13b, ['sebelumnya']) ? sisaLitbang(tambahanLitbang(litbang), tambahan13b.sebelumnya) : null,
    e13: l3a.length || l3b.length ? sumColumn(l3a, 'kredit') + sumColumn(l3b, 'pph') : null,
    e16: l13c.length ? l13c.reduce((acc, r) => acc + fasilitas13C(r), 0) : null,
  }
}

const ALL_SECTIONS = [
  'lampiran-2', 'lampiran-3', 'lampiran-4', 'lampiran-5', 'lampiran-6', 'lampiran-7', 'lampiran-8', 'lampiran-9',
  'lampiran-10a', 'lampiran-10b', 'lampiran-10c', 'lampiran-10d', 'lampiran-11a', 'lampiran-11b', 'lampiran-11c',
  'lampiran-12a', 'lampiran-12b', 'lampiran-13a', 'lampiran-13b', 'lampiran-13c', 'lampiran-14',
]

/** Empty data for every engine lampiran: [] per table block, {} per other block. */
export function emptyLampiran(): Record<string, SectionData> {
  const out: Record<string, SectionData> = {}
  for (const key of ALL_SECTIONS) {
    const def = lampiranDef(key, 0)!
    out[key] = Object.fromEntries(def.parts.flatMap(p => p.blocks.map(b => [b.key, b.kind === 'table' ? [] : {}])))
  }
  return out
}
