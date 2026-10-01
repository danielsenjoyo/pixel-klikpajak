# SPT Tahunan PPh Badan — PRD v0.6 vs implementation

Gap analysis of this repo against **PRD "SPT Tahunan Badan Rupiah: Filing & Reporting
(Coretax / PJAP)" v0.6** (28 stories, US-001 → US-026).

Sources: the PRD, plus DJP's two workbooks — **"2. Form SPT Badan Rupiah buat PJAP 2.xlsx"**
(form spec, 35 tabs, API field names) and **"3. SPT Tahunan Badan - References 20250911.xlsx"**
(25 reference code lists).

Dated 2026-09-25 · covers `app/data/spt1771*.ts`, `app/data/sptTahunanBadan.ts`,
`app/components/spt/*`, `app/pages/main/efiling/report-v2/spt-tahunan-badan/*`.

## What this repo is, and what that means for the comparison

This is a **Figma-faithful UI prototype on a session-scoped mock store**. There is no
backend, no DJP connection, and no persistence beyond the browser tab. Read every
"Gap" below with that in mind: most are not defects, they are work the prototype was
never scoped to do.

To keep the per-story tables about *forms and rules*, the infrastructure gaps are
stated once here and not repeated 28 times:

| PRD §5 standard rule | State |
|---|---|
| DJP interfaces IF_TXR_037 / 038 / 039, submit, validate, status | **Absent.** `useSptTahunanBadan.submit()` flips a local status to `IN_PROGRESS`. No `idSPT` exists. |
| Folder-100 / SFTP async result ingest | **Absent.** |
| E-signing before submit | **Absent.** |
| Prefill from DJP (registration, eBupot, PPh 25, prior-year SPT) + `detected` badges | **Absent.** Every field is manual. Honest for a prototype — nothing is badged as detected when it isn't. |
| Attachments (Induk section I, a.1–j) | **Filenames only** — `lampiranLainnya: Record<string, string \| null>`. No upload. The **mandatory-when matrix is built** (`LAMPIRAN_LAINNYA.mandatoryWhen`): six of the fourteen entries are decided from the form, marked `*` in the list and blocking at Lapor SPT. |
| Save Draft persists against `idSPT`, reopens intact | **Partial** — `useSpt1771Form` saves to session state; survives section switches, not a reload. |
| Observability: log every DJP call, success rate, p95 | **Absent.** |
| Read-only once reported | **Built** — `isLocked()` drives it; verified end-to-end. |
| Tax Year ≥ 2025 on create | **Built** (2026-09-25, this pass). |

**Reference code lists — now real.** `app/data/taxCodes.ts` was regenerated from DJP's
reference workbook: 649 codes across 25 lists, replacing the previous mock ids. Still not
covered by either workbook: the **tax haven country list** (L10C) and the **P3B treaty
subset** (`NEGARA_P3B`, still compiled from memory).

**Rate as config.** PRD treats the CIT rate as versioned config. The code hardcodes
`0.22` in at least four places — `hitungLampiran8`, L6 line 4 (`bayar6`), L13C `pph`
column, and `computeInduk`'s fallback. Worth centralising before any rate change.

**Status vocabulary** used in the tables below:

- **Built** — matches the PRD.
- **Partial** — the structure is there, specifics differ.
- **Gap** — not present.
- **Conflict** — code and PRD disagree and someone has to decide.

---

## Summary

