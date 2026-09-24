/**
 * Top-nav menu — ported from jurnal-tax
 * frontend/src/shared/constants/navigation/menu.js.
 *
 * Fields keep their source meaning:
 * - show: default visibility
 * - rolePermissionCode: permission key (not enforced yet — see docs/ROADMAP.md)
 * - matchPrefix: item is active when the current path starts with it
 *   (source: typeCheck: 'includes' + includedPath)
 * - isNew / isPremium: badges (source: useNewBadge / isPremiumFeature)
 * - isMobileOnly: only rendered in the mobile menu (source: isMobileViewOnly)
 *
 * The deprecated E-Faktur "Arsip" sub-tree (/main/efaktur/*) is kept because the
 * source still renders it under E-Faktur.
 */
export interface NavItem {
  key?: string
  label: string
  path?: string
  show: boolean
  rolePermissionCode?: string
  matchPrefix?: string
  isNew?: boolean
  isPremium?: boolean
  isMobileOnly?: boolean
  children?: NavItem[]
}

const efakturArchive: NavItem = {
  key: 'efaktur-archive',
  show: true,
  label: 'Arsip',
  path: '/main/efaktur',
  children: [
    { key: 'nsfp', show: true, label: 'NSFP', path: '/main/efaktur/nsfp', rolePermissionCode: 'EFAKTUR_NSFP_VIEW' },
    {
      key: 'efaktur',
      show: true,
      label: 'Faktur',
      rolePermissionCode: 'EFAKTUR_DOC_VIEW',
      children: [
        { show: true, label: 'Faktur Keluaran', path: '/main/efaktur/out' },
        { show: true, label: 'Faktur Masukan', path: '/main/efaktur/in' },
        { show: true, label: 'Retur Faktur Keluaran', path: '/main/efaktur/out/return' },
        { show: true, label: 'Retur Faktur Masukan', path: '/main/efaktur/in/return' },
      ],
    },
    {
      key: 'doc',
      show: true,
      label: 'Dokumen Lain',
      path: '/main/efaktur/document',
      rolePermissionCode: 'EFAKTUR_DOC_VIEW',
      children: [
        { show: true, label: 'Dokumen Lain Keluaran', path: '/main/efaktur/document/out' },
        { show: true, label: 'Dokumen Lain Masukan', path: '/main/efaktur/document/in' },
        { show: true, label: 'Retur Dokumen Lain Keluaran', path: '/main/efaktur/document/out/return' },
        { show: true, label: 'Retur Dokumen Lain Masukan', path: '/main/efaktur/document/in/return' },
      ],
    },
    { key: 'reconcile', show: true, label: 'Rekonsiliasi', path: '/main/efaktur/reconcile', rolePermissionCode: 'EFAKTUR_RECON_VIEW', isNew: true },
    { key: 'import', show: true, label: 'Impor Faktur Pajak', path: '/main/efaktur/import', rolePermissionCode: 'EFAKTUR_DOC_VIEW' },
    { key: 'spt', show: true, label: 'SPT', path: '/main/efaktur/spt', rolePermissionCode: 'EFAKTUR_SPT_VIEW' },
  ],
}

