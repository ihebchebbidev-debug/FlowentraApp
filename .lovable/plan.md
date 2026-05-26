# Fix the remaining flow issues

Three changes, shipped in this order so we can verify each before the next.

## 1. Require a company before the user lands on anything else

Right now the app boots in **"All companies"** view, every "Add" button is disabled with a tooltip, and the Service Orders / Offers / Sales lists silently filter to zero rows. We will make company selection a hard gate.

- On login, if the user belongs to more than one company **and** has not picked one yet, redirect to a new `/select-company` screen (cards: company name, role, last accessed). No sidebar, no dashboard until a pick is made.
- Selection is persisted (the existing `targetTenantId` storage) and restored on next visit, so returning users skip the screen.
- A new "Switch company" button in the top bar opens the same picker as a modal — replaces today's "All companies" dropdown for non-admins.
- Admins keep the "All companies" toggle (they need it to audit), but it now requires an explicit click — it is no longer the boot default.
- Every "Add Offer / Add Sale / Add Service Order" button drops its disabled+tooltip pattern, because a company is always selected.

## 2. Sales routes work on direct load

`/sales` and `/sales/:id` currently 404 on refresh because the Sales module is mounted only inside the dashboard shell.

- Re-export the Sales routes at the top level alongside Offers and Service Orders so `BrowserRouter` resolves them on a cold load.
- Keep the sidebar entry pointing at the same path — no UX change for users who navigate from the menu.

## 3. Planned Times & Expenses editor on Offer + Sale items

The `PlannedLineEntries` backend and `plannedEntriesService` frontend already exist, but the item modal never lets a user author them, so the dispatcher's overrun guard and the plan-vs-actual report have nothing to compare against.

Add a collapsible **"Planning"** section to the existing Offer item modal (and the matching Sale item modal):

- **Time** rows: planned minutes, technician count, hourly rate, optional note.
- **Expense** rows: type (travel / per-diem / materials / subcontractor), planned amount, currency, optional note.
- "Add time" / "Add expense" buttons, inline delete.
- On save, call `plannedEntriesService` with `parentType=offer_item` (or `sale_item`) and the item id; the backend's existing `CopyAsync` propagates them through sale → service_order_job, preserving `OriginOfferItemId`.
- On edit, list existing rows from `GetForParentAsync` so the user sees what was authored before.

## Technical notes

- `targetTenant.ts` already exposes `setTargetTenantId / clearTargetTenant / isViewAllMode`. The gate is implemented in a top-level `<RequireCompany>` wrapper around the dashboard routes, reading `getSelectedTargetTenantId()`.
- Sales routes: move the `<Route path="sales/*">` block out of `DashboardContent` and into the top-level router alongside `OffersModule`, while keeping it inside the same authenticated layout.
- Planned editor: new component `PlannedEntriesEditor.tsx` reused by both `OfferItemModal` and `SaleItemModal`. No new API endpoints needed.
- No schema migrations.

## Verification

After each step:
1. Log in as `testadmin@gmail.com`, confirm the company picker appears, pick "Company A", land on dashboard with company pinned.
2. Hit `/dashboard/sales/9` directly in the URL bar — page loads.
3. Open an offer item, add 60 min × 2 techs @ 80 TND/h plus a 50 TND travel expense, save, reopen, values persist; convert offer → sale, open sale item, values are copied.
