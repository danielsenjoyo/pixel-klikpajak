/**
 * The DJP import templates of SPT Tahunan Badan, one spec each, transcribed from the
 * templates linked in the 1-pager "SPT Tahunan Badan (2)" (Confluence PD/50668830735):
 *
 *   6.  CIT_L9_Depreciation_And_Amortization_Template      → Lampiran 9
 *   7.  CIT_L1A_UMUM (Laba Rugi / Aset / Liabilitas, ×12 sektor) → Lampiran 1
 *   8.  CIT_L11A_Promotion_Expense_Template                → Lampiran 11A I
 *   9.  CIT_L11A_Entertainment_Expense_Template            → Lampiran 11A II
 *   10. CIT_L11A_Non_Performing_Loan_Debtors_Template      → Lampiran 11A V
 *   11. CIT_L11A_Uncollectible_Debt_Template               → Lampiran 11A III
 *   12. CIT_L10A_Declaration Of Transaction Related Parties → Lampiran 10A
 *
 * Headers ("Kolom pada excel"), Coretax field names ("Kolom pada xml"), hints and
 * validation text are DJP's own. The 1-pager labels items 9–11 all "Import Lampiran 11A";
 * the files themselves say which part each one fills.
 */
import type { Row } from '~/data/spt1771Engine'
import {
  checkPreamble,
  cellAmount,
  djpCode,
  cellText,
  matchCode,
  norm,
  preambleRows,
  listImport,
  type Code,
  type ImportColumn,
  type ImportIssue,
  type ImportSpec,
} from '~/data/spt1771Import'
import {
  SEKTOR_USAHA,
  labaRugiValue,
  sectorRows,
  type Lampiran1Data,
  type RowValues,
} from '~/data/spt1771Lampiran1'
import {
  ASET_BERWUJUD,
  ASET_TAK_BERWUJUD,
  BENTUK_HUBUNGAN,
  JENIS_BIAYA_PROMOSI,
  JENIS_PEMENUHAN,
  JENIS_TRANSAKSI,
  KATEGORI_KREDIT,
  KELOMPOK_BANGUNAN,
  KODE_KOREKSI_FISKAL,
  METODE_HARGA,
  METODE_PENGHAPUSAN,
  NEGARA,
  PENYUSUTAN_FISKAL,
  PENYUSUTAN_KOMERSIAL,
} from '~/data/taxCodes'
import type { Cell, SheetSpec } from '~/utils/xlsx'

const num = (v: unknown) => (typeof v === 'number' ? v : 0)

// Shared columns ───────────────────────────────────────────────────────────────
const identitas = (hint: string): ImportColumn => ({ header: 'Nomor Identitas', xml: 'IdentityNumber', key: 'identitas', type: 'id', hint, example: '0948684709012000' })
const alamat = (hint: string): ImportColumn => ({ header: 'Alamat', xml: 'Address', key: 'alamat', type: 'text', hint, example: 'Jl. Gatot Subroto Kav. 40-42, Jakarta Selatan' })

// ── Lampiran 9 — Daftar penyusutan dan amortisasi fiskal ─────────────────────
/**
 * DJP's "Kelompok Aset" values. Stored per grid: the two lists share one `aset` block and
 * the kelompok is what files a row into the berwujud or tak-berwujud table (spt1771LampiranDefs).
 */
const KELOMPOK_PENYUSUTAN: Code[] = [
  { code: 'Group 1', name: 'Kelompok 1' },
  { code: 'Group 2', name: 'Kelompok 2' },
  { code: 'Group 3', name: 'Kelompok 3' },
  { code: 'Group 4', name: 'Kelompok 4' },
  { code: 'Other Group', name: 'Kelompok Lainnya' },
  { code: 'Permanent', name: 'Bangunan Permanen' },
  { code: 'Non-permanent', name: 'Bangunan Tidak Permanen' },
]
const KELOMPOK_AMORTISASI = KELOMPOK_PENYUSUTAN.slice(0, 5)
const KELOMPOK_KEY: Record<string, [penyusutan: string, amortisasi: string]> = {
  'Group 1': ['hk1', 'tk1'],
  'Group 2': ['hk2', 'tk2'],
  'Group 3': ['hk3', 'tk3'],
  'Group 4': ['hk4', 'tk4'],
  'Other Group': ['hkl', 'tkl'],
  'Permanent': ['bp', ''],
  'Non-permanent': ['bt', ''],
}
const BANGUNAN = new Set(KELOMPOK_BANGUNAN.map(c => c.code))

