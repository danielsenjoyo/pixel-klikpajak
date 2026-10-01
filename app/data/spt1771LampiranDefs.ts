/**
 * Lampiran 2–14 of SPT Tahunan Badan, transcribed from Figma "SPT-Tahunan-Badan › --> SPT".
 * Rendered by components/spt/SptLampiranPage.vue through the engine in spt1771Engine.ts.
 */
import {
  atMost,
  blockValues,
  notBefore,
  pkpKenaTarif,
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
import {
  ASET_BERWUJUD,
  ASET_BERWUJUD_BANGUNAN,
  ASET_TAK_BERWUJUD,
  BENTUK_HUBUNGAN,
  HUBUNGAN_UTANG,
  BENTUK_PENANAMAN_SISA_LEBIH,
  JENIS_BIAYA_PROMOSI,
  JENIS_PAJAK_DIPOTONG,
  JENIS_TRANSAKSI,
  KATEGORI_KREDIT,
  KELOMPOK_BANGUNAN,
  MATA_UANG,
  METODE_HARGA,
  NEGARA,
  NEGARA_P3B,
  NON_OBJEK_PAJAK,
  OBJEK_PPH_FINAL,
  PENGHASILAN_LUAR_NEGERI,
  PENYUSUTAN_FISKAL,
  PENYUSUTAN_KOMERSIAL,
  codeName,
  toOptions,
} from '~/data/taxCodes'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const sumOf = (key: string) => (rows: Row[]) => rows.reduce((a, r) => a + num(r[key]), 0)
const text = (key: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({ key, label, type: 'text', ...extra })
/** Select from a reference list (data/taxCodes.ts). `withCode` shows and stores codes like "SGP". */
const code = (key: string, label: string, list: Parameters<typeof toOptions>[0], withCode: boolean, extra: Partial<FieldDef> = {}): FieldDef =>
  ({ key, label, type: 'select', options: toOptions(list, withCode), showValue: withCode, width: withCode ? 220 : 260, ...extra })
const negara = (key: string, label: string, extra: Partial<FieldDef> = {}) => code(key, label, NEGARA, true, { placeholder: 'Pilih negara', ...extra })
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
/** Yayasan / KIK are not owned through capital, so those columns do not apply. */
const berModal = (ctx: Omit<Ctx, 'section'>) => !ctx.entityType
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
        // The owner roster is managed in DJP Coretax (Pihak Terkait), so Klikpajak
        // edits an existing row's value columns only — no add, no delete.
        mode: 'drawer',
        form: 'modal',
        canAdd: false,
        canDelete: false,
        refreshable: true,
        emptyLabel: 'lampiran 2A',
        columns: [
          text('nama', 'Nama (2)', { width: 200, readOnly: true }),
          text('alamat', 'Alamat (3)', { width: 260, readOnly: true }),
          negara('kodeNegara', 'Kode Negara (4)'),
          { key: 'npwp', label: 'NPWP/TIN (5)', type: 'id', width: 180, readOnly: true },
          text('jabatan', 'Jabatan (6)', { width: 160, readOnly: true }),
          rp('modal', 'Nilai (7)', { group: 'Modal disetor', when: berModal }),
          { key: 'persen', label: '% (8)', type: 'percent', group: 'Modal disetor', width: 100, when: berModal },
          rp('dividen', 'Dividen/pembagian laba (9)', { when: berModal }),
        ],
        summaries: [
          { label: 'Jumlah modal disetor', value: sumOf('modal'), when: berModal },
          { label: 'Persentase (%)', value: sumOf('persen'), format: 'percent', when: berModal },
          { label: 'Jumlah dividen/pembagian laba', value: sumOf('dividen'), when: berModal },
        ],
      }],
    },
    {
      key: 'b',
      // Opens only on Induk H.21.c (penanaman modal afiliasi) or H.21.d (utang/piutang).
      when: ctx => !!(ctx.answers['h21.c'] || ctx.answers['h21.d']),
      tab: 'B. Daftar Penyertaan Modal',
      title: 'B. Daftar Penyertaan Modal, Utang, Dan/Atau Piutang Pada Perusahaan Afiliasi',
      blocks: [{
        kind: 'table',
        key: 'penyertaan',
        mode: 'drawer',
        emptyLabel: 'lampiran 2B',
        dedupeKey: 'npwp',
        importable: true,
        columns: [
          text('nama', 'Nama (2)', { required: true, width: 200 }),
          negara('kodeNegara', 'Kode Negara (3)', { required: true }),
          { key: 'npwp', label: 'NPWP/TIN (4)', type: 'id', width: 180, required: true },
          rp('modal', 'Nilai (5)', { group: 'Penyertaan modal' }),
          { key: 'persen', label: '% (6)', type: 'percent', group: 'Penyertaan modal', width: 100 },
          rp('utang', 'Nilai (7)', { group: 'Utang' }),
          { key: 'utangTahun', label: 'Tahun (8)', type: 'year', group: 'Utang', width: 110 },
          rp('utangBunga', 'Bunga/tahun (9)', { group: 'Utang' }),
          rp('piutang', 'Nilai (10)', { group: 'Piutang' }),
          { key: 'piutangTahun', label: 'Tahun (11)', type: 'year', group: 'Piutang', width: 110 },
          rp('piutangBunga', 'Bunga/tahun (12)', { group: 'Piutang' }),
        ],
        // The mapping sheet defines totals for Utang and Piutang only — there is
        // deliberately no Penyertaan Modal total (PRD OI-5).
        summaries: [
          { label: 'Total Utang', value: sumOf('utang') },
          { label: 'Total Piutang', value: sumOf('piutang') },
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
          negara('kodeNegara', 'Kode negara (3)', { group: 'Pemotong pajak' }),
          { key: 'tanggal', label: 'Tanggal transaksi/pembayaran PPh (4)', type: 'date', width: 170 },
          code('kodePenghasilan', 'Kode penghasilan (5)', PENGHASILAN_LUAR_NEGERI, false, { placeholder: 'Pilih jenis penghasilan' }),
          rp('netto', 'Penghasilan netto (6)'),
          rp('pajakNilai', 'Nilai (7)', { group: 'Pajak terutang/dibayar di luar negeri' }),
          code('valas', 'Valas (8)', MATA_UANG, true, { group: 'Pajak terutang/dibayar di luar negeri', placeholder: 'Pilih mata uang' }),
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
          code('jenisPajak', 'Jenis pajak (4)', JENIS_PAJAK_DIPOTONG, false, { width: 200, placeholder: 'Pilih jenis pajak' }),
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
      // C.2 "menerima penghasilan lain yang dikenakan PPh Final".
      when: ctx => !!ctx.answers.c2,
      tab: 'A. Penghasilan yang Dikenakan PPh Final',
      title: 'A. Penghasilan yang Dikenakan PPh Final',
      blocks: [{
        kind: 'table',
        key: 'final',
        mode: 'inline',
        columns: [
          code('kodeObjek', 'Kode objek pajak (2)', OBJEK_PPH_FINAL, true, { required: true, placeholder: 'Pilih objek pajak' }),
          text('objek', 'Objek pajak (3)', { width: 280, derive: r => codeName(OBJEK_PPH_FINAL, r.kodeObjek) }),
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
      // C.3 "menerima penghasilan yang bukan objek pajak".
      when: ctx => !!ctx.answers.c3,
      tab: 'B. Penghasilan yang Tidak Termasuk Objek Pajak',
      title: 'B. Penghasilan yang Tidak Termasuk Objek Pajak',
      blocks: [{
        kind: 'table',
        key: 'nonObjek',
        mode: 'inline',
        columns: [
          code('kodeJenis', 'Kode jenis penghasilan (2)', NON_OBJEK_PAJAK, true, { required: true, placeholder: 'Pilih jenis penghasilan' }),
          text('jenis', 'Jenis penghasilan (3)', { width: 280, derive: r => codeName(NON_OBJEK_PAJAK, r.kodeJenis) }),
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
        // PER-11 Lampiran 5 b)(1): "Data tempat kegiatan usaha merupakan data yang terdaftar
        // dalam administrasi Direktorat Jenderal Pajak. Jika informasi ini belum tersedia,
        // maka Wajib Pajak perlu melakukan pemutakhiran data." A missing or wrong TKU is
        // fixed in Coretax and pulled again — never typed over here.
        mode: 'drawer',
        readOnly: true,
        refreshable: true,
        emptyLabel: 'tempat kegiatan usaha',
        // Column names follow Coretax's own TKU register so the two read alike.
        columns: [
          text('niTku', 'NI TKU (2)', { width: 200 }),
          text('namaTku', 'Nama TKU (3)', { width: 200 }),
          text('alamat', 'Alamat (4)', { width: 240 }),
          text('kelurahan', 'Desa/kelurahan (5)', { width: 160 }),
          text('kecamatan', 'Kecamatan (6)', { width: 150 }),
          text('kota', 'Kota/kabupaten (7)', { width: 190 }),
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
        // One grid: a row per TKU from bagian A, then DJP's recap baris a–g.
        mode: 'inline',
        emptyLabel: 'lampiran 5B',
        derivedFrom: { block: 'tku', key: 'niTku', copy: ['namaTku'] },
        sticky: { start: 1, end: 1 },
        columns: [
          text('namaTku', 'Nama TKU (2)', { width: 220, readOnly: true }),
          ...monthCols,
          { key: 'jumlah', label: 'Jumlah (15)', type: 'currency', compute: r => MONTHS.reduce((a, _, i) => a + num(r[`m${i + 1}`]), 0) },
        ],
        recap: {
          key: 'rekap',
          totalKey: 'jumlah',
          rows: [
            // a sums the TKU rows; b–d and f are entered.
            { key: 'a', no: 'a.', label: 'Jumlah peredaran bruto', compute: (_v, ctx, col) => {
              const rows = tableRows(ctx.section, 'peredaran')
              return col === 'jumlah'
                ? monthKeys.reduce((a, k) => a + sumColumn(rows, k), 0)
                : sumColumn(rows, col)
            } },
            { key: 'b', no: 'b.', label: 'Jumlah PPh Final terutang' },
            { key: 'c', no: 'c.', label: 'Jumlah PPh Final disetor sendiri' },
            { key: 'd', no: 'd.', label: 'Jumlah PPh Final dipotong pihak lain' },
            { key: 'e', no: 'e.', label: 'Selisih', monthly: false, compute: v => selisih5B(v) },
            { key: 'f', no: 'f.', label: 'Selisih pada SPT yang dibetulkan', monthly: false },
            { key: 'g', no: 'g.', label: 'Selisih karena pembetulan', monthly: false, compute: v => selisih5B(v) - num(v['f.jumlah']) },
          ],
        },
      }],
    },
  ],
}

/**
 * Lampiran 5B baris e — PPh Final already paid less PPh Final owed, i.e. the
 * overpayment the form moves to Induk H.21.j. Baris g nets it against the amount
 * already reported on the SPT being corrected.
 * ⚠️ Derived: the DJP sheet gives the field names but not this arithmetic.
 */
const monthKeys = MONTHS.map((_, i) => `m${i + 1}`)
const rowTotal = (v: BlockValues, row: string) => monthKeys.reduce((a, k) => a + num(v[`${row}.${k}`]), 0)
const selisih5B = (v: BlockValues) => rowTotal(v, 'c') + rowTotal(v, 'd') - rowTotal(v, 'b')

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
/**
 * Pasal 31E ayat (1): a 50% rate cut on the PKP share of the first Rp4,8 miliar of gross
 * turnover — but only for a taxpayer whose turnover is at most Rp 50 miliar. PER-11 makes
 * that an eligibility condition at Induk D.11 rather than a term in this formula, so the
 * Induk hides the tarif above the ceiling; this is the backstop for a stored answer.
 */
export const BATAS_31E_MAKS = 50_000_000_000
export function hitungLampiran8(bruto: number, pkpMentah: number) {
  const pkp = pkpKenaTarif(pkpMentah)
  const eligible = bruto > 0 && bruto <= BATAS_31E_MAKS
  const fasilitas = eligible ? Math.round(Math.min(1, BATAS_31E / bruto) * pkp) : 0
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
const L9_BERWUJUD_GROUPS = [
  { value: 'hk1', label: 'A. Kelompok 1', heading: 'I. Harta berwujud' },
  { value: 'hk2', label: 'B. Kelompok 2' },
  { value: 'hk3', label: 'C. Kelompok 3' },
  { value: 'hk4', label: 'D. Kelompok 4' },
  { value: 'hkl', label: 'E. Kelompok lain' },
  { value: 'bp', label: 'A. Permanen', heading: 'II. Kelompok bangunan' },
  { value: 'bt', label: 'B. Tidak permanen' },
]
const L9_TAK_BERWUJUD_GROUPS = [
  { value: 'tk1', label: 'A. Kelompok 1', heading: 'III. Harta tak berwujud' },
  { value: 'tk2', label: 'B. Kelompok 2' },
  { value: 'tk3', label: 'C. Kelompok 3' },
  { value: 'tk4', label: 'D. Kelompok 4' },
  { value: 'tkl', label: 'E. Kelompok lain' },
]

/** Every option names its section, so "B. Kelompok 2" is never ambiguous. */
function l9GroupOptions(groups: typeof L9_BERWUJUD_GROUPS) {
  let heading = ''
  return groups.map((g) => {
    if (g.heading) heading = g.heading
    return { value: g.value, label: `${heading} — ${g.label}` }
  })
}

const L9_ALL_GROUPS = [...L9_BERWUJUD_GROUPS, ...L9_TAK_BERWUJUD_GROUPS]
/**
 * Both tables read one asset list, so a single "Tambah data" can file a row into
 * either. Codes are disjoint across the registers (4xx berwujud, 5xx bangunan,
 * 6xx tak berwujud), so one Kode aset list serves them all.
 */
const ASET_SEMUA = [...ASET_BERWUJUD, ...KELOMPOK_BANGUNAN, ...ASET_TAK_BERWUJUD]

/** Fiscal depreciation of the rows in the given categories. */
const totalPenyusutan = (ctx: Ctx, groups: string[]) =>
  tableRows(ctx.section, 'aset').filter(r => groups.includes(String(r.kelompok ?? ''))).reduce((a, r) => a + num(r.penyusutan), 0)
const L9_BERWUJUD_KEYS = L9_BERWUJUD_GROUPS.map(g => g.value)
const L9_TAK_BERWUJUD_KEYS = L9_TAK_BERWUJUD_GROUPS.map(g => g.value)

/**
 * Lampiran 9 baris c + f — selisih penyusutan and selisih amortisasi, both fiskal less
 * komersial. Lampiran 1's "Beban Penyusutan dan Amortisasi" correction should account for
 * the same amount; `ctx.section` must be Lampiran 9's own data.
 */
export function selisihPenyusutanL9(ctx: Ctx): number {
  const berwujud = blockValues(ctx.section, 'rekapBerwujud')
  const takBerwujud = blockValues(ctx.section, 'rekapTakBerwujud')
  return (totalPenyusutan(ctx, L9_BERWUJUD_KEYS) - num(berwujud['b.penyusutan']))
    + (totalPenyusutan(ctx, L9_TAK_BERWUJUD_KEYS) - num(takBerwujud['e.penyusutan']))
}

/** The nine DJP columns, shared by both registers. */
const asetColumns = (groups: typeof L9_BERWUJUD_GROUPS, aset: Parameters<typeof toOptions>[0]): FieldDef[] => [
  { key: 'kelompok', label: 'Kelompok aset', type: 'select', options: l9GroupOptions(groups), required: true, formOnly: true, placeholder: 'Pilih kelompok aset' },
  code('kode', 'Kode aset (1)', aset, true, { required: true, placeholder: 'Pilih kode aset' }),
  text('jenis', 'Kelompok/jenis aset (2)', { width: 200, derive: r => codeName(aset, r.kode) }),
  { key: 'perolehan', label: 'Bulan/tahun perolehan (3)', type: 'month', width: 160 },
  rp('biaya', 'Biaya perolehan (4)'),
  rp('sisaBuku', 'Nilai sisa buku fiskal pada awal tahun (5)'),
  code('metodeKomersial', 'Komersial (6)', PENYUSUTAN_KOMERSIAL, false, { group: 'Metode penyusutan/amortisasi', width: 200 }),
  code('metodeFiskal', 'Fiskal (7)', PENYUSUTAN_FISKAL, false, { group: 'Metode penyusutan/amortisasi', width: 200 }),
  rp('penyusutan', 'Penyusutan/amortisasi fiskal tahun ini (8)'),
  text('keterangan', 'Keterangan (9)', { width: 180 }),
]

const lampiran9: LampiranDef = {
  section: 'lampiran-9',
  title: 'Lampiran 9',
  parts: [{
    key: 'main',
    blocks: [
      {
        kind: 'table',
        key: 'berwujud',
        dataKey: 'aset',
        title: 'Harta berwujud dan bangunan',
        mode: 'drawer',
        emptyLabel: 'harta',
        numbered: false,
        groupBy: { key: 'kelompok', options: L9_BERWUJUD_GROUPS },
        // The one add button lives here and offers every category; a tak-berwujud
        // row files itself into the table below.
        columns: asetColumns(L9_ALL_GROUPS, ASET_SEMUA),
        recap: {
          key: 'rekapBerwujud',
          totalKey: 'penyusutan',
          placement: 'footer',
          rows: [
            { key: 'a', no: 'a.', label: 'Jumlah penyusutan fiskal', valueKey: 'penyusutan', compute: (_v, ctx) => totalPenyusutan(ctx, L9_BERWUJUD_KEYS) },
            { key: 'b', no: 'b.', label: 'Jumlah penyusutan komersial', valueKey: 'penyusutan' },
            { key: 'c', no: 'c.', label: 'Selisih penyusutan (a - b)', valueKey: 'penyusutan', compute: (v, ctx) => totalPenyusutan(ctx, L9_BERWUJUD_KEYS) - num(v['b.penyusutan']) },
          ],
        },
      },
      {
        kind: 'table',
        key: 'takBerwujud',
        dataKey: 'aset',
        title: 'Harta tak berwujud',
        mode: 'drawer',
        emptyLabel: 'harta',
        numbered: false,
        canAdd: false,
        groupBy: { key: 'kelompok', options: L9_TAK_BERWUJUD_GROUPS },
        columns: asetColumns(L9_ALL_GROUPS, ASET_SEMUA),
        recap: {
          key: 'rekapTakBerwujud',
          totalKey: 'penyusutan',
          placement: 'footer',
          rows: [
            { key: 'd', no: 'd.', label: 'Jumlah amortisasi fiskal', valueKey: 'penyusutan', compute: (_v, ctx) => totalPenyusutan(ctx, L9_TAK_BERWUJUD_KEYS) },
            { key: 'e', no: 'e.', label: 'Jumlah amortisasi komersial', valueKey: 'penyusutan' },
            { key: 'f', no: 'f.', label: 'Selisih amortisasi (d - e)', valueKey: 'penyusutan', compute: (v, ctx) => totalPenyusutan(ctx, L9_TAK_BERWUJUD_KEYS) - num(v['e.penyusutan']) },
          ],
        },
      },
    ],
  }],
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
        negara('kodeNegara', 'Kode negara (4)'),
        code('kodeHubungan', 'Kode bentuk hubungan (5)', BENTUK_HUBUNGAN, false, { placeholder: 'Pilih bentuk hubungan' }),
        text('kegiatan', 'Kegiatan usaha (6)', { width: 180 }),
        code('kodeTransaksi', 'Kode jenis transaksi (7)', JENIS_TRANSAKSI, false, { placeholder: 'Pilih jenis transaksi' }),
        rp('nilai', 'Nilai transaksi (8)'),
        code('kodeHarga', 'Kode penetapan harga yang digunakan (9)', METODE_HARGA, true, { width: 260, placeholder: 'Pilih metode' }),
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
      // PER-11 Lampiran 10B b): "diisi dengan memilih jawaban (YA/TIDAK) ... dari setiap
      // pernyataan yang ada" — every one of the fifteen, not just the ones that apply.
      required: true,
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
          negara('kodeNegara', 'Kode negara (4)'),
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
          code('bentuk', 'Bentuk dan jenis biaya (6)', JENIS_BIAYA_PROMOSI, false, { width: 240, placeholder: 'Pilih jenis biaya' }),
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
            code('jenis', 'Jenis harta berwujud (2)', ASET_BERWUJUD_BANGUNAN, true, { required: true, placeholder: 'Pilih jenis harta' }),
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
          code('kategori', 'Kategori (8)', KATEGORI_KREDIT, false, { width: 180, placeholder: 'Pilih kategori' }),
        ],
        totals: ['awal', 'akhir', 'bunga'],
      }],
    },
  ],
}

const avg12 = (r: Record<string, unknown>) => Math.round(Array.from({ length: 12 }, (_, i) => num(r[`b${i + 1}`])).reduce((a, b) => a + b, 0) / 12)

/**
 * L11B I angka 5. Each of the first three lines takes its linked source while that source
 * has data, and what was typed otherwise — `linked` only changes what a row *displays*,
 * so a total over the stored values alone would read the stale figure.
 */
const ebitdaValue = (v: BlockValues, ctx: Ctx) =>
  (ctx.labaKomersial || num(v.neto))
  + (ctx.penyusutanKomersial || num(v.penyusutan))
  + (ctx.pphTerutang || num(v.pajak))
  + num(v.pinjaman)

/** L11B III kolom (2) — this lender's own rata-rata from bagian II.A (PER-11 III(b)). */
const saldoRataLender = (r: Record<string, unknown>, ctx: Ctx) => {
  const name = String(r.nama ?? '').trim()
  const row = tableRows(ctx.section, 'utang').find(x => String(x.nama ?? '').trim() === name)
  return row ? avg12(row) : 0
}

/** PMK 169/2015 — borrowing costs above a 4:1 debt-to-equity ratio are not deductible. */
export const DER_MAKS = 4

/**
 * L11B II.C — average debt, average equity and their ratio. `ctx.section` must be
 * Lampiran 11B's own data. The ratio is null while there is no equity to divide by.
 */
export function derL11b(ctx: Ctx): { utang: number, modal: number, ratio: number | null } {
  const utang = avgRows(ctx, 'utang')
  const modal = avgRows(ctx, 'modal')
  return { utang, modal, ratio: modal ? utang / modal : null }
}
/**
 * PER-11 Lampiran 11B II heads these columns "SALDO UTANG TIAP AKHIR BULAN (Rp)" and says
 * each is "diisi dengan saldo utang pada akhir bulan yang bersangkutan dalam mata uang
 * rupiah" — whole rupiah, not millions. The old "(dalam jutaan rupiah)" heading disagreed
 * with the Rp input under it and with the regulation; OI-L11Bunit resolves this way.
 */
const bulanCols = (offset: number, of: 'utang' | 'modal'): FieldDef[] =>
  Array.from({ length: 12 }, (_, i) => rp(`b${i + 1}`, `Bulan ke-${i + 1} (${i + offset})`, { group: `Saldo ${of} tiap akhir bulan (Rp)`, width: 170 }))
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
          // PER-11 Lampiran 11B I(a)(b)(c): the first three lines are not judgement calls —
          // two are Lampiran 1's commercial column and one is Induk D.12. They stay typeable
          // while their source is still empty, because PER-11 also lets the whole of bagian I
          // be filed as 0 when no EBITDA method is prescribed for the year.
          item('1', 'Penghasilan neto komersial', 'neto', { linked: ctx => ctx.labaKomersial || null, hint: 'Diisi dari Lampiran 1 — Laba (Rugi) Sebelum Pajak, kolom (3)' }),
          item('2', 'Beban penyusutan dan amortisasi', 'penyusutan', { linked: ctx => ctx.penyusutanKomersial || null, hint: 'Diisi dari Lampiran 1 — Beban Penyusutan dan Amortisasi, kolom (3)' }),
          item('3', 'Beban pajak penghasilan', 'pajak', { linked: ctx => ctx.pphTerutang || null, hint: 'Diisi dari SPT Induk angka 12' }),
          item('4', 'Beban biaya pinjaman', 'pinjaman'),
          item('5', 'EBITDA', 'ebitda', { type: 'computed', compute: ebitdaValue }),
          item('6', 'EBITDA (25%)', 'ebitda25', { type: 'computed', compute: (v, ctx) => Math.round(0.25 * ebitdaValue(v, ctx)) }),
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
          key: 'utang',
          title: 'A. Penghitungan rata-rata saldo utang',
          mode: 'inline',
          numbered: false,
          columns: [
            { key: 'identitas', label: 'Nomor identitas (NPWP/NIK/lainnya) (1)', type: 'id', group: 'Pemberi pinjaman', width: 200 },
            text('nama', 'Nama (2)', { group: 'Pemberi pinjaman', width: 200, required: true }),
            code('hubungan', 'Hubungan (3)', HUBUNGAN_UTANG, false, { group: 'Pemberi pinjaman', width: 160, placeholder: 'Pilih hubungan' }),
            ...bulanCols(4, 'utang'),
            { key: 'rata', label: 'Rata-rata (16)', type: 'currency', compute: avg12 },
          ],
          totals: ['rata'],
        },
        {
          kind: 'table',
          key: 'modal',
          title: 'B. Penghitungan rata-rata saldo modal',
          mode: 'inline',
          numbered: false,
          columns: [
            text('rincian', 'Rincian modal (1)', { width: 200, required: true }),
            ...bulanCols(2, 'modal'),
            { key: 'rata', label: 'Rata-rata (14)', type: 'currency', compute: avg12 },
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
          // PER-11 III(a)/(b): the lender and its average balance are "sesuai dengan Bagian
          // II.A" — one row per lender there, so neither is re-entered here.
          derivedFrom: { block: 'utang', key: 'nama' },
          columns: [
            text('nama', 'Pemberi pinjaman (1)', { width: 220, readOnly: true }),
            { key: 'saldo', label: 'Saldo rata-rata utang (2)', type: 'currency', compute: saldoRataLender },
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
        negara('negara', 'Negara/yuridiksi (4)', { group: 'Pemberi pinjaman' }),
        code('kodeValas', 'Kode (5)', MATA_UANG, true, { group: 'Mata uang', placeholder: 'Pilih mata uang' }),
        rp('kurs', 'Kurs akhir tahun (6)', { group: 'Mata uang' }),
        { key: 'awal', label: 'Awal tahun (7)', type: 'usd', group: 'Pokok utang (USD)' },
        { key: 'tambah', label: 'Penambahan (8)', type: 'usd', group: 'Pokok utang (USD)' },
        { key: 'kurang', label: 'Pengurangan (9)', type: 'usd', group: 'Pokok utang (USD)' },
        { key: 'akhir', label: 'Akhir tahun (10)', type: 'usd', group: 'Pokok utang (USD)', compute: r => num(r.awal) + num(r.tambah) - num(r.kurang) },
        { key: 'mulai', label: 'Tanggal mulai (11)', type: 'date', group: 'Jangka waktu pinjaman', width: 160 },
        {
          key: 'jatuhTempo',
          label: 'Tanggal jatuh tempo (12)',
          type: 'date',
          group: 'Jangka waktu pinjaman',
          width: 170,
          validate: notBefore('mulai', 'Tanggal jatuh tempo tidak boleh lebih awal dari tanggal mulai.'),
        },
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
/** L12A angka 2 — Induk D.12 while the Induk has a figure, else what was entered here. */
const pphBadan12A = (v: BlockValues, ctx: Ctx) => ctx.pphTerutang || num(v.pphBadan)

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
        item(undefined, 'Kode negara kantor pusat', 'kodeNegara', { type: 'select', options: toOptions(NEGARA) }),
        item('1', 'Penghasilan neto fiskal', 'neto', { type: 'computed', compute: (_, ctx) => ctx.penghasilanNeto, hint: 'Diisi dari SPT Induk angka 4' }),
        // PER-11 Lampiran 12A angka 2: "dipindahkan dari formulir INDUK Bagian D angka 12".
        // Typeable while the Induk still shows nothing, and for the final-tax variants where
        // PER-11 sends the figure from Lampiran 4 instead.
        item('2', 'PPh badan terutang', 'pphBadan', { linked: ctx => ctx.pphTerutang || null, hint: 'Diisi dari SPT Induk angka 12' }),
        item('3', 'Dasar pengenaan pajak PPh Pasal 26 Ayat (4) (1 - 2)', 'dpp', { type: 'computed', compute: (v, ctx) => ctx.penghasilanNeto - pphBadan12A(v, ctx) }),
        item('4', 'PPh Pasal 26 Ayat (4)', undefined, { heading: true }),
        item('a', 'Terutang: tarif x jumlah pada angka (3)', 'tarif', { indent: 1, type: 'percent', hint: 'Isi tarif (%) sesuai UU PPh atau P3B' }),
        item(undefined, 'PPh Pasal 26 Ayat (4) terutang', 'terutang', { indent: 1, type: 'computed', compute: (v, ctx) => Math.round(num(v.tarif) / 100 * (ctx.penghasilanNeto - pphBadan12A(v, ctx))) }),
        item('b', 'Tidak terutang, berdasarkan:', undefined, { heading: true, indent: 1 }),
        item('1)', 'Ketentuan P3B Indonesia - (kode negara)', 'p3b', { indent: 2, type: 'select', options: toOptions(NEGARA_P3B) }),
        item('2)', 'Ditanamkan kembali seluruhnya di Indonesia', undefined, { heading: true, indent: 2 }),
        item('a)', 'Ditanamkan kembali pada perusahaan baru di Indonesia — NPWP', 'npwpBaru', { indent: 2, type: 'id' }),
        item('b)', 'Ditanamkan kembali pada perusahaan yang sudah berdiri di Indonesia — NPWP', 'npwpLama', { indent: 2, type: 'id' }),
        item('c)', 'Ditanamkan kembali dalam bentuk perolehan aset tetap', 'asetTetap', { indent: 2 }),
        item('d)', 'Ditanamkan kembali dalam bentuk aset tak berwujud', 'asetTakBerwujud', { indent: 2 }),
      ],
    }],
  }],
}

