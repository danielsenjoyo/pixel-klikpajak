/**
 * Mock of the user-setting / company payload the source header and sidebar read
 * from the Vuex store (user/getUserSetting, company/getCompanyDetail). Replace
 * with richer seed data when modules are ported.
 */
export interface Company {
  id: number
  name: string
  /** 16-digit NPWP, shown unformatted like the source header. */
  npwp: string
  /**
   * Entity form. Yayasan and KIK are not owned through capital contribution, so
   * Lampiran 2A drops the modal disetor / dividen columns and the 100% rule does
   * not apply to them (PRD F4 §4, §7 V-A1). Absent = ordinary capital-owned entity.
   */
  entityType?: 'yayasan' | 'kik-reksadana' | 'kik-eba'
  /**
   * Bentuk usaha tetap — activates SPT Badan Lampiran 12A/12B (PRD §5.7).
   * The real flag comes from registration; how it is detected is still open
   * (OI-BUTdetect), so the prototype carries it on the company record.
   */
  isBut?: boolean
  /** Contact on the DJP record — read-only in the return (brief §6.1 A, §10 RO-DJP). */
  email: string
  phone: string
  /**
   * Penandatangan from the Coretax signer module. The return renders it read-only:
   * it is changed in Coretax, never in the SPT form (brief §6.1 J, §10 RO-signer).
   */
  signer: { nikNpwp: string, nama: string, jabatan: string }
  /**
   * Rekening on the Coretax profile. F.19b lets the preparer pick one; the number and
   * holder that come with it stay read-only (brief §9 row 19b).
   */
  bankAccounts: { id: string, bank: string, nomor: string, pemilik: string }[]
}

export const companies: Company[] = [
  {
    id: 188311,
    name: 'PT Mekari Pajak Indonesia',
    npwp: '0123456789012345',
    email: 'pajak@mekari.com',
    phone: '02150981893',
    signer: { nikNpwp: '3174091203890001', nama: 'Andi Wijaya', jabatan: 'Direktur Utama' },
    bankAccounts: [
      { id: 'bca-utama', bank: 'Bank Central Asia (BCA)', nomor: '5410288812', pemilik: 'PT Mekari Pajak Indonesia' },
      { id: 'mandiri-ops', bank: 'Bank Mandiri', nomor: '1220098877341', pemilik: 'PT Mekari Pajak Indonesia' },
    ],
  },
  {
    id: 188312,
    name: 'PT Central Perk Indonesia',
    npwp: '0234567890123456',
    email: 'finance@centralperk.co.id',
    phone: '02129887766',
    signer: { nikNpwp: '3172051108840011', nama: 'Rina Kartika', jabatan: 'Direktur Keuangan' },
    bankAccounts: [{ id: 'bni-utama', bank: 'Bank Negara Indonesia (BNI)', nomor: '0881234567', pemilik: 'PT Central Perk Indonesia' }],
  },
  {
    id: 188313,
    name: 'CV Sinar Jaya Abadi',
    npwp: '0345678901234567',
    email: 'admin@sinarjaya.co.id',
    phone: '0318765432',
    signer: { nikNpwp: '3578012509790022', nama: 'Budi Santoso', jabatan: 'Direktur' },
    bankAccounts: [{ id: 'bri-utama', bank: 'Bank Rakyat Indonesia (BRI)', nomor: '003401000123456', pemilik: 'CV Sinar Jaya Abadi' }],
  },
  {
    id: 188314,
    name: 'BUT Nippon Trading Co., Ltd.',
    npwp: '0456789012345678',
    isBut: true,
    email: 'tax.id@nippontrading.co.jp',
    phone: '02157901234',
    signer: { nikNpwp: '9945678901234567', nama: 'Kenji Tanaka', jabatan: 'Chief Representative' },
    bankAccounts: [{ id: 'cimb-but', bank: 'Bank CIMB Niaga', nomor: '8001234567', pemilik: 'BUT Nippon Trading Co., Ltd.' }],
  },
  {
    id: 188315,
    name: 'Yayasan Mekari Peduli',
    npwp: '0567890123456789',
    entityType: 'yayasan',
    email: 'sekretariat@mekaripeduli.org',
    phone: '02150981899',
    signer: { nikNpwp: '3173042108750003', nama: 'Bambang Sutrisno', jabatan: 'Ketua Pembina' },
    bankAccounts: [{ id: 'bsi-yayasan', bank: 'Bank Syariah Indonesia (BSI)', nomor: '7001122334', pemilik: 'Yayasan Mekari Peduli' }],
  },
]

/**
 * Owner roster DJP prefills into Lampiran 2 Part A from registration (Pihak Terkait)
 * and the prior-year SPT. Klikpajak never adds or removes these rows — it only edits
 * Kode Negara, Modal Disetor and Dividen (PRD F4 §3). Stand-in for the real prefill.
 */