const RUPIAH_HINT = 'jika SPT Rupiah maka nilai desimal akan dibulatkan komersial satuan penuh'

function l9Columns(kind: 'penyusutan' | 'amortisasi'): ImportColumn[] {
  const berwujud = kind === 'penyusutan'
  const what = berwujud ? 'aset berwujud' : 'aset tidak berwujud'
  return [
    {
      header: 'Kode Aset', xml: 'CodeOfAsset', key: 'kode', type: 'code', required: true, codeWidth: 4,
      codes: berwujud ? [...ASET_BERWUJUD, ...KELOMPOK_BANGUNAN] : ASET_TAK_BERWUJUD,
      codesTitle: berwujud ? 'Code Of Asset Depreciation / Kode Aset Penyusutan' : 'Code Of Asset Amortization / Kode Aset Tidak Berwujud',
      hint: `Diisi dengan kode ${what} sesuai referensi`, example: berwujud ? '0401' : '0601',
      rule: berwujud ? '4 digit angka sesuai kode referensi. Kode 0502, 0503, 0504, 0505 dan 0599 (bangunan) wajib berkelompok "Permanent" atau "Non-permanent".' : '4 digit angka sesuai kode referensi',
    },
    {
      header: 'Kelompok Aset', xml: 'GroupOfAsset', key: 'kelompok', type: 'code', required: true,
      codes: berwujud ? KELOMPOK_PENYUSUTAN : KELOMPOK_AMORTISASI,
      codesTitle: berwujud ? 'Group Of Asset Depreciation / Kelompok Aset' : 'Group Of Asset Amortization / Kelompok Aset',
      hint: `Diisi dengan kelompok ${what} sesuai referensi`, example: 'Group 1',
    },
    { header: 'Bulan Perolehan', xml: 'MonthOfAcquisition', key: 'bulan', type: 'int', min: 1, max: 12, required: true, hint: `Diisi dengan bulan diperolehnya ${what}`, example: 1 },
    { header: 'Tahun Perolehan', xml: 'YearOfAcquisition', key: 'tahun', type: 'int', min: 1900, max: 9999, required: true, hint: `Diisi dengan tahun diperolehnya ${what}`, example: 2023, rule: '4 digit angka, tidak melewati tahun pajak' },
    { header: 'Harga Perolehan', xml: 'AcquisitionPrice', key: 'biaya', type: 'amount', hint: `Diisi dengan harga perolehan ${what}`, example: 200000000 },
    { header: 'Nilai Sisa Buku', xml: 'RemainingValue', key: 'sisaBuku', type: 'amount', hint: `Diisi dengan nilai sisa buku ${what}`, example: 100000000 },
    {
      header: 'Metode Komersial', xml: 'CommercialMethode', key: 'metodeKomersial', type: 'code', codes: PENYUSUTAN_KOMERSIAL,
      codesTitle: berwujud ? 'Commercial Methode Depreciation / Metode penyusutan komersial' : 'Commercial Methode Amortization / Metode amortisasi komersial',
      hint: `Diisi dengan metode ${berwujud ? 'penyusutan' : 'amortisasi'} komersial ${what}`, example: 'SM',
    },
    {
      header: 'Metode Fiskal', xml: 'FiscalMethode', key: 'metodeFiskal', type: 'code', codes: PENYUSUTAN_FISKAL,
      codesTitle: berwujud ? 'Fiscal Methode Depreciation / Metode penyusutan fiskal' : 'Fiscal Methode Amortization / Metode amortisasi fiskal',
      hint: `Diisi dengan metode ${berwujud ? 'penyusutan' : 'amortisasi'} fiskal ${what}`, example: 'GL',
    },
    { header: 'Penyusutan Fiskal', xml: 'FiscalDepretiationThisYear', key: 'penyusutan', type: 'amount', hint: `Diisi dengan nilai ${berwujud ? 'penyusutan' : 'amortisasi'} fiskal ${what} tahun ini`, example: 50000000 },
    { header: 'Keterangan', xml: 'Notes', key: 'keterangan', type: 'text', hint: `Diisi dengan keterangan ${what}`, example: berwujud ? 'Mobil Toyota Avanza B 1234 SOQ' : 'Merk dagang abc' },
  ]
}

