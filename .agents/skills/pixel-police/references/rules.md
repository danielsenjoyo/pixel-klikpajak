# The rule list

Two tiers: what `scripts/pixel-police.mjs` catches mechanically, and what only a
reviewer can catch. The script is the floor, not the ceiling — a clean run
means "nothing obviously off-system was added", not "this screen is correct".

## Tier 1 — enforced by `scripts/pixel-police.mjs`

Checked on **added lines only**, in changed `app/**/*.vue` and `app/**/*.css` files, against
the merge-base with `origin/main` (or `main`). "Changed" spans the commits since that base
_and_ the working tree — staged, unstaged and untracked — so a rule fires on work that isn't
committed yet. Comment-only lines are skipped. A line is exempt when it contains
`pixel-police-allow`, or a comment directly above it does — or a comment above one bare
wrapper tag (`<MpPopoverTrigger>`), since that component clones its first child and a comment
inside it would be cloned instead of the button.

| Rule id                            | Where           | Violation                                                                 | Fix                                                                                    | Source                             |
| ---------------------------------- | --------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------- |
| `token/hardcoded-color`            | anywhere        | `#hex`, `rgb()`, `rgba()`, `hsl()`; named colours in CSS colour properties | `var(--mp-colors-<semantic>)`                                                          | CLAUDE.md → Pixel rules 3          |
| `token/unknown-var`                | anywhere        | `var(--mp-…)` Pixel doesn't define; `var(--kp-…)` never declared           | fix the typo (check `get-docs`); declare `--kp-*` in `app/assets/css/app.css`           | CLAUDE.md → Pixel rules 3          |
| `token/px-spacing-type`            | CSS             | 2px+ on padding / margin / gap / font-size / line-height / letter-spacing / border-radius | `--mp-spacing-*`, `--mp-font-sizes-*`, `--mp-line-heights-*`, `--mp-radii-*` | CLAUDE.md → Pixel rules 3          |
| `token/raw-font-weight`            | CSS             | numeric `font-weight`                                                     | `var(--mp-font-weights-*)`                                                             | CLAUDE.md → Pixel rules 3          |
| `component/raw-control`            | template        | `<button\|input\|select\|textarea>`                                       | `MpButton` / `MpInput` / `MpSelect` / `MpTextarea`; icon-only → `<button class="kp-icon-btn">` | CLAUDE.md → Pixel rules 1–2 |
| `component/inline-style`           | template        | `style=""` / `:style=""`                                                  | a scoped class with token variables                                                    | CLAUDE.md → Pixel rules 3          |
| `component/icon-size`              | template        | `MpIcon size` other than `sm` / `md`                                      | `size="sm"` or `"md"`                                                                  | CLAUDE.md → gotchas                |
| `component/avatar-variant-color`   | template        | `MpAvatar` without `variant-color`                                        | pass `variant-color`                                                                   | CLAUDE.md → gotchas                |
| `component/tooltip-object`         | template        | `v-tooltip` given anything but an object literal                          | always pass `{ label, placement }`; `v-if` the wrapper instead of passing `undefined`  | CLAUDE.md → gotchas                |
| `import/non-pixel3`                | anywhere        | `@mekari/pixel` (v1) or a `@mekari/pixel3-*` sub-package                  | `@mekari/pixel3` (`pixel3-postcss` in config is fine)                                  | CLAUDE.md → Pixel rules 1          |
| `theme/token-mode`                 | anywhere        | `setNextTheme(false)` / `setNextTheme()`                                  | keep `setNextTheme(true)` — token 2.4                                                  | `app/plugins/pixel.client.ts`      |

Multi-line opening tags are read as a whole, so `<button` on one line with
`class="kp-icon-btn"` on the next is recognised.

### Built-in exceptions (already whitelisted — don't "fix" them)

| Exception                                                                 | Why                                                                                  |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `<button class="kp-icon-btn">`                                            | Pixel 3 has no `MpButtonIcon`; this is the documented icon-button (CLAUDE.md)         |
| `:style="{ '--kp-…': … }"` — setting a CSS custom property                | a runtime value handed to the stylesheet (e.g. `--kp-content-offset` in the layout)   |
| `:style` with `cellWidth(…)`                                              | `SptTableBlock` column widths come from lampiran config                              |
| `1px` (hairlines, the `.kp-sr-only` clip)                                  | no token for a hairline                                                               |
| px `width` / `height` / `top` / `min-width` …                             | Figma-spec'd layout sizes with no token — comment the source next to them            |