| Story | Lampiran | Status | Headline |
|---|---|---|---|
| US-001 | Create/obtain | Partial | No `idSPT`; Konsep SPT selectors reduced to a year picker |
| US-002 | Open & render | Partial | Renders fully; no IF_TXR_039, no `FacilityRegisters` |
| US-003 | Induk | Partial | A–J across 4 tabs; §7.1 provenance complete — every lampiran-sourced line is a value with a drill-through, never an input; Bagian I mandatory-when matrix built |
| US-004 | L1A–L1L | Partial + **Conflict** | All 12 sectors render; FPO/FNE enum wired; **total formulas for BC02–BC12 derived, pending sign-off**; sign convention disputed; **one code per account only (PRD allows >1)**; code required once col 7/8 ≠ 0; balance sheet blocks |
| US-005 | L2 | Partial | All 9 + 11 columns; Part A prefilled + identity read-only + refresh; Σ% = 100 gates completeness but does not block inline |
| US-006 | L3 | Partial + **Conflict** | Columns match; **OI-1 `c = a − b` not implemented** |
| US-007 | L4 | Partial | Columns match; PRD wants equality-block, code auto-fills Induk instead |
| US-008 | L5 | Built | Bagian A is DJP's TKU register — prefilled, read-only, Coretax column names; bagian B derives from it |
| US-009 | L6 | Built (form) | All 7 lines exact |
| US-010 | L7 | Built (form) | Columns exact; window hardcoded to 4 years |
| US-011 | L8 | Partial | Lines exact; **Rp 50bn ceiling missing** |
| US-012 | L9 | Built | All 9 columns + recap; L1 reconcile warns; no bulk import |
| US-013 | L10A | Built (form) | All 10 columns; code lists now real DJP (`CIT_RT_*`, `CIT_TT_*`, `CIT_PM_*`) |
| US-014 | L10B | Built | All 15 declarations exact; all required, enforced via a tri-state Ya/Tidak |
| US-015 | L10C | Partial | 4 columns + statement; tax-haven list absent from both DJP workbooks |
| US-016 | L10D | Built (form) | 5 + 5 checklist + both dates |
| US-017 | L11A | Built (form) | All five sections; **no natura classification (KF-P-06)** |
| US-018 | L11B | Partial | `Hubungan` enum wired; I sourced from L1 + Induk D.12, III sourced from II.A; DER cap **warns** (PER-11 leaves the method open); monthly columns corrected to whole rupiah; no add-gate |
| US-019 | L11C | Built | All 15 columns; date order enforced |
| US-020 | L12A | Partial | Angka 2 sourced from Induk D.12; **4(b) should be four checkboxes, not two NPWPs + two amounts** |
| US-021 | L12B | Partial | All 8 sections built; V–VIII now open on the bentuk ticked in IV.a; **AC-02 as written is not a regulation rule** — the real one is blocked on L12A 4(b) being modelled as checkboxes |
| US-022 | L13A | Built (form) | Close match across all 5 groups |
| US-023 | L13B | Partial | Both facilities present; R&D capped at 200% (the *tambahan*, not the 300% total); vocational cap not checkable — the base cost is never captured |
| US-024 | L13C | Built (form) | All 11 columns |
| US-024b | L14 | Built (form) | All 10 columns |
| US-025 | Submit | **Gap** | No e-sign, billing, refund gating, Pembetulan replace, or DJP result |
| US-026 | Verify | **Gap** | Status is local only |

"Built (form)" means the *form* matches the PRD field spec. It does not mean the story
is done — every one of them still sits on the missing infrastructure above.

---

## Lifecycle

### US-001 Create or obtain the draft — Partial

| AC | State |
|---|---|
| AC-01 Konsep SPT / Jenis Pajak / Jenis SPT / Jenis Periode / Periode & Tahun / Normal-Pembetulan | **Partial** — the modal offers a year picker only. Pembetulan is derived (`max(revision) + 1`), not chosen. |
| AC-02 Obtain DJP-generated SPT | **Gap** |
| AC-03 Create new / Pembetulan, Konsep SPT summary | **Partial** — a row is created; no summary screen, no `idSPT`. |
| AC-04 Re-create existing unreported → route to it | **Partial** — `hasOpenSpt()` blocks with "masih dalam proses"; it does not route to the existing draft as the PRD asks. |
| AC-05 Reject Tax Year < 2025 | **Built** — `MIN_TAX_YEAR` greys earlier years and blocks submit. |
| AC-06 Processing / "SPT sudah ada" status messages | **Gap** |

### US-002 Open & render — Partial

Rendering is solid: all 22 sections, section menu with checkpoints, Simpan, read-only
when locked. **Gap:** IF_TXR_039, interface-tracking status, and `FacilityRegisters`
(which US-025 needs for preliminary-refund gating) have no representation at all.

### US-025 Submit & report — Gap

The largest single gap. Missing: e-signing, KB billing-code notification, the
LB refund gating, Pembetulan "Ganti SPT Sebelumnya", DJP Sukses/Gagal handling, and
folder-100 validation surfacing.

