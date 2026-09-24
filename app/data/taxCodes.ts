/**
 * Reference code lists for SPT Tahunan Badan lampiran selects.
 *
 * The source app loads these from the backend (`/country-codes`, `initialData.*List`), so this
 * is mock seed data until those endpoints are ported:
 *   - NEGARA / MATA_UANG use real ISO 3166-1 alpha-3 / ISO 4217 codes (a subset).
 *   - METODE_HARGA uses the standard transfer-pricing method abbreviations.
 *   - The other lists are regulation categories with this app's own ids — replace the ids
 *     with DJP's codes when the reference data is available.
 */
import type { CodeOption } from '~/data/spt1771Engine'

interface Code { code: string, name: string }

/** Select options; `withCode` shows "SGP — Singapura", otherwise just the name. */
export const toOptions = (list: readonly Code[], withCode = true): CodeOption[] =>
  list.map(c => ({ value: c.code, label: withCode ? `${c.code} — ${c.name}` : c.name }))

/** Name for a stored code ('' when empty or unknown). */
export const codeName = (list: readonly Code[], code: unknown): string =>
  list.find(c => c.code === code)?.name ?? ''

// ── ISO 3166-1 alpha-3 (subset: Indonesia, treaty partners, common counterparties) ──
export const NEGARA: Code[] = [
  { code: 'IDN', name: 'Indonesia' },
  { code: 'AUS', name: 'Australia' },
  { code: 'AUT', name: 'Austria' },
  { code: 'ARE', name: 'Uni Emirat Arab' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'BEL', name: 'Belgia' },
  { code: 'BGD', name: 'Bangladesh' },
  { code: 'BHR', name: 'Bahrain' },
  { code: 'BHS', name: 'Bahama' },
  { code: 'BMU', name: 'Bermuda' },
  { code: 'BRA', name: 'Brasil' },
  { code: 'BRN', name: 'Brunei Darussalam' },
  { code: 'CAN', name: 'Kanada' },
  { code: 'CHE', name: 'Swiss' },
  { code: 'CHL', name: 'Chili' },
  { code: 'CHN', name: 'Tiongkok' },
  { code: 'CYM', name: 'Kepulauan Cayman' },
  { code: 'CZE', name: 'Ceko' },
  { code: 'DEU', name: 'Jerman' },
  { code: 'DNK', name: 'Denmark' },
  { code: 'EGY', name: 'Mesir' },
  { code: 'ESP', name: 'Spanyol' },
  { code: 'FIN', name: 'Finlandia' },
  { code: 'FRA', name: 'Prancis' },
  { code: 'GBR', name: 'Britania Raya' },
  { code: 'GGY', name: 'Guernsey' },
  { code: 'HKG', name: 'Hong Kong' },
  { code: 'HUN', name: 'Hongaria' },
  { code: 'IMN', name: 'Pulau Man' },
  { code: 'IND', name: 'India' },
  { code: 'IRL', name: 'Irlandia' },
  { code: 'ITA', name: 'Italia' },
  { code: 'JEY', name: 'Jersey' },
  { code: 'JOR', name: 'Yordania' },
  { code: 'JPN', name: 'Jepang' },
  { code: 'KHM', name: 'Kamboja' },
  { code: 'KOR', name: 'Korea Selatan' },
  { code: 'KWT', name: 'Kuwait' },
  { code: 'LAO', name: 'Laos' },
  { code: 'LIE', name: 'Liechtenstein' },
  { code: 'LKA', name: 'Sri Lanka' },
  { code: 'LUX', name: 'Luksemburg' },
  { code: 'MAC', name: 'Makau' },
  { code: 'MCO', name: 'Monako' },
  { code: 'MEX', name: 'Meksiko' },
  { code: 'MMR', name: 'Myanmar' },
  { code: 'MUS', name: 'Mauritius' },
  { code: 'MYS', name: 'Malaysia' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'NLD', name: 'Belanda' },
  { code: 'NOR', name: 'Norwegia' },
  { code: 'NZL', name: 'Selandia Baru' },
  { code: 'OMN', name: 'Oman' },
  { code: 'PAK', name: 'Pakistan' },
  { code: 'PAN', name: 'Panama' },
  { code: 'PHL', name: 'Filipina' },
  { code: 'POL', name: 'Polandia' },
  { code: 'PRT', name: 'Portugal' },
  { code: 'QAT', name: 'Qatar' },
  { code: 'ROU', name: 'Rumania' },
  { code: 'RUS', name: 'Rusia' },
  { code: 'SAU', name: 'Arab Saudi' },
  { code: 'SGP', name: 'Singapura' },
  { code: 'SWE', name: 'Swedia' },
  { code: 'SYC', name: 'Seychelles' },
  { code: 'THA', name: 'Thailand' },
  { code: 'TUR', name: 'Turki' },
  { code: 'TWN', name: 'Taiwan' },
  { code: 'USA', name: 'Amerika Serikat' },
  { code: 'VGB', name: 'Kepulauan Virgin Britania Raya' },
  { code: 'VNM', name: 'Vietnam' },
  { code: 'ZAF', name: 'Afrika Selatan' },
]

