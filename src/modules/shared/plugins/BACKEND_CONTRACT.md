# Plugin Activations — Backend Contract

> **Audience**: Flowentra .NET API team.
> **Scope**: `/api/plugins*` endpoints consumed by `pluginsApi.ts`.
> **Tenancy rule (IMPORTANT)**: Plugin activations are **GLOBAL** — every
> tenant (krossier, dev, demo, …) shares the exact same set of enabled
> modules. Do **not** filter by `TenantId` for these endpoints.

---

## 1. Database

The `activated_modules` table already exists (see `full_flowentra_table.txt`):

```sql
CREATE TABLE "activated_modules" (
  "id"           serial PRIMARY KEY,
  "TenantId"     integer  DEFAULT 0    NOT NULL,
  "plugin_code"  varchar(40)            NOT NULL,
  "is_enabled"   boolean  DEFAULT true  NOT NULL,
  "created_at"   timestamp DEFAULT now() NOT NULL,
  "updated_at"   timestamp DEFAULT now() NOT NULL,
  "updated_by"   integer
);
```

### Required migration (run once)

Because activations are global, treat `TenantId = 0` as the canonical
"global" row. Enforce uniqueness on `plugin_code` alone (ignoring tenant)
to prevent duplicates.

```sql
-- 1. Collapse any per-tenant duplicates into the global TenantId=0 row.
--    Keep the most recently updated row for each plugin_code.
WITH ranked AS (
  SELECT id,
         plugin_code,
         is_enabled,
         updated_at,
         ROW_NUMBER() OVER (PARTITION BY plugin_code ORDER BY updated_at DESC, id DESC) AS rn
  FROM activated_modules
)
DELETE FROM activated_modules a
USING ranked r
WHERE a.id = r.id AND r.rn > 1;

-- 2. Force every remaining row to TenantId=0 (global).
UPDATE activated_modules SET "TenantId" = 0 WHERE "TenantId" <> 0;

-- 3. Enforce uniqueness on plugin_code (one row per plugin, globally).
CREATE UNIQUE INDEX IF NOT EXISTS ux_activated_modules_plugin_code
  ON activated_modules (plugin_code);

-- 4. Seed all 38 plugin codes as enabled (idempotent).
INSERT INTO activated_modules ("TenantId", plugin_code, is_enabled)
VALUES
  (0, 'PL0001CONTACTS',      true),
  (0, 'PL0002SALES',         true),
  (0, 'PL0003DEALS',         true),
  (0, 'PL0004PROJECTS',      true),
  (0, 'PL0005OFFERS',        true),
  (0, 'PL0006SUPPORT',       true),
  (0, 'PL0007ARTICLES',      true),
  (0, 'PL0008INVSERVICES',   true),
  (0, 'PL0009STOCK',         true),
  (0, 'PL0010CALENDAR',      true),
  (0, 'PL0011TASKS',         true),
  (0, 'PL0012DOCUMENTS',     true),
  (0, 'PL0013HR',            true),
  (0, 'PL0014SKILLS',        true),
  (0, 'PL0015FIELD',         true),
  (0, 'PL0023SCHEDULING',    true),
  (0, 'PL0024DISPATCHER',    true),
  (0, 'PL0025PURCHASES',     true),
  (0, 'PL0026PAYMENTS',      true),
  (0, 'PL0027COMMUNICATION', true),
  (0, 'PL0028EMAILCALENDAR', true),
  (0, 'PL0029NOTIFICATIONS', true),
  (0, 'PL0030EXTERNAL',      true),
  (0, 'PL0031WORKFLOW',      true),
  (0, 'PL0032DYNAMICFORMS',  true),
  (0, 'PL0033SYSTEM',        true),
  (0, 'PL0034SETTINGS',      true),
  (0, 'PL0035AUTH',          true),
  (0, 'PL0036DASHBOARD',     true),
  (0, 'PL0037LOOKUPS',       true),
  (0, 'PL0038WEBSITEBLDR',   true),
  (0, 'PL0039DASHBLDR',      true),
  (0, 'PL0040ANALYTICS',     true),
  (0, 'PL0041AIASSISTANT',   true),
  (0, 'PL0042AUTOMATION',    true),
  (0, 'PL0043USERS',         true),
  (0, 'PL0044PREFERENCES',   true),
  (0, 'PL0045ONBOARDING',    true)
ON CONFLICT (plugin_code) DO NOTHING;
```