/** Bulan + tahun → the grid's `MM/YYYY`; DJP group → the grid's kelompok key. */
function l9Finish(kind: 'penyusutan' | 'amortisasi') {
  return (row: Row, ctx: { year: number }): string | undefined => {
    const group = String(row.kelompok)
    const isBangunan = BANGUNAN.has(String(row.kode))
    if (kind === 'penyusutan' && isBangunan !== (group === 'Permanent' || group === 'Non-permanent')) {
      return isBangunan
        ? `Kode Aset ${djpCode(String(row.kode), 4)} adalah bangunan — Kelompok Aset harus "Permanent" atau "Non-permanent"`
        : `Kelompok Aset "${group}" hanya untuk kode bangunan (0502–0599)`
    }
    if (num(row.tahun) > ctx.year) return `Tahun Perolehan ${row.tahun} melewati tahun pajak ${ctx.year}`
    row.kelompok = KELOMPOK_KEY[group]![kind === 'penyusutan' ? 0 : 1]
    row.perolehan = `${String(row.bulan).padStart(2, '0')}/${row.tahun}`
    delete row.bulan
    delete row.tahun
    return undefined
  }
}

export const IMPORT_L9 = listImport({
  id: 'l9',
  title: 'Impor daftar penyusutan dan amortisasi',
  description: 'Isi harta berwujud, bangunan, dan harta tak berwujud Lampiran 9 sekaligus dari template DJP.',
  fileName: 'CIT_L9_Depreciation_And_Amortization_Template',
  target: 'aset',
  preamble: false,
  sections: [
    { title: 'Daftar Penyusutan', columns: l9Columns('penyusutan'), finish: l9Finish('penyusutan') },
    { title: 'Daftar Amortisasi', columns: l9Columns('amortisasi'), finish: l9Finish('amortisasi') },
  ],
})

// ── Lampiran 10A — Transaksi hubungan istimewa ───────────────────────────────
export const IMPORT_L10A = listImport({
  id: 'l10a',
  title: 'Impor transaksi hubungan istimewa',
  description: 'Isi daftar transaksi dengan pihak yang mempunyai hubungan istimewa dari template DJP.',
  fileName: 'CIT_L10A_Declaration_Of_Transaction_Related_Parties_Template',
  target: 'transaksi',
  preamble: true,
  sections: [{
    columns: [
      { header: 'Nama Mitra', xml: 'Name', key: 'nama', type: 'text', required: true, hint: 'Diisi dengan nama mitra transaksi', example: 'Davied' },
      { header: 'NPWP Mitra Transaksi', xml: 'TIN2', key: 'npwp', type: 'id', hint: 'Diisi dengan NPWP Mitra Transaksi', example: '3302190406850001' },
      { header: 'Kode Negara', xml: 'CountryCode', key: 'kodeNegara', type: 'code', codes: NEGARA, codesTitle: 'Country Code', hint: 'Diisi dengan kode negara mitra transaksi sesuai referensi', example: 'BRA', rule: '3 huruf sesuai referensi Country Code' },
      { header: 'Kode Tipe Relasi', xml: 'TypeOfRelationCode', key: 'kodeHubungan', type: 'code', codes: BENTUK_HUBUNGAN, codesTitle: 'Relation Code', hint: 'Diisi dengan kode tipe relasi/mitra sesuai referensi', example: 'CIT_RT_01' },
      { header: 'Kegiatan Usaha', xml: 'BusinessActivity', key: 'kegiatan', type: 'text', hint: 'Diisi dengan kegiatan usaha mitra transaksi', example: 'Financing' },
      { header: 'Kode Jenis Transaksi', xml: 'TypeOfTransactionCode', key: 'kodeTransaksi', type: 'code', codes: JENIS_TRANSAKSI, codesTitle: 'Transaction Code', hint: 'Diisi dengan kode jenis transaksi sesuai referensi', example: 'CIT_TT_14' },
      { header: 'Nilai Transaksi', xml: 'TransactionValue', key: 'nilai', type: 'amount', hint: 'Diisi dengan nilai transaksi', example: 1000000 },
      { header: 'Kode Metode Harga Transfer', xml: 'PricingMethodAppliedCode', key: 'kodeHarga', type: 'code', codes: METODE_HARGA, codesTitle: 'Pricing Methode', hint: 'Diisi dengan kode metode penentuan harga transfer yang digunakan sesuai referensi', example: 'CIT_PM_01' },
      { header: 'Alasan Penggunaan Metode', xml: 'ReasonOfPricingMethodApplication', key: 'alasan', type: 'text', hint: 'Diisi dengan alasan penggunaan metode penentuan harga transfer yang digunakan', example: 'To get Total Cost' },
    ],
  }],
})

