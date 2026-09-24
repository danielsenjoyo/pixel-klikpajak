/** Header menus that aren't part of the sidebar tree (source: components/Pixel/Header/Bar/Action). */

export interface QuickAccessGroup {
  title: string
  items: { label: string, path: string }[]
}

/** "+" quick-access popover — Buat / Lapor / Upload shortcuts. Source: Action/Quick. */
export const quickAccessGroups: QuickAccessGroup[] = [
  {
    title: 'Buat',
    items: [
      { label: 'ID Billing', path: '/main/ebilling/create' },
      { label: 'Faktur keluaran', path: '/main/efaktur-v2/out/create' },
    ],
  },
  { title: 'Lapor', items: [{ label: 'SPT Tahunan', path: '/main/efiling/report/spt' }] },
  { title: 'Upload', items: [{ label: 'Bukti potong', path: '/main/ebupot-v2/unifikasi/domestic/create' }] },
]

export interface SwitchAppGroup {
  title: string
  items: { label: string, desc: string, icon: string }[]
}

/** Mekari app switcher drawer. Source: Action/SwitchApp. */
export const switchAppGroups: SwitchAppGroup[] = [
  {
    title: 'Produk Mekari yang Anda gunakan',
    items: [{ label: 'Mekari Klikpajak', desc: 'Aplikasi pengelolaan pajak terdaftar DJP', icon: 'klikpajak-brand' }],
  },
  {
    title: 'Produk Mekari lainnya',
    items: [
      { label: 'Mekari Talenta', desc: 'Aplikasi payroll & HRIS terautomasi', icon: 'talenta-brand' },
      { label: 'Mekari Jurnal', desc: 'Aplikasi akuntansi online terintegrasi', icon: 'jurnal-brand' },
      { label: 'Mekari Qontak', desc: 'Aplikasi omnichannel CRM terautomasi', icon: 'qontak-brand' },
      { label: 'Mekari Flex', desc: 'Aplikasi manajemen tunjangan karyawan yang fleksibel', icon: 'flex-brand' },
      { label: 'Mekari e-Sign', desc: 'Aplikasi penyelenggara layanan e-Signature', icon: 'sign-brand' },
    ],
  },
  {
    title: 'Lainnya dari Mekari',
    items: [{ label: 'Mekari University', desc: 'Platform belajar profesional', icon: 'university-brand' }],
  },
]