> Defaults: every plugin starts **enabled**. Disabling a plugin requires an
> explicit row update (see `PATCH /api/plugins/:code` below).

---

## 2. HTTP API

All endpoints:
- Are mounted under the existing `/api` prefix.
- Require a valid bearer token (any authenticated user can **read**;
  only users with the `Admin` role can **toggle** — enforce server-side).
- **Ignore the `X-Tenant` header** for these endpoints (activations are global).
- Return JSON envelopes that match the rest of the Flowentra API.
  The frontend `unwrap<T>()` helper accepts either:
  - raw payload (`PluginActivation[]`), **or**
  - `{ success: true, data: PluginActivation[] }`.

### Shared DTO

```ts
interface PluginActivation {
  code: string;        // e.g. "PL0025PURCHASES"
  isEnabled: boolean;
  updatedAt?: string;  // ISO-8601, optional
}
```

### `GET /api/plugins`

Return **every row** in `activated_modules` (one per plugin code, globally).

```http
GET /api/plugins HTTP/1.1
Authorization: Bearer <jwt>
```

**200 OK**
```json
[
  { "code": "PL0001CONTACTS",    "isEnabled": true,  "updatedAt": "2026-05-02T12:00:00Z" },
  { "code": "PL0025PURCHASES",   "isEnabled": false, "updatedAt": "2026-05-02T12:05:00Z" }
]
```

> If the table is empty, return `[]`. The frontend treats absence of a row
> as "enabled" (default-on), so an empty array means "everything enabled".

### `PATCH /api/plugins/:code`

Upsert the global activation row for one plugin.

```http
PATCH /api/plugins/PL0025PURCHASES HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{ "isEnabled": false }
```

**Server logic** (pseudo-SQL):
```sql
INSERT INTO activated_modules ("TenantId", plugin_code, is_enabled, updated_by, updated_at)
VALUES (0, :code, :isEnabled, :userId, now())
ON CONFLICT (plugin_code)
DO UPDATE SET is_enabled = EXCLUDED.is_enabled,
              updated_at  = now(),
              updated_by  = EXCLUDED.updated_by;
```

**200 OK**
```json
{ "code": "PL0025PURCHASES", "isEnabled": false, "updatedAt": "2026-05-02T12:05:00Z" }
```

**Validation**:
- `:code` must match `^PL\d{4}[A-Z]+$` (40 chars max).
- Reject toggles for `isCore` plugins (`PL0033SYSTEM`, `PL0034SETTINGS`,
  `PL0035AUTH`, `PL0036DASHBOARD`) with **409 Conflict**:
  ```json
  { "success": false, "message": "Core plugin cannot be disabled" }
  ```

### `POST /api/plugins/bulk`

Bulk upsert — used by "Enable all" / "Disable all" in the UI.

```http
POST /api/plugins/bulk HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{ "codes": ["PL0001CONTACTS", "PL0002SALES"], "isEnabled": true }
```

**200 OK** — array of the upserted rows.

**Validation**:
- `codes`: 1..200 entries, each matching the code regex.
- Silently skip core plugins on a "disable all" call (do not error the
  whole batch — just don't disable them).

### `GET /api/plugins/stats`

Aggregate counters for the settings header.

```http
GET /api/plugins/stats HTTP/1.1
```

**200 OK**
```json
{ "active": 37, "total": 38 }
```

`total` = count of distinct plugin codes the backend knows about
(seed list above, currently 38). `active` = `total` minus the number of
rows where `is_enabled = false`.

---

## 3. Multi-subdomain behaviour

Even though tenancy is **resolved** from the subdomain
(`krossier.flowentra.app` → `Tenants.Slug='krossier'`), these endpoints
**must not filter by tenant**. The same `GET /api/plugins` response is
returned for every host. This is by design — Flowentra ships one
canonical set of enabled modules across all customers.

If product policy ever changes to per-tenant activations:
1. Drop `ux_activated_modules_plugin_code`.
2. Add `CREATE UNIQUE INDEX ux_activated_modules_tenant_code ON activated_modules ("TenantId", plugin_code);`
3. Resolve `TenantId` from the `X-Tenant` header / JWT and scope all four
   endpoints by it. The frontend already sends `X-Tenant` on every request.
