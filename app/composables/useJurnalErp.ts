import type { Company } from '~/data/session'
import { pullJurnal, type PullScenario } from '~/data/jurnalErp'

export type ErpScenario = PullScenario | 'disconnected'

/**
 * Jurnal connection for Lampiran 1 (L1 PRD US-002 / US-006).
 *
 * `scenario` is driven by ErpDevPanel (dev only) to walk AC-004/005/006; in a production
 * build it stays 'ok'. The confirmed CoA → DJP mapping is remembered per company and sektor —
 * across tax years, which is the point of US-006 — in memory like the rest of the mock store.
 */
export function useJurnalErp() {
  const scenario = useState<ErpScenario>('kp-erp-scenario', () => 'ok')
  const savedMappings = useState<Record<string, Record<string, string>>>('kp-coa-mapping', () => ({}))

  const key = (company: Company, sektor: string) => `${company.id}:${sektor}`
  const isConnected = (company: Company) => !!company.jurnalConnected && scenario.value !== 'disconnected'
  const savedMapping = (company: Company, sektor: string) => savedMappings.value[key(company, sektor)]

  function confirmMapping(company: Company, sektor: string, mapping: Record<string, string>) {
    savedMappings.value = { ...savedMappings.value, [key(company, sektor)]: mapping }
  }

  const pull = (year: number) => pullJurnal(year, scenario.value === 'disconnected' ? 'ok' : scenario.value)

  return { scenario, isConnected, savedMapping, confirmMapping, pull }
}
