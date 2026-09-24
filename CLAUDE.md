# CLAUDE.md — pixel-klikpajak

A rebuild of the Klikpajak UI (`../jurnal-tax/frontend`, Vue 2.7 + Pixel 1) on
**Nuxt 4 + Vue 3 + Pixel 3, token mode 2.4**. SPA only (`ssr: false`), mock data,
no backend calls.

## Commands

```bash
npm install
npm run dev      # http://localhost:4331 (edit here)
npm run build    # must pass with zero errors before a change is done
PORT=4332 node .output/server/index.mjs   # production preview — use for visual checks
```

## Source of truth

- UI behaviour, copy and routes: `../jurnal-tax/frontend/src`
  - routes: `router/<module>/index.js` (+ `views.js`)
  - pages: `pages/<module>`, shared pieces: `components/{atoms,molecules,organisms,templates}`
  - shell: `components/Pixel/{Header,Sidebar,SidebarMobile}` + `layouts/MekariPixelFaktur`
  - nav tree: `components/Pixel/Sidebar/Container/menuList.js` → `app/data/navigation.ts`
    (the old top-nav `shared/constants/navigation/menu.js` is legacy — not rendered)
- Visual language: Pixel 3 components + token 2.4. Do not port Pixel 1 / SCSS
  styling; rebuild each screen with Pixel 3 primitives.
- Copy stays in Bahasa Indonesia, matching the source.

## Structure

```
app/
  plugins/pixel.client.ts   Pixel plugin; setNextTheme(true) = token 2.4, default product theme
  assets/css/pixel.css      Panda root (PostCSS injects Pixel CSS here) — keep it to the @layer line
  assets/css/app.css        global shell vars (--kp-*) and base styles
  layouts/default.vue       logged-in shell: fixed header + sidebar + sub-panel; Shift+X / Shift+C
  layouts/blank.vue         no-chrome shell (auth, onboarding, public, print)
  components/KpHeader       logo · Daftar Efin · KpQuickAccess (+) · KpSwitchApp · KpAccountMenu
  components/KpSidebar      first-level sidebar (216px / 60px rail, hover-expands) + company ID
  components/KpSidebarPanel second-level panel (232px / 8px strip) for modules with sections
  components/KpSidebarItem  panel row / collapsible group (recursive)
  components/KpSidebarMobile  drawer version below 992px
  components/KpNotPorted    placeholder shown for any route not ported yet
  composables/useSidebar    collapse state, persisted in localStorage "sidebar" like the source
  data/navigation.ts        sidebar tree + active-module / active-leaf helpers
  data/session.ts           mock user-setting payload (company, NPWP, flags)
  pages/[...slug].vue       catch-all → KpNotPorted
```

Pages mirror source URLs (`/main/efaktur-v2/out` → `app/pages/main/efaktur-v2/out/index.vue`),
so every nav link resolves and a ported page simply replaces the placeholder.

## Pixel rules

1. Import UI from `@mekari/pixel3`; use Pixel components before raw HTML.
2. Check props with the Pixel MCP (`get-component`, `get-icon-name`). If it is
   down, read the types in `node_modules/@mekari/pixel3-<component>/dist`.
   Known gotchas: `MpIcon` sizes are only `sm` | `md`; always pass `variant-color`
   to `MpAvatar` (its random colour can come out blank); `MpCollapse` throws when
   mounted open — use `v-show` for open-by-default groups; there is no `MpButtonIcon`
   — use `.kp-icon-btn` from app.css.
3. Custom CSS uses token variables only: `--mp-colors-<semantic>` (e.g.
   `--mp-colors-text-secondary`, `--mp-colors-border-default`), `--mp-spacing-*`,
   `--mp-radii-*`, `--mp-font-sizes-*`, `--mp-font-weights-*`, `--mp-shadows-*`.
   No hex values.
4. `MpPopoverContent` / drawer content is teleported — style its root class in an
   unscoped `<style>` block; scoped classes won't match it.
5. Dev CSS can go stale after many edits (Panda regen race): if a Pixel component
   renders unstyled in dev but fine in `npm run build`, restart `npm run dev`.

## Porting plan

See [docs/ROADMAP.md](docs/ROADMAP.md).