export const pemegangSahamPrefill: Record<number, { nama: string, alamat: string, kodeNegara: string, npwp: string, jabatan: string, modal: number, persen: number }[]> = {
  188311: [
    { nama: 'Mekari Holdings Pte Ltd', alamat: '8 Marina View, Asia Square Tower 1, Singapura', kodeNegara: 'SGP', npwp: '9912345678901234', jabatan: 'Pemegang Saham', modal: 6_000_000_000, persen: 60 },
    { nama: 'PT Sumber Daya Nusantara', alamat: 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan', kodeNegara: 'IDN', npwp: '0198765432109876', jabatan: 'Pemegang Saham', modal: 3_000_000_000, persen: 30 },
    { nama: 'Andi Wijaya', alamat: 'Jl. Kemang Raya No. 12, Jakarta Selatan', kodeNegara: 'IDN', npwp: '3174091203890001', jabatan: 'Direktur Utama', modal: 1_000_000_000, persen: 10 },
    { nama: 'Siti Rahmawati', alamat: 'Jl. Cikini Raya No. 5, Jakarta Pusat', kodeNegara: 'IDN', npwp: '3171065507920002', jabatan: 'Komisaris', modal: 0, persen: 0 },
  ],
  188315: [
    { nama: 'Bambang Sutrisno', alamat: 'Jl. Diponegoro No. 21, Jakarta Pusat', kodeNegara: 'IDN', npwp: '3173042108750003', jabatan: 'Ketua Pembina', modal: 0, persen: 0 },
    { nama: 'Ratna Kusuma', alamat: 'Jl. Salemba Raya No. 8, Jakarta Pusat', kodeNegara: 'IDN', npwp: '3175061410880004', jabatan: 'Ketua Pengurus', modal: 0, persen: 0 },
    { nama: 'Hendra Gunawan', alamat: 'Jl. Menteng Dalam No. 3, Jakarta Selatan', kodeNegara: 'IDN', npwp: '3174022709800005', jabatan: 'Pengawas', modal: 0, persen: 0 },
  ],
}

/**
 * Tempat kegiatan usaha registered in Coretax, which Lampiran 5 bagian A reports as-is.
 * PER-11 is explicit that this is DJP's own register — "Data tempat kegiatan usaha
 * merupakan data yang terdaftar dalam administrasi Direktorat Jenderal Pajak. Jika
 * informasi ini belum tersedia, maka Wajib Pajak perlu melakukan pemutakhiran data" —
 * so a missing TKU is fixed in Coretax, never typed into the SPT.
 *
 * A NITKU is the 16-digit NPWP followed by a 6-digit branch sequence, so the samples are
 * generated from the company's own NPWP rather than hardcoded.
 */
export interface TkuRow {
  niTku: string
  namaTku: string
  alamat: string
  kelurahan: string
  kecamatan: string
  kota: string
  provinsi: string
}

const TKU_PLACES: Record<number, Omit<TkuRow, 'niTku' | 'namaTku'>[]> = {
  188311: [
    { alamat: 'Jl. Gatot Subroto No. 40', kelurahan: 'Senayan', kecamatan: 'Kebayoran Baru', kota: 'Kota Adm. Jakarta Selatan', provinsi: 'DKI Jakarta' },
    { alamat: 'Jl. Indrapura No. 5', kelurahan: 'Krembangan Selatan', kecamatan: 'Krembangan', kota: 'Kota Surabaya', provinsi: 'Jawa Timur' },
    { alamat: 'Jl. A. Yani Utara No. 200', kelurahan: 'Arjosari', kecamatan: 'Blimbing', kota: 'Kota Malang', provinsi: 'Jawa Timur' },
  ],
  188315: [
    { alamat: 'Jl. Salemba Raya No. 8', kelurahan: 'Paseban', kecamatan: 'Senen', kota: 'Kota Adm. Jakarta Pusat', provinsi: 'DKI Jakarta' },
  ],
}

export function tkuPrefill(companyId: number): TkuRow[] {
  const company = companies.find(c => c.id === companyId)
  if (!company) return []
  return (TKU_PLACES[companyId] ?? []).map((place, i) => ({
    niTku: `${company.npwp}${String(i).padStart(6, '0')}`,
    namaTku: company.name,
    ...place,
  }))
}

export const session = {
  companyId: 188311,
  /** Source: companyData.jurnalCid === 0 → shows the app switcher, company list and logout. */
  isJurnalUser: false,
  /** Source: companyData.efinRegistered — false shows the "Daftar Efin" header button. */
  isEfinRegistered: true,
  /** Sidebar counters (source: badgeValue[item.badgeName]). */
  sidebarBadges: { payableCount: 0 },
}
