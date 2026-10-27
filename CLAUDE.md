# CLAUDE.md — pixel-klikpajak

A rebuild of the Klikpajak UI (`../jurnal-tax/frontend`, Vue 2.7 + Pixel 1) on
**Nuxt 4 + Vue 3 + Pixel 3, token mode 2.4**. SPA only (`ssr: false`), mock data,
no backend calls.

## Commands

```bash
npm install
npm run dev      # http://localhost:4331 (edit here)
npm run build    # must pass with zero errors before a change is done
npm run pixel-police   # Pixel Police gate on your changes (add `-- --all` to audit the repo)
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
  components/KpSidebar      first-level sidebar (216px / 60px rail, hover-expands) + company ID;
                            auto-collapses to the rail on entering a module with a sub-panel
  components/KpSidebarPanel second-level panel (232px / 8px strip) for modules with sections
  components/KpSidebarItem  panel row / collapsible group (recursive)
  components/KpSidebarMobile  drawer version below 992px
  components/KpNotPorted    placeholder shown for any route not ported yet
  components/KpPageHeader   page title bar (title + actions slot) on the surface background
  components/KpStage        white content stage filling the page (optional section title)
  components/KpPagination   table pagination (Pixel 3 ships none) — v-model:page / v-model:per-page
  components/KpBlankSlate   empty / filtered-empty state (illustration + copy + optional action)
  components/KpCurrencyInput  "Rp" (or `prefix="$"`) amount field (formats 1.234.567,00; disabled = computed)
  components/KpYesNo        Tidak/Ya radio pair · KpQuestion (question + hints) · KpFormSection
  components/KpFileField    "Pilih file" upload with format hint (stores file name)
  components/spt/*          SPT Tahunan Badan: SptSectionNav (checkpoints), SptIndukForm, SptLampiran1,
                            SptAccountTable; lampiran engine: SptLampiranPage → SptTableBlock /
                            SptFormBlock / SptStatementsBlock / SptFieldsBlock, SptField;
                            SptImportModal (DJP template import: unduh template → unggah → review → Tambahkan/Ganti)
  components/quota/*        Langganan & kuota: QuotaBanners (migrasi / kuota / perpanjangan —
                            three independent slots), QuotaPackageCard, QuotaModuleCard,
                            QuotaHistoryTable, QuotaBlockedModal (4 exhaustion routes),
                            QuotaLoadError (shows no figures and no buy CTA, so a failed
                            load cannot be mistaken for "kuota habis")
  data/spt1771Induk.ts      SPT Induk model, options, computeInduk(), LAMPIRAN_LAINNYA
  data/spt1771Lampiran1.ts  Lampiran 1A rows + formulas (Laba Rugi, Posisi Keuangan)
  data/spt1771Engine.ts     config types for lampiran (table/form/statements/fields blocks) + helpers
  data/spt1771LampiranDefs.ts  Lampiran 2–14 definitions (from Figma), lampiranDef(), emptyLampiran()
  data/spt1771Checkpoints.ts   done / required / optional per section; required lampiran from Induk
  data/taxCodes.ts          mock reference lists for lampiran selects (negara, mata uang, objek pajak…)
  data/spt1771Import.ts     import engine: template builder + parser for DJP's .xlsx/.csv templates
                            (NPWP SPT / Tahun Pajak check, codes matched without leading zeros, row rejects)
  data/jurnalErp.ts         mock Jurnal books for Lampiran 1: trial balance per CoA (Jasa/SaaS seed, balances
                            by construction), transactions behind nominatif accounts, pullJurnal(ok|partial|error)
  data/coaMapping.ts        Lampiran 1 per-CoA reconciliation (L1 PRD R1 + round-1): INDUSTRY_SEKTOR,
                            COA_DJP_LOOKUP, FISCAL_PROMPT (Layer 1 config), class-guarded mapping, rollUp() → DJP L1A
  components/spt/l1/*       Jurnal workspace: SptErpSourceCard, SptCoaTable (spreadsheet grid, one compact row per
                            CoA: Akun Jurnal + Akun DJP frozen, (3)–(10) inline, scrolls sideways; bulk-set, value
                            override), SptCoaTransactionsDrawer (a year of transactions per CoA: search, month,
                            paging, select-all-filtered → fills (4)/(5)/(7)/(8) + code); "Per akun DJP" =
                            SptAccountTable `display` (full L1A)
  data/versions.ts          prototype versions (26Q4 default, 27Q1 …); KpVersionSwitch in the header picks one
  composables/usePrototypeVersion  current version (?v= link > localStorage > default); `has('27Q1')` gates a
                            feature; switching reloads so in-memory drafts never cross versions
  composables/useJurnalErp  connection + dev scenario; confirmed CoA→DJP mapping per company+sektor (reused yearly)
  data/spt1771ImportSpecs.ts  one spec per DJP template (1-pager SPT Badan (2) items 6–12): L1 laporan
                            keuangan (per sektor), L9, L10A, L11A I/II/III/V — headers verbatim from DJP
  utils/xlsx.ts             zero-dependency .xlsx read (DecompressionStream) / write (stored zip)
  data/subscription.ts      package/quota model + the Repackaging business rules as pure
                            functions (BR ids in comments), per-company seed, dev presets
  composables/useSidebar    collapse state, persisted in localStorage "sidebar" like the source
  composables/useSubscription  active company's package, banner dismissal (memory-only) and the
                            login-triggered migration off the legacy Basic/Small tiers
  data/navigation.ts        sidebar tree + active-module / active-leaf helpers
  data/session.ts           mock user-setting payload (company, NPWP, flags)
  pages/[...slug].vue       catch-all → KpNotPorted
  dev/ErpDevPanel.vue       Jurnal pull scenario (ok / partial / error / not connected), dev only, same pattern
  dev/QuotaDevPanel.vue     scenario controls, dev only; OUTSIDE components/ so Nuxt does not
                            auto-import it — the page loads it behind `import.meta.dev`, so it
                            is dropped from a production build rather than merely hidden
```