Partly there: `f19a: 'pemeriksaan' | 'pendahuluan'` exists as a choice and
`indukIssues()` requires it plus bank details when the return is Lebih Bayar. What is
missing is the **gating** — PRD AC-04a/b/c make *Pengembalian Pendahuluan* selectable
only when `FacilityRegisters` contains `AS.09-01`, or (Pasal 17D) turnover is
> 0 and < Rp 50bn **and** LB ≤ Rp 1bn. Today it is always selectable.

Pre-submit blocking (VR-01) is partial: checkpoints block Lapor SPT on a missing Induk
field or a required-but-empty lampiran, and Lampiran 1 must balance. The **cross-form
equality checks are absent** — L4-A = C.2, L4-B = C.3, L1 fiscal = D.4, L8 = D.12,
L3 = E.13, L6 = G are never asserted, because the code *derives* those Induk values
from the lampiran instead (see US-007).

### US-026 Verify status — Gap

Status comes from the local seed. No polling, no failure detail.

---

## Induk

### US-003 Fill Induk — Partial

Present and correct: sections A–J, the computed chain (`D.4, D.7, D.9, D.12,
F.17a, F.17c, F.18b` in `computeInduk`), read-only computed fields, tarif options,
Pembetulan handling via `f18b`, and — as of this pass — the full activation matrix.

**§10 provenance is now complete.** All eight lampiran-sourced lines — C.2, C.3, D.5, D.6,
D.8, D.10, E.13, E.16 — render as `RO-computed`: the figure plus a drill-through to the
lampiran that produces it, exactly like D.4. They were inputs that only *became* values once
their lampiran had data, which meant a preparer could type D.8 in the Induk and leave
Lampiran 7 empty, putting a number on the return that nothing supported. The eight
`*Amount` fields are gone from `SptIndukData` and `computeInduk` reads only the lampiran;
the activation matrix already requires that lampiran the moment the question is answered Ya.
`SptLinkedAmount.vue` existed only to switch between the two renderings and is deleted.

The remaining Induk amounts are genuinely the preparer's: E.14 (angsuran PPh 25), E.15
(STP pokok), F.17b and F.18a.

| PRD point | State |
|---|---|
| AC-03 conditional lampiran routing | **Built**, realigned to §5.7 this pass |
| AC-04 deactivating a filled lampiran warns and preserves data | **Built** — a part whose Induk answer is "Tidak" is hidden, and a lampiran with every part hidden says so on its own page ("Data yang sudah diisi tetap tersimpan"). Lampiran 2B additionally confirms before hiding. |
| Parts follow their own question | **Built** — `Ctx.answers` carries every Induk Ya/Tidak, so Lampiran 4 bagian A opens on C.2 and bagian B on C.3 independently, and Lampiran 13B I/II on D.6 with III/IV on D.10. Previously every part of a lampiran appeared as soon as any one of its questions was answered Ya. |
| `AccountingPeriodStart` / `End` as dates | **Partial** — modelled as `periodType` + a `periodePembukuan` month-range enum |
| Cash method needs DJP permission | **Gap** — `metodePembukuan: 'kas'` is freely selectable |

---

## Lampiran

### US-004 L1A–L1L — Partial, and one conflict

**1A now matches DJP exactly** — 15 label corrections, and three accounts that were
missing entirely (`1530` Akum. Penyusutan Aset Tetap Lainnya, `1531` Aset Biologis,
`1533` Aset Hak Guna). `1534` had been carrying `1530`'s label; it is
"Dikurangi: Akumulasi Penyusutan - **Aset Hak Guna**". All four are wired into the
`Jumlah Aset` total with the accumulated-depreciation rows signed negative.

**Sector coverage:** the selector now lists all 12 DJP sectors (`BC01`–`BC12`), but only
**BC01 (Umum / 1A)** has a transcribed account schema. Picking any other sector shows a
blank slate rather than 1A's accounts under a wrong heading. All eleven are now wired from tabs L1B–L1L
(`spt1771Lampiran1Sectors.ts`). Each has its own P&L skeleton — L1E (Bank) is
interest-based, L1F (Dana Pensiun) investment-based, L1G (Asuransi) underwriting,
L1I (Bank Syariah) bagi hasil.

