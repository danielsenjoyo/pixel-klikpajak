/**
 * Mock Jurnal (ERP) books for Lampiran 1 — the "Tarik data dari Jurnal" source
 * (L1 — Fiscal Reconciliation PRD, US-002 / §11 dependencies).
 *
 * What a pull returns: the trial balance per CoA for the tax year (Jurnal's own account
 * numbering and categories) and, for the accounts that need a daftar nominatif, the
 * transactions behind the balance (PRD §6A "transaction-level data required", round-1 F5
 * keeps the picker as an optional aid). No backend: the seed is a Jasa/SaaS company whose
 * balance sheet ties by construction — retained earnings is the plug.
 */
import { n } from '~/utils/currency'

/** Statement class — decides which DJP accounts a CoA may map to (PRD §6 account-class constraint). */
export type CoaClass = 'aset' | 'liabilitas' | 'ekuitas' | 'pendapatan' | 'beban'

export interface JurnalAccount {
  /** Jurnal account number, e.g. "1-10001". */
  coa: string
  name: string
  /** Jurnal's account category, as the CoA list prints it. */
  category: string
  cls: CoaClass
  /**
   * Closing balance for the year, signed the way the statements read: income and expense
   * as positive amounts, assets positive, contra assets (akumulasi, cadangan) negative.
   */
  balance: number
}

export interface JurnalTransaction {
  id: string
  date: string
  /** Jurnal document number. */
  number: string
  description: string
  amount: number
  /** Source record in Jurnal — opened in a new tab (PRD AC-017). */
  url: string
}

export type PullScenario = 'ok' | 'partial' | 'error'

export interface PullResult {
  accounts: JurnalAccount[]
  /** Accounts the pull could not read (AC-004) — loaded as empty lines, flagged, page not blocked. */
  missing: JurnalAccount[]
  transactions: Record<string, JurnalTransaction[]>
  pulledAt: string
}

type Seed = [coa: string, name: string, category: string, cls: CoaClass, balance: number]

const PROFIT_LOSS: Seed[] = [
  ['4-40000', 'Pendapatan Langganan', 'Pendapatan', 'pendapatan', 18_500_000_000],
  ['4-40100', 'Pendapatan Jasa Implementasi', 'Pendapatan', 'pendapatan', 2_400_000_000],
  ['4-40200', 'Diskon Penjualan', 'Pendapatan', 'pendapatan', 350_000_000],
  ['5-50000', 'Beban Pokok Pendapatan - Server & Hosting', 'Harga Pokok Penjualan', 'beban', 3_200_000_000],
  ['5-50100', 'Beban Pokok Pendapatan - Tim Implementasi', 'Harga Pokok Penjualan', 'beban', 1_150_000_000],
  ['6-60001', 'Beban Gaji', 'Beban', 'beban', 6_800_000_000],
  ['6-60002', 'Beban Tunjangan & Bonus', 'Beban', 'beban', 1_250_000_000],
  ['6-60003', 'Beban BPJS Perusahaan', 'Beban', 'beban', 420_000_000],
  ['6-60004', 'Beban Imbalan Kerja (PSAK 24)', 'Beban', 'beban', 310_000_000],
  ['6-60101', 'Beban Perjalanan Dinas', 'Beban', 'beban', 380_000_000],
  ['6-60201', 'Beban Penyusutan - Peralatan & Kendaraan', 'Beban', 'beban', 540_000_000],
  ['6-60202', 'Beban Amortisasi - Software', 'Beban', 'beban', 220_000_000],
  ['6-60301', 'Beban Sewa Kantor', 'Beban', 'beban', 960_000_000],
  ['6-60401', 'Beban Konsultan & Jasa Profesional', 'Beban', 'beban', 450_000_000],
  ['6-60501', 'Beban Iklan & Promosi', 'Beban', 'beban', 610_000_000],
  ['6-60502', 'Beban Entertainment', 'Beban', 'beban', 185_000_000],
  ['6-60601', 'Beban Natura Karyawan', 'Beban', 'beban', 95_000_000],
  ['6-60701', 'Beban Listrik, Air & Internet', 'Beban', 'beban', 240_000_000],
  ['6-60702', 'Beban Perlengkapan Kantor', 'Beban', 'beban', 85_000_000],
  ['6-60801', 'Beban Denda & Sanksi Pajak', 'Beban', 'beban', 42_000_000],
  ['6-60803', 'Beban PPh Ditanggung Perusahaan', 'Beban', 'beban', 64_000_000],
  // Custom account the company added itself — the lookup table has no entry for it (AC-008).
  ['6-60950', 'Beban Kegiatan Komunitas Pengguna', 'Beban', 'beban', 48_000_000],
  ['7-70001', 'Pendapatan Bunga - Jasa Giro', 'Pendapatan Lainnya', 'pendapatan', 18_000_000],
  ['7-70002', 'Pendapatan Bunga - Deposito', 'Pendapatan Lainnya', 'pendapatan', 126_000_000],
  ['7-70003', 'Pendapatan Dividen', 'Pendapatan Lainnya', 'pendapatan', 250_000_000],
  ['7-70004', 'Keuntungan Selisih Kurs', 'Pendapatan Lainnya', 'pendapatan', 34_000_000],
  ['8-80001', 'Beban Administrasi Bank', 'Beban Lainnya', 'beban', 12_000_000],
  ['8-80002', 'Kerugian Selisih Kurs', 'Beban Lainnya', 'beban', 21_000_000],
  ['8-80003', 'Sumbangan', 'Beban Lainnya', 'beban', 75_000_000],
]

