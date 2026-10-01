/**
 * SPT Tahunan PPh Badan — Lampiran 1 (sektor Umum = 1A).
 * Rows mirror Figma "SPT / lampiran 1A / A" (Laporan Laba Rugi) and
 * "SPT / lampiran 1A / B" (Laporan Posisi Keuangan).
 */
import { SECTOR_SCHEMAS } from '~/data/spt1771Lampiran1Sectors'
import { SEKTOR_USAHA_DJP } from '~/data/taxCodes'
import { n } from '~/utils/currency'

export type L1Col = 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8' | 'c10'
export type Formula = [code: string, sign: 1 | -1][]

export type AccountRow =
  | { kind: 'group', label: string }
  /** full = columns 3/4/5 editable (income rows); simple = only column 3. */
  | { kind: 'input', code: string, label: string, variant?: 'full' | 'simple', indent?: boolean }
  | { kind: 'total', code: string, label: string, formula: Formula, strong?: boolean }

export const LAMPIRAN1_COLUMNS: { key: L1Col | 'c9', label: string, computed?: boolean }[] = [
  { key: 'c3', label: 'Nilai (komersial) (3)' },
  { key: 'c4', label: 'Non objek pajak (4)' },
  { key: 'c5', label: 'Dikenakan PPh Final (5)' },
  { key: 'c6', label: 'Tidak final (6)=(3)-(4)-(5)', computed: true },
  { key: 'c7', label: 'Koreksi fiskal positif (7)' },
  { key: 'c8', label: 'Koreksi fiskal negatif (8)' },
  { key: 'c9', label: 'Kode koreksi fiskal (9)' },
  { key: 'c10', label: 'Nilai fiskal (sebelum fasilitas perpajakan) (10)', computed: true },
]

/** Columns a total row shows (Figma); 4800 shows every numeric column. */
export const TOTAL_COLS: L1Col[] = ['c3', 'c6', 'c10']
export const GRAND_TOTAL_COLS: L1Col[] = ['c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c10']
export const GRAND_TOTAL_CODE = '4800'

const sum = (...codes: string[]): Formula => codes.map(c => [c, 1])