Index pages follow: `KpPageHeader` (title + breadcrumb) → `KpStage` → filter row → `MpTable`
→ `KpPagination`, with `KpBlankSlate` for empty and filtered-empty states. Reference:
`app/pages/main/efiling/report-v2/spt-tahunan-badan/index.vue` (Figma SPT-Tahunan-Badan › Index).

Form pages follow the Lapor SPT page `…/spt-tahunan-badan/[id]/[[section]].vue` (Figma › SPT):
in-page section menu + form column (640px stacked, 880px where label/control sit side by side) + sticky Simpan, draft/save via a composable
(`useSpt1771Form`), unsaved-changes guard, `definePageMeta({ key, sidebarPanel: 'collapsed' })`.
A submitted SPT is read-only but still browsable: lock form content with `<fieldset class="kp-lock" :disabled>`
inside the component, never around it — tab bars and view switches stay outside so they keep working.
The layout adds no content padding — pages own it.

Lampiran 2–14 are config, not components: add or change one in `spt1771LampiranDefs.ts`
(table columns with `group` for two-row headers, `compute` for read-only values, `mode: 'drawer'`
for "Tambah data" drawers). If an Induk answer requires it, add the rule to `requiredLampiran()`.
Imports attach per part: `LampiranPart.import` (a spec from `spt1771ImportSpecs.ts`) puts an
"Impor data" button on the part header; Lampiran 1 has its own "Impor laporan keuangan".
To add one, transcribe the DJP template's "Petunjuk Pengisian" sheet into a `listImport()` spec.
Lampiran amounts that fill SPT Induk go through `lampiranLinks()` → `computeInduk()`: `null`
means "lampiran empty, keep the manual entry"; the Induk field then shows `SptLinkedAmount`
read-only with its `LINK_SOURCE` hint. Values from another lampiran use `FormItem.linked`
(reads `ctx.lampiran`).

New product surface ships behind a prototype version: add it to `VERSIONS` and gate it with
`usePrototypeVersion().has('<id>')`; the default (26Q4) stays the running release.

Lampiran 1 has two ways in (Jurnal only from version 27Q1). Books connected to Jurnal (`Company.jurnalConnected`) → "Tarik data dari
Jurnal" stores a per-CoA workspace in `Lampiran1Data.erp`; `rollUp()` writes it into `labaRugi` /
`posisiKeuangan`, so Induk D.4, L11B and validation read it like a typed grid — never edit those two
directly while `erp` exists. Mapping rules (lookup, class guard, prompts) live in `coaMapping.ts`, not in
components; an unmapped CoA blocks (it would drop out of the roll-up silently). Not connected → the DJP
grid + import, unchanged.

Manajemen kuota (`/v2/main/setting/quota-management`) is the one screen built from a PRD
rather than ported: `KpPageHeader` → `KpStage` → banner stack → summary cards → history table.
Its quota, warning-threshold and exhaustion-routing rules live in `app/data/subscription.ts`
as pure functions so they can be read against the PRD; components never re-derive them.