// ── ISO 4217 (subset) ────────────────────────────────────────────────────────
export const MATA_UANG: Code[] = [
  { code: 'USD', name: 'Dolar Amerika Serikat' },
  { code: 'AUD', name: 'Dolar Australia' },
  { code: 'BND', name: 'Dolar Brunei' },
  { code: 'CAD', name: 'Dolar Kanada' },
  { code: 'CHF', name: 'Franc Swiss' },
  { code: 'CNY', name: 'Yuan Tiongkok' },
  { code: 'DKK', name: 'Krone Denmark' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'Pound Sterling' },
  { code: 'HKD', name: 'Dolar Hong Kong' },
  { code: 'INR', name: 'Rupee India' },
  { code: 'JPY', name: 'Yen Jepang' },
  { code: 'KRW', name: 'Won Korea' },
  { code: 'MYR', name: 'Ringgit Malaysia' },
  { code: 'NOK', name: 'Krone Norwegia' },
  { code: 'NZD', name: 'Dolar Selandia Baru' },
  { code: 'PHP', name: 'Peso Filipina' },
  { code: 'SAR', name: 'Riyal Arab Saudi' },
  { code: 'SEK', name: 'Krona Swedia' },
  { code: 'SGD', name: 'Dolar Singapura' },
  { code: 'THB', name: 'Baht Thailand' },
  { code: 'TWD', name: 'Dolar Taiwan' },
  { code: 'AED', name: 'Dirham Uni Emirat Arab' },
  { code: 'VND', name: 'Dong Vietnam' },
]

// ── Lampiran 3A — jenis penghasilan dari luar negeri (Pasal 24 categories) ───
export const PENGHASILAN_LUAR_NEGERI: Code[] = [
  { code: 'dividen', name: 'Dividen' },
  { code: 'bunga', name: 'Bunga' },
  { code: 'royalti', name: 'Royalti' },
  { code: 'sewa', name: 'Sewa dan penghasilan lain sehubungan dengan penggunaan harta' },
  { code: 'jasa', name: 'Imbalan sehubungan dengan jasa, pekerjaan, dan kegiatan' },
  { code: 'pengalihan', name: 'Keuntungan dari pengalihan harta' },
  { code: 'usaha', name: 'Laba usaha' },
  { code: 'lainnya', name: 'Penghasilan lainnya' },
]

