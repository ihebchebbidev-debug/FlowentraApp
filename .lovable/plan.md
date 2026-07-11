
# Plan a dispatch from inside the Service Order → Dispatches tab

Goal: let a user create/plan a dispatch (pick jobs, technicians, date, time) without leaving the service order, using the exact same backend validation and creation paths as the planning board.

## 1. UX flow

In `ServiceOrderDetail.tsx` → **Dispatches tab** (currently just `<DispatchesTable/>`):

- Add a primary button **"Plan Dispatch"** in the tab header (right-aligned, next to the table title).
- Clicking it opens a new modal **`PlanDispatchModal`** with four ordered steps in a single dialog (no wizard chrome — sections stacked, validated on submit):

  1. **Jobs** — checklist of the service order's non-completed, non-cancelled jobs (`mappedJobs`). Preselect all unscheduled ones. Show job title, installation badge, required skills, estimated duration. At least 1 job required.
  2. **Date & time** — date picker + start time + end time (or start + duration). Default: today, next full hour, +2h. Derive `estimatedDuration` from the sum of selected jobs when available.
  3. **Technicians** — multi-select of technicians. Two data sources fed in parallel:
     - `GET /api/planning/available-users?date=&startTime=&endTime=&requiredSkills=` → sorts available techs first, greys-out unavailable with reason (leave / overlap).
     - Full tech list fallback from `DispatcherService.getTechnicians()` for cases with no availability match.
     - Show a "Suggest" button that calls `rankTechniciansForJob` (already used by DispatchingInterface smart planning) for the first selected job.
  4. **Details** — priority (default `medium`), site address (prefilled from service order), optional notes, checkbox "Send notification to technicians" (existing behavior).

- Live validation panel at the bottom: on any change to jobs/date/time/techs, debounced call to `POST /api/planning/validate-assignment` (per job × per tech). Shows:
  - ✅ ok / ⚠️ soft warnings (overlap when `AllowOverlap`) / ❌ hard conflicts (leave, out of working hours).
  - Submit button disabled while any hard conflict exists.

- On submit → success toast, close modal, `handleRefresh()` on Dispatches tab to show the new row.

## 2. Which backend path to call

Mirror the planning-board decision tree (already documented in `DispatchingInterface.tsx:80-92`):

```text
selected jobs
   │
   ├─ 1 job  ────────────────► POST /api/dispatches/from-job        (createFromJobAsync)
   │
   ├─ N jobs, same InstallationId ──► POST /api/dispatches/from-installation
   │                                   (or AddJobsToInstallationDispatchAsync if a
   │                                    dispatch already exists that date + techs)
   │
   └─ N jobs, mixed / no installation ──► POST /api/dispatches/from-service-order
                                          (createFromServiceOrderAsync)
```

Read the global `JobConversionMode` app setting the same way `DispatchingInterface` does; it can force `service_order` mode even for installation-grouped jobs.

Reuse the existing frontend service methods in `src/modules/dispatcher/services/dispatch-operations.service.ts`:
- `assignJob` (1 job)
- `assignServiceOrderAsSingleDispatch` (N jobs, whole SO)
- `assignInstallationGroup` (N jobs, one installation)

No new API client code needed — just call these from the new modal.

## 3. New / changed files

**New**
- `src/modules/field/service-orders/components/PlanDispatchModal.tsx` — the modal described above. Local state for jobs/date/time/techs/details, debounced validation, submit dispatcher.
- `src/modules/field/service-orders/components/PlanDispatchModal.utils.ts` — small helper to pick the right creation path from `{ jobs, jobConversionMode }`.

**Changed**
- `src/modules/field/service-orders/pages/ServiceOrderDetail.tsx` — add "Plan Dispatch" button in the Dispatches `TabsContent`, wire state to open modal, pass `serviceOrder`, `mappedJobs`, refresh callback.
- `src/modules/field/service-orders/components/DispatchesTable.tsx` — optional: expose an `onPlanDispatch` prop so the button can live inside the table header instead of above the card (nicer alignment). If we skip this, button sits above the card.
- `src/modules/field/service-orders/locale/en.json` + `fr.json` — add keys: `dispatches.planDispatch`, `.selectJobs`, `.scheduleDate`, `.startTime`, `.endTime`, `.assignTechnicians`, `.suggestBest`, `.priority`, `.notifyTechnicians`, `.conflictLeave`, `.conflictOverlap`, `.noAvailableTechs`, `.planSuccess`.

**Untouched but reused**
- `dispatch-operations.service.ts` (assignJob / assignServiceOrderAsSingleDispatch / assignInstallationGroup)
- Planning API endpoints (`/available-users`, `/validate-assignment`) — same ones the board already consumes.
- `rankTechniciansForJob` from `src/modules/dispatcher/utils/planningAssist.ts` for the "Suggest" button.

## 4. State & data flow

```text
ServiceOrderDetail
  ├─ dispatches (existing state)
  ├─ mappedJobs (existing state)
  └─ [new] planModalOpen
      │
      ▼
PlanDispatchModal (props: serviceOrder, jobs, onClose, onCreated)
  ├─ local: selectedJobIds, date, startTime, endTime, technicianIds,
  │         priority, notes, notify, conversionMode
  ├─ query: availableUsers (react-query, key includes date+time+skills)
  ├─ query: validation (debounced 400ms; key includes jobs+techs+date+time)
  └─ submit → pickCreationPath() → dispatch-operations.service call
              → onCreated() → parent fetchRelatedData() → toast → close
```

## 5. Edge cases to cover

- Service order has zero eligible jobs → button disabled with tooltip "All jobs already dispatched or cancelled".
- Jobs from different installations selected → auto-fall back to `from-service-order` even if `JobConversionMode = installation`, and show an info line.
- End time ≤ start time → inline field error, submit blocked.
- Selected tech is on approved leave → hard conflict, submit blocked; message names the leave dates.
- Overlap with an existing dispatch → soft conflict; show an "Allow overlap" checkbox that mirrors the `AllowOverlap` flag sent to `/validate-assignment` and the create call.
- Offline (`useOffline`) → show read-only state with "Reconnect to plan a dispatch".
- Successful create where backend merged into an existing installation dispatch → detect via response (`dispatchId` matches an existing row) and show "Added to existing installation dispatch #NNN" instead of "Created".

## 6. Out of scope (say so up-front)

- No changes to backend endpoints — everything already exists.
- No drag-and-drop from this modal; that stays on the planning board.
- No changes to the Dispatches tab table columns beyond adding the header button.
- No changes to `JobConversionMode` semantics.

## 7. Verification

- `tsgo` clean.
- Manual: on a service order with 2+ unscheduled jobs, open Dispatches tab → Plan Dispatch → pick 1 job, 1 tech, today 14:00–16:00 → confirm a dispatch row appears and matches on `/dashboard/field/dispatcher` calendar.
- Manual: pick 2 jobs same installation → confirm a single dispatch is created (or existing one appended to).
- Manual: pick a tech on leave that date → hard conflict visible, submit disabled.

## Technical notes

- Reuse `Dialog` + `Form` shadcn primitives already used elsewhere in `service-orders/components`.
- Debounce with `useDebounce` hook already in `src/hooks/useDebounce.ts`.
- Prefill `siteAddress` from `serviceOrder.siteAddress` (or fallback to contact address).
- Send `serviceOrderId` on every creation call so the resulting dispatch is auto-linked to this SO and appears in the tab after refresh (`DispatchesTable` filters by SO id already).
- All strings via `t()`; no hardcoded English.
