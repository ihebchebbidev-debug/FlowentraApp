# Align Invoices with Sales & Offers

Goal: the Invoices module should look and behave exactly like Sales and Offers — same header, stats, filter/search patterns, list/table views, mobile cards, detail page structure, fonts, sizes, spacing — while keeping the invoice-specific business logic (posting, payments, void, reopen, PDF, audit trail) intact and fully translated in EN/FR.

## 1. Invoices List page — mirror `SalesList` / `OffersList`

Rebuild `src/modules/invoices/pages/InvoicesPage.tsx` around the same primitives Sales uses:

- Page shell: same padding, header typography (`text-2xl`/`text-sm muted`), primary action button on the right.
- Stats row using the same `Card` + `CardContent` sizing and icon tone conventions as `SalesList` stat cards (not the current custom `StatCard`). Clickable to filter — like Sales.
- View mode switch: `list` and `table` only (no kanban, as requested). Persist via `getInitialViewMode`.
- `CollapsibleSearch` + filter bar toggled by a Filter button, matching Sales layout.
- Status filter, date-from/date-to, contact filter, sale-number filter, "overdue only" quick chip.
- Table view rendered via shared `TableLayout` with the exact column header styling, sort chevrons, row hover, and row-action dropdown (`TableRowActions`) used in Sales.
- List (mobile-first) view rendered as the same card component style Sales uses on `md:hidden`, with identical typography, spacing, badges.
- Pagination via `SimplePaginationBar` (same as Sales) — replace the current custom pagination.
- Bulk selection column with `Checkbox`, plus bulk void/download actions (safe subset).
- Permissions via `usePermissions('invoices')` mirroring Sales' `canRead/canCreate/...` gates.
- Export button opening the shared `ExportModal` (CSV of currently filtered invoices).

## 2. Invoice Detail page — mirror `OfferDetail` / `SaleDetail`

Rebuild `src/modules/invoices/pages/InvoiceDetailPage.tsx` to use the same detail shell as Offers/Sales:

- Back link + breadcrumb, header with invoice number, status badge, and right-aligned action buttons (Download PDF, Post, Mark Paid, Reopen, Void, Delete) all rendered with the same button sizes/variants as Offers.
- Summary card grid (contact, sale link, issue/due dates, totals, amount paid/due) using the same card grid Offers uses in its overview header.
- Tabbed body using the same `Tabs` layout as Offers, with these tabs — each implemented as a component under `src/modules/invoices/components/tabs/` to match the Offers/Sales tab folder pattern:
  - `OverviewTab` — header info + totals summary.
  - `ItemsTab` — invoice lines table styled identically to Offers/Sales `ItemsTab`.
  - `PaymentsTab` — existing payment list + Mark Paid/Reopen/Void actions with required memo dialogs (already implemented, moved into the tab).
  - `ActivityTab` — the existing `InvoiceActivityTab` renamed/aligned to match Offers `ActivityTab` styling (icons, timeline, timestamps, actor).
  - `NotesTab` — notes on the invoice, mirroring Offers.
  - `AttachmentsTab` — attachments, mirroring Offers (backend endpoint reused if exists; otherwise stub UI only when backend not present — no fake data).
- Detail drawer (`InvoiceDetailDrawer`) kept but updated to use the same header/footer pattern as the Offers drawer.

## 3. Translations (EN + FR)

- Audit `public/locales/en/invoices.json` and `fr/invoices.json` for every new key introduced by the refactor (view mode labels, filter bar, bulk actions, table headers, tab titles, empty states, export modal strings, permission-denied strings).
- Cross-check with `sales.json` / `offers.json` to reuse consistent phrasing.
- Verify no raw English string leaks (grep for hardcoded strings in the new files).

## 4. Backend verification (no schema changes expected)

- Confirm existing endpoints cover the UI needs:
  - `GET /invoices` supports `status`, `search`, `dateFrom`, `dateTo`, `contactId`, `saleId`, `sortBy`, `sortOrder`, `page`, `limit`.
  - `POST /invoices/:id/void|mark-paid|reopen` accept and persist `Reason`/`Memo` (already added).
  - `GET /invoices/:id/activities` returns actor + timestamp + memo.
- If a filter used by the new UI is missing on the API, add it in `InvoiceService.cs` + `InvoicesController.cs` and log the activity where appropriate.
- Re-verify soft-delete exclusion, tenant scoping, and cancelled-sale guard remain in place.

## 5. Verification

- Type-check the invoices module.
- Load `/dashboard/invoices` and `/dashboard/invoices/:id` in the preview (desktop + mobile viewports) with Playwright, screenshot both, and diff visually against `/dashboard/sales` and `/dashboard/offers` for header, stats, filter bar, table, cards, and detail tabs.
- Switch language to FR and screenshot again to confirm no missing translations.

## Technical notes

- Reuse: `TableLayout`, `SimplePaginationBar`, `CollapsibleSearch`, `TableRowActions`, `ExportModal`, `CreateActionButton`, `CompanyBadge`, `UserInline`, `getInitialViewMode`, `useCurrency`, `usePermissions`.
- Keep `useCustomerInvoicesList` / `customerInvoicesApi` as the data layer; only extend params if a new filter is added.
- Do not introduce Kanban view (explicit user requirement).
- No hardcoded Tailwind colors — use existing semantic tokens/badge variants already used by Sales/Offers status badges.
- Keep `InvoicePDFDocument` and `InvoiceDownloadPdfButton` unchanged in styling — already aligned to Sales/Offers PDFs.

## Out of scope

- Any change to invoice numbering, tax logic, or currency conversion.
- New backend tables. No schema migration is expected; if one becomes necessary for a missing filter, it will be flagged before writing.
