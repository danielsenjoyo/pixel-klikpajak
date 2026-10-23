import { DEFAULT_VERSION, VERSIONS, atLeast, isVersion } from '~/data/versions'

const STORAGE_KEY = 'kp-prototype-version'

function initial(): string {
  if (import.meta.server) return DEFAULT_VERSION
  // A shared link wins (?v=27Q1), then the viewer's last choice, then the default.
  const fromUrl = new URLSearchParams(window.location.search).get('v')
  if (isVersion(fromUrl)) return fromUrl
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isVersion(saved)) return saved
  }
  catch {}
  return DEFAULT_VERSION
}

/**
 * The prototype version on view (data/versions.ts). Switching reloads the page: drafts live in
 * memory, and a draft built under one version (a Jurnal workspace, say) must not leak into another.
 */
export function usePrototypeVersion() {
  const version = useState<string>('kp-prototype-version', initial)

  function setVersion(next: string) {
    if (!isVersion(next) || next === version.value) return
    try { window.localStorage.setItem(STORAGE_KEY, next) }
    catch {}
    const url = new URL(window.location.href)
    url.searchParams.delete('v')
    window.location.assign(url.toString())
  }

  return {
    version,
    versions: VERSIONS,
    setVersion,
    /** True from the version that introduced a feature onwards. */
    has: (since: string) => atLeast(version.value, since),
  }
}