export const labaRugiRows: AccountRow[] = [
  { kind: 'group', label: 'Penjualan' },
  { kind: 'input', code: '4002', label: 'Penjualan Domestik', variant: 'full' },
  { kind: 'input', code: '4003', label: 'Penjualan Ekspor', variant: 'full' },
  { kind: 'total', code: '4004', label: 'Penjualan Bruto', formula: sum('4002', '4003') },
  { kind: 'group', label: 'Dikurangi:' },
  { kind: 'input', code: '4011', label: 'Retur' },
  { kind: 'input', code: '4012', label: 'Potongan Penjualan' },
  { kind: 'input', code: '4013', label: 'Penyesuaian Penjualan' },
  { kind: 'total', code: '4020', label: 'Penjualan Bersih', formula: [['4004', 1], ['4011', -1], ['4012', -1], ['4013', -1]] },
  { kind: 'group', label: 'Harga Pokok Penjualan (HPP)' },
  { kind: 'input', code: '5001', label: 'Pembelian' },
  { kind: 'input', code: '5003', label: 'Beban Pengangkutan' },
  { kind: 'input', code: '5007', label: 'Beban Lainnya' },
  { kind: 'input', code: '5008', label: 'Persediaan - Awal' },
  { kind: 'input', code: '5009', label: 'Dikurangi: Persediaan - Akhir', indent: true },
  { kind: 'total', code: '5020', label: 'Jumlah HPP', formula: [['5001', 1], ['5003', 1], ['5007', 1], ['5008', 1], ['5009', -1]] },
  { kind: 'total', code: '4300', label: 'Laba Kotor', formula: [['4020', 1], ['5020', -1]] },
  { kind: 'input', code: '4199', label: 'Pendapatan Usaha Lainnya', variant: 'full' },
  { kind: 'group', label: 'Beban Usaha' },
  { kind: 'input', code: '5311', label: 'Gaji, Tunjangan, Bonus, Honorarium, THR, dsb' },
  { kind: 'input', code: '5312', label: 'Beban imbalan kerja lainnya' },
  { kind: 'input', code: '5313', label: 'Beban Transportasi' },
  { kind: 'input', code: '5314', label: 'Beban Penyusutan dan Amortisasi' },
  { kind: 'input', code: '5315', label: 'Beban Sewa' },
  { kind: 'input', code: '5316', label: 'Beban Bunga' },
  { kind: 'input', code: '5317', label: 'Beban Sehubungan dengan Jasa' },
  { kind: 'input', code: '5318', label: 'Beban Penurunan Nilai' },
  { kind: 'input', code: '5319', label: 'Beban Royalti' },
  { kind: 'input', code: '5320', label: 'Beban Pemasaran atau Promosi' },
  { kind: 'input', code: '5321', label: 'Beban Entertainment' },
  { kind: 'input', code: '5322', label: 'Beban Umum dan Administrasi' },
  { kind: 'input', code: '5399', label: 'Beban Usaha Lainnya' },
  { kind: 'total', code: '5400', label: 'Jumlah Beban Usaha', formula: sum('5311', '5312', '5313', '5314', '5315', '5316', '5317', '5318', '5319', '5320', '5321', '5322', '5399') },
  { kind: 'total', code: '4500', label: 'Laba (Rugi) Usaha', formula: [['4300', 1], ['4199', 1], ['5400', -1]] },
  { kind: 'group', label: 'Pendapatan Non Usaha' },
  { kind: 'input', code: '4501', label: 'Keuntungan Selisih Kurs', variant: 'full' },
  { kind: 'input', code: '4503', label: 'Keuntungan Penjualan Aset selain Persediaan', variant: 'full' },
  { kind: 'input', code: '4511', label: 'Pendapatan Bunga', variant: 'full' },
  { kind: 'input', code: '4599', label: 'Pendapatan Non Usaha Lainnya', variant: 'full' },
  { kind: 'total', code: '4600', label: 'Jumlah Pendapatan Non Usaha', formula: sum('4501', '4503', '4511', '4599') },
  { kind: 'group', label: 'Beban Non Usaha' },
  { kind: 'input', code: '5405', label: 'Kerugian Penjualan Aset selain Persediaan' },
  { kind: 'input', code: '5409', label: 'Sumbangan' },
  { kind: 'input', code: '5421', label: 'Kerugian Selisih Kurs' },
  { kind: 'input', code: '5499', label: 'Beban Non Usaha Lainnya' },
  { kind: 'total', code: '5500', label: 'Jumlah Beban Non Usaha', formula: sum('5405', '5409', '5421', '5499') },
  // Figma labels 4700 "Jumlah Beban Non Usaha" (a copy of 5500); it is the net non-operating result.
  { kind: 'total', code: '4700', label: 'Pendapatan (Beban) Non Usaha', formula: [['4600', 1], ['5500', -1]] },
  { kind: 'total', code: GRAND_TOTAL_CODE, label: 'Laba (Rugi) Sebelum Pajak', formula: [['4500', 1], ['4700', 1]], strong: true },
]