Account codes and names are DJP's, verbatim. **The total formulas are derived**, because
the workbook gives account lists and column arithmetic but no row formulas. The rule
(group sums; a net row closes a section over its block totals, orphan inputs and the
preceding net) was validated by regenerating BC01 and diffing against the hand-written
schema: **10 of 10 laba-rugi formulas and the Jumlah Aset formula reproduce exactly.**
That is good evidence, not proof — BC02–BC12 show an on-page caveat until Tax/Legal
confirm them.

| PRD field spec | State |
|---|---|
| Columns 1–10 (kode, nama, komersial, non-objek, final, tidak final, koreksi +/−, kode, nilai fiskal) | **Built** |
| Col 9 `CorrectionCode` = `Enum(FPO-01..12 / FNE-01..04)` | **Built** — real DJP enum, form order (12 positive then 4 negative) |
| Code required when col 7 or 8 ≠ 0 | **Built** — `missingKoreksiCode` marks the cell and blocks Lapor SPT |
| More than one code per account | **Gap** — single-value select; needs a DJP ruling on one-code-per-row vs a list, and on attributing a code to col 7 or col 8 |
| Part B balance: Total Assets = Liabilities + Equity, hard block | **Built** — a blocking issue in `spt1771Validation.ts`, named in the menu as "tidak seimbang" |
| AC-05 guided mapping for an unmapped account | **Gap** — no CoA mapping UI (PRD A/B territory) |

> **Conflict — nilai fiskal sign convention.**
> PRD US-004 field 10: `= komersial − nonobjek − final + pos − neg`, uniformly.
> [`spt1771Lampiran1.ts`](../app/data/spt1771Lampiran1.ts) `labaRugiValue`:
> `c10 = c6 + (isExpense ? -1 : 1) * (c7 - c8)` — it **flips the sign for 5xxx expense
> accounts**, on the reasoning that a positive correction reduces a deductible cost.
> These give different answers for every expense row, and the difference propagates
> through `penghasilanNetoFiskal` → Induk D.4 → PKP → PPh terutang.
> **Owner: Tax/Legal.** Sits alongside KF-P-12 / KF-N-03. Left as-is pending a ruling.

### US-005 L2 — form matches

All of Part A (cols 2–9) and Part B (11 fields) are present with the PRD's semantics.

**Gaps:** nama/alamat/NPWP are editable, where the PRD wants them prefilled and
read-only; **Σ Modal Disetor % = 100 is not validated** (AC-03), so the Yayasan/KIK
exception (OI-14) has nothing to except from.

### US-006 L3 — Partial, and the OI-1 conflict

Part A cols 2–10 and Part B cols all present.

**Gaps:** no eBupot prefill and so no "Berbeda dari data eBupot" flag (AC-03); Part A
lacks the `OverseasRefundPreviousYear` / `OverseasTotalCalculatedCurrentYear` lines,
so "current = total − refund prev year" is not computed.

> **Conflict — OI-1.** PRD (confirmed against the workbook) has the Part B footer
> **`c = a − b`** flowing to Induk E.13. The code does the opposite:
> `e13 = Σ L3-A kredit + Σ L3-B pph` — purely additive. This is exactly the
> disagreement OI-1 flags. **Owner: Tax/Legal**; PRD says block submit until signed off.

### US-007 L4 — Partial, with a structural divergence

Both parts' columns match. `tarif` is manual; the PRD derives it from the object code.

> **Divergence worth a decision.** PRD AC-02 wants L4-A total = Induk C.2 and
> L4-B total = C.3, **validated, blocking on mismatch**. The code instead *derives*
> C.2/C.3 from L4 via `lampiranLinks` + `LINK_SOURCE`, so they can never disagree.
> The code's model is arguably better UX, but it means the PRD's blocking validation
> has no subject. Same pattern applies to D.5, D.6, D.8, D.10, D.12, E.13, E.16.
> **Owner: PM** — confirm DJP does not require the two to be independently entered.

### US-008 L5 — Built

**Bagian A is not a form.** PER-11 Lampiran 5 b)(1) ends with a note that settles it:
"Data tempat kegiatan usaha merupakan data yang terdaftar dalam administrasi Direktorat
Jenderal Pajak. Jika informasi ini belum tersedia, maka Wajib Pajak perlu melakukan
pemutakhiran data." A missing or wrong TKU is corrected in Coretax and re-pulled, never
typed into the SPT. So the table is prefilled from the registered roster, rendered as
read-only text with no add and no row actions, and keeps only "Tarik ulang data".

