/**
 * Mock of the user-setting payload the source nav reads from USER_SETTING_API
 * (jurnal-tax frontend/src/pages/main/Nav). Replace with real data or richer seed
 * data when modules are ported.
 */
export interface Company {
  id: number
  name: string
  npwp: string
}

export const companies: Company[] = [
  { id: 1, name: 'PT Mekari Pajak Indonesia', npwp: '01.234.567.8-901.000' },
  { id: 2, name: 'PT Central Perk Indonesia', npwp: '02.345.678.9-012.000' },
  { id: 3, name: 'CV Sinar Jaya Abadi', npwp: '03.456.789.0-123.000' },
]

export const session = {
  userName: 'Daniel Senjoyo',
  companyId: 1,
  isAddonUser: false,
  isEmailVerified: true,
  // Source: showRegisterEfin = !efiling.isRegistered && !efiling.isActivated
  showRegisterEfin: true,
}
