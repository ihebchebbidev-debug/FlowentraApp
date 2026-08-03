# Implementing module activation in the external administration app

Target API: **`https://api.flowentra.app`** (use HTTPS — plain `http://` 301-redirects,
and `curl` without `-L` returns an empty body).

Everything below is the *only* supported write path for module activation. The tenant
app itself is read-only by design.

---

## 0. Deployment prerequisite (blocking today)

`https://api.flowentra.app/swagger/v1/swagger.json` currently exposes only:

```
/api/plugins            (JWT + X-Tenant, in-app read)
/api/plugins/stats
/api/plugins/{code}
/api/plugins/bulk
```

`/api/public/plugins/*` returns **404** — the deployed build predates
`PublicPluginsController.cs` (and even `GET /api/plugins/graph`). **Redeploy the
backend from `main` before wiring the admin app**, then re-check:

```bash
curl -s https://api.flowentra.app/api/public/plugins/graph | head
```

Until then the admin app can only fall back to the authenticated `/api/plugins`
routes, one tenant at a time via the `X-Tenant` header.

---

## 1. Endpoints (all under `/api/public/plugins`, no auth, no headers)

| Method | Path | Purpose |
|---|---|---|
| GET | `/tenants` | every manageable tenant slug |
| GET | `/graph` | static graph: code, isCore, dependencies, transitiveDependencies, transitiveDependents |
| GET | `?tenant=x` | one tenant: `stored` + `isEnabled` + `disabledByDependency`, counts |
| GET | `/all` | every tenant in one call (`?tenant=` narrows), plus per-tenant `errors[]` |
| GET | `/preview/{code}?tenant=x&isEnabled=false` | dry run → `alsoEnabled[]`, `alsoDisabled[]` |
| PATCH | `/{code}?tenant=x` | body `{ isEnabled, cascade }` |
| POST | `/bulk?tenant=x` | body `{ codes[], isEnabled, cascade }` |
| POST | `/broadcast` | body `{ code, isEnabled, cascade, tenants? }` — omit `tenants` = all |

`tenant` defaults to `default` (shared DB). Slugs are lower-cased server-side.

### Response envelope

```jsonc
{ "success": true, "data": { ... }, "snapshot": { ...tenant snapshot... } }
```

Errors:

| HTTP | `error` | Meaning | Admin-app handling |
|---|---|---|---|
| 400 | `coreLocked` | tried to disable a core module | disable the switch, tooltip "core module" |
| 404 | `unknown` | code not in the catalog | your client list is stale → refetch `/graph` |
| 409 | `dependencyConflict` | dependents still on; `blockingDependents[]` returned | show the list, offer "disable with cascade" |

`/broadcast` and `/all` never fail as a whole — they return `errors[]` per tenant and
`success:false` only when at least one tenant failed.

---

## 2. Client (drop into the admin app)

```ts
// src/lib/plugins-api.ts
const BASE = "https://api.flowentra.app/api/public/plugins";

export interface PluginNode {
  code: string; isCore: boolean; dependencies: string[];
  transitiveDependencies: string[]; transitiveDependents: string[];
}
export interface TenantModule {
  code: string; isCore: boolean; dependencies: string[];
  stored: boolean | null;          // explicit DB row; null = no row = default ON
  isEnabled: boolean;              // effective, after dependency resolution
  disabledByDependency: boolean;   // itself ON, a dependency is OFF
}
export interface TenantSnapshot {
  tenant: string; total: number; active: number;
  modules: TenantModule[];
  activations: { code: string; isEnabled: boolean; updatedAt: string }[];
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw Object.assign(new Error(json.message ?? `HTTP ${res.status}`), {
      status: res.status, code: json.error, blockingDependents: json.blockingDependents ?? [],
    });
  }
  return json as T;
}

export const pluginsApi = {
  tenants: () => req<{ data: { tenant: string }[] }>("/tenants").then(r => r.data.map(t => t.tenant)),
  graph:   () => req<{ data: PluginNode[] }>("/graph").then(r => r.data),
  get:     (tenant: string) => req<{ data: TenantSnapshot }>(`?tenant=${encodeURIComponent(tenant)}`).then(r => r.data),
  all:     () => req<{ data: TenantSnapshot[]; errors: unknown[] }>("/all"),
  preview: (tenant: string, code: string, isEnabled: boolean) =>
    req<{ data: { alsoEnabled: string[]; alsoDisabled: string[] } }>(
      `/preview/${code}?tenant=${encodeURIComponent(tenant)}&isEnabled=${isEnabled}`).then(r => r.data),
  toggle:  (tenant: string, code: string, isEnabled: boolean, cascade = false) =>
    req<{ snapshot: TenantSnapshot }>(`/${code}?tenant=${encodeURIComponent(tenant)}`,
      { method: "PATCH", body: JSON.stringify({ isEnabled, cascade }) }).then(r => r.snapshot),
  bulk:    (tenant: string, codes: string[], isEnabled: boolean, cascade = true) =>
    req<{ snapshot: TenantSnapshot }>(`/bulk?tenant=${encodeURIComponent(tenant)}`,
      { method: "POST", body: JSON.stringify({ codes, isEnabled, cascade }) }).then(r => r.snapshot),
  broadcast: (code: string, isEnabled: boolean, tenants?: string[], cascade = true) =>
    req<{ data: unknown[]; errors: unknown[] }>("/broadcast",
      { method: "POST", body: JSON.stringify({ code, isEnabled, cascade, tenants }) }),
};
```

## 3. Recommended UX flow

1. On load: `graph()` once (static, cacheable forever per deploy) + `tenants()`.
2. Tenant picker → `get(tenant)`; render one row per module ordered by the graph.
   - `isEnabled && stored !== false` → ON
   - `disabledByDependency` → ON but greyed, badge "blocked by <dependency>"
   - `isCore` → switch locked
3. On switch click → `preview(tenant, code, next)` **first**.
   - `alsoEnabled.length` → confirm "will also enable: …"
   - `alsoDisabled.length` → confirm "will also disable: …", then send `cascade:true`
   - nothing extra → `toggle(...)` directly with `cascade:false`
4. Re-render from the returned `snapshot` — no refetch needed; every write returns the
   full post-write state.
5. Fleet view: `all()` → matrix tenants × modules; a column header action calls
   `broadcast(code, isEnabled)`.

## 4. Rules you must mirror client-side (never re-derive them differently)

```
effective(p) = p.isCore ? true
             : (stored[p] ?? true) && every transitive dep d:
                 d.isCore || (stored[d] ?? true)
```

- **No row = enabled.** Never treat a missing activation as OFF.
- Enabling a module implicitly enables its whole dependency chain.
- Disabling without `cascade` is a 409, not a silent partial write.
- Compare codes as whole strings (`PL0004INVOICES` ≠ `PL0004PROJECTS`).
- The catalog and edges live in `Backend/Modules/Plugins/KnownPlugins.cs` and
  `src/modules/<m>/plugin.ts`, kept 1:1 by `node scripts/verify-modules.mjs`.
  The admin app should read `/graph` rather than hardcode a copy.

## 5. Security note

`/api/public/plugins/*` is `[AllowAnonymous]` and can enable/disable modules for any
tenant. Before exposing the admin app publicly, put the API behind a network
restriction (IP allow-list / VPN / gateway auth) or add an API-key filter to
`PublicPluginsController`. Today anyone who knows the URL can toggle any tenant.

See also: `docs/module-dependencies.md` (logic), `docs/module-map.md` (per-module
impact), `docs/module-public-api.md` (raw endpoint reference).