const BALANCE_SHEET: Seed[] = [
  ['1-10001', 'Kas', 'Kas & Bank', 'aset', 45_000_000],
  ['1-10002', 'Rekening Bank BCA', 'Kas & Bank', 'aset', 5_850_000_000],
  ['1-10003', 'Rekening Bank Mandiri', 'Kas & Bank', 'aset', 1_120_000_000],
  ['1-10004', 'Deposito Berjangka (< 3 bulan)', 'Kas & Bank', 'aset', 2_000_000_000],
  ['1-10100', 'Piutang Usaha', 'Akun Piutang', 'aset', 2_680_000_000],
  ['1-10101', 'Cadangan Kerugian Piutang', 'Akun Piutang', 'aset', -95_000_000],
  ['1-10300', 'Piutang Karyawan', 'Aktiva Lancar Lainnya', 'aset', 60_000_000],
  ['1-10402', 'Sewa Dibayar di Muka', 'Aktiva Lancar Lainnya', 'aset', 480_000_000],
  ['1-10500', 'PPN Masukan', 'Aktiva Lancar Lainnya', 'aset', 140_000_000],
  ['1-10501', 'PPh 23 Dibayar di Muka', 'Aktiva Lancar Lainnya', 'aset', 210_000_000],
  ['1-10600', 'Uang Muka Pembelian', 'Aktiva Lancar Lainnya', 'aset', 35_000_000],
  ['1-10700', 'Aset Tetap - Peralatan Kantor', 'Aktiva Tetap', 'aset', 2_700_000_000],
  ['1-10701', 'Aset Tetap - Kendaraan', 'Aktiva Tetap', 'aset', 650_000_000],
  ['1-10751', 'Akumulasi Penyusutan - Peralatan Kantor', 'Depresiasi & Amortisasi', 'aset', -1_240_000_000],
  ['1-10752', 'Akumulasi Penyusutan - Kendaraan', 'Depresiasi & Amortisasi', 'aset', -260_000_000],
  ['1-10800', 'Aset Tak Berwujud - Software', 'Aktiva Tetap', 'aset', 1_100_000_000],
  ['1-10801', 'Akumulasi Amortisasi - Software', 'Depresiasi & Amortisasi', 'aset', -440_000_000],
  ['1-10900', 'Uang Jaminan Sewa', 'Aktiva Lainnya', 'aset', 120_000_000],
  ['2-20100', 'Hutang Usaha', 'Akun Hutang', 'liabilitas', 860_000_000],
  ['2-20400', 'Beban Masih Harus Dibayar', 'Kewajiban Lancar Lainnya', 'liabilitas', 390_000_000],
  ['2-20500', 'PPN Keluaran', 'Kewajiban Lancar Lainnya', 'liabilitas', 310_000_000],
  ['2-20501', 'Hutang PPh 21', 'Kewajiban Lancar Lainnya', 'liabilitas', 145_000_000],
  ['2-20502', 'Hutang PPh 23', 'Kewajiban Lancar Lainnya', 'liabilitas', 22_000_000],
  ['2-20700', 'Pendapatan Diterima di Muka', 'Kewajiban Lancar Lainnya', 'liabilitas', 1_640_000_000],
  ['2-20800', 'Liabilitas Imbalan Kerja', 'Kewajiban Jangka Panjang', 'liabilitas', 980_000_000],
  ['3-30000', 'Modal Saham', 'Ekuitas', 'ekuitas', 5_000_000_000],
]

