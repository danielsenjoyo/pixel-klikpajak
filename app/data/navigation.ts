/**
 * Sidebar navigation — ported from jurnal-tax
 * frontend/src/components/Pixel/Sidebar/Container/menuList.js (the current
 * Klikpajak nav; the old top-nav menu.js is no longer rendered).
 *
 * The source builds this tree at runtime from user-setting flags. This port is
 * the tree for a fully-activated Coretax company:
 *   CTAS SPT active + canAccessSptCoretax  → Lapor Pajak "head office" sections
 *   E-Faktur registered + onboarded        → legacy E-Faktur section expanded
 *   E-Bupot registered, CTAS E-Bupot on    → BP 21/26/MP/A1/A2 + Daftar impor inserted
 *   unified signee active                  → Penandatanganan › Coretax / Legacy
 *   not a reconcile user                   → Rekonsiliasi shows the premium icon
 * Items with isShow:false in the source (Scan faktur on desktop, PPh 21 menus)
 * are omitted. Route names were resolved to paths via frontend/src/router.
 * `/v2/*` paths are the source's decoupled (separate app) pages.
 */
export interface NavLeaf {
  id: string
  label: string
  path: string
  icon?: string
  /** Premium feature (source: isPremium → "upgrade" icon). */
  isPremium?: boolean
  /** Badge key into the session's sidebar counters (source: badgeName). */
  badge?: 'payableCount'
  /** Nested items rendered as a collapsible group (source: childs). */
  children?: NavLeaf[]
}

export interface NavSection {
  title: string
  items: NavLeaf[]
}

export interface NavModule {
  id: string
  label: string
  icon: string
  /** Where the top-level item navigates. */
  path: string
  /** Paths that make this module active (source: target.parent route-name prefix). */
  match: string[]
  rolePermissionCode?: string | string[]
  /** Second-level panel title for single-section modules (source: items.name). */
  panelTitle?: string
  sections?: NavSection[]
}

