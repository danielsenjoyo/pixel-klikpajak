#!/usr/bin/env node
/**
 * Pixel Police — the compliance gate for pixel-klikpajak (Pixel 3, token mode 2.4).
 *
 * Fails on NEW Pixel token/component violations. Only lines ADDED since a base ref are
 * checked, so existing, deliberate exceptions never block a push — only new code does.
 * Ported from pixel-jurnal's scripts/pixel-police.sh; the rules are this repo's own
 * (CLAUDE.md → Pixel rules). Full rule list: .agents/skills/pixel-police/references/rules.md
 *
 * Usage:
 *   node scripts/pixel-police.mjs             # vs. merge-base with origin/main (or main)
 *   node scripts/pixel-police.mjs <base-ref>  # vs. an explicit base ref/sha
 *   node scripts/pixel-police.mjs --all       # audit every line of every file (not a gate)
 *
 * "The change" = every commit since the base PLUS the working tree — staged, unstaged and
 * untracked files — so running it on uncommitted work checks that work.
 *
 * Escape hatch: `pixel-police-allow` in a trailing comment on the line, or in a comment on
 * the line directly above (for multi-line tags, where a comment can't go inside the tag).
 * Use it for documented exceptions only, and write the exception into docs/ in the same change.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const AUDIT_ALL = args.includes('--all')
const BASE_INPUT = args.find(a => !a.startsWith('--')) ?? ''
const FILE_GLOBS = ['app/**/*.vue', 'app/**/*.css']

const git = (...a) => {
  try {
    return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  }
  catch {
    return ''
  }
}

// ── Base ref (always a merge-base with HEAD, never a branch tip) ─────────────
function resolveBase(input) {
  if (input && !/^0+$/.test(input) && git('rev-parse', '--verify', '-q', `${input}^{commit}`)) {
    return git('merge-base', input, 'HEAD') || input
  }
  for (const ref of ['origin/main', 'main']) {
    if (git('rev-parse', '--verify', '-q', ref)) {
      const mb = git('merge-base', ref, 'HEAD')
      if (mb) return mb
    }
  }
  return git('rev-parse', 'HEAD~1') || git('rev-parse', 'HEAD')
}

