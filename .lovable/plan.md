
## Goal

Fix the awkward "in-between" viewport range (roughly 640–1024px) where the desktop layout is cramped but mobile hasn't kicked in yet, and — as the customer requested — remove the table view entirely on mobile across every module so only the list/card version remains.

## Problem today

- `MOBILE_BREAKPOINT = 768` in `use-mobile.tsx`, `useLayoutMode.ts`, and `getInitialViewMode.ts`. Between 768–1100px the sidebar, headers and tables render at desktop widths but with almost no room, producing horizontal scroll and cramped controls.
- `getInitialViewMode` only forces `list` on the **initial** render. If the user opens the module on desktop in `table` view and then resizes/DevTools down, the table stays and looks broken.
- Every list toolbar (Contacts, Offers, Sales, Deals, Service Orders, Dispatches, Installations, Inventory, Articles, Purchase Orders, Supplier Invoices, Goods Receipts, Field Clients, Field Inventory, Lookups, Inventory-Services) still renders the "Table" toggle button on mobile.

## Changes

### 1. Unify and raise the mobile breakpoint

- New single source of truth: `src/hooks/getInitialViewMode.ts` already exports `MOBILE_BREAKPOINT`. Bump to `1024` and export it.
- Update `src/hooks/use-mobile.tsx` and `src/hooks/useLayoutMode.ts` to import that constant instead of hard-coding `768`. Result: sidebar collapses, mobile layout kicks in, and list-only enforcement all switch together at ≤1023px.

### 2. Reactive "force list on mobile" hook

Add `useEnforceListOnMobile(viewMode, setViewMode, allowed)` in `getInitialViewMode.ts`:

- Subscribes to the same `(max-width: 1023px)` media query.
- When the viewport becomes mobile AND `viewMode !== 'list'` AND `'list'` is in `allowed`, call `setViewMode('list')`.
- Also exports `useIsListForcedMobile()` returning a boolean so toolbars can hide the table/grid/kanban toggle buttons.

### 3. Wire the hook into every list module

For each file below: call `useEnforceListOnMobile(viewMode, setViewMode, allowed)` right after the `useState`, and wrap the non-list toggle buttons in `{!isListForcedMobile && (...)}`:

- `src/modules/contacts/components/ContactsList.tsx`
- `src/modules/offers/components/OffersList.tsx`
- `src/modules/sales/hooks/useSalesList.ts` + `src/modules/sales/components/SalesList.tsx`
- `src/modules/deals/components/DealsList.tsx`
- `src/modules/field/service-orders/pages/ServiceOrdersList.tsx`
- `src/modules/field/dispatches/...` list page
- `src/modules/field/installations/pages/InstallationsList.tsx`
- `src/modules/field/FieldCustomers/components/ClientsList.tsx`
- `src/modules/field/InventoryField/components/InventoryList.tsx`
- `src/modules/inventory-services/components/InventoryServicesList.tsx`
- `src/modules/inventory-services/components/ArticlesList.tsx`
- `src/modules/articles/hooks/useArticlesList.ts`
- `src/modules/purchases/pages/PurchaseOrderListPage.tsx`
- `src/modules/purchases/pages/SupplierInvoiceListPage.tsx`
- `src/modules/purchases/pages/GoodsReceiptListPage.tsx`
- `src/modules/lookups/hooks/useLookupsModule.ts`
- `src/modules/tasks/components/ProjectManager.tsx` (kanban/grid/list — force list on mobile, hide kanban/grid buttons)

### 4. No visual redesign on desktop

Only the breakpoint and the mobile toggle visibility change. Desktop table views, filters, and page layouts are untouched at ≥1024px.

## Verification

- Typecheck.
- Playwright: capture Contacts, Offers, Sales, Purchase Orders at 1280, 1000, 800, 500px. Confirm ≤1023px auto-switches to list, table toggle button is hidden, and the sidebar / topbar collapses cleanly with no horizontal scroll.
- Manually resize DevTools from 1400 → 400px and confirm no in-between broken state.

## Non-goals

- No changes to the list/card row markup itself.
- No changes to detail pages (already migrated to underline tabs).
- No changes to modal/dialog tab groups.