Column names follow Coretax's own TKU register (NI TKU, Nama TKU, Alamat, Desa/kelurahan,
Kecamatan, Kota/kabupaten, Provinsi) rather than the prototype's earlier wording, so the
two screens read alike. Sample NITKUs are generated as the 16-digit NPWP plus a 6-digit
branch sequence, the way Coretax builds them.

Bagian B still derives one row per TKU from bagian A.

**Gaps:** region fields are free text rather than the DJP wilayah enums (they come from the
register, so this only matters once the prefill is real).
### US-009 L6 — form matches

All 7 lines exact, including line 2 fed from L7 and line 7 flowing to Induk G.
**Gaps:** AC-02 prefill of instalments, AC-03 "Angsuran bulan [x] belum terisi" — the
form is a single annual computation, not twelve months, so there is no month to warn about.

### US-010 L7 — form matches

Columns 2–9 exact, incl. `kIni` → L6 line 2 and `kBerjalan` carry-forward.
**Gaps:** no prior-year prefill; the 4-year window is hardcoded in the column
generator rather than driven by config.

### US-011 L8 — Partial

Lines 1, 2, 2a, 2b, 3a, 3b, 4 match, and the result correctly overwrites Induk D.12
when tarif (c) is chosen.

> **Gap — the Rp 50bn ceiling.** PRD AC-02: turnover above Rp 50bn ⇒ facility is 0.
> `hitungLampiran8` only prorates `min(1, 4.8bn / bruto)`, with no upper bound.
> At turnover Rp 60bn and PKP Rp 10bn it still grants Rp 800m of facilitated PKP
> instead of zero — **understating tax for every large filer that reaches this form**.
> Both thresholds should come from config.

### US-012 L9 — form matches

Per-asset columns (9) match the PRD exactly, across all groups: Berwujud K1–4,
Bangunan permanen / tidak permanen, Tak berwujud K1–4, plus the fiskal/komersial/selisih
recaps for both tangible and intangible.

AC-02 (the recap should agree with the L1 depreciation line) is **built as a warning**:
`penyusutanIssues` compares L9's selisih penyusutan + amortisasi against account 5314's net
kolom (7)/(8) correction. It compares **magnitudes only** — which column carries the
correction depends on the expense-row sign convention that is still open for Tax/Legal
(see US-004), and a rule built on the disputed reading would bake it in.

**Gaps:** bulk import (AC-01); asset classes/rates/lives are not validated against
UU PPh 11/11A.

### US-013 L10A — form matches

All 10 columns, now backed by the real DJP lists: `RELATIONSHIP_TYPE` (4, `CIT_RT_*`),
`TRANSACTION_TYPE` (14, `CIT_TT_*`), `PRICING_METHOD` (9, `CIT_PM_*`). "Alasan required
when a method is chosen" is still not enforced.

### US-014 L10B — Built

All 15 declarations — 1a–d, 2a–c, 3a–e, 4a–c — match the PRD one for one.

AC-02 ("all required, block and list the unanswered") is **built**. PER-11 Lampiran 10B b)
is explicit — "diisi dengan memilih jawaban (YA/TIDAK) ... **dari setiap pernyataan yang
ada**" — so the block carries `required: true` and `KpYesNo` gained a third state: `null`
renders as neither radio, which is what makes "belum dijawab" distinguishable from a
deliberate Tidak at all.

The tri-state is **scoped to `StatementsBlock`**. The Induk's 21 gating questions seed to
`false` and keep their Tidak-preselected behaviour; changing those would turn every Induk
question into an unanswered one, which is a design decision, not a refactor.

Per-item blocking is gated twice over: the lampiran must be one the return owes
(`requiredLampiran`), and it must already have an answer in it. A required lampiran that is
wholly untouched is reported once as "belum diisi" rather than fifteen times, and merely
opening L10B when H.21.a is Tidak raises nothing.

### US-015 L10C — Partial