// ── Lampiran 11A ─────────────────────────────────────────────────────────────
export const IMPORT_L11A_PROMOSI = listImport({
  id: 'l11a-promosi',
  title: 'Impor biaya promosi',
  description: 'Isi daftar nominatif biaya promosi (Lampiran 11A bagian I) dari template DJP.',
  fileName: 'CIT_L11A_Promotion_Expense_Template',
  target: 'promosi',
  preamble: true,
  sections: [{
    columns: [
      identitas('Diisi dengan NOMOR IDENTITAS (NPWP/NIK/LAINNYA) penerima promosi'),
      { header: 'Nama Penerima', xml: 'NameOfRecipient', key: 'nama', type: 'text', required: true, hint: 'Diisi dengan nama penerima promosi', example: 'Davied' },
      alamat('Diisi dengan alamat lengkap penerima promosi'),
      { header: 'Tanggal', xml: 'DateOfPromotion', key: 'tanggal', type: 'date', hint: 'Diisi dengan tanggal promosi dilakukan', example: '21-03-2023' },
      { header: 'Bentuk & Jenis Biaya', xml: 'FormAndType', key: 'bentuk', type: 'code', codes: JENIS_BIAYA_PROMOSI, codesTitle: 'Type of Promotion / Tipe Promosi', hint: 'Diisi dengan bentuk dan jenis biaya promosi sesuai kode referensi', example: 'EXHIBITION' },
      { header: 'Nilai', xml: 'AmountOfPromotion', key: 'nilai', type: 'amount', hint: 'Diisi dengan nilai promosi', example: 1000000 },
      { header: 'PPh Dipotong/Dipungut', xml: 'AmountOfWitholding', key: 'pph', type: 'amount', hint: 'Diisi dengan nilai PPh yang dipotong atau dipungut', example: 10000 },
      { header: 'Nomor Bupot', xml: 'WitholdingSlipNumber', key: 'nomorBukti', type: 'text', hint: 'Diisi dengan Nomor Bukti Pemotongan/Pemungutan', example: '2000000P4' },
      { header: 'Keterangan', xml: 'Description', key: 'keterangan', type: 'text', hint: 'Diisi dengan keterangan', example: 'Sample Product' },
    ],
  }],
})

export const IMPORT_L11A_ENTERTAINMENT = listImport({
  id: 'l11a-entertainment',
  title: 'Impor biaya entertainment',
  description: 'Isi daftar nominatif biaya entertainment (Lampiran 11A bagian II) dari template DJP.',
  fileName: 'CIT_L11A_Entertainment_Expense_Template',
  target: 'entertainment',
  preamble: true,
  sections: [{
    columns: [
      { header: 'Tanggal', xml: 'DateOfEntertainment', key: 'tanggal', type: 'date', required: true, hint: 'Diisi dengan tanggal entertainment diberikan', example: '21-03-2023' },
      { header: 'Tempat', xml: 'Place', key: 'tempat', type: 'text', hint: 'Diisi dengan kota/kabupaten', example: 'JAKARTA' },
      alamat('Diisi dengan alamat lengkap relasi yang menerima'),
      { header: 'Jenis', xml: 'TypeOfEntertainment', key: 'jenis', type: 'text', hint: 'Diisi dengan jenis entertainment yang diberikan', example: 'Jamuan' },
      { header: 'Nilai', xml: 'AmountOfEntertainment', key: 'nilai', type: 'amount', hint: 'Diisi dengan nominal nilai entertainment', example: 1000000 },
      { header: 'Nama Relasi', xml: 'NameOfBusinessPartner', key: 'nama', type: 'text', hint: 'Diisi dengan nama lengkap relasi yang menerima', example: 'Davied' },
      { header: 'Jabatan', xml: 'Position', key: 'jabatan', type: 'text', hint: 'Diisi dengan jabatan relasi yang menerima. Jika penerima orang pribadi bukan wakil perusahaan maka diisi "-"', example: 'Direktur' },
      { header: 'Nama Perusahaan', xml: 'CompanyName', key: 'perusahaan', type: 'text', hint: 'Diisi dengan nama perusahaan relasi yang menerima. Jika penerima orang pribadi bukan wakil perusahaan maka diisi "-"', example: 'PT. Abal Abal Jaya' },
      { header: 'Jenis Usaha', xml: 'BusinessType', key: 'jenisUsaha', type: 'text', hint: 'Diisi dengan jenis usaha relasi yang menerima', example: 'Pertambangan Minyak Bumi' },
      { header: 'Catatan', xml: 'Notes', key: 'keterangan', type: 'text', hint: 'Diisi dengan catatan atau keterangan', example: 'Bill 011/12/2024' },
    ],
  }],
})

