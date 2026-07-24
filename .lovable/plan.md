
# Plan Time & Expenses from Items — end-to-end across Offer → Sale → Service Order → Dispatch

## What exists today (verified in code)

- Item taxonomy on Offer & Sale is `article`/`material` vs `service` (no separate "expense" item type).
- Materials are pre-planned implicitly by the item itself: `SaleItem.quantity` for `article`/`material` becomes `ServiceOrderMaterial.EstimatedQuantity` at Sale → Service Order conversion.
- Time & Expenses are planned through the generic `PlannedLineEntry` entity (`kind = time | expense | material`), keyed by `parentType/parentId` ∈ `offer_item | sale_item | service_order_job`, with `originOfferItemId` preserved for lineage.
- `PlannedEntriesEditor` is already mounted in `EditOfferItemModal.tsx` and `EditSaleItemModal.tsx`.
- Copy pipeline already in place:
  - Offer → Sale conversion: `SaleService.CreateFromOfferAsync` (l.374–385) and `OfferService.ConvertToSale` (l.842) call `_plannedEntries.CopyAsync("offer_item", src.Id, "sale_item", dst.Id, …)`.
  - Offer re-sync to a live Sale: `OfferService` l.515 keeps sale items in step with offer edits.
  - Sale → Service Order conversion: `ServiceOrderService.CreateFromSaleAsync` l.627 calls `CopyAsync("sale_item", sid, "service_order_job", jobId, …)` — but guarded by `if (_plannedEntries != null)`.
- Dispatch actuals are already aggregated back against the job's plan: `PlannedLineEntryService` l.176–234 reads `DispatchJob`/`TimeEntries`/`DispatchExpenses`/`DispatchMaterials` and attributes them per job for plan-vs-actual and overrun badges.

So the primitives are in place; the request is to (a) make planning visible from the items tabs everywhere, (b) guarantee copy runs in every direction of the flow, and (c) surface the chain (offer plan visible on the sale, sale/offer plan visible on the service order, whole plan visible on dispatches).

## Design goals

1. Author planning once — from an Offer item, a Sale item, or (for direct SOs) a Service Order job.
2. Every conversion, re-sync, split, and re-generation copies the plan forward — idempotent, non-optional, logged on failure.
3. Every downstream screen shows both the local plan and its upstream origin (never lose the lineage).
4. Dispatches consume the plan and drive the overrun signal without any manual re-entry.

## Changes

### A. Item-level planning UI (frontend, both tabs)

`src/modules/offers/components/tabs/ItemsTab.tsx` and `src/modules/sales/components/tabs/ItemsTab.tsx`:

- Render `PlannedInlineList` under each item row with `parentType="offer_item" | "sale_item"` and `parentId={item.id}` — compact chips for planned time and planned expenses.
- Add a "Plan time / expense" row action that opens `PlanEditorDialog` directly (no full modal).
- For `service` items with an empty plan, offer a one-click "Use item duration" that seeds a `kind:'time'` entry from `SaleItem.duration` / `OfferItem.duration`.
- Add header `PlannedTotalsBadge`s (total planned minutes; total planned expenses per currency), sourced from a new lightweight summary endpoint (§ E).

### B. Lineage visible upward on Sale items

On a Sale item that came from an Offer item (`originOfferItemId` populated on its `PlannedLineEntry`s), show a small "from Offer" tag on each planned chip and a tooltip with the offer number + offer item title. Data is already carried by `PlannedLineEntry.originOfferItemId` — this is purely a render change in `PlannedInlineList` / `PlannedEntryCard`.

### C. Service Order overview shows the whole chain

`src/modules/field/service-orders/components/TimeExpensesTab.tsx` and `MaterialsTab.tsx`:

- Under each job, group planned entries by origin: "Planned on Offer / Planned on Sale / Planned on Service Order" using `originOfferItemId` + the copy trail. Any entry whose `parentType='service_order_job'` and has an `originOfferItemId` is a copied one; without it, it was authored directly on the job (direct-SO path).
- Add a top-of-tab summary: total planned time & expenses for the whole SO, and delta vs actuals — reuse `OverrunBadge`.

### D. Guarantee copy in every direction (backend, no schema change)

`Backend/Modules/Sales/Services/SaleService.cs`, `Backend/Modules/Offers/Services/OfferService.cs`, `Backend/Modules/ServiceOrders/Services/ServiceOrderService.cs`:

- Remove the silent `if (_plannedEntries != null)` guard in `ServiceOrderService.CreateFromSaleAsync` (l.610–627). Make `IPlannedLineEntryService` a required constructor dependency; if unavailable, throw at startup, not silently at runtime.
- Ensure `CopyAsync` runs in every one of these transitions (add where missing, keep idempotent):
  - Offer item created/edited → nothing (source of truth).
  - Offer → Sale conversion (`SaleService.CreateFromOfferAsync`) — already wired ✓
  - Offer edit re-syncs live Sale (`OfferService` l.498–522) — already wired ✓
  - Sale → Service Order conversion (`ServiceOrderService.CreateFromSaleAsync`) — un-guard ✓
  - Offer → Service Order (skip-sale) path (`ServiceOrderService` offer origin branch) — verify + add `CopyAsync("offer_item", oid, "service_order_job", jobId, …)` if missing.
  - Sale re-generation / item split — call `CopyAsync` for each new sale-item id from its source offer-item id.
  - Direct Service Order → shadow Sale (`EnsureShadowSaleAsync`) — copy `service_order_job → sale_item` so the shadow sale carries the plan for reporting.
