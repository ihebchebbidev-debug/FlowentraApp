## Correction to the plan

Company details are **per company (per tenant)** — every company in the app carries its own address, email, tax ID, bank details and footer message. Nothing is global or shared across companies. A report always prints the footer of the company that owns the document.

## Problem

Company identity is entered twice today and neither place is complete:

- **Settings → Company Information** writes to that company's `Tenants` row, but only holds name, website, phone, logo. No email, city, tax ID, bank details.
- **Each PDF settings modal** keeps its own hand-typed company block, still shipping demo defaults ("PEAK SOLUTIONS", "1234 Service Street"). Nothing links the two, so a footer can silently print another company's stale data or fake data.

## Phase 1 — Each company's record gets the missing fields

EF migrations are disabled in this repo, so the schema change is a hand-written SQL file.

- `Backend/Migrations/20260729_Tenants_AddCompanyDetails.sql` — `ALTER TABLE "Tenants" ADD COLUMN IF NOT EXISTS ...`, all nullable: `CompanyEmail`, `CompanyTagline`, `CompanyCity`, `CompanyPostalCode`, `CompanyState`, `TaxId`, `RegistrationNumber`, `ShareCapital`, `BankName`, `BankAccount`, `BankSwift`, `ReportFooterMessage`. (`CompanyAddress`, `CompanyCountry`, `Industry` already exist.) Every column lives on the tenant row, so each company holds its own values.
- Mirror the fields in `Tenant.cs`, `CreateTenantRequest`, `UpdateTenantRequest`, the mapping blocks in `TenantsController.Create`/`Update`, and the frontend `Tenant` interface in `src/services/api/tenantsApi.ts`.

**Settings page** (`CompanySettings.tsx`) — edits *the currently active company only* — reorganised into cards: Identity (name, tagline, industry, logo) · Contact (email, phone, website) · Address (street, city, postal code, state, country) · Legal & finance (tax ID/VAT, trade register, share capital) · Bank (bank name, RIB/IBAN, SWIFT) · Reports (footer message). Plus a live preview of the exact footer lines that company will print.

**Permission gotcha, handled up front:** `PUT /api/Tenants/{id}` is MainAdminUser-only; a regular user gets 403. `GET /api/Tenants` is open to regular users. So non-admins see the form read-only with a note, instead of hitting a failed save.

## Phase 2 — Per-company resolver

`src/shared/company/useActiveCompany.ts`:

- Resolves the **document's owning company**: active company id → tenant row from the already-cached `useTenantMap()` list. Same resolution order `CompanySettings` uses today, extracted so it exists once.
- `useActiveCompany()` (hook) + `loadActiveCompany()` (promise, for non-React callers), served from the existing tenant cache so reports don't wait on a round-trip.
- Switching companies re-resolves; `invalidateActiveCompany()` fires after a save so open report tabs pick up the new values without a reload.

`src/shared/pdf/resolveCompany.ts`:

- `resolvePdfCompany(settings, company, logoBase64)` → merged company block. Order: **module override (only when the override switch is on and the field is non-empty) → that company's Company Information → empty string.**
- `buildFooterLines(company)` → joins only non-empty parts with " • " so missing fields never leave "• •" gaps. Up to three lines: contact, legal (tax ID / register / capital), bank.

## Phase 3 — Wire every consumer

- **The 4 `pdfSettings.utils.ts` copies** (sales, offers, dispatches, service-orders): demo defaults stripped to empty; type normalised — dispatches is missing `footerMessage`/`logoSize` (its DataTab casts `as any`), offers is missing `tagline`. Add the new legal/bank fields plus `company.useOverride` (default `false` = inherit from the company record).
- **The ~20 merge sites** (7 report pages, 9 preview modals, 4 Send*Modals) currently do `company: {...settings.company, logo: logoBase64}` → each becomes `resolvePdfCompany(...)`. `FormPreviewPage` builds a hardcoded empty company object and gets the same call.
- **The 9 PDF documents**: footers switch to `buildFooterLines(config.company)`. This also fixes `PurchaseOrderPDFDocument`/`SupplierInvoicePDFDocument` dropping website + footer message, and `DynamicFormPDFDocument` printing only the name.
- **The 4 DataTab copies**: "Override company information" switch, inherited values shown greyed/read-only while off, new legal/bank fields, "Reset to Company Information" button. The offers DataTab's ad-hoc auto-fill effect is deleted — the resolver replaces it.

Note: PDF settings are stored **per tenant** (the "per-user" comments in the services are wrong — `pdfSettingsApi` sends the tenant header). So an override also stays scoped to one company, never leaking to another.

## Phase 4 — Data hygiene

Saved PDF settings still contain demo strings. A one-time normaliser on load clears any `company` field exactly matching a shipped demo default ("PEAK SOLUTIONS", "Mountain Service Excellence", the Service Street address, the peaksolutions.com email/site, "YOUR COMPANY") and leaves `useOverride: false`. Anything genuinely typed is kept and flips `useOverride` on.

## Verification

1. Typecheck.
2. Vitest units for `resolvePdfCompany` (override on/off, partial, empty) and `buildFooterLines` (no stray separators).
3. Playwright against the live preview: fill company A's details, open one report per family (quote, sale, invoice, purchase order, supplier invoice, dispatch, service order, payment receipt), screenshot each footer. Then **switch to company B, fill different details, and re-open the same reports to confirm B's footer prints B's address — not A's.** Finally flip one module's override and confirm only that module, for that company, changes.
4. Confirm the non-admin read-only path shows the notice rather than a failed save.