Table (4 columns) and statement II present. **Gap:** the country select uses the full
`NEGARA` list; there is no configured tax-haven list, so AC-02 ("selecting a tax-haven
country makes the related rows required") has nothing to trigger on.

### US-016 L10D — form matches

Both 5-item checklists and both availability dates. **Gap:** no link to attachment i
(CbCR receipt).

### US-017 L11A — form matches

All five sections present with columns matching the PRD headers, including the two
the workbook names explicitly: IV.A sarana & fasilitas (6 columns) and IV.B
rekapitulasi (location, both SK number/date pairs, and all six cost categories).

> **Gap — KF-P-06.** There is no natura/kenikmatan classification UI at all, so AC-02
> ("auto-classification blocked; surface the treatment choice with its PMK 66/2023
> citation") has nothing to attach to. Nor is there the VR-01 link from an incomplete
> nominatif list to a non-deductible cost in L1. **Owner: Tax/Legal.**

### US-018 L11B — Partial

Built: EBITDA (I), debt & capital monthly averages and DER (II), borrowing cost (III),
and the foreign-debt question that gates L11C.

**OI-L11Bunit resolves the other way.** The monthly columns were headed "(dalam jutaan
rupiah)" over a plain `Rp` input — the two disagreed, and so did the regulation: PER-11
Lampiran 11B II heads them "SALDO UTANG TIAP AKHIR BULAN (Rp)" and says each is "diisi
dengan saldo utang pada akhir bulan yang bersangkutan **dalam mata uang rupiah**". Whole
rupiah. The heading is corrected and the input was always right. The capital table's twelve
columns were also sitting under the *debt* heading; it now says "Saldo modal".

| PRD point | State |
|---|---|
| AC-03 DER add-gate: the "Add" control appears when every EBITDA value is 0 | **Gap** |
| AC-04 DER cap (4:1, config) → excess borrowing cost non-deductible → L1 positive correction | **Warning, deliberately not computed** — see below |
| I.a/I.b/I.c sourced from L1 and Induk D.12 | **Built** — `linked`, read-only once the source has a figure |
| III kolom (1)/(2) sourced from II.A | **Built** — `derivedFrom`, one row per lender, average carried across |

> **Why the DER cap is a warning and not a calculation.** PER-11 Lampiran 11B a) lists the
> ratio method as one option among several — "melalui metode DER, melalui persentase
> tertentu dari EBITDA, atau melalui metode lainnya" — and kolom (4) is "biaya pinjaman yang
> dapat diperhitungkan **sesuai dengan perbandingan yang diperkenankan**", where the allowed
> ratio comes from other regulation (PMK 169/2015: 4:1), not from PER-11. Computing kolom (4)
> from 4:1 would force the DER method on a taxpayer using the EBITDA method and would bake a
> rate PER-11 leaves open. So kolom (4) stays the preparer's, and `derIssues` warns when the
> ratio exceeds the cap while the whole borrowing cost is still claimed.

### US-019 L11C — form matches

All 15 columns including the computed `akhir = awal + tambah − kurang`.
AC-02 (due date may not precede the start date) blocks, through
`FieldDef.validate` + the engine's `notBefore` factory: the cell turns red as it is
typed and the issue stops Lapor SPT.

### US-020 L12A — form matches

Kode negara, neto (from Induk D.4), PPh badan, DPP, tarif + terutang, P3B exemption,
and all four reinvestment routes.

Angka 2 now carries Induk D.12, as PER-11 b)(2) requires ("dipindahkan dari formulir INDUK
Bagian D angka 12"), read-only once the Induk has a figure.

**Gaps:** tarif is a free percent rather than 20% with a treaty override; **4(b) should be
four checkboxes, not two NPWPs and two currency fields** (PER-11 b)(4)(b)) — this blocks the
reinvestment consistency rule, see L12B above; PER-11 also routes angka 2 from Lampiran 4
for final-tax filers, which the single D.12 link does not cover.
BUT detection is now wired to `company.isBut` (this pass) but **OI-BUTdetect stands** —
the real source should be registration, not a seed flag.

### US-021 L12B — Partial (was Gap; sections IV–VIII built 2026-09-29)

All eight sections of the DJP form are now present and match the mapping workbook's 46
`L12BNotificationReinvestmentNetIncome.*` fields:

