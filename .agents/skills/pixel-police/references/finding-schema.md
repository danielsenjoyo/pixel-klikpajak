# Finding schema — the reviewer's output contract

Every issue Pixel Police raises is a **Finding**. Report findings as a list,
most-severe first.

| Field              | Values / rule                                                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`               | short slug — reuse the Tier 1 rule id when it applies (`token/hardcoded-color`), else e.g. `pattern-missing-blank-slate`                                                        |
| `title`            | one short line — the claim alone, no rationale                                                                                                                                  |
| `dimension`        | `pixel-component` · `pixel-token` · `pattern` · `consistency` · `state-coverage` · `ux-flow` · `copy` · `a11y`                                                                  |
| `category`         | `design-guideline-violation` · `missing-requirement` · `undocumented-behavior` · `ux-flow-violation` · `ambiguous-requirement` · `missing-edge-case` · `needs-product-decision` |
| `classification`   | `confirmed-gap` · `potential-gap` · `cannot-verify` · `intentional-exception-candidate`                                                                                         |
| `severity`         | `high` · `medium` · `low`                                                                                                                                                       |
| `evidence`         | what you observed — `file:line`, the screenshot region, or the Figma node; else `null`                                                                                          |
| `guideline`        | the rule it breaks **plus its source** (`CLAUDE.md → Pixel rules 3`, `references/rules.md`, MCP `get-component`, the source app file)                                           |
| `fix`              | the concrete on-system replacement — component, prop, token, or copy                                                                                                            |
| `decisionQuestion` | when it's a judgement call: the question for the human                                                                                                                          |
| `suggestedOwner`   | `Product Manager` · `Product Designer` · `Engineer` · `Joint decision`                                                                                                          |

## Rules

- **Cite real evidence.** Every finding points at a real line, a real rule, or a
  real MCP lookup. Never invent a requirement, component or token.
- **Absence is not proof.** If something couldn't be seen, mark `cannot-verify`.
- **Guidelines are defaults, not laws.** A deliberate deviation is an
  `intentional-exception-candidate` with a `decisionQuestion`.
- **Every finding is actionable.** A concrete `fix` for a hard rule, or a
  `decisionQuestion` plus `suggestedOwner` for a judgement call.
- **Don't pad to a number** — but never skip a whole dimension because another
  one looked fine.
- **Separate the tiers.** Say plainly which findings the gate caught
  mechanically and which are your own reading.

## Compact report shape

```
HIGH · pixel-token · confirmed-gap
  Hardcoded px padding on the section-nav toggle
  evidence  app/components/spt/SptSectionNav.vue:154
  guideline CLAUDE.md → Pixel rules 3 — spacing uses --mp-spacing-*
  fix       padding: var(--mp-spacing-1) (4px) or document the 6px Figma value
            and mark the line pixel-police-allow

MEDIUM · a11y · potential-gap
  …
```
