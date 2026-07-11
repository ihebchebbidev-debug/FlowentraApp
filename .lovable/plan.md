## Goal

Remove the standalone "Plan vs Actual" statistics UI and the separate "Planned time & expenses" block on Service Orders and Dispatches. Instead, planned rows appear **inline** in the same Time / Expenses / Materials lists as actuals, visually tagged with a "Planned" badge and a different style. Users add planned rows via new **Plan Time / Plan Expense / Plan Materials** buttons that sit next to the existing "Add" buttons.

## Backend

1. **Extend `PlannedLineEntry`** (`Backend/Modules/Planning/Models/PlannedLineEntry.cs`) to support a third kind `material`:
   - New nullable fields: `ArticleId (int?)`, `ArticleName (string?, 200)`, `Quantity (decimal(18,3)?)`, `UnitPrice (decimal(18,2)?)`, `Unit (string?, 20)`.
   - Update `Kind` validation to accept `time | expense | material`.
2. **Migration** `Backend/Migrations/20260712_PlannedLineEntries_AddMaterial.sql` — `ALTER TABLE PlannedLineEntries ADD COLUMN ...` for the five new columns (nullable, safe on existing rows).
3. **DTOs** — extend `PlannedLineEntryDto` / `CreatePlannedLineEntryDto` with the same fields; service validates that `material` kind requires `ArticleId` (or `ArticleName`) and `Quantity > 0`.
4. **`PlannedLineEntryService`**:
   - `ValidateKind` — accept `material`, require quantity + (articleId or articleName).
   - `Map`/create/update — persist the new columns.
   - `GetPlanVsActualAsync` — planned material total feeds the existing `materials` expense bucket for backwards-compat totals.

## Frontend service

5. `src/services/plannedEntriesService.ts` — extend `PlannedEntryKind` to `'time' | 'expense' | 'material'`, add optional fields on `PlannedLineEntry` / `CreatePlannedLineEntry`, add `sumPlannedMaterials` helper (`quantity * unitPrice`).

## Shared inline UI

6. New reusable button `src/shared/components/planning/PlanEntryButton.tsx` that opens the existing planned-entry editor dialog scoped to one `kind` (`time | expense | material`). Extracts the dialog from `PlannedEntriesEditor` and adds a material form (article picker + quantity + unit price).
7. New helper `usePlannedEntriesForJobs(jobIds[])` in `src/shared/components/planning/usePlannedEntries.ts` — batches `plannedEntriesApi.list` calls for all jobs on a Service Order or Dispatch and returns a merged array with `parentId` preserved.

## Service Orders — `ServiceOrderDetail.tsx`

8. Delete the `PlanVsActualPanel` grid and the `PlannedEntriesEditor` per-job block on the `time_expenses` tab. Keep the tab, but only render `<TimeExpensesTab />` and `<MaterialsTab />` (already there).
9. Pass `jobIds` down to `TimeExpensesTab` and `MaterialsTab`.

## `TimeExpensesTab.tsx`

10. Load planned entries for all job ids via the new hook.
11. Merge planned `time` rows into the Time table and planned `expense` rows into the Expenses table as read-model rows with `source: 'planned'`. Style them with a muted background, a `Badge` labeled "Planned", and an inline edit/delete that calls `plannedEntriesApi.update/remove`.
12. Next to each existing "Add time entry" / "Add expense" button, add **Plan Time** and **Plan Expense** buttons using `PlanEntryButton`.

## `MaterialsTab.tsx`

13. Load planned entries and filter `kind === 'material'`. Merge them as inline rows in the materials list with the same "Planned" badge treatment.
14. Add a **Plan Material** button next to the existing "Add Material" button.

## Dispatches (mirror of the above)

15. Locate dispatch equivalents (`src/modules/field/dispatches/**`) — find the time/expense/material tabs on the dispatch detail. Apply steps 10–14 there, using the dispatch's own service-order-job id(s) as parent.
16. Remove any `PlanVsActualPanel` render inside dispatch pages (if present).

## Cleanup

17. Delete `PlanVsActualPanel.tsx` (no more callers).
18. Simplify `PlannedEntriesEditor.tsx` — keep the internals used by `PlanEntryButton` (dialog + form) but drop the outer stats/list wrapper. Or delete the file if fully replaced.
19. Keep `Offers / Sales` usages of `PlannedEntriesEditor` untouched (item modals) — they still need the compact editor for authoring plans on offer/sale lines. If we simplify the shared editor, keep a `variant="compact"` prop so those pages still work.

## Verification

- `tsgo` typecheck must pass.
- Manual: open a Service Order → Time & Expenses tab → confirm no stats panel; add a planned time via "Plan Time" → row appears inline with Planned badge; refresh page → still there. Repeat for expense and material. Repeat on Dispatch detail.
- Existing offer/sale item planning modals still open and save.

## Technical notes

- Merging read-model rows: planned rows use synthetic ids like `planned-{id}` so React keys don't collide with actuals.
- The existing dispatch-overrun gating logic that reads `PlannedLineEntry` totals continues to work unchanged (planned materials contribute to the `materials` bucket in `GetPlanVsActualAsync`).
- No data migration for existing rows — new columns are nullable; old `expense` rows with `expenseType='materials'` keep working.