| Section | Block | Source fields |
| --- | --- | --- |
| I–III identitas + laba bersih | `but` | `IdentityOf…`, `FiscalYear`, `TaxableIncome`, `IncomeTax`, `NetIncomeAfterTax` |
| IV.a bentuk penanaman modal | `but` (4 checkbox) | `TypeOfReinvestment` |
| IV.b realisasi | table `realisasi` | `RealizationOfReinvestment.*`, `TotalAmountOfRealization` |
| V perusahaan baru didirikan | table `perusahaanBaru` | `ReinvestmentOfNewlyEstablishedCompany.*` |
| VI perusahaan sudah didirikan | table `perusahaanLama` | `ReinvestmentOfEstablishedCompany.*` incl. bursa efek |
| VII aset tetap | table `asetTetap` | `TypeOfFixedAsset` … `DateOfDeedOfPurchase` |
| VIII aset tak berwujud | table `asetTakBerwujud` | `TypeOfIntangibleAsset`, `AmountOfInvestment…`, `Description…` |

**AC-02 as the PRD states it does not exist in the regulation.** Reinvestment does not
*reduce* the branch-profit-tax base. PER-11 Lampiran 12A b)(4) makes 4(b) a tick: PPh 26(4)
is either terutang at 20%/P3B on the full DPP, or **tidak terutang** because the income was
"ditanamkan kembali **seluruhnya** di Indonesia". It is binary, not a subtraction.

The enforceable rule is therefore a cross-form one — claim full reinvestment in L12A and
L12B must show realisasi covering the whole of III.d. It is **not built**, because 4(b) is
modelled wrongly: PER-11 makes all four routes checkboxes (with an NPWP for i/ii), while the
form renders c) and d) as currency fields and 4(b)(2) as a bare heading with no control. So
there is no tick to key the rule off. Fix the control shapes first — tracked with the tarif
gap below.

### US-022 L13A — form matches

KMK pemberian/pemanfaatan number+date, approved investment (valas / ekuivalen / rupiah
/ jumlah), bentuk, bidang, all four facility checkboxes with persentase and kompensasi
year, realisasi tahun ini / akumulasi, mulai produksi komersial, and tahun ke- / nilai
(the 1/6 × % × realisasi computation). Feeds Induk D.5.

### US-023 L13B — Partial

Vocational (I agreement table, II cost recap a–e + total) and R&D (III proposal table,
IV the six-line current-year computation) both present and wired to Induk D.6 / D.10.

**AC-02 statutory multiplier caps — the PRD's two numbers are both wrong.** PER-11
Lampiran 13B a)(1)(2) splits each facility into an ordinary 100% and a *tambahan*:

| Facility | Total | Ordinary | Tambahan (what the lampiran reports) |
|---|---|---|---|
| Praktik kerja / pemagangan | ≤200% | 100% | **≤100%** |
| Penelitian dan pengembangan | ≤300% | 100% | **≤200%** |
| Praktik kerja di Ibu Kota Nusantara | ≤250% | 100% | **≤150%** |

So part III kolom (6) caps at **200%**, not 300% — 300% is the total, which already
includes the ordinary 100% the expense account carries. Enforced with `atMost(200, …)`.
PER-11 C(e) also lists 200/175/150/125/100/75/50/25 but prefixes them "antara lain", so
they are named in the message as guidance rather than enforced as an enum.

**The IKN 250%/150% tier is missing from the PRD entirely.**

**Still a gap — and not fixable from the form:** the vocational cap. Parts I/II never
capture the base cost; PER-11 B(1) says rows a–e are each "diisi dengan **tambahan**
pengurangan penghasilan bruto", i.e. the already-computed additional amount. With no cost
to compare against, there is nothing to validate 100%-of-cost against. Needs either a new
base-cost column or an out-of-band check.

AC-03 (ineligible costs excluded from the base) is also absent.

### US-024 L13C — form matches

All 11 columns including the computed `fasilitas = % × 22% × PKP`. Note the hardcoded
`0.22`.

### US-024b L14 — form matches

All 10 columns including the three computed ones (jumlah penggunaan, belum ditanamkan,
and the past-due amount), plus the summary rows.

---

## Open items

### PRD open items this review confirms