export const posisiKeuanganRows: AccountRow[] = [
  { kind: 'group', label: 'Aset Lancar' },
  { kind: 'input', code: '1101', label: 'Kas dan Setara Kas' },
  { kind: 'input', code: '1122', label: 'Piutang Usaha - Pihak Ketiga' },
  { kind: 'input', code: '1123', label: 'Piutang Usaha - Pihak yang Mempunyai Hubungan Istimewa' },
  { kind: 'input', code: '1124', label: 'Piutang Lainnya - Pihak Ketiga' },
  { kind: 'input', code: '1125', label: 'Piutang Lainnya - Pihak yang Mempunyai Hubungan Istimewa' },
  { kind: 'input', code: '1131', label: 'Cadangan Kerugian Penurunan Nilai - Aset Lancar', indent: true },
  { kind: 'input', code: '1181', label: 'Aset Kontrak' },
  { kind: 'input', code: '1200', label: 'Investasi' },
  { kind: 'input', code: '1401', label: 'Persediaan' },
  { kind: 'input', code: '1421', label: 'Beban Dibayar di Muka' },
  { kind: 'input', code: '1423', label: 'Pajak Dibayar di Muka' },
  { kind: 'input', code: '1405', label: 'Aset Dimiliki untuk Dijual' },
  { kind: 'input', code: '1422', label: 'Uang Muka' },
  { kind: 'input', code: '1499', label: 'Aset Lancar Lainnya' },
  { kind: 'group', label: 'Aset Tidak Lancar' },
  { kind: 'input', code: '1501', label: 'Piutang Jangka Panjang' },
  { kind: 'input', code: '1520', label: 'Properti Investasi' },
  { kind: 'input', code: '1523', label: 'Tanah dan Bangunan' },
  { kind: 'input', code: '1524', label: 'Dikurangi: Akumulasi Penyusutan - Tanah dan Bangunan', indent: true },
  { kind: 'input', code: '1529', label: 'Aset Tetap Lainnya' },
  { kind: 'input', code: '1530', label: 'Dikurangi: Akumulasi Penyusutan - Aset Tetap Lainnya', indent: true },
  { kind: 'input', code: '1531', label: 'Aset Biologis' },
  { kind: 'input', code: '1533', label: 'Aset Hak Guna' },
  { kind: 'input', code: '1534', label: 'Dikurangi: Akumulasi Penyusutan - Aset Hak Guna', indent: true },
  { kind: 'input', code: '1551', label: 'Investasi pada Perusahaan Asosiasi, Ventura Bersama dan Anak Perusahaan' },
  { kind: 'input', code: '1599', label: 'Investasi Jangka Panjang Lainnya' },
  { kind: 'input', code: '1600', label: 'Aset Tak Berwujud' },
  { kind: 'input', code: '1601', label: 'Dikurangi: Akumulasi Amortisasi - Aset Tak Berwujud', indent: true },
  { kind: 'input', code: '1611', label: 'Aktiva Pajak Tangguhan' },
  { kind: 'input', code: '1651', label: 'Klaim atas Pengembalian Pajak' },
  { kind: 'input', code: '1658', label: 'Cadangan Kerugian Penurunan Nilai - Aset Tidak Lancar', indent: true },
  { kind: 'input', code: '1698', label: 'Aset Tidak Lancar Lainnya' },
  {
    kind: 'total',
    code: '1700',
    label: 'Jumlah Aset',
    formula: [
      ['1101', 1], ['1122', 1], ['1123', 1], ['1124', 1], ['1125', 1], ['1131', -1], ['1181', 1], ['1200', 1], ['1401', 1],
      ['1421', 1], ['1423', 1], ['1405', 1], ['1422', 1], ['1499', 1], ['1501', 1], ['1520', 1], ['1523', 1], ['1524', -1],
      ['1529', 1], ['1530', -1], ['1531', 1], ['1533', 1], ['1534', -1], ['1551', 1], ['1599', 1], ['1600', 1], ['1601', -1], ['1611', 1], ['1651', 1], ['1658', -1], ['1698', 1],
    ],
  },
  { kind: 'group', label: 'Liabilitas Jangka Pendek' },
  { kind: 'input', code: '2102', label: 'Utang Usaha - Pihak Ketiga' },
  { kind: 'input', code: '2103', label: 'Utang Usaha - Pihak yang Mempunyai Hubungan Istimewa' },
  { kind: 'input', code: '2111', label: 'Utang Bunga' },
  { kind: 'input', code: '2186', label: 'Liabilitas Kontrak' },
  { kind: 'input', code: '2187', label: 'Liabilitas Sewa Jangka Pendek' },
  { kind: 'input', code: '2191', label: 'Utang Pajak' },
  { kind: 'input', code: '2192', label: 'Utang Dividen' },
  { kind: 'input', code: '2195', label: 'Beban yang Masih Harus Dibayar' },
  { kind: 'input', code: '2201', label: 'Utang Bank Jangka Pendek' },
  { kind: 'input', code: '2202', label: 'Utang Jangka Panjang yang Jatuh Tempo dalam Satu Tahun' },
  { kind: 'input', code: '2203', label: 'Pendapatan Diterima di Muka' },
  { kind: 'input', code: '2228', label: 'Liabilitas Jangka Pendek Lainnya' },
  { kind: 'group', label: 'Liabilitas Jangka Panjang' },
  { kind: 'input', code: '2301', label: 'Utang Bank Jangka Panjang' },
  { kind: 'input', code: '2303', label: 'Utang Jangka Panjang - Pihak Ketiga' },
  { kind: 'input', code: '2304', label: 'Utang Jangka Panjang - Pihak yang Mempunyai Hubungan Istimewa' },
  { kind: 'input', code: '2312', label: 'Liabilitas Sewa Jangka Panjang' },
  { kind: 'input', code: '2322', label: 'Liabilitas Imbalan Kerja' },
  { kind: 'input', code: '2321', label: 'Liabilitas Pajak Tangguhan' },
  { kind: 'input', code: '2998', label: 'Liabilitas Jangka Panjang Lainnya' },
  {
    kind: 'total',
    code: '2999',
    label: 'Jumlah Liabilitas',
    formula: sum('2102', '2103', '2111', '2186', '2187', '2191', '2192', '2195', '2201', '2202', '2203', '2228', '2301', '2303', '2304', '2312', '2322', '2321', '2998'),
  },
  { kind: 'group', label: 'Ekuitas' },
  { kind: 'input', code: '3102', label: 'Modal Saham' },
  { kind: 'input', code: '3120', label: 'Tambahan Modal Disetor' },
  { kind: 'input', code: '3200', label: 'Saldo Laba' },
  { kind: 'input', code: '3297', label: 'Pendapatan Komprehensif Lainnya' },
  { kind: 'input', code: '3298', label: 'Ekuitas Lainnya' },
  { kind: 'total', code: '3299', label: 'Jumlah Ekuitas', formula: sum('3102', '3120', '3200', '3297', '3298') },
  { kind: 'total', code: '3300', label: 'Jumlah Liabilitas dan Ekuitas', formula: [['2999', 1], ['3299', 1]], strong: true },
]