/** Contra-revenue and expense lines reduce profit; everything else in the P&L adds to it. */
const REDUCES_PROFIT = (a: JurnalAccount) => a.cls === 'beban' || a.coa === '4-40200'

function toAccount([coa, name, category, cls, balance]: Seed): JurnalAccount {
  return { coa, name, category, cls, balance }
}

/** Jurnal's balance sheet closes with retained earnings and the current year's profit. */
function trialBalance(): JurnalAccount[] {
  const pl = PROFIT_LOSS.map(toAccount)
  const bs = BALANCE_SHEET.map(toAccount)
  const profit = pl.reduce((acc, a) => acc + (REDUCES_PROFIT(a) ? -a.balance : a.balance), 0)
  const sum = (cls: CoaClass) => bs.filter(a => a.cls === cls).reduce((acc, a) => acc + a.balance, 0)
  const retained = sum('aset') - sum('liabilitas') - sum('ekuitas') - profit
  return [
    ...bs,
    { coa: '3-30100', name: 'Laba Ditahan', category: 'Ekuitas', cls: 'ekuitas', balance: retained },
    { coa: '3-30200', name: 'Laba Tahun Berjalan', category: 'Ekuitas', cls: 'ekuitas', balance: profit },
    ...pl,
  ]
}

/** Transactions behind the accounts that typically need a daftar nominatif. Each list sums to its balance. */
const TRANSACTIONS: Record<string, [date: string, number: string, description: string, amount: number][]> = {
  '6-60501': [
    ['02/02', 'EXP-00112', 'Iklan Google Ads Q1', 180_000_000],
    ['14/04', 'EXP-00241', 'Sponsor acara Indonesia Tax Summit', 150_000_000],
    ['09/06', 'EXP-00318', 'Merchandise promosi pelanggan', 65_000_000],
    ['21/08', 'EXP-00402', 'Iklan LinkedIn kampanye UMKM', 135_000_000],
    ['03/11', 'EXP-00517', 'Booth pameran Jakarta Fintech Week', 80_000_000],
  ],
  '6-60502': [
    ['18/01', 'EXP-00087', 'Jamuan makan malam calon klien BUMN', 28_500_000],
    ['07/03', 'EXP-00165', 'Golf bersama mitra distribusi', 41_000_000],
    ['22/05', 'EXP-00290', 'Jamuan makan siang klien enterprise', 12_750_000],
    ['16/07', 'EXP-00366', 'Hadiah Lebaran untuk klien', 54_000_000],
    ['30/09', 'EXP-00451', 'Jamuan makan malam direksi mitra', 31_250_000],
    ['12/12', 'EXP-00598', 'Acara akhir tahun bersama klien', 17_500_000],
  ],
  '6-60601': [
    ['31/03', 'EXP-00180', 'Makan siang bersama seluruh karyawan', 38_000_000],
    ['15/08', 'EXP-00395', 'Seragam karyawan', 22_000_000],
    ['20/12', 'EXP-00611', 'Bingkisan akhir tahun karyawan', 35_000_000],
  ],
  '6-60801': [
    ['25/04', 'JV-00211', 'STP bunga PPh Pasal 25 Maret', 17_000_000],
    ['28/10', 'JV-00488', 'STP denda keterlambatan SPT Masa PPN', 25_000_000],
  ],
  '8-80003': [
    ['10/04', 'EXP-00220', 'Sumbangan bencana banjir Demak', 30_000_000],
    ['17/08', 'EXP-00381', 'Sumbangan perayaan HUT RI warga sekitar', 15_000_000],
    ['05/12', 'EXP-00572', 'Donasi beasiswa yayasan pendidikan', 30_000_000],
  ],
}

/**
 * Everything else in the P&L gets a year of generated activity — the realistic case the picker
 * has to handle is hundreds of lines per account, not five. Deterministic (seeded per CoA), so
 * a re-pull returns the same transactions and earlier ticks still match. Each list sums exactly
 * to the account balance.
 */