| OI | Confirmed how |
|---|---|
| **OI-1** (L3 footer `c = a − b` vs additive Induk F) | Code is additive — the disagreement is live, not theoretical |
| **KF-P-06** (natura deductibility) | No classification exists to be blocked |
| **KF-P-12 / KF-N-03** (depreciation shared L1 ↔ L9) | A warning now names both figures when they differ; which column the correction belongs in still rides on the US-004 sign ruling |
| **OI-14** (Modal Disetor % ≠ 100) | No Σ% validation at all |
| **OI-BUTdetect** | Now satisfied by a company-record flag; the real source is still undefined |
| **OI-L11Bunit** (millions of rupiah) | Already handled correctly |
| **OI-fields** (missing per-row API names) | **Resolvable** — the form-spec workbook carries them, e.g. L1 col 6 is `.NonFinal` |

### New items this review raises

| # | Severity | Item | Owner |
|---|---|---|---|
| **G-1** | **High** | L1 nilai fiskal sign convention: code flips the correction sign for 5xxx expense accounts, PRD does not. Moves D.4 and everything downstream. | Tax/Legal |
| **G-2** | **High** | Pasal 31E has no Rp 50bn ceiling — understates tax above that turnover. | Tax/Legal + Eng |
| **G-3** | Med | L13B super-deduction percentages are unbounded (no 200% / 300% cap). | Tax/Legal |
| **G-4** | Med | L11B DER cap not implemented, so excess borrowing cost never becomes an L1 positive correction. | Tax/Legal + Eng |
| **G-5** | Med | Cross-form totals are *derived* rather than *validated*. Confirm DJP does not require independent entry of C.2/C.3/D.5/D.6/D.8/D.10/D.12/E.13/E.16. | PM |
| **G-6** | Med | L12B is missing all five reinvestment sections. | PM + Eng |
| **G-7** | Low | CIT rate hardcoded as `0.22` in four places; PRD treats it as versioned config. | Eng |
| **G-8** | Low | US-003 AC-04 deactivation warning absent — data is preserved silently. | Design |
| **G-9** | Low | L10C still has no tax-haven country list (absent from both DJP workbooks); L10B does not enforce "all required". | Tax/Legal + Eng |
| **G-10** | **High** | Eleven L1 sector schemas (BC02–BC12) are now wired from tabs L1B–L1L. Account codes and names are DJP's; the **total formulas are derived**, not sourced. The derivation reproduces all 10 hand-verified BC01 formulas and its Jumlah Aset exactly, but each sector's totals still need Tax/Legal sign-off. The UI carries an on-page caveat for BC02–BC12. | Tax/Legal |
| **G-11** | ~~Low~~ **Resolved** | 1A field names corrected against DJP: 15 labels, 3 missing accounts (1530, 1531, 1533) and the 1534 mix-up. | — |

---

## Changed in this pass (2026-09-25)

From DJP's two workbooks:

- `taxCodes.ts` regenerated — 25 lists, 649 codes, real DJP codes and Indonesian wording.
- **Kode penyesuaian fiskal** FPO-01..12 / FNE-01..04 wired to Lampiran 1 kolom 9 (was free text).
- Sector selector now lists BC01–BC12; non-BC01 sectors show a blank slate (no schema yet).
- Free text → selects: L9 kode aset (per group: berwujud / bangunan / tak berwujud),
  L9 metode penyusutan komersial & fiskal, L11A jenis biaya promosi, L11A IV.A jenis harta,
  L11A V kategori kredit, L14 bentuk penanaman kembali, L3-B jenis pajak.

Navigation and titles:

- Section menu uses short labels (`L1 - Rekonsiliasi Fiskal` …); each page heads with
  DJP's official title (`Rekonsiliasi Laporan Keuangan`), sub-parts with their own
  form headings.

Activation matrix:

Aligning the activation matrix to PRD §5.7, verified in the running app:

- `requiredLampiran()` now always requires **L1, L2, L6, L11B** (previously L2 was
  gated on H.21c/d, L6 only on `G.20 === false`, and L11B was absent).
- **L11C** activates from L11B's own "utang swasta luar negeri" answer.
- **L12A/12B** activate on a BUT entity (`Company.isBut`, with a BUT seed company).
- `MIN_TAX_YEAR = 2025` blocks creating an earlier return, in the picker and on submit.
- Separately: `isLampiran1Filled()` now requires the balance sheet to have data, since
  an untouched one balances trivially at 0 = 0.