- Add a `parent-conversion` audit log entry per copy so failures surface in the activity tab, not just server logs.

Dispatch side:
- No copy needed — dispatches already read the job's `PlannedLineEntry` set (via `DispatchJob → ServiceOrderJob`) and produce actuals. Confirmed in `PlannedLineEntryService` l.176–234.
- Add a read-only "Planned for this job" panel in `DispatchTimeExpensesTab.tsx` that lists the job's planned time/expenses (grouped by origin as in §C) alongside the technician's entry form, so dispatched technicians see the budget they're working against.

### E. One backend summary endpoint (avoids N calls from the items tab)

`Backend/Modules/Planning/Controllers/PlannedLineEntriesController.cs` + `Services/PlannedLineEntryService.cs`:

- `GET /api/planning/summary?parentType={offer|sale|service_order}&parentId={id}`
- Returns `{ totalMinutes, byKind, byCurrency: { EUR: 1200.00, … }, byChild: [{ childId, minutes, amount }] }` aggregated over all `offer_item` / `sale_item` / `service_order_job` children of that parent.
- Used by items-tab totals badges (§A) and the SO summary (§C).

## Verification checklist (must all pass before shipping)

For a fixture with plan set on an Offer item:

1. Plan appears on the Offer item row and in Offer totals.
2. Convert Offer → Sale: same plan visible on the Sale item, with "from Offer" origin tag.
3. Edit Offer item plan while the Sale is live: change reflected on the Sale within one refresh (existing re-sync path).
4. Convert Sale → Service Order: plan visible on the corresponding Service Order Job, grouped under "Planned on Offer".
5. Add an extra plan directly on the Sale item: appears on the SO job under "Planned on Sale".
6. Add an extra plan directly on the SO job: appears under "Planned on Service Order".
7. Create Dispatch from the SO: the Dispatch time/expense screen shows the job's planned budget; logging actuals surfaces the correct overrun badge on the SO Time & Expenses tab.
8. Direct SO path: plan authored on job → completed → shadow Sale carries the plan back onto its sale items.
9. Idempotency: re-running any conversion (retry, re-sync) does not duplicate planned entries (existing `CopyAsync` guarantee) — covered by a targeted backend test.
10. DI safety: booting the API without `IPlannedLineEntryService` fails fast at startup instead of silently dropping copies at runtime.

## Files touched

Frontend
- `src/modules/offers/components/tabs/ItemsTab.tsx`
- `src/modules/sales/components/tabs/ItemsTab.tsx`
- `src/modules/field/service-orders/components/TimeExpensesTab.tsx`
- `src/modules/field/service-orders/components/MaterialsTab.tsx`
- `src/modules/field/service-orders/components/JobsTable.tsx` (plan editor for direct-SO jobs)
- `src/modules/field/dispatches/components/DispatchTimeExpensesTab.tsx` (read-only planned panel)
- `src/shared/components/planning/PlannedInlineList.tsx` and `PlannedEntryCard.tsx` (origin tag rendering)
- `src/services/plannedEntriesService.ts` (new `summary` call)

Backend (no DB schema changes)
- `Backend/Modules/ServiceOrders/Services/ServiceOrderService.cs` — un-guard + offer-origin branch + shadow-sale reverse copy
- `Backend/Modules/Sales/Services/SaleService.cs` — ensure copy on re-generation / split paths
- `Backend/Modules/Offers/Services/OfferService.cs` — audit log around existing copy
- `Backend/Modules/Planning/Controllers/PlannedLineEntriesController.cs`
- `Backend/Modules/Planning/Services/PlannedLineEntryService.cs` — new `SummaryAsync`
- Backend tests covering the 10 checklist scenarios (xUnit under `Backend/Tests/Planning/`).

## Out of scope

- No new `expense` item type on Offer/Sale — expense planning already exists via `PlannedLineEntry`.
- No new DB tables. `PlannedLineEntry` covers all three kinds and all three parent types.
- No changes to how invoices are calculated from actuals (`ServiceOrderTimeEntry` / `ServiceOrderExpense` / `ServiceOrderMaterial` remain the actuals source).

## Flow diagram

```text
                ┌───────────────────────── PlannedLineEntry (kind: time|expense|material) ─────────────────────────┐
                │                                                                                                  │
Offer item ─▶ author here                                                                                          │
   │  Offer → Sale (SaleService / OfferService.ConvertToSale)  → CopyAsync(offer_item → sale_item)                 │
   ▼                                                                                                               │
Sale item  ─▶ inherits + can add its own                                                                           │
   │  Sale → Service Order (ServiceOrderService.CreateFromSaleAsync)  → CopyAsync(sale_item → service_order_job)   │
   │  Offer → Service Order (skip-sale)                              → CopyAsync(offer_item → service_order_job)   │
   ▼                                                                                                               │
Service Order Job ─▶ inherits + can add its own (direct-SO path authors here)                                      │
   │  Direct SO → shadow Sale (EnsureShadowSaleAsync)               → CopyAsync(service_order_job → sale_item)     │
   ▼                                                                                                               │
Dispatch (DispatchJob → job) ─▶ no copy; reads the job plan, writes actuals ──── aggregated back for overrun ──────┘
```
