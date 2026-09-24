import { activeModule } from '~/data/navigation'

// Sidebar collapse state. Source: shared/sidebar-util.js — persisted in
// localStorage under "sidebar"; the parent defaults to collapsed and the child
// panel to open whenever a module with a second-level panel is active.
const STORAGE_KEY = 'sidebar'

export const SIDEBAR_WIDTH = { parent: 216, parentCollapsed: 60, child: 232, childCollapsed: 32 }

interface Stored { parent: { isCollapse: boolean }, child: { isCollapse: boolean } }

function read(): Stored {
  const fallback = { parent: { isCollapse: true }, child: { isCollapse: false } }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  }
  catch {
    return fallback
  }
}

function write(state: Stored) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
  catch {
    // storage unavailable — state just won't persist
  }
}

export function useSidebar() {
  const route = useRoute()
  const stored = useState('kp-sidebar', () => read())
  const isHovering = useState('kp-sidebar-hover', () => false)
  const isMobileOpen = useState('kp-sidebar-mobile', () => false)

  const module = computed(() => activeModule(route.path))
  const hasChild = computed(() => !!module.value?.sections?.length)

  const isParentCollapsed = computed(() => stored.value.parent.isCollapse)
  // Pages with meta.sidebarPanel === 'collapsed' (wide forms) start with the panel
  // collapsed; a manual toggle there is remembered until the page changes.
  const panelOverride = useState<boolean | null>('kp-sidebar-panel-override', () => null)
  const isPanelForced = computed(() => route.meta.sidebarPanel === 'collapsed')
  const isChildCollapsed = computed(() => (isPanelForced.value ? (panelOverride.value ?? true) : stored.value.child.isCollapse))
  // Hovering a collapsed parent expands it over the content (source handleMouseEnter).
  const isParentExpandedVisually = computed(() => !isParentCollapsed.value || isHovering.value)

  const contentOffset = computed(() => {
    const parent = isParentCollapsed.value ? SIDEBAR_WIDTH.parentCollapsed : SIDEBAR_WIDTH.parent
    const child = hasChild.value
      ? (isChildCollapsed.value ? SIDEBAR_WIDTH.childCollapsed : SIDEBAR_WIDTH.child)
      : 0
    return parent + child
  })

  function setParentCollapse(isCollapse: boolean) {
    if (stored.value.parent.isCollapse === isCollapse) return
    stored.value = { ...stored.value, parent: { isCollapse } }
    write(stored.value)
  }

  // Called when the active module changes (and on first load):
  // - entering a module with a second-level panel auto-collapses the parent to the
  //   icon rail; the user can still expand it (toggle / Shift+X / hover), and that
  //   choice holds while they stay inside the module;
  // - a page without a second-level panel always shows the parent expanded.
  function syncWithRoute() {
    setParentCollapse(hasChild.value)
  }

  function toggleParent() {
    isHovering.value = false
    stored.value = { ...stored.value, parent: { isCollapse: !isParentCollapsed.value } }
    write(stored.value)
  }

  function toggleChild() {
    if (isPanelForced.value) {
      panelOverride.value = !isChildCollapsed.value
      return
    }
    stored.value = { ...stored.value, child: { isCollapse: !stored.value.child.isCollapse } }
    write(stored.value)
  }

  function resetPanelOverride() {
    panelOverride.value = null
  }

  return {
    module,
    hasChild,
    isParentCollapsed,
    isChildCollapsed,
    isParentExpandedVisually,
    isHovering,
    isMobileOpen,
    contentOffset,
    syncWithRoute,
    resetPanelOverride,
    toggleParent,
    toggleChild,
  }
}
