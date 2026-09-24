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
  const isChildCollapsed = computed(() => stored.value.child.isCollapse)
  // Hovering a collapsed parent expands it over the content (source handleMouseEnter).
  const isParentExpandedVisually = computed(() => !isParentCollapsed.value || isHovering.value)

  const contentOffset = computed(() => {
    const parent = isParentCollapsed.value ? SIDEBAR_WIDTH.parentCollapsed : SIDEBAR_WIDTH.parent
    const child = hasChild.value
      ? (isChildCollapsed.value ? SIDEBAR_WIDTH.childCollapsed : SIDEBAR_WIDTH.child)
      : 0
    return parent + child
  })

  // Source renderChildMenu: a page without a second-level panel always shows the
  // parent expanded, and that expanded state is persisted.
  function syncWithRoute() {
    if (!hasChild.value && stored.value.parent.isCollapse) {
      stored.value = { ...stored.value, parent: { isCollapse: false } }
      write(stored.value)
    }
  }

  function toggleParent() {
    isHovering.value = false
    stored.value = { ...stored.value, parent: { isCollapse: !isParentCollapsed.value } }
    write(stored.value)
  }

  function toggleChild() {
    stored.value = { ...stored.value, child: { isCollapse: !stored.value.child.isCollapse } }
    write(stored.value)
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
    toggleParent,
    toggleChild,
  }
}
