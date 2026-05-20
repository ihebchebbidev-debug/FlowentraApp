## Goal

Replace the current **Manage Planning** button (which navigates away to a schedule editor) with a **modal** that manages reusable *Planning Profiles*. A profile bundles every "how do I want my planning board to look and behave" setting (visible users, SO vs Installations mode, weekends, which dispatches to show, scheduling permissions, etc.). One profile is active per user; profiles can be **personal** or **shared** (tenant-wide, admin-published).

Working-hours / leave editing is *kept* but moved to its own entry point (it's a different concern — it edits the technician, not the viewer's preferences).

---

## Decisions locked in from Q&A

- **Scope**: Personal + shared (admin-published) profiles.
- **Default**: One active profile per user (no quick-switcher in header — switching happens inside the modal).
- **Visible users**: Explicit user list (multi-select).
- **Extras**: I'll add sensible "plus" toggles beyond what you listed (see Settings section).

---

## UX

### Entry point
- The **Manage Planning** button in `CalendarHeader.tsx` opens `<PlanningProfilesModal/>` instead of navigating.
- A secondary link inside the modal — "Edit technician working hours & leave" — preserves access to the old `SchedulerManager` page for admins.

### Modal structure
- Left rail: list of profiles (sectioned **My profiles** / **Shared profiles**), `+ New profile` button, badge showing active one.
- Right pane: tabs **General**, **Visible users**, **Display**, **Permissions**.
- Footer: `Set as active`, `Save`, `Duplicate`, `Delete`, `Share with team` (admin only).

### Settings inside a profile

**General**
- Profile name (editable inline)
- Description (optional)
- Sharing: Private / Shared with tenant (admin only toggle)
- Icon/color (cosmetic, helps recognize)

**Visible users**
- Multi-select of users with avatars + search
- "Include only users with skills" optional filter (additive — narrows the list further)
- Toggle: hide users with no working hours
- Toggle: hide users on leave today

**Display**
- Mode switcher: Service Orders / Installations (replaces in-board toggle)
- Default view: Day / Week
- Include weekends
- Display closed dispatches
- Display rejected dispatches
- Display cancelled dispatches *(plus)*
- Load closed service orders
- Load planned service orders
- Color jobs by: Status / Priority / Service Order / Technician *(plus)*
- Show job duration labels *(plus)*
- Compact row height *(plus)*

**Permissions / behavior**
- Allow scheduling of jobs
- Allow scheduling in the past
- Allow changing (rescheduling) dispatches
- Allow unassigning dispatches *(plus)*
- Confirm before overlap (already exists — surfaced here)
- Auto-collapse completed dispatches *(plus)*

---

## Backend changes

### New table `PlanningProfiles`
Columns:
- `Id` (PK)
- `TenantId` (ITenantEntity)
- `OwnerUserId` (creator)
- `Name`, `Description`, `Color`, `Icon`
- `IsShared` (bool — visible to whole tenant when true)
- `IsActiveDefault` (per-user "active" tracked separately, see below)
- `VisibleUserIds` (`jsonb int[]`)
- `RequiredSkillIds` (`jsonb int[]`, optional)
- `Settings` (`jsonb` — holds all toggles above; flexible to add more without migrations)
- Audit: CreatedAt/By, ModifiedAt/By, DeletedAt/By (ISoftDeletable)

### New table `UserActivePlanningProfile`
- `UserId` (PK)
- `TenantId`
- `ProfileId` (FK)
- `UpdatedAt`

Separate table so switching active profile doesn't write into the profile row (and a user can have a shared profile active without owning it).

### New module `Backend/Modules/PlanningProfiles/`
- `Models/PlanningProfile.cs`, `UserActivePlanningProfile.cs`
- `DTOs/PlanningProfileDtos.cs` (Create/Update/Response/Settings)
- `Services/IPlanningProfileService.cs`, `PlanningProfileService.cs`
- `Controllers/PlanningProfilesController.cs` — endpoints:
  - `GET /api/planning-profiles` — list mine + shared
  - `GET /api/planning-profiles/{id}`
  - `POST /api/planning-profiles`
  - `PUT /api/planning-profiles/{id}` — only owner or admin
  - `DELETE /api/planning-profiles/{id}` — soft delete
  - `POST /api/planning-profiles/{id}/share` — admin only
  - `GET /api/planning-profiles/active` — returns current user's active
  - `PUT /api/planning-profiles/active/{id}` — set active
- Register in `Program.cs` DI.

