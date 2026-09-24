# Porting roadmap

Source: `../jurnal-tax/frontend/src` (~375 route entries across 14 route modules).
Done so far: **boilerplate only** — shell, nav, layouts, placeholders.

## Phase 0 — Boilerplate ✅

- Nuxt 4 + Pixel 3 (token 2.4, default product theme)
- Klikpajak shell matching production (`components/Pixel/*`): fixed header
  (quick access, app switcher, account/company menu), first-level sidebar,
  second-level panel per module, collapse + keyboard shortcuts, mobile drawer
- `default` and `blank` layouts
- Catch-all placeholder so every source URL resolves

## Done

- `/main/efiling/report-v2/spt-tahunan-badan` — SPT Tahunan Badan index (Figma
  SPT-Tahunan-Badan › Index: default, blank, Lapor SPT menu + create modal, toast).
  Established the index-page pattern and `KpPageHeader`, `KpStage`, `KpPagination`,
  `KpBlankSlate`.
- `/main/efiling/report-v2/spt-tahunan-badan/:id/:section` — Lapor SPT Tahunan Badan
  (Figma SPT-Tahunan-Badan › SPT): SPT Induk A–J with calculations, Lampiran 1A
  (Laba Rugi + Posisi Keuangan), section menu, save/draft, unsaved guard, submit.

- Lampiran 2–14 (Figma "--> SPT"): config-driven engine (`spt1771LampiranDefs.ts`), inline
  and drawer tables, calculation sheets, Ya/Tidak statements, field groups. Section menu shows
  per-section checkpoints (done / required by SPT Induk answers / optional); required-but-empty
  lampiran block Lapor SPT. Lampiran 8 feeds Induk D.12 when tarif (c) is chosen.

## Open on SPT Tahunan Badan

- Other Lampiran 1 sectors (only "Umum" / 1A is designed).
- Lampiran → Induk amounts beyond D.12 (e.g. Lampiran 3 → E.13, Lampiran 7 → D.8) are entered
  twice today; wire them once the source's rules are confirmed.
- Lampiran 5B drawer in Figma is a copy of Lampiran 7's; built from the 5B table instead.
- Code lists (kode negara, kode objek pajak, kode jenis transaksi…) are free text; replace with
  selects when the reference data is ported.

## Phase 1 — Shared foundations (do before any module)

| Item | Source | Notes |
| --- | --- | --- |
| Page header pattern (title, breadcrumb, actions) | `components/organisms/*`, `layouts/efaktur/*` | One `KpPageHeader` used by every page |
| List page pattern (filter bar + `MpTable` + pagination) | `components/tables`, `components/pagination` | ✅ Established on SPT Tahunan Badan; extract a `KpIndexTable` once a second list is ported |
| Form page pattern (`MpFormControl` sections, sticky footer) | `layouts/efaktur/Form`, `components/inputs` | |
| Detail page pattern | `layouts/efaktur/Detail` | |
| Status tags | `components/approvalStatus`, `components/label` | Map source statuses → `MpBadge`/`MpTag` |
| Formatting utils (NPWP, Rupiah, terbilang, dates) | `formatting`, `helper`, `shared/helpers` | Pure TS ports |
| Mock data layer + persistence | `store/*`, `api/*` | Typed seed data in `app/data/*` |
| Permission + feature-flag gating | `router/index.js`, `store/auth/roles`, `menuList.js` (`basedOnPermissions`, CTAS flags) | Nav is currently the fully-activated Coretax tree; `rolePermissionCode` is kept on modules |

## Phase 2 — Modules (suggested order)

Ordered by how central the module is to daily use and how much it reuses Phase 1.

| # | Module | Source router | Routes | Source layouts | Nav entry |
| --- | --- | --- | --- | --- | --- |
| 1 | Home / Dasbor | `pages/Home` | 1 | MekariPixel | Dasbor |
| 2 | E-Faktur v2 | `router/efaktur` (`/main/efaktur-v2/*`) | 41 | MekariPixelFaktur | E-Faktur |
| 3 | E-Faktur legacy / Arsip, NSFP, SPT, Rekonsiliasi | `router/efaktur` (`/main/efaktur/*`) | 77 | LayoutContainer, EfakturDetail | E-Faktur › Arsip |
| 4 | E-Bupot v2 | `router/ebupot` (`/main/ebupot-v2/*`) | 50 | LayoutContainer | E-Bupot |
| 5 | E-Bupot unifikasi + Arsip | `router/ebupot` (`/main/ebupot/*`) | 47 | LayoutContainer, EbupotList | E-Bupot › SPT / Arsip |
| 6 | E-Billing | `router/ebilling` | 15 | LayoutContainer | E-Billing |
| 7 | E-Filing / Lapor Pajak | `router/efiling` | 54 | LayoutContainer | Lapor Pajak |
| 8 | Settings | `router/setting` | 28 | LayoutContainer | Pengaturan |
| 9 | EFIN register + migration | `router/efin`, `router/migrationEfin` | 7 | MekariPixel | Daftar Efin button |
| 9b | Pengecekan NPWP, Riwayat aktivitas, Manajemen kuota/pengguna, Penandatanganan Coretax | decoupled `/v2/*` app (not in this repo) | — | — | Sidebar |
| 10 | E-Registration | `router/eregistration` | 17 | Eregistration | — |
| 11 | Onboarding, company setup, public | `router/onboarding`, `companySetup`, `public` | 12 | Blank / Plain | — |
| 12 | Admin (internal back-office) | `router/admin` | 23 | Admin | — (separate shell) |

Skip: `router/demo`, deprecated `router/taxManagement`, `pages/auth/Register`.

## Per-module checklist

1. Read the module's `router/<module>/index.js` + `views.js`; list its routes.
2. Read each page and its components; note states (empty, filtered-empty,
   loading, error, no-permission, destructive confirm).
3. Add typed seed data in `app/data/<module>.ts`.
4. Create pages at the source URL path under `app/pages/`.
5. Build with Pixel 3 components; verify props via Pixel MCP.
6. `npm run build`, then check each page in the browser.
