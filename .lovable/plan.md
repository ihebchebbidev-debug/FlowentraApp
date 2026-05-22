
## Goal

Let the user who creates an **offer** or **sale** plan, per **service-type** article line:
- **Planned hours** (one or many — e.g. 2 technicians × 4h)
- **Planned expenses** (travel, per diem, materials, subcontractor)

These planned values must be **persisted on the line**, **copied on every conversion** (offer → sale → service order → job → dispatch), and used at execution time as a **soft budget**: technicians can still log actuals, but the UI **warns on overrun** (planned vs actual badge + reason note required when exceeded).

Defaults are **manual** — no auto-fill from the Article master. Only article lines whose article `type = service` show the planning UI.

---

## Backend changes

### 1. New table — `planned_line_entries`

One row per planned time block or expense, attached to a parent line. The parent type changes as the document is converted, but the **`origin_offer_item_id`** stays the same so we can trace lineage end-to-end.

```text
planned_line_entries
├─ id (pk)
├─ tenant_id
├─ parent_type           enum: offer_item | sale_item | service_order_job
├─ parent_id             int (fk depending on parent_type)
├─ origin_offer_item_id  int? (lineage anchor, copied on every conversion)
├─ kind                  enum: time | expense
│
│  -- time fields
├─ planned_minutes       int?
├─ technician_count      int? (default 1)
├─ hourly_rate           decimal?
│
│  -- expense fields
├─ expense_type          enum: travel | per_diem | materials | subcontractor
├─ planned_amount        decimal?
├─ currency              varchar(3)?
│
├─ description           varchar(500)?
├─ created_at / created_by / modified_at / modified_by
```

Indexes: `(tenant_id, parent_type, parent_id)`, `(tenant_id, origin_offer_item_id)`.

### 2. Conversion copy logic

- **OfferService.ConvertToSale** → for each new `sale_item`, copy all `planned_line_entries` where `parent_type=offer_item AND parent_id=<src>`, rewriting `parent_type=sale_item, parent_id=<new>`, keeping `origin_offer_item_id`.
- **SaleService.CreateServiceOrder** → same copy, target `parent_type=service_order_job` on the job spawned from that sale line.
- Reverse edits after conversion are blocked on the source document (already the case for converted offers/sales).

### 3. Dispatch execution — soft cap with warnings

`DispatchService.AddTimeEntryAsync` / `AddExpenseAsync`:
- Sum existing actuals (TimeEntries / Expenses) for the parent `service_order_job` grouped by kind/expense_type.
- Compare against summed `planned_line_entries` for that job.
- If `actual + new > planned`, accept the entry but:
  - set a new column `overrun_flag = true`
  - require `overrun_reason` (non-empty) — return `400` if missing
- Expose `GET /api/service-orders/{id}/jobs/{jobId}/plan-vs-actual` returning per-line planned vs actual rollup.

### 4. DTOs / endpoints

- `POST/PUT/DELETE /api/offers/{id}/items/{itemId}/planned-entries`
- `POST/PUT/DELETE /api/sales/{id}/items/{itemId}/planned-entries`
- `GET /api/service-orders/{id}/jobs/{jobId}/planned-entries`
- Include `plannedEntries[]` inline in existing OfferItemDto / SaleItemDto / ServiceOrderJobDto responses.

### 5. Validation

- Planning UI/endpoints reject lines where `article.type != 'service'` for `kind=time`.
- Expenses allowed on any service line.

---

## Frontend changes

### Offer & Sale editor (line drawer)

For each line where `article.type === 'service'`, add a **"Plan time & expenses"** section:

```text
┌─ Line: Installation (service) ────────────────┐
│  Planned time                       [+ Add]   │
│   • 2 techs × 4h00 — Installation crew   ✏ 🗑 │
│   • 1 tech × 1h30 — Commissioning        ✏ 🗑 │
│                                               │
│  Planned expenses                   [+ Add]   │
│   • Travel        120.00 €               ✏ 🗑 │
│   • Per diem       45.00 € × 2 techs     ✏ 🗑 │
│                                               │
│  Planned totals: 9h30 · 210.00 €              │
└───────────────────────────────────────────────┘
```

- Modal forms for add/edit.
- Header of the offer/sale shows **rolled-up planned totals** (hours + cost) next to the financial totals.
- Read-only display when the document is converted/locked.

### Service Order detail → Job tab

- New **"Plan vs Actual"** panel per job: planned hours / actual hours, planned expenses / actual expenses, color bar (green < 80%, amber 80–100%, red > 100%).
- Lineage chip: "Planned on Offer OF-… line #3".

### Dispatch — time & expense modal (technician)

- Show remaining budget (e.g. *"Planned: 8h00 · Logged: 6h30 · Remaining: 1h30"*).
- If submission would exceed plan: inline amber warning, **"Reason for overrun"** textarea becomes required, submit button label changes to *"Log with overrun"*.
- After save, entry shows an "Over plan" badge in the list.

### Files touched (high level)

- `Backend/Modules/Planning/` (new): `PlannedLineEntry` model, `IPlannedLineEntryService`, `PlannedLineEntriesController`, EF config + migration.
- `Backend/Modules/Offers/Services/OfferService.cs` — copy on convert; include in DTO.
- `Backend/Modules/Sales/Services/SaleService.cs` — copy on convert; include in DTO.
- `Backend/Modules/ServiceOrders/Services/ServiceOrderService.cs` — copy on create-from-sale; plan-vs-actual endpoint.
- `Backend/Modules/Dispatches/Services/DispatchService.cs` — overrun check on `AddTimeEntryAsync` / `AddExpenseAsync`; new `OverrunFlag`/`OverrunReason` columns on `TimeEntries`/`Expenses`.
- `src/modules/offers/components/OfferLinePlannedEntries.tsx` (new) + integrate in line drawer.
- `src/modules/sales/components/SaleLinePlannedEntries.tsx` (new) + integrate.
- `src/modules/service-orders/components/JobPlanVsActualPanel.tsx` (new).
- `src/modules/dispatcher/components/TimeEntryModal.tsx` & `ExpenseModal.tsx` — overrun warning + reason field.
- Shared service: `src/services/plannedEntriesService.ts`.

---

## Migration / rollout

1. EF migration: create `planned_line_entries`; add `overrun_flag`, `overrun_reason` to `TimeEntries` and `Expenses`.
2. Existing offers/sales/SOs: no backfill — empty plans behave as "unbounded", so warnings only trigger when a plan exists.
3. Ship backend + frontend together behind no flag (additive, non-breaking).

---

## Open follow-ups (not in this plan, can be next iterations)

- Aggregate planned vs actual at the **Sale** and **Service Order** level for dashboards.
- Approval workflow for hard caps (current choice is soft warn).
- Per-technician planned allocation inside a time block.
