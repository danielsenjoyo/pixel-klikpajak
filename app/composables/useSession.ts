import { companies, session } from '~/data/session'

export function useSession() {
  const companyId = useState('kp-company-id', () => session.companyId)
  const company = computed(() => companies.find(c => c.id === companyId.value) ?? companies[0]!)

  function switchCompany(id: number) {
    companyId.value = id
  }

  return { session, companies, company, companyId, switchCompany }
}