/** L12B IV.a — the four reinvestment forms, reused as the IV.b realisasi picker. */
const BENTUK_PENANAMAN = [
  { value: 'perusahaanBaru', label: 'Penyertaan modal pada perusahaan yang baru didirikan dan berkedudukan di Indonesia' },
  { value: 'perusahaanLama', label: 'Penyertaan modal pada perusahaan yang sudah didirikan dan berkedudukan di Indonesia' },
  { value: 'asetTetap', label: 'Pembelian aset tetap yang digunakan oleh bentuk usaha tetap untuk menjalankan usaha' },
  { value: 'asetTakBerwujud', label: 'Investasi dalam bentuk aset tak berwujud oleh bentuk usaha tetap untuk menjalankan usaha' },
]

/**
 * PER-11 Lampiran 12B a): each detail section is "diisi dalam hal Wajib Pajak BUT telah
 * melakukan penanaman kembali dalam bentuk …", so V–VIII follow the boxes ticked in IV.a.
 */
const bentukDipilih = (key: string) => (ctx: Ctx) => blockValues(ctx.section, 'but')[key] === true

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
        {
          title: 'IV. a. Bentuk penanaman modal',
          fields: BENTUK_PENANAMAN.map(o => ({ key: o.value, label: o.label, type: 'checkbox' as const, full: true })),
        },
      ],
    }, {
      kind: 'table',
      key: 'realisasi',
      title: 'IV. b. Realisasi penanaman kembali yang telah dilakukan',
      mode: 'inline',
      columns: [
        { key: 'bentuk', label: 'Bentuk penanaman kembali (2)', type: 'select', options: BENTUK_PENANAMAN, width: 320, required: true },
        rp('nilai', 'Nilai realisasi (3)'),
        { key: 'tahun', label: 'Tahun realisasi (4)', type: 'year', width: 130 },
      ],
      totals: ['nilai'],
    }, {
      kind: 'table',
      key: 'perusahaanBaru',
      when: bentukDipilih('perusahaanBaru'),
      title: 'V. Penanaman kembali dalam bentuk penyertaan modal pada perusahaan yang baru didirikan',
      mode: 'drawer',
      columns: [
        text('nama', 'Nama perusahaan (2)', { width: 220, required: true }),
        { key: 'npwp', label: 'NPWP (3)', type: 'id', width: 180 },
        text('alamat', 'Alamat (4)', { width: 260 }),
        text('jenisUsaha', 'Jenis usaha (5)', { width: 180 }),
        text('akteNomor', 'Nomor (6)', { group: 'Akte pendirian', width: 170 }),
        { key: 'akteTanggal', label: 'Tanggal (7)', type: 'date', group: 'Akte pendirian', width: 150 },
        text('notaris', 'Notaris (8)', { group: 'Akte pendirian', width: 200 }),
        rp('investasi', 'Nilai investasi (9)'),
        text('mulaiOperasi', 'Masa perusahaan mulai aktif beroperasi/berproduksi komersial (10)', { width: 220 }),
      ],
      totals: ['investasi'],
    }, {
      kind: 'table',
      key: 'perusahaanLama',
      when: bentukDipilih('perusahaanLama'),
      title: 'VI. Penanaman kembali dalam bentuk penyertaan modal pada perusahaan yang sudah didirikan',
      mode: 'drawer',
      columns: [
        text('nama', 'Nama perusahaan (2)', { width: 220, required: true }),
        { key: 'npwp', label: 'NPWP (3)', type: 'id', width: 180 },
        text('alamat', 'Alamat (4)', { width: 260 }),
        text('jenisUsaha', 'Jenis usaha (5)', { width: 180 }),
        text('akteNomor', 'Nomor (6)', { group: 'Akte penyertaan modal', width: 170 }),
        { key: 'akteTanggal', label: 'Tanggal (7)', type: 'date', group: 'Akte penyertaan modal', width: 150 },
        text('notaris', 'Notaris (8)', { group: 'Akte penyertaan modal', width: 200 }),
        rp('investasi', 'Nilai investasi (9)'),
        text('mulaiOperasi', 'Masa perusahaan mulai aktif beroperasi (10)', { width: 220 }),
        { key: 'bursa', label: 'Ya/Tidak (11)', type: 'yesno', group: 'Terdaftar di bursa efek', width: 130 },
        text('namaBursa', 'Nama bursa efek (12)', { group: 'Terdaftar di bursa efek', width: 200 }),
      ],
      totals: ['investasi'],
    }, {
      kind: 'table',
      key: 'asetTetap',
      when: bentukDipilih('asetTetap'),
      title: 'VII. Penanaman kembali dalam bentuk aset tetap',
      mode: 'drawer',
      columns: [
        text('jenis', 'Jenis aset tetap (2)', { width: 220, required: true }),
        text('lokasi', 'Lokasi aset tetap (3)', { width: 240 }),
        { key: 'kuantitas', label: 'Kuantitas (4)', type: 'number', width: 130 },
        rp('nilai', 'Nilai aset tetap (5)'),
        text('buktiNomor', 'Nomor (6)', { group: 'Bukti kepemilikan aset tetap', width: 170 }),
        { key: 'buktiTanggal', label: 'Tanggal (7)', type: 'date', group: 'Bukti kepemilikan aset tetap', width: 150 },
        text('akteNomor', 'Nomor (8)', { group: 'Akte pembelian', width: 170 }),
        { key: 'akteTanggal', label: 'Tanggal (9)', type: 'date', group: 'Akte pembelian', width: 150 },
      ],
      totals: ['nilai'],
    }, {
      kind: 'table',
      key: 'asetTakBerwujud',
      when: bentukDipilih('asetTakBerwujud'),
      title: 'VIII. Penanaman kembali dalam bentuk aset tak berwujud',
      mode: 'inline',
      columns: [
        text('jenis', 'Jenis aset (2)', { width: 240, required: true }),
        rp('nilai', 'Nilai investasi (3)'),
        text('uraian', 'Uraian (4)', { width: 320 }),
      ],
      totals: ['nilai'],
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
      // Bagian I and II are the vocational facility — Induk D.6.
      when: ctx => !!ctx.answers.d6,
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
      when: ctx => !!ctx.answers.d6,
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
      // Bagian III and IV are the research facility — Induk D.10.
      when: ctx => !!ctx.answers.d10,
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
          // PER-11 Lampiran 13B C(e): this column is the *tambahan* (additional) deduction,
          // capped at 200%. The headline 300% is the total, which already includes the
          // ordinary 100% the account itself carries. PER-11 lists 200/175/150/125/100/75/
          // 50/25 "antara lain", so the list guides but only the ceiling is enforced.
          {
            key: 'persen',
            label: 'Persentase fasilitas (6)',
            type: 'percent',
            width: 130,
            validate: atMost(200, 'Maksimal 200%. Nilai yang lazim: 200, 175, 150, 125, 100, 75, 50, atau 25.'),
          },
          { key: 'tambahan', label: 'Tambahan pengurangan penghasilan bruto penelitian dan pengembangan (7)', type: 'currency', width: 260, compute: r => Math.round(num(r.biaya) * num(r.persen) / 100) },
        ],
        summaries: [{ label: 'Jumlah tambahan pengurangan penghasilan bruto penelitian dan pengembangan', value: tambahanLitbang }],
      }],
    },
    {
      key: 'iv',
      when: ctx => !!ctx.answers.d10,
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
        code('bentuk', 'Bentuk penanaman kembali sisa lebih (3)', BENTUK_PENANAMAN_SISA_LEBIH, false, { width: 280, placeholder: 'Pilih bentuk penanaman' }),
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
/**
 * Storage slots one lampiran needs, in place. The renderer calls this on open and the empty
 * draft is built from it, so the two agree — when they did not, merely opening Lampiran 5 or
 * 9 created keys the saved copy lacked and the page announced unsaved changes before the
 * preparer had typed anything.
 *
 * A table's rows live under `dataKey` when it shares a store with another table (Lampiran 9
 * keeps one asset list behind two grids), and its recap rows under their own key.
 */
export function seedSection(def: LampiranDef, data: SectionData): SectionData {
  for (const part of def.parts) {
    for (const b of part.blocks) {
      const store = b.kind === 'table' ? b.dataKey ?? b.key : b.key
      if (data[store] === undefined) data[store] = b.kind === 'table' ? [] : {}
      if (b.kind === 'table' && b.recap && data[b.recap.key] === undefined) data[b.recap.key] = {}
    }
  }
  return data
}

export function emptyLampiran(year: number): Record<string, SectionData> {
  const out: Record<string, SectionData> = {}
  for (const key of ALL_SECTIONS) {
    const def = lampiranDef(key, year)
    if (def) out[key] = seedSection(def, {})
  }
  return out
}

/**
 * Rows a `derivedFrom` table mirrors from its source, seeded at the same time as the source
 * itself. The renderer would otherwise create them on first open — a write to the draft that
 * the preparer never made.
 */
export function seedDerived(lampiran: Record<string, SectionData>, year: number, newId: () => string) {
  for (const [key, data] of Object.entries(lampiran)) {
    const def = lampiranDef(key, year)
    if (!def) continue
    for (const part of def.parts) {
      for (const b of part.blocks) {
        if (b.kind !== 'table' || !b.derivedFrom) continue
        const d = b.derivedFrom
        const source = data[d.block]
        if (!Array.isArray(source)) continue
        data[b.dataKey ?? b.key] = source
          .filter(r => String(r[d.key] ?? '').trim())
          .map((r) => {
            const row: Row = { id: newId(), [d.key]: r[d.key] }
            for (const f of d.copy ?? []) row[f] = r[f]
            return row
          })
      }
    }
  }
}
