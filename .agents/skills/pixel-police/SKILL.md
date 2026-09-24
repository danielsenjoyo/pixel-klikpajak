---
name: pixel-police
description: Final design-system reviewer for the Klikpajak rebuild (pixel-klikpajak). Use when a change, a screen, a Figma frame or pasted Vue needs verifying against OUR Pixel 3 token-2.4 components, tokens, patterns and copy rules — then rewriting to compliant code. Trigger on "/pixel-police", "police this", "is this on-system?", "check before I push", "cek design ini", or any request to audit or fix a screen for design-system compliance.
metadata:
  author: Mekari Klikpajak
  version: "2026.9.24"
  ported-from: pixel-jurnal/.agents/skills/pixel-police
---

# Pixel Police (Klikpajak)

The **last gate before a push**. Two things happen: **verify** (surface every
deviation as an evidence-backed finding) and **fix** (rewrite to on-system Vue
using our real components, tokens and patterns). You never "approve" a design
as final — you make it compliant and hand the human the judgement calls.

## ⚠️ Token mode 2.4 — the one rule that must not be broken

This repo is **Pixel 3, Design Tokens v2.4** (`app/plugins/pixel.client.ts` →
`setNextTheme(true)`, default product theme). Sibling repos differ —
`pixel-jurnal` runs **v2.1** with `css()`-only styling, `pixel-erp` runs v2.4
Enterprise. Never carry a component rule, token value or styling convention
across from them.

| Concern                                       | ONLY source of truth                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| Components, props, variants, icon names       | `@mekari/pixel3` + the Pixel MCP (`get-component`, `get-icon-name`, `get-docs`) |
| Pixel gotchas + styling rules                 | `CLAUDE.md` → "Pixel rules"                                                     |
| Tokens                                        | `--mp-*` (Pixel styled-system, 2.4 "next" theme) + `--kp-*` in `app/assets/css/app.css` |
| Shell: header / sidebar / sub-panel           | `app/layouts/default.vue`, `components/Kp{Header,Sidebar,SidebarPanel}.vue`     |
| Page construction                             | `CLAUDE.md` → index-page and form-page patterns (reference pages named there)   |
| SPT lampiran                                  | config in `app/data/spt1771LampiranDefs.ts`, rendered by `components/spt/*`     |
| Behaviour, routes, copy                       | the source app `../jurnal-tax/frontend/src`, and the Figma file for the screen  |
| Enforceable rule list + exceptions            | `references/rules.md` (this skill)                                              |
| Finding format                                | `references/finding-schema.md` (this skill)                                     |
| UI copy                                       | the `uxw-mekari` skill (Bahasa Indonesia, matching the source app)              |

**Never guess a prop, token or icon name.** Confirm through the Pixel MCP.

## Input

- **A change** — the current branch's diff, a set of files, or "what I just built".
- **A design** — a screenshot, Figma link, or pasted HTML/Vue to fix.

Work with whatever is given; mark the rest `cannot-verify`.

## Workflow

### Phase 0 — Load the rules (always, before judging anything)

1. Read `references/rules.md` — the enforceable checklist.
2. Read `CLAUDE.md` → "Pixel rules" and the page pattern for the page type in
   front of you (index page, form page, SPT lampiran).
3. For a list screen, diff the code against the reference index page
   (`app/pages/main/efiling/report-v2/spt-tahunan-badan/index.vue`); for a form,
   against the Lapor SPT page (`…/spt-tahunan-badan/[id]/[[section]].vue`).
4. Keep the Pixel MCP open for every component assertion.

### Phase 1 — VERIFY (produce findings)

Review across ALL dimensions on every pass — don't stop at the first one that
finds something:

1. **Pixel component** — every element maps to a real `@mekari/pixel3`
   component with MCP-confirmed props; bespoke UI that duplicates an existing
   `Kp*` / `Spt*` building block is a finding.
2. **Pixel token (v2.4)** — hardcoded colour/px, numeric font-weight, unknown
   `--mp-*` / `--kp-*` names, inline `style`.
3. **Pattern conformance** — `KpPageHeader` + `KpStage` per page; index pages
   follow filter row → `MpTable` → `KpPagination` with `KpBlankSlate` for empty
   and filtered-empty; form pages keep the 640px column + sticky Simpan + unsaved
   guard; new lampiran are config in `spt1771LampiranDefs.ts`, not new components.
4. **Cross-screen consistency** — money through `formatRp` / `formatNumber`
   (`app/utils/currency.ts`), dates `DD/MM/YYYY`, status through the `MpBadge`
   type mapping in `CLAUDE.md`.
5. **State coverage** — empty, filtered-empty, loading, populated, validation
   error, success toast, read-only / locked, destructive confirm.
6. **UX flow** — task progression, validation, feedback, recovery.
7. **Copy** — Bahasa Indonesia, matching the source app; check with `uxw-mekari`.
8. **Accessibility** — `aria-label` on every icon-only button (`.kp-icon-btn`),
   `outline: none` only with a `box-shadow: var(--mp-shadows-focus)` replacement,
   labels tied to their inputs.

Emit findings per `references/finding-schema.md` — most-severe first, each
citing real evidence, each ending in a concrete `fix` or `decisionQuestion`.
Absence ≠ proof (`cannot-verify`). Guidelines are defaults: flag a deliberate
deviation as `intentional-exception-candidate` with a question rather than
declaring it wrong.

### Phase 2 — FIX (rewrite to on-system Vue)

For every `confirmed-gap` that's a hard rule, rewrite the code:

- Import UI from `@mekari/pixel3`; Pixel primitives before raw HTML; wrap
  validated fields in `MpFormControl` (it replaces the inner input's id — target
  the control id).
- **Styling is a scoped `<style>` block with token variables** — `--mp-colors-<semantic>`,
  `--mp-spacing-*`, `--mp-radii-*`, `--mp-font-sizes-*`, `--mp-font-weights-*`,
  `--mp-shadows-*`. Teleported content (`MpPopoverContent`, drawer content) is
  styled from an unscoped block.
- Reuse the `Kp*` components and the lampiran engine before inventing anything new.
- Mock data lives in `app/data/` with its type, not inside the `.vue`.
- Leave `decisionQuestion` items for the human — don't silently pick.
- When a pattern legitimately changes, update `CLAUDE.md` (and `docs/ROADMAP.md`
  if scope moves) in the same change.

### Phase 3 — ENFORCE (self-check, must be green)

```bash
npm run pixel-police   # added lines vs. merge-base with origin/main (working tree included)
npm run build          # must pass with zero errors
```

Both run on `git push` (`.githooks/pre-push`) and on every PR to `main`
(`.github/workflows/ci.yml`). Treat the output as blocking: fix and re-run until
clean. The gate checks **added lines** only, so a violation it reports is always
yours. `npm run pixel-police -- --all` audits the whole repo (informational).

A genuine, documented exception gets a `pixel-police-allow` comment — on the
line, or on the line directly above a multi-line tag — **and** the exception is
written into `references/rules.md` or `CLAUDE.md` in the same change. Never use
it to silence a real finding.

The script covers the Tier 1 rules. Everything marked _reviewer-only_ in
`references/rules.md` is on you.

## Output to the human

1. **Findings** — grouped by dimension, most-severe first, with sources.
2. **The corrected code** (or a diff).
3. **Open decisions** — the `decisionQuestion` items with `suggestedOwner`.
4. **Gate status** — `npm run pixel-police` + `npm run build`, verbatim.

Keep it honest: report what you couldn't verify, and never present a judgement
call as a hard rule.
