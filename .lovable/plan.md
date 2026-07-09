
## Goal

Match the customer spec (`Reporting_Module.docx`) and the visual reference (`reporting.html`) across the reporting module. Every dashboard becomes filter-bar + KPI grid + chart grid + detail table, with RAG dots, star-to-pin favorites, and an Export Reports tab. Works on desktop, tablet, and mobile.

## Scope

Frontend only. No backend changes in this pass — existing `/api/reporting/*` endpoints stay; missing data (HR, Purchase, expenses, invoice detail rows) renders empty-state cards instead of silently blank charts. Backend expansion can be a follow-up.

## Deliverables

1. **Design tokens** (`index.css` + `tailwind.config.ts`)
   - Add semantic RAG tokens: `--rag-green/yellow/red/orange`, `--chart-1..6`, `--surface-muted`.
   - No hardcoded hex in components (fixes current violations).

2. **Shared reporting primitives** in `src/modules/reporting/components/`
   - `ReportShell` — page header (icon + title + subtitle + actions: Filters / Export / Refresh).
   - `FilterBar` — period + entity filters + Clear/Apply (per-dashboard config).
   - `KpiCard` — icon, tag chip, value, label, trend row, RAG corner accent.
   - `ChartCard` — title, star button, body slot, empty/loading/error states.
   - `RagDot`, `RagBadge`, `ProgressRow`, `DataTable` (RAG row highlight + sticky header on mobile).
   - `EmptyState` for not-yet-implemented sections.

3. **Favorites store** — Zustand + localStorage. Star on any `ChartCard` pins its `{id, title, source}` for `MyDashboard` to render.

4. **Dashboards rebuilt to match the reference**
   - **Sales**: 4 KPIs, 3-across (Offers by Status / Orders by Status / Conversion Trend), Year Comparison (8-col) + Orders by Type progress list (4-col), Top Customers table with Conv% + status badges.
   - **Service**: 4 KPIs, Completion vs 90% target line (8) + WO by Status (4), 3-across (WO by Type / Year Comp / Dispatches by Tech), Consumed vs Planned Hours summary strip + chart, Technician Performance table with efficiency RAG badges.
   - **Finance**: 4 RAG KPIs, Invoice Status donut + Payment Collection vs Target + Expense Categories vs Budget + Cash Flow, Invoice detail table with row RAG highlighting.
   - **HR**: Headcount + Salary by Department (side-by-side bars), Performance donut + Hiring vs Turnover, Employee table (contract type, band, grade, tenure).
   - **Purchase**: Spend by Supplier (horizontal bar top 8), Spend by Category donut + Receipt Status donut, Articles by Supplier stacked bar, PO Spend trend, PO detail table with overdue row highlighting.

5. **New tabs**
   - **My Dashboard** (default route) — grid of starred widgets; empty state with jump buttons to each dashboard.
   - **Export Reports** — date range, format radios (XLSX/PDF/CSV), scope checkboxes, saved-export list. UI only in this pass; wires to a stub `exportApi.request(...)` (returns not-implemented toast) so the surface is real without backend work.

6. **Routing** — update `ReportingModule.tsx` to add `my` (default) and `export` routes; add reporting sub-nav entry pattern so all 7 tabs are reachable.

7. **Responsiveness**
   - Grid drops: 4→2→1 for KPIs, 3→1 for chart rows, 8/4 split → stacked on `<lg`.
   - Filter bar wraps and becomes a bottom-sheet trigger on `<md` (Sheet component).
   - Tables get horizontal scroll wrapper + sticky first column on `<md`.
   - Charts use `ResponsiveContainer` with min-height tuned per breakpoint.
   - Verified with Playwright at 375 / 768 / 1440 px.

8. **i18n** — extend `locales/en.json` + `fr.json` with all new labels (KPI names, filter labels, empty states, export UI).

## Technical notes

- Keep Recharts (already installed) — no ECharts swap. All colors via `hsl(var(--chart-N))`.
- No new deps except `zustand` (already in project — verify) for favorites.
- No changes to `useReporting.ts` hooks or `reportingApi.ts` shapes; new UI degrades gracefully when arrays are empty (all HR/Purchase cards will show `EmptyState` until backend is filled in — noted in the module for later work).
- Currency: use `Intl.NumberFormat` with tenant currency from `PreferencesProvider` instead of hardcoded USD.
- Backend gaps to schedule next (not in this pass): populate HR + Purchase endpoints, add `ExpensesByCategory` + `InvoiceTable` to Finance, fix YoY month-gap bug, fix `Take(5)` ordering, add date-range/filter params.

## File map

```text
src/modules/reporting/
  components/
    ReportShell.tsx
    FilterBar.tsx
    KpiCard.tsx
    ChartCard.tsx
    DataTable.tsx
    RagDot.tsx  RagBadge.tsx  ProgressRow.tsx  EmptyState.tsx
  store/
    useFavoritesStore.ts
  pages/
    MyDashboard.tsx        (new)
    SalesDashboard.tsx     (rewrite)
    ServiceDashboard.tsx   (rewrite)
    FinanceDashboard.tsx   (rewrite)
    HrDashboard.tsx        (rewrite)
    PurchaseDashboard.tsx  (rewrite)
    ExportReports.tsx      (new)
  ReportingModule.tsx      (add my + export routes)
  locales/en.json, fr.json (extend)
src/index.css              (add RAG + chart tokens)
tailwind.config.ts         (map tokens)
```

## Out of scope for this pass

- Real export generation (PDF/XLSX/CSV) — UI only.
- Backend endpoint expansion.
- Server-side filters actually filtering the API — filter bar is wired to local state + query params, ready for backend params later.