export const navigation: NavItem[] = [
  { key: 'home', show: true, label: 'Dasbor', path: '/main/home' },
  {
    key: 'ebilling',
    show: true,
    label: 'E-Billing',
    path: '/main/ebilling',
    rolePermissionCode: 'EBILLING_VIEW',
    matchPrefix: '/main/ebilling',
  },
  {
    key: 'report',
    show: true,
    label: 'Lapor Pajak',
    path: '/main/efiling/report/spt-masa-unifikasi',
    rolePermissionCode: 'EFILING_VIEW',
    matchPrefix: '/main/efiling',
  },
  {
    key: 'faktur',
    show: true,
    label: 'E-Faktur',
    path: '/main/efaktur-v2',
    rolePermissionCode: 'EFAKTUR_VIEW',
    matchPrefix: '/main/efaktur',
    children: [
      { key: 'nsfp-v2', show: true, label: 'NSFP', path: '/main/efaktur-v2/nsfp', rolePermissionCode: 'EFAKTUR_NSFP_VIEW' },
      {
        key: 'efaktur-v2',
        show: true,
        label: 'Faktur',
        rolePermissionCode: 'EFAKTUR_DOC_VIEW',
        children: [
          { show: true, label: 'Faktur Keluaran', path: '/main/efaktur-v2/out' },
          { show: true, label: 'Faktur Masukan', path: '/main/efaktur-v2/in' },
          { show: true, label: 'Retur Faktur Keluaran', path: '/main/efaktur-v2/out/return' },
          { show: true, label: 'Retur Faktur Masukan', path: '/main/efaktur-v2/in/return' },
        ],
      },
      {
        key: 'doc',
        show: true,
        label: 'Dokumen Lain',
        path: '/main/efaktur-v2/document',
        rolePermissionCode: 'EFAKTUR_DOC_VIEW',
        children: [
          { show: true, label: 'Dokumen Lain Keluaran', path: '/main/efaktur-v2/document/out' },
          { show: true, label: 'Dokumen Lain Masukan', path: '/main/efaktur-v2/document/in' },
          { show: true, label: 'Retur Dokumen Lain Keluaran', path: '/main/efaktur-v2/document/out/return' },
          { show: true, label: 'Retur Dokumen Lain Masukan', path: '/main/efaktur-v2/document/in/return' },
        ],
      },
      { key: 'reconcile', show: true, label: 'Rekonsiliasi', path: '/main/efaktur/reconcile', rolePermissionCode: 'EFAKTUR_RECON_VIEW', isPremium: true },
      { key: 'import', show: true, label: 'Impor Faktur Pajak', path: '/main/efaktur-v2/import', rolePermissionCode: 'EFAKTUR_DOC_VIEW' },
      { key: 'spt', show: true, label: 'SPT', path: '/main/efaktur/spt', rolePermissionCode: 'EFAKTUR_SPT_VIEW' },
      efakturArchive,
    ],
  },
  {
    key: 'scan-faktur',
    show: true,
    label: 'Scan Faktur',
    path: '/main/efaktur/in/scan',
    rolePermissionCode: 'EFAKTUR_DOC_CREATE',
    isMobileOnly: true,
  },
  {
    key: 'bupot',
    show: true,
    label: 'E-Bupot',
    path: '/main/ebupot',
    rolePermissionCode: 'EBUPOT_VIEW',
    matchPrefix: '/main/ebupot',
    children: [
      // Legacy v1 unifikasi entries are hidden in the source (toggleCtasEbupot).
      { key: 'ebupot-unifikasi-domestic', show: false, label: 'PPh Pasal 4 ayat (2), 15, 22 & 23', path: '/main/ebupot/unifikasi/domestic', rolePermissionCode: 'EBUPOT_WITHHOLDING_VIEW' },
      { key: 'ebupot-unifikasi-foreign', show: false, label: 'BP Non-Residen Legacy', path: '/main/ebupot/unifikasi/foreign', rolePermissionCode: 'EBUPOT_WITHHOLDING_VIEW' },
      { key: 'ebupot-unifikasi-domestic-v2', show: true, label: 'BP Unifikasi/21/A0', path: '/main/ebupot-v2/unifikasi/domestic' },
      { key: 'ebupot-unifikasi-foreign-v2', show: true, label: 'BP Non-Residen', path: '/main/ebupot-v2/unifikasi/foreign' },
      { key: 'ebupot-v2-bp21', show: true, label: 'BP 21', path: '/main/ebupot-v2/bp21' },
      { key: 'ebupot-v2-bp26', show: true, label: 'BP 26', path: '/main/ebupot-v2/bp26' },
      { key: 'ebupot-v2-bpmp', show: true, label: 'BPMP', path: '/main/ebupot-v2/bpmp' },
      { key: 'ebupot-v2-bpA1', show: true, label: 'BP A1', path: '/main/ebupot-v2/bpA1' },
      { key: 'ebupot-v2-bpA2', show: true, label: 'BP A2', path: '/main/ebupot-v2/bpA2' },
      { key: 'ebupot-article', show: true, label: 'PPh A1/A2', path: '/main/ebupot-v2/article' },
      {
        key: 'ebupot-payment',
        show: true,
        label: 'Pembayaran PPh',
        children: [
          { show: true, label: 'Penyetoran sendiri', path: '/main/ebupot-v2/self-payment' },
          { show: true, label: 'Pemotongan digunggung', path: '/main/ebupot-v2/cumulative-payment' },
        ],
      },
      { key: 'ebupot-unifikasi-import', show: true, label: 'Daftar Impor XLS', path: '/main/ebupot/unifikasi/import' },
      { key: 'ebupot-unifikasi-spt', show: true, label: 'SPT', path: '/main/ebupot/unifikasi/spt', rolePermissionCode: 'EBUPOT_SPT_VIEW' },
      {
        key: 'ebupot-archive',
        show: true,
        label: 'Arsip',
        path: '/main/ebupot/archive',
        children: [
          { key: 'ebupot-archive-pph23', show: true, label: 'PPh Pasal 23', path: '/main/ebupot/archive/pph23' },
          { key: 'ebupot-archive-pph26', show: true, label: 'PPh Pasal 26', path: '/main/ebupot/archive/pph26' },
          { key: 'ebupot-archive-import', show: true, label: 'Impor BP 23/26', path: '/main/ebupot/archive/import' },
          { key: 'ebupot-archive-spt', show: true, label: 'SPT', path: '/main/ebupot/archive/spt' },
        ],
      },
    ],
  },
]

/** Recursively drop hidden items (and groups left empty). */
export function visibleItems(items: NavItem[], { mobile = false } = {}): NavItem[] {
  return items
    .filter(item => item.show && (mobile || !item.isMobileOnly))
    .map(item => (item.children ? { ...item, children: visibleItems(item.children, { mobile }) } : item))
    .filter(item => !item.children || item.children.length > 0)
}

/** Source rule: prefix match when matchPrefix is set, otherwise exact path. */
export function isNavItemActive(item: NavItem, currentPath: string): boolean {
  if (item.matchPrefix) return currentPath.startsWith(item.matchPrefix)
  return item.path === currentPath
}

/** Find the deepest nav label for a path — used by placeholder pages. */
export function findNavLabel(path: string, items: NavItem[] = navigation, trail: string[] = []): string[] | null {
  for (const item of items) {
    const next = [...trail, item.label]
    if (item.path === path) return next
    if (item.children) {
      const hit = findNavLabel(path, item.children, next)
      if (hit) return hit
    }
  }
  return null
}