Pages mirror source URLs (`/main/efaktur-v2/out` → `app/pages/main/efaktur-v2/out/index.vue`),
so every nav link resolves and a ported page simply replaces the placeholder.

## Pixel rules

1. Import UI from `@mekari/pixel3`; use Pixel components before raw HTML.
2. Check props with the Pixel MCP (`get-component`, `get-icon-name`). If it is
   down, read the types in `node_modules/@mekari/pixel3-<component>/dist`.
   Known gotchas: `MpIcon` sizes are only `sm` | `md`; always pass `variant-color`
   to `MpAvatar` (its random colour can come out blank); `MpCollapse` throws when
   mounted open — use `v-show` for open-by-default groups; there is no `MpButtonIcon`
   — use `.kp-icon-btn` from app.css; `MpDatePicker` year limits use `:disabled-year`
   (docs say `disable-year`); `MpSelect` has an 88px min-width; per-row `MpPopover`s
   should pass `:is-keep-alive="false"` so closed menus don't stay in the DOM.
   `MpBadge for="tableStatus"` types: announcement=gray, information=blue,
   warning=orange, critical=red, completed=green.
   `MpFormControl` replaces the inner input's id with its own id (target the control id).
   `v-tooltip` must always get an object — never `undefined` (it throws); v-if the wrapper.
   `MpBanner` reads its default slot once in `setup()` and caches the vnodes, so a mounted
   banner keeps its original variant and copy when props change — give it a `:key` that
   changes with the state.
   `MpModal` / `MpDrawer` open when `is-open` turns true but do NOT close when it turns false —
   a prop-closed one stays open inside and ignores the next open. Mount it per open instead
   (`v-if` + `:key`); unmounting resets it.
   `MpInput is-clearable` emits `undefined` on clear — bind `:model-value` and coerce
   (`@update:model-value="q = $event ?? ''"`) so string methods don't throw.
   Inputs in table cells have no `<label>`: pass `aria-label` (`KpCurrencyInput` / `SptField`
   take an `ariaLabel` prop).
3. Custom CSS uses token variables only: `--mp-colors-<semantic>` (e.g.
   `--mp-colors-text-secondary`, `--mp-colors-border-default`), `--mp-spacing-*`,
   `--mp-radii-*`, `--mp-font-sizes-*`, `--mp-font-weights-*`, `--mp-shadows-*`.
   No hex values.
4. `MpPopoverContent` / drawer content is teleported — style its root class in an
   unscoped `<style>` block; scoped classes won't match it.
5. Dev CSS can go stale after many edits (Panda regen race): if a Pixel component
   renders unstyled in dev but fine in `npm run build`, restart `npm run dev`.

## Pixel Police — the compliance gate

Design-system compliance, ported from pixel-jurnal. Two halves:

- **`scripts/pixel-police.mjs`** (`npm run pixel-police`) — 11 mechanical rules from the Pixel
  rules above (hardcoded colour, unknown `--mp-*`/`--kp-*` token, px spacing/type, numeric
  font-weight, raw HTML control, inline style, MpIcon size, MpAvatar `variant-color`, v-tooltip
  object, non-`pixel3` import, token mode) checked on the **added lines only** of changed
  `app/**/*.vue` / `.css` files versus the merge-base with `origin/main` — commits since the base
  **plus the working tree**, untracked files included. Runs on `git push` (`.githooks/pre-push`,
  wired by `npm install` via `core.hooksPath`, together with `npm run build`) and in CI
  (`.github/workflows/ci.yml`). A genuine, documented exception gets a `pixel-police-allow`
  comment on the line (or the line above a multi-line tag / a bare wrapper tag) — and the exception written into the
  rule list in the same change. Escape hatches for emergencies: `PIXEL_POLICE_SKIP=1` /
  `BUILD_SKIP=1 git push`.
- **The `pixel-police` skill** (`.agents/skills/pixel-police/`, linked from `.claude/skills/`) —
  the reviewer that runs the same rules plus everything a script can't see (props via the Pixel
  MCP, page patterns, state coverage, copy, a11y), emits findings, and rewrites the code to
  comply. `references/rules.md` is the full two-tier rule list.

Run `npm run pixel-police` and `npm run build` before handing work back. Never silence a
finding with `pixel-police-allow` to make the gate pass.

## Porting plan

See [docs/ROADMAP.md](docs/ROADMAP.md).
