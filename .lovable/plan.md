# Rename Sales → Orders (i18n + UI)

## 1. Translated sidebar submenu label

Add a shared i18n key used by the workspace sidebar module labels.

- Add to `src/shared/locale/en.json` and `src/shared/locale/fr.json`:
  - `workspace.modules.orders` → `"Orders"` / `"Commandes"`
  - `workspace.modules.ordersDashboard` → `"Orders dashboard"` / `"Tableau de bord commandes"`
- In `src/modules/dashboard/components/workspaces.config.ts`, add an optional `labelI18nKey?: string` to `SidebarModuleItemProps` (and workspace-level equivalent for consistency) and set it on the sales submenu items:
  - `{ key: "sales-dash", labelI18nKey: "workspace.modules.ordersDashboard", label: "Orders dashboard", ... }`
  - `{ key: "sales", labelI18nKey: "workspace.modules.orders", label: "Orders", ... }`
- In `src/modules/dashboard/components/WorkspaceSidebar.tsx` and `MobileWorkspaceNav.tsx`, resolve the rendered label via `t(m.labelI18nKey, { defaultValue: m.label })` using `useTranslation()`. The fallback keeps every other entry working unchanged.

## 2. Rename Sales → Orders in the Sales module UI

Scope: user-visible strings only in the Sales list, detail, edit, and status views. No route, table, plugin code, or backend rename.

Update `src/modules/sales/locale/en.json` and `fr.json` values (keys stay the same):

- `sales` → `Orders` / `Commandes`
- `sale` → `Order` / `Commande`
- `newSale` → `New Order` / `Nouvelle commande`
- `addSaleButton` → `Add Order` / `Ajouter commande`
- `viewSale`, `deleteSale`, `saleDetails`, `salesManagement`, `manageSalesAndOffers`
- `allSales`, `activeSales`, `inProgressSales`, `closedSales`, `wonSales`, `lostSales`
- `editSale.pageTitle`, `editSale.pageDescription`, `editSale.saleInformation`, `editSale.successUpdated`, `editSale.errorUpdating`, `editSale.loadingSale`
- `deleteConfirmTitle`, `deleteConfirmDescription`, `deleteSuccess`, `deleteError`

Every occurrence of the words "Sale/Sales/Vente/Facture" in these values becomes "Order/Orders/Commande/Commandes". Placeholders (`{{title}}`) preserved.

Also sweep hard-coded English "Sales"/"Sale" text in the Sales module components that render titles/labels/toasts (list header, detail header, kanban column titles, breadcrumbs, buttons) and route them through the existing `t()` keys above. Files in scope:

- `src/modules/sales/pages/AddSale.tsx`, `EditSale.tsx`, `SaleReportPage.tsx`
- `src/modules/sales/components/SalesList.tsx`, `SaleDetail.tsx`, `SalesKanbanView.tsx`, `SaleStatusFlow.tsx`, `SendSaleModal.tsx`, `ConvertToServiceOrderDialog.tsx`
- `src/modules/sales/components/tabs/*`

No changes to identifiers, permissions, routes (`/dashboard/sales`), plugin code (`PL0002SALES`), DB tables, or the module folder name — only display strings.

## 3. Out of scope

- Other workspaces (Purchases, Field, etc.) keep their existing labels.
- Reporting page label at `workspaces.config.ts` line 129 (`Sales` under reporting) stays as-is unless you want it renamed too — flag on approval.
- The word "sale" appearing in unrelated descriptive copy (e.g. "sale orders" in company settings) is left alone to avoid meaning drift.

## Technical notes

- The sidebar today renders `m.label` literally; adding `labelI18nKey` with a `t()` fallback keeps every other module entry rendering untouched and lets us drive translation only where we opt in.
- Locale value edits do not require code changes because the sales UI already reads through `t('sales:...')`. For components still using literal English strings, we replace them with the existing keys.
- Build check: `bun run build` after edits; smoke-check the Sales list, detail page, and sidebar in EN and FR via the preview.
