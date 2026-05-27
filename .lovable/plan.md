## Goal

Keep the two layers cleanly separated:

- **X-Tenant** = subdomain/app database (krossier / demo / dev). Set ONCE from the URL or env. Never changed by the in-app company picker.
- **X-Target-Tenant** = numeric `TenantId` of the active company inside that DB (default = 0). Set/changed by the company picker, sent on **every** request (GET + mutations), drives row-level filtering and ModuleScope (shared vs per_company).

Today the company picker overwrites X-Tenant with the company slug — so switching companies actually switches DB, which is wrong, and ModuleScope can never be observed.

## What changes

### Frontend

1. **New `activeCompany` store** (in `src/utils/targetTenant.ts`):
   - `setActiveCompanyId(id: number | null, viewAll?: boolean)` → persists to `localStorage` keys `active_company_id` and `active_company_view_all`.
   - `getActiveCompanyId()` / `isActiveCompanyViewAll()`.
   - `getSelectedTargetTenantId()` now reads `active_company_id` first.
   - `getTargetTenantHeaders()` emits `X-Target-Tenant` on **every** request whenever an active company is set (including reads, including value 0 for the default company). View-all → no `X-Target-Tenant` (acts like "all rows").

2. **`isViewAllMode()` (in `src/utils/tenant.ts`)** reads `active_company_view_all` instead of the X-Tenant sentinel. `VIEW_ALL_SENTINEL` is kept only as the value sent in `X-Tenant` for backwards-compatible main-admin audit mode if needed — but the picker no longer relies on it.

3. **`getCurrentTenant()`** stays exactly as today (subdomain/env override → DB selector). It is never touched by company switching.

4. **Company picker call sites** stop calling `setTenantOverride` for company selection. They call `setActiveCompanyId(tenant.id)` (or `setActiveCompanyId(null, true)` for view-all):
   - `src/modules/auth/pages/SelectCompany.tsx`
   - `src/components/TenantSwitcher.tsx`
   - `src/components/CompanyFilter.tsx`
   - `src/contexts/TenantMapContext.tsx` (single-tenant collapse path)
   - `src/contexts/AuthContext.tsx` (login bootstrap → set active company id from the user's default tenant; only call `setTenantOverrideWithoutReload` to pin the **subdomain** for preview hosts where there is no real subdomain).

5. **apiClient** always merges `getTargetTenantHeaders()` (GET + mutations). Already does for mutations; extend to GET.

6. **Cache invalidation on switch**: clear react-query cache and company-logo cache (today's `clearLogoCaches`) when `active_company_id` changes; trigger a soft reload so all queries refetch with the new header.

### Backend

`Backend/Infrastructure/TenantMiddleware.cs`:

- When **no** `X-Tenant` header is sent (preview/dev hosts), if `X-Target-Tenant` is present and valid, use it as `TenantId` (currently it's ignored and falls through to TenantId=0).
- Existing behavior for explicit `X-Tenant: krossier` + optional `X-Target-Tenant` stays unchanged.

### Out of scope

- No changes to `[ModuleScope]` attributes or `ApplicationDbContext` filters — they already work the moment `TenantId` is correctly stamped per request.
- No DB migration. No new tables.

## Verification

After applying:

1. Log in on the preview, pick Krossier → `X-Tenant` unchanged (whatever the preview resolves), `X-Target-Tenant: <KrossierId>` on every request.
2. Switch to FixPaint → `X-Tenant` still unchanged, `X-Target-Tenant: <FixPaintId>` on every request. Contact list count differs from Krossier's.
3. Toggle a module to `shared` in Settings → Module Data Scope. Reads on that module return the union across companies for both companies.
4. Toggle back to `per_company` → data isolates again.

## Files touched

- `src/utils/targetTenant.ts` (new active-company store + always-on header)
- `src/utils/tenant.ts` (`isViewAllMode` reads new flag)
- `src/services/api/apiClient.ts` (apply header to GETs too)
- `src/modules/auth/pages/SelectCompany.tsx`
- `src/components/TenantSwitcher.tsx`
- `src/components/CompanyFilter.tsx`
- `src/contexts/TenantMapContext.tsx`
- `src/contexts/AuthContext.tsx`
- `Backend/Infrastructure/TenantMiddleware.cs`