export const IMPORT_L11A_PIUTANG = listImport({
  id: 'l11a-piutang',
  title: 'Impor piutang yang tidak dapat ditagih',
  description: 'Isi daftar piutang yang nyata-nyata tidak dapat ditagih (Lampiran 11A bagian III) dari template DJP.',
  fileName: 'CIT_L11A_Uncollectible_Debt_Template',
  target: 'piutang',
  preamble: true,
  sections: [{
    columns: [
      identitas('Diisi dengan NOMOR IDENTITAS (NPWP/NIK/LAINNYA) debitur'),
      { header: 'Nama Penerima', xml: 'NameOfRecipient', key: 'nama', type: 'text', required: true, hint: 'Diisi dengan nama penerima (debitur)', example: 'Davied' },
      alamat('Diisi dengan alamat lengkap (debitur)'),
      { header: 'Plafon Piutang', xml: 'DebtCeiling', key: 'plafon', type: 'amount', hint: 'Diisi dengan besarnya plafon piutang', example: 1000000 },
      { header: 'Piutang yg tidak dapat ditagih', xml: 'UncollectibleDebtAmount', key: 'tidakTertagih', type: 'amount', hint: 'Diisi dengan besarnya piutang yg tidak dapat ditagih', example: 200000, rule: 'angka positif, maksimal sama dengan plafon piutang' },
      { header: 'Metode Pengurangan', xml: 'DeductionMethod', key: 'metode', type: 'code', codes: METODE_PENGHAPUSAN, codeWidth: 2, codesTitle: 'DEDUCTION METHOD / Metode Pengurangan', hint: 'Diisi dengan metode pengurangan', example: '02', rule: '2 digit angka sesuai kode referensi DEDUCTION METHOD' },
      { header: 'Jenis Dokumen yang disyaratkan', xml: 'TypeOfFulfillmentProvingDocument', key: 'dokumen', type: 'code', codes: JENIS_PEMENUHAN, codeWidth: 2, codesTitle: 'TYPE OF FULFILLMENT PROVING DOCUMENT OF REQUIREMENTS / Jenis dokumen pembuktian', hint: 'Diisi dengan jenis dokumen pembuktian yang disyaratkan', example: '04', rule: '2 digit angka sesuai kode referensi TYPE OF FULFILLMENT PROVING DOCUMENT' },
      { header: 'Keterangan', xml: 'Remarks', key: 'keterangan', type: 'text', hint: 'Diisi dengan keterangan', example: 'catatan' },
    ],
    finish: row => (num(row.tidakTertagih) > num(row.plafon) ? 'Piutang yg tidak dapat ditagih melebihi Plafon Piutang' : undefined),
  }],
})

export const IMPORT_L11A_DEBITUR = listImport({
  id: 'l11a-debitur',
  title: 'Impor debitur kredit kurang lancar',
  description: 'Isi daftar debitur kredit kurang lancar (Lampiran 11A bagian V) dari template DJP.',
  fileName: 'CIT_L11A_Non_Performing_Loan_Debtors_Template',
  target: 'debitur',
  preamble: true,
  sections: [{
    columns: [
      identitas('Diisi dengan NOMOR IDENTITAS (NPWP/NIK/LAINNYA) debitur'),
      { header: 'Nama Debitur', xml: 'DebtorName', key: 'nama', type: 'text', required: true, hint: 'Diisi dengan nama lengkap debitur', example: 'Davied' },
      alamat('Diisi dengan alamat lengkap debitur'),
      { header: 'Nilai Awal', xml: 'AmountBeginning', key: 'awal', type: 'amount', hint: 'Diisi dengan NILAI KREDIT KURANG LANCAR AWAL TAHUN BUKU', example: 10000000 },
      { header: 'Nilai Akhir', xml: 'AmountEndOfYear', key: 'akhir', type: 'amount', hint: 'Diisi dengan NILAI KREDIT KURANG LANCAR AKHIR TAHUN BUKU', example: 2000000 },
      { header: 'Nilai Bunga', xml: 'AmountOfInterest', key: 'bunga', type: 'amount', hint: 'Diisi dengan JUMLAH BUNGA PADA TAHUN BUKU (AKRUAL)', example: 300000 },
      { header: 'Kategori', xml: 'Category', key: 'kategori', type: 'code', codes: KATEGORI_KREDIT, codeWidth: 2, codesTitle: 'Non Performing Loan Category', hint: 'Diisi dengan kategori sesuai kode referensi', example: '01', rule: '2 digit angka sesuai kode referensi Non Performing Loan Category' },
    ],
  }],
})