/**
 * Sektor usaha (DJP BUSINESS_CLASSIFICATION BC01–BC12) — Induk B.1 picks one and it
 * selects the Lampiran 1 variant. Only BC01 (Umum / 1A) has an account schema so far;
 * the other eleven render an empty Lampiran 1 until their schemas are transcribed.
 */
export const SEKTOR_USAHA = SEKTOR_USAHA_DJP.map((c, i) => ({
  value: c.code,
  label: c.name,
  lampiran: `1${'ABCDEFGHIJKL'[i]}`,
})) as { value: string, label: string, lampiran: string }[]
export type SektorUsaha = string

export type RowValues = Partial<Record<'c3' | 'c4' | 'c5' | 'c7' | 'c8', number | null>> & { c9?: string }

export interface Lampiran1Data {
  sektor: SektorUsaha
  labaRugi: Record<string, RowValues>
  posisiKeuangan: Record<string, number | null>
}

export function emptyLampiran1(): Lampiran1Data {
  return { sektor: 'BC01', labaRugi: {}, posisiKeuangan: {} }
}

/** Rows for a sector: BC01 is hand-verified here, BC02–BC12 come from the DJP workbook. */
export function sectorRows(sektor: string): { labaRugi: AccountRow[], posisiKeuangan: AccountRow[] } {
  return SECTOR_SCHEMAS[sektor] ?? { labaRugi: labaRugiRows, posisiKeuangan: posisiKeuanganRows }
}

/** Expense accounts (5xxx): a positive fiscal correction reduces the deductible cost. */
const isExpense = (code: string) => code.startsWith('5')

/** Input-row codes under a total (unsigned), for the fiscal-correction columns. */
function leafCodes(rows: AccountRow[], code: string, acc = new Set<string>()): Set<string> {
  const row = rows.find(r => r.kind !== 'group' && r.code === code)
  if (row?.kind === 'input') acc.add(code)
  else if (row?.kind === 'total') row.formula.forEach(([c]) => leafCodes(rows, c, acc))
  return acc
}

