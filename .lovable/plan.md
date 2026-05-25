## Goal

Right now the Purchases module ships **18 separate pages** (Dashboard, Orders list/detail/create, Receipts list/detail/create/edit, Invoices list/detail/create, Compliance, Audit Log, Reports + 3 report drill-downs). Pages like Compliance feel empty because they hold one strip of KPIs. Goal: keep every feature, but make the module feel like **one dense, tabbed cockpit** instead of a maze of half-empty screens.

## New architecture (3 pages, hybrid drill-down)

```text
/purchases                     -> Cockpit (default tab: Overview)
   tabs: Overview | Orders | Receipts | Invoices | Insights
/purchases/orders/:id          -> full detail route (kept, for share links + PDF)
/purchases/orders/add          -> full create route (kept, large form)
/purchases/receipts/:id        -> kept
/purchases/receipts/:id/edit   -> kept
/purchases/receipts/add        -> kept
/purchases/invoices/:id        -> kept
/purchases/invoices/add        -> kept
```

Everything else (Compliance, Audit Log, Reports, Supplier Performance, Price Evolution, Invoice Aging, Dashboard KPIs) becomes a **tab or sub-section inside `/purchases`**. No separate routes.

### Cockpit tabs

1. **Overview** — KPI strip (POs, Receipts pending, Invoices outstanding, Spend YTD) + Monthly Spending chart + Recent Activity feed (last 10 from audit log) + small Compliance strip (RS, Facture en Ligne, TEJ counters as compact pill row, not big cards).
2. **Orders** — current list with filters, status badges, bulk actions. Row click → side drawer (quick view: header, items, totals, status timeline, "Open full page" link → `/purchases/orders/:id`). "New" button → `/purchases/orders/add`.
3. **Receipts** — same pattern (list + drawer + full route for create/edit).
4. **Invoices** — same pattern + RS toggle visible in drawer.
5. **Insights** — sub-tabs: Reports | Supplier Performance | Price Evolution | Invoice Aging | Audit Log | Compliance details. One scrollable page, segmented sub-tabs at top, each section is dense (table + chart side-by-side where possible).

### Drill-down pattern (hybrid)

- **Row click anywhere** → opens a right-side `Sheet` drawer with the full read-only detail + inline status actions (validate, send, cancel, mark paid…). Fast, no navigation.
- **"Open full page" button** in drawer → existing `/purchases/{entity}/:id` route (kept for PDF preview, deep editing, shareable URL, browser back).
- Create/edit forms stay as full routes (too big for a drawer).

### Visual density (4/5)

- Tighter table row padding (`py-2` instead of `py-4`), smaller font for secondary data, sticky table header, sticky tab bar.
- KPI strip = single row of compact cards, not large hero tiles.
- Compliance counters become pill badges inline, not standalone cards.
- Charts max-height ~240px so two fit side-by-side at lg+.

## Implementation steps

1. **New `PurchasesCockpit.tsx` page** — Tabs (shadcn) for Overview / Orders / Receipts / Invoices / Insights. URL-synced via `?tab=`.
2. **New `OverviewTab.tsx`** — extract KPI + chart + activity from `PurchaseDashboard` + condensed compliance pills from `ComplianceDashboardPage`.
3. **New `InsightsTab.tsx`** — sub-tabs hosting existing `PurchaseReportsPage`, `SupplierPerformancePage`, `PriceEvolutionPage`, `SupplierInvoiceAgingPage`, `PurchaseAuditLogPage`, and the rest of `ComplianceDashboardPage`. Refactor those pages to export a content-only component (no page header) the tab can render.
4. **Reuse existing list pages** for Orders/Receipts/Invoices tabs — extract their table into `*ListContent` components, strip the page chrome, host inside tabs.
5. **Add `EntityQuickViewDrawer.tsx`** — generic Sheet that takes `{type, id}` and renders compact detail with "Open full page" link. Wire row click in each list to open it.
6. **Update `PurchasesModule.tsx` routes**:
   - `/purchases` → `PurchasesCockpit`
   - Keep `/orders/add`, `/orders/:id`, `/receipts/add`, `/receipts/:id`, `/receipts/:id/edit`, `/invoices/add`, `/invoices/:id`
   - **Remove** standalone routes: `/orders`, `/receipts`, `/invoices`, `/compliance`, `/audit-log`, `/reports`, `/reports/*` → all redirect to `/purchases?tab=…`
7. **Update sidebar links** (Purchase Orders / Goods Receipts / Supplier Invoices / Compliance) to point to `/purchases?tab=orders` etc., so the existing nav still works.
8. Keep `PurchaseDashboard.tsx`, `ComplianceDashboardPage.tsx`, list pages, etc. as thin wrappers around their extracted content components (in case anything else imports them).

## What stays identical

- All services, types, mutations, PDF generation, permissions, plugin gate.
- All create/edit forms (full pages, unchanged).
- All deep-link detail routes for sharing/PDF.
- Every feature currently shipped — just rearranged.

## Out of scope

- Backend changes.
- New features or status flows.
- Visual redesign of forms/PDFs.
