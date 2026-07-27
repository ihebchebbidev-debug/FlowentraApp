## Goal

Bring `src/modules/settings/pages/DocumentationPage.tsx` (the `MODULES` catalog rendered on the Documentation page) in line with what is actually shipping in the app today — no dead code, no removed features (like the old drag-and-drop "Dashboard Builder"), no phantom routes.

## Method (per module entry)

For each of the ~40 entries in `MODULES` I will:

1. Verify the module still exists in `src/modules/<name>/` and is wired.
2. Cross-check the `routes:` array against actual `<Route>` declarations (in `App.tsx` and each module's `plugin.ts` / `router`).
3. Cross-check the sidebar entry against `AppSidebar.tsx` groups (workspace / crm / service / system) and `sidebarPluginGating.ts`.
4. Rewrite `name`, `description`, `features`, `routes`, and screen counts so they describe only what a user can actually do today.
5. Drop entries whose module is no longer surfaced to end users (kept as internal code only).

## Known corrections already identified

- **Dashboard** — rename from "Dashboard & Builder" to just **Dashboard**. Remove drag-and-drop builder feature list, `/dashboard/dashboards`, `/dashboard/dashboards/:id`, `/dashboard/dashboards/:id/edit`, and the public shared-dashboard route from the user-facing docs. Keep the built-in Service/Sales/Field/HR/Finance/Executive dashboards, pinning, time-range, quick filters, recent activity, tour, realtime, and mobile behaviour.
- **Dashboard Builder** — remove as a separate documented module (code stays for the public token page only, not user-facing).
- Any module entry whose `routes` reference a page that no longer exists → route removed; if all its routes are gone, the whole entry is dropped.

## Scope of edits

- File touched: `src/modules/settings/pages/DocumentationPage.tsx` (only the `MODULES` array, lines ~1719–3100).
- No behaviour, styling, or i18n changes.
- No changes to the underlying modules themselves.

## Out of scope

- Rewriting the long-form guide pages under `src/modules/settings/pages/docs/guides/*` (those are separate). I'll flag any that are also stale but not edit them unless you confirm.

## Deliverable

An updated `MODULES` array where every entry, route, and feature bullet corresponds to a real, reachable, working part of the app in its current state.