### Authorization rules
- Read: owner OR (shared AND same tenant).
- Update/Delete: owner OR admin.
- `IsShared = true`: requires admin role (`has_role`-style check in service).

### Migration
- `Backend/Migrations/20260518_planning_profiles.sql` creates both tables + indexes on `(TenantId, OwnerUserId)`, `(TenantId, IsShared)`.

---

## Frontend changes

### New files
- `src/modules/dispatcher/services/planningProfilesApi.ts` — REST client.
- `src/modules/dispatcher/types/planningProfile.ts` — `PlanningProfile`, `PlanningProfileSettings`.
- `src/modules/dispatcher/components/planning-profiles/`
  - `PlanningProfilesModal.tsx`
  - `ProfileList.tsx` (left rail)
  - `ProfileForm.tsx` (right pane container with tabs)
  - `tabs/GeneralTab.tsx`
  - `tabs/VisibleUsersTab.tsx` (uses existing user picker)
  - `tabs/DisplayTab.tsx`
  - `tabs/PermissionsTab.tsx`
- `src/modules/dispatcher/hooks/usePlanningProfile.ts` — fetches active profile, exposes settings + setter, caches in React Query.

### Modified files
- `src/modules/dispatcher/components/calendar/CalendarHeader.tsx` — change `onClick` from `navigate(...)` to open modal; keep button label.
- `src/modules/dispatcher/components/calendar/CalendarSettings.tsx` — remove duplicated weekend toggle (now lives in profile) or render it read-only sourced from the active profile.
- `src/modules/dispatcher/pages/DispatcherPage.tsx` — replace local state for: `viewMode`, SO/Installation switcher, "show closed dispatches", "show rejected", load filters → all sourced from `usePlanningProfile().settings`.
- `src/modules/dispatcher/components/DispatchingInterface.tsx` — read visible-users from profile instead of all techs.
- `src/services/api/serviceOrdersApi.ts` calls in dispatcher will now pass filters derived from profile (closed/planned booleans).
- `src/modules/dispatcher/DispatcherModule.tsx` — keep `manage-scheduler/*` routes (for the "Edit technician hours" link inside modal); they're no longer the primary entry.

### Permissions
- "Share with team" button hidden unless user has admin role (use existing `useHasRole` / role check).
- "Allow scheduling …" toggles are *profile-level*, but they only relax behavior the user already has via RBAC — never elevate beyond it. Enforcement on backend stays in `PlanningService`.

### i18n
Add keys under `dispatcher.profiles.*` in all three locale files (`en`, `fr`, `de`):
`title`, `new_profile`, `my_profiles`, `shared_profiles`, `set_active`, `is_active`, `share_with_team`, `private`, `shared`, tab labels, every setting label + helper text, confirmation dialogs, empty states, validation messages. No raw strings in components.

---

## Migration of existing behavior

1. On first load post-deploy, if user has no active profile → backend auto-creates a **"Default"** personal profile populated from their last-used local settings (or sensible defaults: all users visible, Service Orders mode, weekends off, allow scheduling on, no past scheduling, show closed/rejected off).
2. Existing in-board toggles (SO/Installation switcher, weekend toggle) become **deprecated UI** — removed from the calendar header/settings; same state now comes from active profile.
3. Local-storage keys currently holding these prefs are read once on first load to seed the auto-created profile, then cleaned.

---

## Out of scope (explicit)

- Working-hours / leave editing — unchanged; still in `SchedulerManager` page, just accessed via a link inside the new modal.
- Backend `PlanningService` validation logic — unchanged.
- Calendar grid rendering — unchanged; only its inputs change.

---

## Technical notes

- Profile `Settings` stored as `jsonb` so we can add toggles later without schema changes.
- React Query keys: `['planning-profile', 'active']`, `['planning-profiles', 'list']`; invalidate on save/switch.
- The active-profile fetch is awaited before rendering the planning board (small skeleton) to avoid flashing old settings.
- Multi-tenant: every query in `PlanningProfileService` filters `TenantId` from request context; shared profiles never cross tenants.
- Soft delete + audit consistent with the rest of the codebase.

---

## Rollout order
1. Backend migration + module + endpoints + tests.
2. FE types + API client + `usePlanningProfile` hook.
3. Modal + tabs.
4. Wire `CalendarHeader` button → modal; remove old toggles from board.
5. i18n keys in en/fr/de.
6. Smoke-test: create, edit, share, switch active, soft-delete, board reacts.