/**
 * Value of any Laba Rugi cell.
 * Input rows: (6) = (3)-(4)-(5); (10) = (6)+(7)-(8) for income, (6)-(7)+(8) for expenses.
 * Total rows: signed formula for amounts; (7)/(8) are plain sums of all corrections.
 */
export function labaRugiValue(data: Lampiran1Data, code: string, col: L1Col): number {
  const rows = sectorRows(data.sektor).labaRugi
  const row = rows.find(r => r.kind !== 'group' && r.code === code)
  if (!row || row.kind === 'group') return 0
  if (row.kind === 'total') {
    if (col === 'c7' || col === 'c8') return [...leafCodes(rows, code)].reduce((acc, c) => acc + n(data.labaRugi[c]?.[col]), 0)
    return row.formula.reduce((acc, [c, sign]) => acc + sign * labaRugiValue(data, c, col), 0)
  }
  const v = data.labaRugi[code] ?? {}
  const c6 = n(v.c3) - n(v.c4) - n(v.c5)
  switch (col) {
    case 'c6': return c6
    case 'c10': return c6 + (isExpense(code) ? -1 : 1) * (n(v.c7) - n(v.c8))
    default: return n(v[col])
  }
}

/** L1A "Beban Penyusutan dan Amortisasi" — the account Lampiran 9's recap reconciles to. */
export const PENYUSUTAN_CODE = '5314'

/** Feeds Lampiran 11B I.a — "Laba (Rugi) Sebelum Pajak" kolom (3). */
export const labaKomersial = (data: Lampiran1Data): number => labaRugiValue(data, GRAND_TOTAL_CODE, 'c3')
/** Feeds Lampiran 11B I.b — "Beban Penyusutan dan Amortisasi" kolom (3). */
export const penyusutanKomersial = (data: Lampiran1Data): number => labaRugiValue(data, PENYUSUTAN_CODE, 'c3')

/**
 * Net fiscal correction on one account, (7) − (8). Null when the sector's schema has no
 * such account — only BC01 is hand-verified, and the others carry different code sets.
 */
export function koreksiNetto(data: Lampiran1Data, code: string): number | null {
  const has = sectorRows(data.sektor).labaRugi.some(r => r.kind === 'input' && r.code === code)
  if (!has) return null
  const v = data.labaRugi[code] ?? {}
  return n(v.c7) - n(v.c8)
}

/**
 * Kolom (9) says which rule a correction is made under, so an amount in (7) or (8)
 * cannot stand without one: PER-11 Lampiran 1 petunjuk kolom (9), and PRD US-004 AC-03.
 *
 * Returns the account codes still missing a code, in sheet order — the account table
 * marks those rows and `validateSpt` turns each into a blocking issue.
 */
export function missingKoreksiCode(data: Lampiran1Data): string[] {
  const out: string[] = []
  for (const r of sectorRows(data.sektor).labaRugi) {
    if (r.kind !== 'input') continue
    const v = data.labaRugi[r.code] ?? {}
    if ((n(v.c7) !== 0 || n(v.c8) !== 0) && !String(v.c9 ?? '').trim()) out.push(r.code)
  }
  return out
}

export function posisiKeuanganValue(data: Lampiran1Data, code: string): number {
  const row = sectorRows(data.sektor).posisiKeuangan.find(r => r.kind !== 'group' && r.code === code)
  if (!row || row.kind === 'group') return 0
  if (row.kind === 'total') return row.formula.reduce((acc, [c, sign]) => acc + sign * posisiKeuanganValue(data, c), 0)
  return n(data.posisiKeuangan[code])
}

/** Feeds SPT Induk D.4 — "Diisi dari Lampiran 1 (sesuai sektor usaha) bagian A kolom (10)". */
export function penghasilanNetoFiskal(data: Lampiran1Data): number {
  return labaRugiValue(data, GRAND_TOTAL_CODE, 'c10')
}
