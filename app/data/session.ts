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
}

export const companies: Company[] = [
  { id: 188311, name: 'PT Mekari Pajak Indonesia', npwp: '0123456789012345' },
  { id: 188312, name: 'PT Central Perk Indonesia', npwp: '0234567890123456' },
  { id: 188313, name: 'CV Sinar Jaya Abadi', npwp: '0345678901234567' },
]

export const session = {
  companyId: 188311,
  /** Source: companyData.jurnalCid === 0 → shows the app switcher, company list and logout. */
  isJurnalUser: false,
  /** Source: companyData.efinRegistered — false shows the "Daftar Efin" header button. */
  isEfinRegistered: true,
  /** Sidebar counters (source: badgeValue[item.badgeName]). */
  sidebarBadges: { payableCount: 0 },
}