/** Top-level groups are separated by a divider (source: parentId 1, 2, 3). */
export const sidebarGroups: NavModule[][] = [
  [
    { id: 'home', label: 'Dasbor', icon: 'home', path: '/main/home', match: ['/main/home'] },
  ],
  [
    {
      id: 'ebilling',
      label: 'E-Billing',
      icon: 'payslip',
      path: '/main/ebilling/id_billing',
      match: ['/main/ebilling'],
      rolePermissionCode: 'EBILLING_VIEW',
      panelTitle: 'E-Billing',
      sections: [
        {
          title: 'E-Billing',
          items: [
            { id: 'ebilling-id', label: 'ID Billing', path: '/main/ebilling/id_billing', badge: 'payableCount' },
            { id: 'ebilling-ntpn', label: 'NTPN', path: '/main/ebilling/ntpn' },
            { id: 'ebilling-import', label: 'Impor ID Billing', path: '/main/ebilling/import' },
          ],
        },
      ],
    },
    {
      id: 'efiling',
      label: 'Lapor Pajak',
      icon: 'document-sent',
      path: '/main/efiling/report-v2',
      match: ['/main/efiling'],
      rolePermissionCode: ['EFILING_VIEW', 'SPT_PPN_VIEW', 'SPT_UNIFIKASI_VIEW', 'SPT_2126_VIEW', 'EFILING_ARCHIVE_VIEW'],
      sections: [
        {
          title: 'Lapor Pajak Coretax',
          items: [
            {
              id: 'spt-masa',
              label: 'SPT Masa',
              path: '/main/efiling/report-v2/spt-masa/ppn',
              children: [
                { id: 'spt-masa-ppn', label: 'SPT Masa PPN', path: '/main/efiling/report-v2/spt-masa/ppn' },
                { id: 'spt-masa-unifikasi', label: 'SPT Masa PPh Unifikasi', path: '/main/efiling/report-v2/spt-masa/unifikasi' },
                { id: 'spt-masa-2126', label: 'SPT Masa PPh 21/26', path: '/main/efiling/report-v2/spt-masa/pph2126' },
              ],
            },
            { id: 'spt-tahunan-badan-v2', label: 'SPT Tahunan Badan', path: '/main/efiling/report-v2/spt-tahunan-badan' },
          ],
        },
        {
          title: 'Lapor Pajak',
          items: [
            { id: 'efiling-spt-masa', label: 'E-Filing SPT Masa', path: '/main/efiling/report/spt-masa' },
            { id: 'efiling-spt-tahunan', label: 'SPT Tahunan Badan', path: '/main/efiling/report/spt-tahunan' },
            {
              id: 'efiling-archive',
              label: 'Arsip Pajak',
              path: '/main/efiling/report/archived/paid',
              children: [
                { id: 'efiling-archive-paid', label: 'Pajak tidak wajib lapor', path: '/main/efiling/report/archived/paid' },
                { id: 'efiling-archive-filed', label: 'Pajak siap lapor', path: '/main/efiling/report/archived/filed' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'efaktur',
      label: 'E-Faktur',
      icon: 'doc',
      path: '/main/efaktur-v2/out',
      match: ['/main/efaktur'],
      rolePermissionCode: 'EFAKTUR_VIEW',
      sections: [
        {
          title: 'E-Faktur Coretax',
          items: [
            {
              id: 'ctas-faktur',
              label: 'Faktur',
              path: '/main/efaktur-v2/out',
              children: [
                { id: 'ctas-faktur-out', label: 'Faktur keluaran', path: '/main/efaktur-v2/out' },
                { id: 'ctas-faktur-in', label: 'Faktur masukan', path: '/main/efaktur-v2/in' },
                { id: 'ctas-faktur-out-return', label: 'Retur faktur keluaran', path: '/main/efaktur-v2/out/return' },
                { id: 'ctas-faktur-in-return', label: 'Retur faktur masukan', path: '/main/efaktur-v2/in/return' },
              ],
            },
            {
              id: 'ctas-doc',
              label: 'Dokumen lain',
              path: '/main/efaktur-v2/document/out',
              children: [
                { id: 'ctas-doc-out', label: 'Dokumen lain keluaran', path: '/main/efaktur-v2/document/out' },
                { id: 'ctas-doc-in', label: 'Dokumen lain masukan', path: '/main/efaktur-v2/document/in' },
                { id: 'ctas-doc-out-return', label: 'Retur dok. lain keluaran', path: '/main/efaktur-v2/document/out/return' },
                { id: 'ctas-doc-in-return', label: 'Retur dok. lain masukan', path: '/main/efaktur-v2/document/in/return' },
              ],
            },
            { id: 'ctas-import', label: 'Impor faktur pajak', path: '/main/efaktur-v2/import' },
          ],
        },
        {
          title: 'E-Faktur',
          items: [
            { id: 'nsfp', label: 'NSFP', path: '/main/efaktur/nsfp' },
            {
              id: 'faktur',
              label: 'Faktur',
              path: '/main/efaktur/out',
              children: [
                { id: 'faktur-out', label: 'Faktur keluaran', path: '/main/efaktur/out' },
                { id: 'faktur-in', label: 'Faktur masukan', path: '/main/efaktur/in' },
                { id: 'faktur-out-return', label: 'Retur faktur keluaran', path: '/main/efaktur/out/return' },
                { id: 'faktur-in-return', label: 'Retur faktur masukan', path: '/main/efaktur/in/return' },
              ],
            },
            {
              id: 'doc',
              label: 'Dokumen lain',
              path: '/main/efaktur/document/out',
              children: [
                { id: 'doc-out', label: 'Dokumen lain keluaran', path: '/main/efaktur/document/out' },
                { id: 'doc-in', label: 'Dokumen lain masukan', path: '/main/efaktur/document/in' },
                { id: 'doc-out-return', label: 'Retur dok. lain keluaran', path: '/main/efaktur/document/out/return' },
                { id: 'doc-in-return', label: 'Retur dok. lain masukan', path: '/main/efaktur/document/in/return' },
              ],
            },
            { id: 'import', label: 'Impor faktur pajak', path: '/main/efaktur/import' },
            { id: 'spt', label: 'SPT', path: '/main/efaktur/spt' },
            {
              id: 'reconcile',
              label: 'Rekonsiliasi',
              path: '/main/efaktur/reconcile',
              isPremium: true,
              // "Rekapitulasi" is only shown to reconcile users (childPermissionGranted).
              children: [
                { id: 'reconcile-list', label: 'Daftar rekonsiliasi', path: '/main/efaktur/reconcile' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'ebupot',
      label: 'E-Bupot',
      icon: 'expenses',
      path: '/main/ebupot-v2/unifikasi/domestic',
      match: ['/main/ebupot'],
      rolePermissionCode: 'EBUPOT_VIEW',
      sections: [
        {
          title: 'E-Bupot Coretax',
          items: [
            { id: 'ctas-bp-unifikasi', label: 'BP Unifikasi', path: '/main/ebupot-v2/unifikasi/domestic' },
            { id: 'ctas-bp-foreign', label: 'BP Non-Residen', path: '/main/ebupot-v2/unifikasi/foreign' },
            { id: 'ctas-self-payment', label: 'Penyetoran sendiri', path: '/main/ebupot-v2/self-payment' },
            { id: 'ctas-cumulative-payment', label: 'Pemotongan digunggung', path: '/main/ebupot-v2/cumulative-payment' },
            { id: 'ctas-bp21', label: 'BP 21', path: '/main/ebupot-v2/bp21' },
            { id: 'ctas-bp26', label: 'BP 26', path: '/main/ebupot-v2/bp26' },
            { id: 'ctas-bpmp', label: 'BPMP', path: '/main/ebupot-v2/bpmp' },
            { id: 'ctas-bpa1', label: 'BP A1', path: '/main/ebupot-v2/bpA1' },
            { id: 'ctas-bpa2', label: 'BP A2', path: '/main/ebupot-v2/bpA2' },
            { id: 'ctas-import', label: 'Daftar impor', path: '/main/ebupot-v2/import' },
          ],
        },
        {
          title: 'E-Bupot',
          items: [
            { id: 'bp-unifikasi', label: 'BP Unifikasi', path: '/main/ebupot/unifikasi/domestic' },
            { id: 'bp-foreign', label: 'BP Non-Residen', path: '/main/ebupot/unifikasi/foreign' },
            { id: 'bp-import', label: 'Daftar impor XLS', path: '/main/ebupot/unifikasi/import' },
            {
              id: 'bp-spt',
              label: 'SPT',
              path: '/main/ebupot/unifikasi/spt',
              children: [
                { id: 'bp-spt-unifikasi', label: 'SPT Unifikasi', path: '/main/ebupot/unifikasi/spt' },
              ],
            },
            {
              id: 'bp-archive',
              label: 'Arsip',
              path: '/main/ebupot/archive/pph23',
              children: [
                { id: 'bp-archive-pph23', label: 'PPh Pasal 23', path: '/main/ebupot/archive/pph23' },
                { id: 'bp-archive-pph26', label: 'PPh Pasal 26', path: '/main/ebupot/archive/pph26' },
                { id: 'bp-archive-import', label: 'Impor BP 23/26', path: '/main/ebupot/archive/import' },
                { id: 'bp-archive-spt', label: 'SPT', path: '/main/ebupot/archive/spt' },
              ],
            },
          ],
        },
      ],
    },
    { id: 'npwp', label: 'Pengecekan NPWP', icon: 'id-card', path: '/v2/main/check-npwp', match: ['/v2/main/check-npwp'] },
  ],
  [
    {
      id: 'audit-log',
      label: 'Riwayat aktivitas',
      icon: 'log',
      path: '/v2/main/audit-log',
      match: ['/v2/main/audit-log'],
      rolePermissionCode: 'AUDIT_LOG_VIEW',
    },
    {
      id: 'setting',
      label: 'Pengaturan',
      icon: 'settings',
      path: '/main/setting/account/tax',
      match: ['/main/setting', '/v2/main/setting'],
      panelTitle: 'Pengaturan',
      sections: [
        {
          title: 'Pengaturan',
          items: [
            {
              id: 'setting-account',
              label: 'Akun',
              icon: 'profile',
              path: '/main/setting/account/profile',
              children: [
                { id: 'setting-profile', label: 'Profil akun', path: '/main/setting/account/profile' },
                { id: 'setting-company-list', label: 'Perusahaan terdaftar', path: '/main/setting/account/company/list' },
              ],
            },
            {
              id: 'setting-company',
              label: 'Perusahaan',
              icon: 'company',
              path: '/main/setting/account/tax',
              children: [
                { id: 'setting-tax', label: 'Profil perusahaan', path: '/main/setting/account/tax' },
                { id: 'setting-certificate', label: 'Sertifikat elektronik', path: '/main/setting/account/certificate' },
                { id: 'setting-quota', label: 'Manajemen kuota', path: '/v2/main/setting/quota-management' },
                { id: 'setting-nsfp-reminder', label: 'NSFP Reminder', path: '/main/setting/account/nsfp-reminder' },
                { id: 'setting-email', label: 'Pengiriman data pajak', path: '/main/setting/account/company/email/efaktur' },
                { id: 'setting-users', label: 'Manajemen pengguna', path: '/v2/main/setting/company-associate/user/list' },
              ],
            },
            {
              id: 'setting-signee',
              label: 'Penandatanganan',
              icon: 'esignature',
              path: '/v2/main/setting/unified-signee',
              children: [
                { id: 'setting-signee-coretax', label: 'Coretax', path: '/v2/main/setting/unified-signee' },
                {
                  id: 'setting-signee-legacy',
                  label: 'Legacy',
                  path: '/main/setting/account/signee/efaktur',
                  children: [
                    { id: 'signee-efaktur', label: 'Faktur', path: '/main/setting/account/signee/efaktur' },
                    { id: 'signee-spt1771', label: 'SPT Tahunan Badan', path: '/main/setting/account/signee/spt1771' },
                    { id: 'signee-ebupot', label: 'E-Bupot', path: '/main/setting/account/signee/ebupot' },
                    { id: 'signee-ebupot-archive', label: 'Bupot PPh 23/26', path: '/main/setting/account/signee/ebupot-archive' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
]

export const allModules = sidebarGroups.flat()

function matchesPrefix(path: string, prefix: string) {
  return path === prefix || path.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`) || path.startsWith(`${prefix}-`)
}

/** The module owning the current path (source: route name includes target.parent). */
export function activeModule(path: string): NavModule | undefined {
  return allModules.find(m => m.match.some(prefix => matchesPrefix(path, prefix)))
}

function leaves(items: NavLeaf[]): NavLeaf[] {
  return items.flatMap(i => (i.children ? leaves(i.children) : [i]))
}

/**
 * The single leaf to highlight: exact match, else the longest leaf path that is
 * a parent segment of the current path (so /main/efaktur-v2/out/create keeps
 * "Faktur keluaran" active but /main/efaktur-v2/out/return picks its own item).
 */
export function activeLeafPath(path: string, module?: NavModule): string | undefined {
  if (!module?.sections) return undefined
  const paths = module.sections.flatMap(s => leaves(s.items)).map(l => l.path)
  if (paths.includes(path)) return path
  return paths
    .filter(p => path.startsWith(`${p}/`))
    .sort((a, b) => b.length - a.length)[0]
}

export function containsPath(item: NavLeaf, path: string | undefined): boolean {
  if (!path) return false
  if (item.path === path && !item.children) return true
  return !!item.children?.some(c => containsPath(c, path))
}

/** Breadcrumb labels for placeholder pages. */
export function findNavTrail(path: string): string[] | null {
  const module = activeModule(path)
  if (!module) return null
  if (!module.sections) return module.path === path ? [module.label] : null
  const target = activeLeafPath(path, module)
  if (!target) return [module.label]
  const walk = (items: NavLeaf[], trail: string[]): string[] | null => {
    for (const item of items) {
      const next = [...trail, item.label]
      if (item.children) {
        const hit = walk(item.children, next)
        if (hit) return hit
      }
      else if (item.path === target) {
        return next
      }
    }
    return null
  }
  for (const section of module.sections) {
    const hit = walk(section.items, [module.label])
    if (hit) return hit
  }
  return [module.label]
}