// ── Lampiran 1 — Laporan keuangan (Laba Rugi / Aset / Liabilitas) ────────────
export interface L1Payload {
  labaRugi: Record<string, RowValues>
  posisiKeuangan: Record<string, number | null>
  /** Which statements the file carried — "Ganti" only clears those. */
  hasLabaRugi: boolean
  hasPosisi: boolean
}

/** DJP's Laba Rugi header → Lampiran 1 column. Tidak Final / Nilai Fiskal are computed, so read-only. */
const LR_COLUMNS: { header: string, col: keyof RowValues | null }[] = [
  { header: 'Kode Akun', col: null },
  { header: 'Nama Akun', col: null },
  { header: 'NILAI (KOMERSIAL)', col: 'c3' },
  { header: 'NON OBJEK PAJAK', col: 'c4' },
  { header: 'DIKENAKAN PPh FINAL', col: 'c5' },
  { header: 'TIDAK FINAL', col: null },
  { header: 'PENYESUAIAN FISKAL POSITIF', col: 'c7' },
  { header: 'PENYESUAIAN FISKAL NEGATIF', col: 'c8' },
  { header: 'KODE PENYESUAIAN FISKAL', col: 'c9' },
  { header: 'NILAI FISKAL (Sebelum Fasilitas Perpajakan)', col: null },
]
const PK_COLUMNS = ['Kode Akun', 'Nama Akun', 'Nilai']

/** "Aset" holds 1xxx; "Liabilitas" holds liabilitas and ekuitas (2xxx, 3xxx). */
const isAset = (code: string) => code.startsWith('1')
/** "Kode Akun | Nama Akun | …" — both, so the Petunjuk sheet's "Kode Akun" row is not taken for a header. */
const isAccountHeader = (r: Cell[] | undefined) => norm(r?.[0]) === 'kode akun' && norm(r?.[1]) === 'nama akun'