// ── Lampiran 4A — objek PPh final (mock ids) ─────────────────────────────────
export const OBJEK_PPH_FINAL: Code[] = [
  { code: 'F01', name: 'Bunga deposito, tabungan, dan diskonto SBI' },
  { code: 'F02', name: 'Bunga dan/atau diskonto obligasi' },
  { code: 'F03', name: 'Penjualan saham di bursa efek' },
  { code: 'F04', name: 'Persewaan tanah dan/atau bangunan' },
  { code: 'F05', name: 'Pengalihan hak atas tanah dan/atau bangunan' },
  { code: 'F06', name: 'Jasa konstruksi' },
  { code: 'F07', name: 'Penghasilan dari usaha dengan peredaran bruto tertentu' },
  { code: 'F08', name: 'Hadiah undian' },
  { code: 'F09', name: 'Penghasilan lain yang dikenakan PPh final' },
]

// ── Lampiran 4B — penghasilan yang tidak termasuk objek pajak (mock ids) ─────
export const NON_OBJEK_PAJAK: Code[] = [
  { code: 'N01', name: 'Bantuan, sumbangan, zakat, dan harta hibahan' },
  { code: 'N02', name: 'Warisan' },
  { code: 'N03', name: 'Harta sebagai pengganti saham atau penyertaan modal' },
  { code: 'N04', name: 'Pembayaran dari perusahaan asuransi' },
  { code: 'N05', name: 'Dividen atau bagian laba dari dalam negeri' },
  { code: 'N06', name: 'Iuran yang diterima dana pensiun' },
  { code: 'N07', name: 'Penghasilan dana pensiun dari penanaman modal' },
  { code: 'N08', name: 'Bagian laba anggota perseroan komanditer, persekutuan, perkumpulan, firma, dan kongsi' },
  { code: 'N09', name: 'Penghasilan perusahaan modal ventura dari pasangan usaha' },
  { code: 'N10', name: 'Beasiswa' },
  { code: 'N11', name: 'Sisa lebih badan atau lembaga pendidikan dan/atau penelitian dan pengembangan' },
  { code: 'N12', name: 'Bantuan atau santunan dari BPJS' },
  { code: 'N13', name: 'Penghasilan lain yang tidak termasuk objek pajak' },
]

// ── Lampiran 10A — hubungan istimewa (PMK 172/2023 categories) ───────────────
export const BENTUK_HUBUNGAN: Code[] = [
  { code: 'modal-langsung', name: 'Kepemilikan atau penyertaan modal secara langsung' },
  { code: 'modal-tidak-langsung', name: 'Kepemilikan atau penyertaan modal secara tidak langsung' },
  { code: 'penguasaan', name: 'Penguasaan melalui manajemen atau penggunaan teknologi' },
  { code: 'keluarga', name: 'Hubungan keluarga sedarah atau semenda' },
]

export const JENIS_TRANSAKSI: Code[] = [
  { code: 'jual-barang', name: 'Penjualan barang' },
  { code: 'beli-barang', name: 'Pembelian barang' },
  { code: 'serah-jasa', name: 'Penyerahan jasa' },
  { code: 'terima-jasa', name: 'Penerimaan jasa' },
  { code: 'bayar-royalti', name: 'Pembayaran royalti atau imbalan penggunaan harta tak berwujud' },
  { code: 'terima-royalti', name: 'Penerimaan royalti atau imbalan penggunaan harta tak berwujud' },
  { code: 'beri-pinjaman', name: 'Pemberian pinjaman' },
  { code: 'terima-pinjaman', name: 'Penerimaan pinjaman' },
  { code: 'alih-berwujud', name: 'Pengalihan harta berwujud' },
  { code: 'alih-tak-berwujud', name: 'Pengalihan harta tak berwujud' },
  { code: 'lainnya', name: 'Transaksi lainnya' },
]

export const METODE_HARGA: Code[] = [
  { code: 'CUP', name: 'Metode perbandingan harga antara pihak yang independen' },
  { code: 'RPM', name: 'Metode harga penjualan kembali' },
  { code: 'CPM', name: 'Metode biaya-plus' },
  { code: 'PSM', name: 'Metode pembagian laba' },
  { code: 'TNMM', name: 'Metode laba bersih transaksional' },
  { code: 'CUT', name: 'Metode perbandingan transaksi independen' },
  { code: 'Lainnya', name: 'Metode lainnya' },
]