### Documented exceptions (marked `pixel-police-allow` in the code)

| Where                                                                | Why                                                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `KpSidebarItem` group row, `SptSectionNav` group row (expand/collapse) | Pixel 3 ships no navigation component; the rows match production Klikpajak's sidebar. Leaf rows are `NuxtLink`s. |
| `KpSidebarMobile` "Keluar" row                                        | an action styled as one of the drawer's nav rows                                            |
| `KpAccountMenu` trigger (avatar + company name + NPWP)                | a two-line composite trigger; `MpButton` has a fixed height. The allow comment sits above `<MpPopoverTrigger>`, which clones its first child |
| `letter-spacing: 2px` on uppercase section titles (`KpSidebarPanel`, `KpSidebarMobile`) | production Klikpajak's tracking; the widest Pixel token (`--mp-letter-spacings-widest`, 0.1em) is only 1.2px at 12px |

Icon-only buttons use `.kp-icon-btn` (40px square) or `.kp-icon-btn kp-icon-btn--compact`
(padding-sized: collapse toggles, pagination arrows, the account-menu back arrow), with a
shared `:disabled` state. The sidebar's 10px row inset from production is `--kp-sidebar-inset`
(`--mp-spacing-2` + `--mp-spacing-4xs`) in `app/assets/css/app.css`.

`npm run pixel-police -- --all` is clean — keep it that way.

## Tier 2 — reviewer-only (the script cannot see these)

**Components**

- Every element maps to a real `@mekari/pixel3` component, with props confirmed
  via the Pixel MCP — not guessed, not carried over from a v2.1 repo.
- Icon names confirmed via `get-icon-name`.
- `MpBadge for="tableStatus"` types: announcement = gray, information = blue,
  warning = orange, critical = red, completed = green.
- `MpCollapse` throws when mounted open — use `v-show` for open-by-default groups.
- `MpDatePicker` year limits use `:disabled-year` (docs say `disable-year`).
- `MpSelect` has an 88px min-width — size columns for it.
- Per-row `MpPopover` passes `:is-keep-alive="false"`.
- `MpFormControl` replaces the inner input's id with its own — label `for` and
  tests target the control id.
- Teleported content (`MpPopoverContent`, drawer body) is styled from an
  unscoped `<style>` block; scoped classes won't reach it.

**Page construction**

- One `KpPageHeader` (title + breadcrumb + actions) and one `KpStage` per page;
  the layout adds no content padding — the page owns it.
- Index pages: filter row → `MpTable` → `KpPagination`, `KpBlankSlate` for empty
  and filtered-empty (reference: SPT Tahunan Badan index).
- Form pages: in-page section menu + 640px form column + sticky Simpan, draft
  via a composable, unsaved-changes guard, `definePageMeta({ key, sidebarPanel })`.
- SPT lampiran are config (`spt1771LampiranDefs.ts`); Induk links go through
  `lampiranLinks()` → `computeInduk()`; required rules live in `requiredLampiran()`.
- Pages mirror source URLs so nav links resolve.

**Forms**

- Validated fields sit in `MpFormControl` (label, helper, error).
- An input with no `MpFormControl` has an `aria-label` or a `<label for>`.

**States**

- Empty, filtered-empty, loading, populated, validation error, success toast,
  read-only / locked, destructive confirm. A happy-path-only screen is incomplete.

**Consistency**

- Money: `formatRp` / `formatNumber` from `app/utils/currency.ts`
  (`Rp1.234.567,00`). Dates: `DD/MM/YYYY`.

**Copy**

- Bahasa Indonesia, matching the source app (`../jurnal-tax/frontend/src`) and
  Figma. Check wording with the `uxw-mekari` skill.

**Accessibility**

- `aria-label` on every icon-only button.
- `outline: none` only alongside `box-shadow: var(--mp-shadows-focus)`.

## Adding a rule

A mechanical rule earns its place when (a) CLAUDE.md already states it, and (b)
it won't cry wolf — check the baseline first:

```bash
npm run pixel-police -- --all
```

Add a `RULES` entry in `scripts/pixel-police.mjs` (id, where, test, a message
that names the fix), add its row to Tier 1 above, and prove it with a throwaway
file that should and shouldn't trip it.
