## Goal

Let a service order (and the dispatches created from it) carry a set of **preferred skills**. The list is editable, propagates from the service article on the line, drives a **filter by skills** on the service orders list, and appears as an **information card** on the service order overview page.

## What already exists (reuse)

- `Skills` catalog table + `UserSkills` join (technicians know their skills).
- `Article.SkillsRequired` on service articles (JSON string[] of skill names).
- `ServiceOrderJob.RequiredSkills` (string[]) — already auto-copied from the article when the job is generated.
- `Dispatch.RequiredSkills` column exists but nothing writes it (dead column today).

Missing: a skills field on the **ServiceOrder itself**, propagation into **Dispatch**, list-level **filter**, and the **overview card**.

## Plan

### 1. Schema (migration)

- Add `PreferredSkills TEXT[]` column to `ServiceOrders` (Postgres text array, nullable, default empty), in a new `Backend/Neon/37_service_order_preferred_skills.sql` migration.
- No new tables — skills stay as name strings for consistency with the existing model (`Article.SkillsRequired`, `ServiceOrderJob.RequiredSkills`, `Dispatch.RequiredSkills`).

### 2. Backend

- `ServiceOrder` model: add `PreferredSkills : string[]?`.
- `ServiceOrderDto` (create/update/response): add `PreferredSkills`.
- `ServiceOrderService.CreateAsync`: after computing `articleSkillsById`, seed `ServiceOrder.PreferredSkills` = union of all line-item article skills (dedup, case-insensitive). Users can still override on update.
- `ServiceOrderService.UpdateAsync`: persist `PreferredSkills` from DTO.
- **Dispatch propagation**: in `DispatchService` / wherever a dispatch is created from a service order (or its job), set `Dispatch.RequiredSkills` = job's `RequiredSkills` ?? parent order's `PreferredSkills`. Closes the existing gap.
- `ServiceOrdersController` list endpoint: add `skills` query param (comma-separated). When present, filter with array overlap (`PreferredSkills && @skills`) — "any of" semantics. Also expose a `GET /api/service-orders/skills` (or reuse `SkillsController`) so the filter UI can populate.

### 3. Frontend — service order form

- In `CreateServiceOrder.tsx` and the edit path used from `ServiceOrderDetail.tsx`, add a "Preferred skills" multi-select (reuse the existing skills multi-select pattern from articles / planning profiles). Prefill with the union of the selected service articles' `SkillsRequired`; user can edit.
- Wire to the DTO field.

### 4. Frontend — list filter

- In `ServiceOrdersList.tsx`, add a "Skills" filter chip beside existing filters. Multi-select from the skills catalog; passes `skills=…` to the list API. "Any of" match.

### 5. Frontend — overview card

- On `ServiceOrderDetail.tsx` overview tab, add an information card titled **Preferred skills** (FR: **Compétences préférées**) that renders the skills as badges. Empty state: "No preferred skills set" / "Aucune compétence préférée".
- Small "Edit" affordance opens the same multi-select used in the form (or routes to edit mode) so users can adjust from the overview.

### 6. i18n

- Add EN/FR strings in `src/modules/field/service-orders/locale/{en,fr}.json`:
  - `preferredSkills.title`, `preferredSkills.empty`, `preferredSkills.edit`, `filter.skills.label`, `filter.skills.placeholder`.

### 7. Verification

- Build passes.
- Create a service order with two service articles that each have distinct skills → order's PreferredSkills = union.
- Edit and remove one → persists.
- Filter list by one skill → only matching orders shown.
- Overview shows the badges.
- Create a dispatch from the order → `Dispatch.RequiredSkills` populated.

## Technical notes

- Storage stays denormalized name-string arrays to match `Article.SkillsRequired`, `ServiceOrderJob.RequiredSkills`, `Dispatch.RequiredSkills`, and the dispatcher's existing name-based matcher (`DispatchingInterface.tsx`). Migrating to FK-based join tables would be a much larger refactor and is out of scope here.
- No server-side enforcement of "user must have skill" — matches current behavior (advisory filtering only).
- `RoleSkills` remains unused (out of scope).

## Out of scope

- Converting existing name-string arrays to FK-based `*_skills` join tables.
- Auto-assigning technicians by skill match.
- Adding skills to Offers/Sales (still a gap, but not part of this request).