export function lampiran1Import(data: Lampiran1Data): ImportSpec<L1Payload> {
  const sektor = SEKTOR_USAHA.find(s => s.value === data.sektor) ?? SEKTOR_USAHA[0]!
  const schema = sectorRows(data.sektor)
  const lrInputs = schema.labaRugi.filter(r => r.kind === 'input')
  const pkInputs = schema.posisiKeuangan.filter(r => r.kind === 'input')
  const lrByCode = new Map(schema.labaRugi.filter(r => r.kind !== 'group').map(r => [r.code, r]))
  const pkByCode = new Map(schema.posisiKeuangan.filter(r => r.kind !== 'group').map(r => [r.code, r]))

  return {
    id: 'l1',
    title: 'Impor laporan keuangan',
    description: `Isi Lampiran ${sektor.lampiran} (sektor ${sektor.label}) dari template laporan keuangan: laba rugi beserta penyesuaian fiskalnya, aset, dan liabilitas.`,
    unit: 'akun',
    fileName: () => `CIT_L${sektor.lampiran}_${sektor.label.toUpperCase().replace(/\s+/g, '_')}.xlsx`,

    // Prefilled with what Lampiran 1 already holds, so the file round-trips: download,
    // adjust in Excel, import back.
    template(ctx) {
      const lr: Cell[][] = [...preambleRows(ctx), [], LR_COLUMNS.map(c => c.header)]
      for (const r of lrInputs) {
        const v = data.labaRugi[r.code] ?? {}
        lr.push([r.code, r.label, v.c3 ?? null, v.c4 ?? null, v.c5 ?? null, labaRugiValue(data, r.code, 'c6'), v.c7 ?? null, v.c8 ?? null, v.c9 || null, labaRugiValue(data, r.code, 'c10')])
      }
      const pk = (filter: (code: string) => boolean): Cell[][] => [
        ...preambleRows(ctx),
        [],
        PK_COLUMNS,
        ...pkInputs.filter(r => filter(r.code)).map(r => [r.code, r.label, data.posisiKeuangan[r.code] ?? null] as Cell[]),
      ]
      const guide: Cell[][] = [
        ['Kolom pada excel', 'Petunjuk pengisian', 'Validasi'],
        ['NPWP SPT', 'Diisi dengan NPWP Pelapor SPT', '16 digit angka NPWP sesuai SPT yang dilaporkan'],
        ['Tahun Pajak', 'Diisi dengan tahun pajak SPT', '4 digit angka sesuai tahun pajak SPT yang dilaporkan'],
        ['Kode Akun', `Kode akun Lampiran ${sektor.lampiran}. Akun jumlah tidak diisi — dihitung otomatis dari rinciannya.`, `sesuai daftar akun Lampiran ${sektor.lampiran}`],
        ['Nama Akun', 'Hanya sebagai panduan; tidak dibaca saat impor.', ''],
        ['NILAI (KOMERSIAL)', 'Nilai menurut laporan keuangan komersial', 'angka positif'],
        ['NON OBJEK PAJAK', 'Bagian nilai yang bukan objek pajak (hanya akun penghasilan)', 'angka positif'],
        ['DIKENAKAN PPh FINAL', 'Bagian nilai yang dikenakan PPh final (hanya akun penghasilan)', 'angka positif'],
        ['TIDAK FINAL', 'Dihitung otomatis: (3) - (4) - (5). Diabaikan saat impor.', ''],
        ['PENYESUAIAN FISKAL POSITIF', 'Nilai penyesuaian fiskal positif', 'angka positif'],
        ['PENYESUAIAN FISKAL NEGATIF', 'Nilai penyesuaian fiskal negatif', 'angka positif'],
        ['KODE PENYESUAIAN FISKAL', 'Kode penyesuaian fiskal sesuai sheet Ref', 'wajib diisi jika ada penyesuaian fiskal'],
        ['NILAI FISKAL (Sebelum Fasilitas Perpajakan)', 'Dihitung otomatis. Diabaikan saat impor.', ''],
        ['Nilai (sheet Aset / Liabilitas)', 'Saldo akun pada akhir tahun buku', 'angka positif'],
        [],
        [RUPIAH_HINT],
      ]
      const lrCols = [{ width: 12, text: true }, { width: 48 }, ...Array.from({ length: 6 }, () => ({ width: 22 })), { width: 22, text: true }, { width: 22 }]
      const pkCols = [{ width: 12, text: true }, { width: 64 }, { width: 22 }]
      return [
        { name: 'Laba Rugi', rows: lr, boldRows: [3], cols: lrCols },
        { name: 'Aset', rows: pk(isAset), boldRows: [3], cols: pkCols },
        { name: 'Liabilitas', rows: pk(c => !isAset(c)), boldRows: [3], cols: pkCols },
        { name: 'Petunjuk Pengisian', rows: guide, boldRows: [0], cols: [{ width: 36 }, { width: 80 }, { width: 44 }] },
        { name: 'Ref', rows: [['Kode', 'Deskripsi'], ...KODE_KOREKSI_FISKAL.map(k => [k.code, k.name] as Cell[])], boldRows: [0], cols: [{ width: 12, text: true }, { width: 110 }] },
      ] satisfies SheetSpec[]
    },

    parse(sheets, ctx) {
      const payload: L1Payload = { labaRugi: {}, posisiKeuangan: {}, hasLabaRugi: false, hasPosisi: false }
      const empty = { accepted: 0, rejected: [] as ImportIssue[], payload }
      const withHeader = sheets.filter(s => s.rows.some(isAccountHeader))
      if (!withHeader.length) return { ...empty, fileError: 'Sheet Laba Rugi, Aset, atau Liabilitas tidak ditemukan. Unduh template lalu salin data Anda ke dalamnya.' }
      const preamble = withHeader.find(s => s.rows.slice(0, 10).some(r => norm(r?.[0]) === 'npwp spt'))
      const err = checkPreamble(preamble?.rows ?? [], ctx)
      if (err) return { ...empty, fileError: err }

      const rejected: ImportIssue[] = []
      const seen = new Set<string>()
      let accepted = 0

      for (const sheet of withHeader) {
        const where = sheets.length > 1 ? sheet.name : undefined
        let mode: 'lr' | 'pk' | null = null
        let idx: number[] = []
        for (let i = 0; i < sheet.rows.length; i++) {
          const r = sheet.rows[i] ?? []
          if (isAccountHeader(r)) {
            const heads = r.map(norm)
            mode = heads.includes(norm('NILAI (KOMERSIAL)')) ? 'lr' : 'pk'
            idx = (mode === 'lr' ? LR_COLUMNS.map(c => c.header) : PK_COLUMNS).map(h => heads.indexOf(norm(h)))
            const missing = (mode === 'lr' ? LR_COLUMNS.filter(c => c.col).map(c => c.header) : ['Nilai']).filter(h => !heads.includes(norm(h)))
            if (missing.length) return { ...empty, fileError: `Kolom ${missing.join(', ')} tidak ditemukan di sheet ${sheet.name}.` }
            if (mode === 'lr') payload.hasLabaRugi = true
            else payload.hasPosisi = true
            continue
          }
          if (!mode || r.every(c => cellText(c) === '')) continue
          const reject = (reason: string) => rejected.push({ sheet: where, row: i + 1, reason })
          const code = cellText(r[idx[0]!])
          if (!code) { reject('Kode Akun wajib diisi'); continue }
          if (seen.has(code)) { reject(`Kode akun ${code} muncul lebih dari satu kali di file`); continue }

          if (mode === 'lr') {
            const row = lrByCode.get(code)
            if (!row) {
              reject(pkByCode.has(code) ? `Akun ${code} adalah akun posisi keuangan — isi di sheet Aset atau Liabilitas` : `Kode akun ${code} tidak ada di Lampiran ${sektor.lampiran}`)
              continue
            }
            if (row.kind !== 'input') { reject(`Akun ${code} (${row.label}) adalah akun jumlah dan dihitung otomatis — isi akun rinciannya`); continue }
            const values: RowValues = {}
            let bad: string | undefined
            LR_COLUMNS.forEach((c, ci) => {
              if (!c.col || idx[ci]! < 0) return
              const cell = r[idx[ci]!]
              if (c.col === 'c9') {
                const s = cellText(cell)
                const k = matchCode(KODE_KOREKSI_FISKAL, cell)
                if (s && !k) bad ??= `Kode penyesuaian fiskal "${s}" tidak ada di referensi`
                values.c9 = k ?? ''
                return
              }
              const a = cellAmount(cell)
              if (a.error) bad ??= `${c.header} ${a.error}`
              if ((c.col === 'c4' || c.col === 'c5') && a.value && row.variant !== 'full') bad ??= `${c.header} tidak berlaku untuk akun ${code} (${row.label})`
              values[c.col] = a.value
            })
            // A listed account with nothing filled in is left as it is (the template lists every account).
            if (!bad && Object.values(values).every(v => v === null || v === undefined || v === '')) continue
            if ((num(values.c7) || num(values.c8)) && !values.c9) bad ??= 'Kode penyesuaian fiskal wajib diisi jika ada penyesuaian fiskal positif atau negatif'
            if (bad) { reject(bad); continue }
            seen.add(code)
            payload.labaRugi[code] = values
            accepted++
          }
          else {
            const row = pkByCode.get(code)
            if (!row) {
              reject(lrByCode.has(code) ? `Akun ${code} adalah akun laba rugi — isi di sheet Laba Rugi` : `Kode akun ${code} tidak ada di Lampiran ${sektor.lampiran}`)
              continue
            }
            if (row.kind !== 'input') { reject(`Akun ${code} (${row.label}) adalah akun jumlah dan dihitung otomatis — isi akun rinciannya`); continue }
            const a = cellAmount(r[idx[2]!])
            if (a.error) { reject(`Nilai ${a.error}`); continue }
            if (a.value === null) continue
            seen.add(code)
            payload.posisiKeuangan[code] = a.value
            accepted++
          }
        }
      }

      if (!accepted && !rejected.length) return { ...empty, fileError: 'Tidak ada akun di file. Isi nilai akun di bawah baris judul kolom.' }
      return { accepted, rejected, payload }
    },
  }
}