// ── Known token names ─────────────────────────────────────────────────────────
// --mp-*: everything Pixel's styled-system defines (2.1 base + 2.4 "next" theme).
// --kp-*: the project variables declared in app/assets/css/app.css, plus ones a component sets at
// runtime through :style="{ '--kp-…': … }" (e.g. --kp-content-offset in layouts/default.vue).
function knownVars() {
  const sources = [
    'node_modules/@mekari/pixel3-styled-system/tokens/index.mjs',
    'node_modules/@mekari/pixel3-styled-system/themes/next.json',
    'node_modules/@mekari/pixel3-styled-system/themes/theme-next.json',
    'node_modules/@mekari/pixel3-styled-system/themes/new.json',
  ].filter(existsSync)
  const mp = new Set(sources.flatMap(f => [...readFileSync(f, 'utf8').matchAll(/--mp-[a-z0-9-]+/g)].map(m => m[0])))
  const kpSources = ['app/assets/css/app.css', ...git('ls-files', '--cached', '--others', '--exclude-standard', '--', 'app/**/*.vue').split('\n').filter(Boolean)]
  const kp = new Set(kpSources.filter(existsSync).flatMap(f =>
    [...readFileSync(f, 'utf8').matchAll(/['"]?(--kp-[a-z0-9-]+)['"]?\s*:/g)].map(m => m[1])))
  return { mp, kp, mpChecked: sources.length > 0 }
}

// ── Rules ─────────────────────────────────────────────────────────────────────
// Each rule sees one added line plus its context and returns a message or null.
//   where: 'any' | 'template' | 'style' (CSS files and <style> blocks) | 'script'
const HEX_OR_FN = /(#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{8}\b|\brgba?\(|\bhsla?\()/
const NAMED_COLOR = /\b(color|background(-color)?|border(-[a-z]+)?(-color)?|outline(-color)?|fill|stroke|box-shadow)\s*:[^;]*\b(white|black|red|green|blue|gray|grey|orange|yellow|purple|pink)\b/
// Spacing/type properties only — px widths/heights/offsets from Figma stay allowed. 1px (hairlines,
// the sr-only clip) is fine; anything from 2px up needs a token.
const SPACING_PX = /\b(padding|margin|gap|row-gap|column-gap|font-size|line-height|letter-spacing|border-radius)(-[a-z]+)*\s*:[^;]*?(?:^|[\s(,:])-?(?:[2-9]|[1-9]\d+)(?:\.\d+)?px/

const RULES = [
  {
    id: 'token/hardcoded-color',
    where: 'any',
    test: ({ line, section }) =>
      HEX_OR_FN.test(line) || (section === 'style' && NAMED_COLOR.test(line)),
    message: 'Hardcoded colour — use a semantic token: var(--mp-colors-text-secondary), var(--mp-colors-border-default)…',
  },
  {
    id: 'token/unknown-var',
    where: 'any',
    test: ({ line, vars }) => {
      for (const [, name] of line.matchAll(/var\(\s*(--(?:mp|kp)-[a-z0-9-]+)/g)) {
        if (name.startsWith('--kp-') && !vars.kp.has(name)) return `\`${name}\` is never declared (app/assets/css/app.css or a :style custom property)`
        if (name.startsWith('--mp-') && vars.mpChecked && !vars.mp.has(name)) return `\`${name}\` is not a Pixel token (typo? check get-docs / tokens)`
      }
      return false
    },
    message: 'Unknown token variable',
  },
  {
    id: 'token/px-spacing-type',
    where: 'style',
    test: ({ line }) => SPACING_PX.test(line),
    message: 'Hardcoded px spacing/type — use var(--mp-spacing-*), --mp-font-sizes-*, --mp-line-heights-*, --mp-radii-* (1px hairlines are fine)',
  },
  {
    id: 'token/raw-font-weight',
    where: 'style',
    test: ({ line }) => /\bfont-weight\s*:\s*\d/.test(line),
    message: 'Numeric font-weight — use var(--mp-font-weights-*)',
  },
  {
    id: 'component/raw-control',
    where: 'template',
    test: ({ tag }) => !!tag && /^<(button|input|select|textarea)\b/.test(tag) && !/\bkp-icon-btn\b/.test(tag),
    message: 'Raw HTML control — use MpButton / MpInput / MpSelect / MpTextarea; icon-only buttons use <button class="kp-icon-btn"> (there is no MpButtonIcon)',
  },
  {
    id: 'component/inline-style',
    where: 'template',
    // Allowed: :style that only sets CSS custom properties (a runtime value the stylesheet then
    // uses), and table column widths from config via cellWidth().
    test: ({ line }) => /(^|\s)style="/.test(line)
      || (/(^|\s):style="/.test(line) && !/:style="\{\s*'--/.test(line) && !/cellWidth\(/.test(line)),
    message: 'Inline style — use a scoped class with token variables (only CSS custom properties and cellWidth() column widths may be bound)',
  },
  {
    id: 'component/icon-size',
    where: 'template',
    test: ({ tag }) => !!tag && /^<MpIcon\b/.test(tag) && /\ssize="(?!sm"|md")[^"]*"/.test(tag),
    message: 'MpIcon only supports size="sm" | "md"',
  },
  {
    id: 'component/avatar-variant-color',
    where: 'template',
    test: ({ tag }) => !!tag && /^<MpAvatar\b/.test(tag) && !/variant-color=/.test(tag),
    message: 'MpAvatar needs an explicit variant-color (its random colour can render blank)',
  },
  {
    id: 'component/tooltip-object',
    where: 'template',
    test: ({ line }) => /v-tooltip="(?!\s*\{)/.test(line),
    message: 'v-tooltip must always get an object literal — never a conditional/undefined (it throws); v-if the wrapper instead',
  },
  {
    id: 'import/non-pixel3',
    where: 'any',
    test: ({ line }) => /from\s+['"]@mekari\/pixel(?!3(-[a-z]+)?['"])/.test(line) || /from\s+['"]@mekari\/pixel3-(?!postcss)[a-z-]+['"]/.test(line),
    message: 'Import UI from @mekari/pixel3 only (not @mekari/pixel or a pixel3-* sub-package)',
  },
  {
    id: 'theme/token-mode',
    where: 'any',
    test: ({ line }) => /setNextTheme\(\s*(false)?\s*\)/.test(line),
    message: 'Klikpajak runs token mode 2.4 — keep setNextTheme(true) (plugins/pixel.client.ts)',
  },
]

// ── File scanning ─────────────────────────────────────────────────────────────
const isCommentOnly = l => /^\s*(\/\/|\/\*|\*|<!--)/.test(l)
const ALLOW = 'pixel-police-allow'

/** 'template' | 'script' | 'style' for each line (CSS files are all 'style'). */
function sections(file, lines) {
  if (file.endsWith('.css')) return lines.map(() => 'style')
  let cur = 'template'
  return lines.map((l) => {
    if (/^\s*<script\b/.test(l)) cur = 'script'
    else if (/^\s*<style\b/.test(l)) cur = 'style'
    const here = cur
    if (/<\/(script|style)>/.test(l)) cur = 'template'
    return here
  })
}

/** The opening tag that starts on line i (joined across lines), or null. */
function tagAt(lines, i) {
  const m = lines[i].match(/<([A-Za-z][\w-]*)\b.*$/)
  if (!m) return null
  let tag = m[0]
  for (let j = i + 1; j < Math.min(lines.length, i + 15) && !/>/.test(tag.replace(/"[^"]*"/g, '""')); j++) tag += ` ${lines[j].trim()}`
  return tag
}

function addedLineNumbers(file, base, untracked) {
  const lines = readFileSync(file, 'utf8').split('\n')
  if (AUDIT_ALL || untracked.has(file)) return lines.map((_, i) => i + 1)
  const diff = git('diff', '--unified=0', base, '--', file)
  const nums = []
  for (const [, start, count] of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
    const n = count === undefined ? 1 : Number(count)
    for (let k = 0; k < n; k++) nums.push(Number(start) + k)
  }
  return nums
}

function main() {
  const base = AUDIT_ALL ? null : resolveBase(BASE_INPUT)
  const untracked = new Set(git('ls-files', '--others', '--exclude-standard', '--', ...FILE_GLOBS).split('\n').filter(Boolean))
  const files = AUDIT_ALL
    ? git('ls-files', '--', ...FILE_GLOBS).split('\n').filter(Boolean)
    : [...new Set([...git('diff', '--name-only', base, '--', ...FILE_GLOBS).split('\n'), ...untracked])].filter(Boolean)
  const vars = knownVars()

  const dirty = !AUDIT_ALL && git('status', '--porcelain', '--', ...FILE_GLOBS) ? ' (+ uncommitted work)' : ''
  console.log(AUDIT_ALL
    ? `Pixel Police: auditing every line of ${files.length} files`
    : `Pixel Police: checking added lines since ${base.slice(0, 12)}${dirty}`)

  let total = 0
  for (const file of files.sort()) {
    if (!existsSync(file)) continue
    const lines = readFileSync(file, 'utf8').split('\n')
    const sect = sections(file, lines)
    const hits = []
    for (const n of addedLineNumbers(file, base, untracked)) {
      const i = n - 1
      const line = lines[i]
      if (line === undefined || isCommentOnly(line)) continue
      if (line.includes(ALLOW) || (i > 0 && isCommentOnly(lines[i - 1]) && lines[i - 1].includes(ALLOW))) continue
      const ctx = { line, section: sect[i], tag: sect[i] === 'template' ? tagAt(lines, i) : null, vars }
      for (const rule of RULES) {
        if (rule.where !== 'any' && rule.where !== ctx.section) continue
        const res = rule.test(ctx)
        if (res) hits.push({ n, rule, detail: typeof res === 'string' ? res : rule.message, line: line.trim() })
      }
    }
    if (hits.length) {
      console.log(`\n🚨 ${file}`)
      for (const h of hits) console.log(`  ✗ ${file}:${h.n}  [${h.rule.id}] ${h.detail}\n       ${h.line.slice(0, 140)}`)
      total += hits.length
    }
  }

  console.log('')
  if (!total) {
    console.log(`✅ Pixel Police: no ${AUDIT_ALL ? '' : 'new '}token/component violations.`)
    return 0
  }
  console.log(`❌ Pixel Police: ${total} violation${total === 1 ? '' : 's'} above.`)
  if (!AUDIT_ALL) {
    console.log('   Only newly-added lines are checked — pre-existing code is not flagged.')
    console.log(`   Deliberate exception? Add a '${ALLOW}' comment (same line, or the line above a`)
    console.log('   multi-line tag) and document it in docs/ in the same change.')
  }
  return 1
}

process.exit(main())
