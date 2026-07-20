
## Goal

Unify the six main list pages (Offers, Sales, Service Orders, Dispatches, Installations, Contacts) so the **table view** in all of them is rendered by the same `TableLayout` engine at `src/components/shared/TableLayout.tsx`. Sales and Contacts already use it; this plan migrates the four holdouts.

Scope is limited to the **table (list) view** of each page. Kanban / Map / Card views remain untouched, as do filters, headers, toolbars, exports, and business logic. Only the raw `<Table>` JSX blocks are replaced.

## Files migrated

1. `src/modules/field/service-orders/pages/ServiceOrdersList.tsx` — replace both embedded tables (700px and 900px variants) with a single `TableLayout` call, aligned to the same width as the other lists.
2. `src/modules/offers/components/OffersList.tsx` — replace hand-rolled table with `TableLayout`.
3. `src/modules/field/installations/pages/InstallationsList.tsx` — same.
4. `src/modules/field/dispatches/pages/DispatchesList.tsx` — same.

Sales and Contacts serve as reference implementations; they are not modified.

## What each migration does

For each file:

- Convert the existing header cells and row cells into a `Column<T>[]` array passed to `TableLayout`.
- Move bulk-selection state (`selectedIds`, select-all, per-row checkbox) off the local hand-rolled implementation and onto `TableLayout`'s `enableSelection` / `selectedIds` / `onSelectionChange` / `bulkActions` props. This removes the divergent aria-label strings that caused the earlier translation bug.
- Keep the existing row-click navigation via `onRowClick`.
- Preserve existing cell renderers (badges, status chevrons, avatars, actions menu) — they just move into `column.render`.
- Preserve empty-state copy via `emptyTitle` / `emptyDescription` / `emptyIcon`.
- Preserve pagination by using `TableLayout`'s `enablePagination` where the page already paginates client-side; server-paginated pages keep their existing controls below.

## Service Orders extra step

`ServiceOrdersList.tsx` currently renders **two** tables on the same page with different `min-w` values. Both are collapsed into a single `TableLayout` instance driven by the same column config, so widths align with the other five lists.

Its local `ExportModal` import is swapped for the shared `src/components/shared/ExportModal.tsx` used by the other modules, matching the pattern in Sales/Contacts.

## Out of scope

- Kanban, Map, and Card views.
- Filter UI, search bar, and export/report modals other than the Service Orders ExportModal swap.
- Backend queries, RLS, and column data.
- Sales and Contacts list files (already aligned).
- The chevron StatusFlowStepper (already unified in a previous turn).

## Technical notes

- `TableLayout` is generic (`TableLayout<T>`), so each page types its columns to its row shape (e.g. `Column<ServiceOrderRow>[]`).
- Column definitions are memoized with `useMemo` and dependencies on the translation function and any per-row callbacks, matching the Sales/Contacts pattern.
- Bulk action bar content (existing buttons: assign, export selected, delete, etc.) is passed as `bulkActions` JSX and rendered by `TableLayout` when `selectedIds.size > 0`.
- Translation keys already added under `bulk.selectAll` / `bulk.selectItem` in each module's locale are re-used; `TableLayout`'s built-in `aria-label`s are left as the shared strings ("Select all" / "Select row") to match how Sales/Contacts consume them today.

## Verification

- Build passes (auto).
- Manually spot-check each of the four list pages in preview: rows render, row-click navigates, checkbox select-all works, bulk bar appears with selection count, empty state renders when filters return nothing, pagination advances.
- Confirm the four migrated tables visually match Sales/Contacts (same header background, row hover, min-width, resize handles).
