# Porting roadmap

Source: `../jurnal-tax/frontend/src` (~375 route entries across 14 route modules).
Done so far: **boilerplate only** — shell, nav, layouts, placeholders.

## Phase 0 — Boilerplate ✅

- Nuxt 4 + Pixel 3 (token 2.4, default product theme)
- Klikpajak top-nav shell: logo, main menu (3-level dropdowns), mobile drawer,
  Daftar Efin button, product selector, company/account menu
- `default` and `blank` layouts
- Catch-all placeholder so every source URL resolves

## Phase 1 — Shared foundations (do before any module)

| Item | Source | Notes |
| --- | --- | --- |
| Page header pattern (title, breadcrumb, actions) | `components/organisms/*`, `layouts/efaktur/*` | One `KpPageHeader` used by every page |
| List page pattern (filter bar + `MpTable` + pagination) | `components/tables`, `components/pagination` | Most efaktur/ebupot/ebilling pages are lists |
| Form page pattern (`MpFormControl` sections, sticky footer) | `layouts/efaktur/Form`, `components/inputs` | |
| Detail page pattern | `layouts/efaktur/Detail` | |
| Status tags | `components/approvalStatus`, `components/label` | Map source statuses → `MpBadge`/`MpTag` |
| Formatting utils (NPWP, Rupiah, terbilang, dates) | `formatting`, `helper`, `shared/helpers` | Pure TS ports |
| Mock data layer + persistence | `store/*`, `api/*` | Typed seed data in `app/data/*` |
| Permission gating (`rolePermissionCode`) | `router/index.js`, `store/auth/roles` | Nav already carries the codes |

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
| 8 | Settings | `router/setting` | 28 | LayoutContainer | User menu › Pengaturan |
| 9 | EFIN register + migration | `router/efin`, `router/migrationEfin` | 7 | MekariPixel | Daftar Efin button |
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