const TX_PROFILE: { match: (coa: string) => boolean, size: number, prefix: string, texts: string[] }[] = [
  { match: c => c.startsWith('4-'), size: 45_000_000, prefix: 'INV', texts: ['Invoice langganan', 'Invoice implementasi', 'Invoice perpanjangan langganan', 'Penyesuaian invoice'] },
  { match: c => c.startsWith('5-'), size: 30_000_000, prefix: 'BILL', texts: ['Tagihan server cloud', 'Tagihan hosting', 'Honor tim implementasi', 'Lisensi pihak ketiga'] },
  { match: c => c === '6-60001' || c === '6-60002' || c === '6-60003', size: 140_000_000, prefix: 'PAY', texts: ['Penggajian', 'Pembayaran tunjangan', 'Iuran BPJS', 'Bonus kinerja'] },
  { match: c => c.startsWith('7-'), size: 6_000_000, prefix: 'BNK', texts: ['Bunga rekening', 'Bunga deposito', 'Penerimaan lain', 'Selisih kurs'] },
  { match: () => true, size: 4_500_000, prefix: 'EXP', texts: ['Pembayaran', 'Biaya operasional', 'Penggantian biaya', 'Tagihan vendor'] },
]

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generated(account: JurnalAccount, year: number): JurnalTransaction[] {
  const profile = TX_PROFILE.find(p => p.match(account.coa))!
  const total = Math.round(account.balance)
  const count = Math.max(3, Math.min(320, Math.round(total / profile.size)))
  const rand = seeded([...account.coa].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7))
  const weights = Array.from({ length: count }, () => 0.4 + rand())
  const sum = weights.reduce((a, b) => a + b, 0)
  const amounts = weights.map(w => Math.round((total * w) / sum / 1000) * 1000)
  amounts[amounts.length - 1]! += total - amounts.reduce((a, b) => a + b, 0)
  const days = amounts.map(() => Math.floor(rand() * 365)).sort((a, b) => a - b)
  return amounts.map((amount, i) => {
    const d = new Date(Date.UTC(year, 0, 1 + days[i]!))
    const number = `${profile.prefix}-${account.coa.replace('-', '')}-${String(i + 1).padStart(4, '0')}`
    const text = profile.texts[Math.floor(rand() * profile.texts.length)]!
    return {
      id: `${account.coa}-${number}`,
      date: `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${year}`,
      number,
      description: `${text} — ${account.name}`,
      amount,
      url: `https://my.jurnal.id/transactions/${number.toLowerCase()}`,
    }
  })
}

function transactionsFor(year: number, accounts: JurnalAccount[]): Record<string, JurnalTransaction[]> {
  const curated = Object.fromEntries(Object.entries(TRANSACTIONS).map(([coa, list]) => [
    coa,
    list.map(([date, number, description, amount]) => ({
      id: `${coa}-${number}`,
      date: `${date}/${year}`,
      number,
      description,
      amount,
      url: `https://my.jurnal.id/transactions/${number.toLowerCase()}`,
    })),
  ]))
  const rest = accounts
    .filter(a => (a.cls === 'pendapatan' || a.cls === 'beban') && !curated[a.coa] && a.balance > 0)
    .map(a => [a.coa, generated(a, year)])
  return { ...curated, ...Object.fromEntries(rest) }
}

/** Accounts a "partial" pull drops — one from each statement, so both tabs show the flag. */
const PARTIAL_DROPS = ['1-10501', '6-60301', '7-70004']

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Pull the year's books from Jurnal. `error` rejects (AC-006 — the caller keeps the draft),
 * `partial` returns with a few accounts unread (AC-004).
 */
export async function pullJurnal(year: number, scenario: PullScenario): Promise<PullResult> {
  await wait(900)
  if (scenario === 'error') throw new Error('Layanan Jurnal sedang tidak dapat dihubungi.')
  const all = trialBalance()
  const missing = scenario === 'partial' ? all.filter(a => PARTIAL_DROPS.includes(a.coa)) : []
  return {
    accounts: all.filter(a => !missing.includes(a)),
    missing,
    transactions: transactionsFor(year, all),
    pulledAt: new Date().toISOString(),
  }
}

/** Sum of a transaction selection — the default amount the picker proposes (AC-012). */
export const sumTransactions = (list: JurnalTransaction[]) => list.reduce((acc, t) => acc + n(t.amount), 0)
