# Module (Plugin) Activation — Public API & Integration Guide

Two hard rules this system enforces:

1. **In-app users can never change their modules.** The app only *reads* activation
   state; the Settings screen shows status and a "Request change" dialog that emails
   Flowentra (`POST /api/module-requests`). There is no toggle, no write path
   (verified automatically by `node scripts/verify-modules.mjs`).
2. **All writes happen through the public admin API below** — no auth, no API key,
   no headers. The tenant is always an explicit `?tenant=` query parameter.

Base URL: `https://<your-api-host>` — every path below is prefixed `/api/public/plugins`.

---

## 1. Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/public/plugins/tenants` | List every tenant this API can manage |
| GET | `/api/public/plugins/graph` | Static dependency graph (codes, core flags, transitive deps/dependents) |
| GET | `/api/public/plugins?tenant=krossier` | One tenant: stored + effective state, counts |
| GET | `/api/public/plugins/all` | Every tenant in one call (`?tenant=` narrows to one) |
| GET | `/api/public/plugins/preview/{code}?tenant=krossier&isEnabled=false` | Dry-run: what a toggle would change |
| PATCH | `/api/public/plugins/{code}?tenant=krossier` | Toggle one module |
| POST | `/api/public/plugins/bulk?tenant=krossier` | Toggle many modules for one tenant |
| POST | `/api/public/plugins/broadcast` | Apply one change to many tenants |

`tenant` defaults to `default` (the shared database) when omitted.

### GET one tenant

```bash
curl "https://api.example.com/api/public/plugins?tenant=krossier"
```

```json
{
  "success": true,
  "data": {
    "tenant": "krossier",
    "total": 39,
    "active": 31,
    "modules": [
      {
        "code": "PL0026PAYMENTS",
        "isCore": false,
        "dependencies": ["PL0004INVOICES"],
        "stored": null,
        "isEnabled": false,
        "disabledByDependency": true
      }
    ],
    "activations": [{ "code": "PL0002SALES", "isEnabled": false, "updatedAt": "2026-08-03T06:10:00Z" }]
  }
}
```

* `stored` — the explicit DB row: `true`, `false`, or `null` (no row = default ON).
* `isEnabled` — **effective** state after the dependency chain is resolved.
* `disabledByDependency` — module itself is on, but a dependency is off.

### Toggle one module

```bash
# Disable Contacts and cascade everything that needs it
curl -X PATCH "https://api.example.com/api/public/plugins/PL0001CONTACTS?tenant=krossier" \
  -H "Content-Type: application/json" \
  -d '{"isEnabled": false, "cascade": true}'
```

Response: `{ "success": true, "data": {...}, "snapshot": { ...same shape as GET... } }`

Without `cascade` (or `cascade: false`) a disable that would break dependents returns **409**:

```json
{
  "success": false,
  "error": "dependencyConflict",
  "code": "PL0001CONTACTS",
  "blockingDependents": ["PL0002SALES","PL0004INVOICES","PL0026PAYMENTS","PL0003DEALS","PL0005OFFERS","PL0004PROJECTS","PL0025PURCHASES","PL0015FIELD","PL0024DISPATCHER","PL0023SCHEDULING"]
}
```

Other errors: `400 coreLocked` (system/settings/auth/dashboard can never be disabled),
`404 unknown` (code not in the catalog).

### Bulk (one tenant)

```bash
curl -X POST "https://api.example.com/api/public/plugins/bulk?tenant=krossier" \
  -H "Content-Type: application/json" \
  -d '{"codes":["PL0002SALES","PL0004INVOICES"],"isEnabled":true,"cascade":true}'
```

### Broadcast (many tenants)

```bash
curl -X POST "https://api.example.com/api/public/plugins/broadcast" \
  -H "Content-Type: application/json" \
  -d '{"code":"PL0015FIELD","isEnabled":false,"cascade":true,"tenants":["krossier","demo"]}'
```

Omit `tenants` to hit every configured tenant. Response contains `data` (applied)
and `errors` (per-tenant failures) — partial success is normal and reported.

### Preview before writing

```bash
curl "https://api.example.com/api/public/plugins/preview/PL0015FIELD?tenant=krossier&isEnabled=false"
# → { "data": { "alsoDisabled": ["PL0024DISPATCHER","PL0023SCHEDULING"], "alsoEnabled": [] } }
```

---

## 2. The activation model (must be mirrored by any client)

* Absence of a row = **enabled** (default-on).
* Core modules (`PL0033SYSTEM`, `PL0034SETTINGS`, `PL0035AUTH`, `PL0036DASHBOARD`) are always on.
* A module is **effectively on** only when it is on **and every module in its
  transitive dependency chain is on**.
* **Enable** writes `true` for the module *and its whole transitive dependency chain*.
* **Disable + cascade** writes `false` for the module *and all transitive dependents*.

### Dependency edges (13)

```
PL0001CONTACTS (root)
├── PL0002SALES ── PL0004INVOICES ── PL0026PAYMENTS
├── PL0003DEALS
├── PL0005OFFERS
├── PL0004PROJECTS
├── PL0025PURCHASES
└── PL0015FIELD ── PL0024DISPATCHER ── PL0023SCHEDULING
PL0007ARTICLES ── PL0009STOCK
```

(`PL0004INVOICES` depends on both Contacts and Sales; `PL0023SCHEDULING` on both Field and Dispatcher.)

### Cascade table

| Disable | Also switched off |
| --- | --- |
| `PL0001CONTACTS` | Sales, Deals, Offers, Projects, Purchases, Invoices, Payments, Field, Dispatcher, Scheduling |
| `PL0002SALES` | Invoices, Payments |
| `PL0004INVOICES` | Payments |
| `PL0015FIELD` | Dispatcher, Scheduling |
| `PL0024DISPATCHER` | Scheduling |
| `PL0007ARTICLES` | Stock |

| Enable | Also switched on |
| --- | --- |
| `PL0026PAYMENTS` | Invoices, Sales, Contacts |
| `PL0004INVOICES` | Sales, Contacts |
| `PL0023SCHEDULING` | Dispatcher, Field, Contacts |
| `PL0009STOCK` | Articles |

### Reference resolver (drop into your admin app)

```ts
type Node = { code: string; isCore: boolean; dependencies: string[] };

/** stored: code -> true|false (missing = default ON) */
export function resolveEnabled(graph: Node[], stored: Record<string, boolean>) {
  const byCode = new Map(graph.map((n) => [n.code, n]));
  const out = new Map<string, boolean>();
  const walk = (code: string): boolean => {
    if (out.has(code)) return out.get(code)!;
    const n = byCode.get(code);
    if (!n) return true;               // unknown code → allow
    if (n.isCore) { out.set(code, true); return true; }
    let v = stored[code] !== false;    // default-on
    if (v) for (const d of n.dependencies) if (!walk(d)) { v = false; break; }
    out.set(code, v);
    return v;
  };
  graph.forEach((n) => walk(n.code));
  return out;
}

export function transitiveDependents(graph: Node[], code: string, out = new Set<string>()) {
  for (const n of graph) {
    if (n.dependencies.includes(code) && !out.has(n.code)) {
      out.add(n.code);
      transitiveDependents(graph, n.code, out);
    }
  }
  return out;
}
```

Fetch `graph` from `/api/public/plugins/graph` so you never hardcode the edges.

---

## 3. Minimal admin app (copy-paste)

```ts
const API = 'https://api.example.com/api/public/plugins';

export const modulesAdmin = {
  tenants: () => fetch(`${API}/tenants`).then((r) => r.json()).then((j) => j.data),
  graph: () => fetch(`${API}/graph`).then((r) => r.json()).then((j) => j.data),
  get: (tenant: string) => fetch(`${API}?tenant=${tenant}`).then((r) => r.json()).then((j) => j.data),
  all: () => fetch(`${API}/all`).then((r) => r.json()),
  preview: (tenant: string, code: string, isEnabled: boolean) =>
    fetch(`${API}/preview/${code}?tenant=${tenant}&isEnabled=${isEnabled}`)
      .then((r) => r.json()).then((j) => j.data),
  async toggle(tenant: string, code: string, isEnabled: boolean, cascade = true) {
    const res = await fetch(`${API}/${code}?tenant=${tenant}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled, cascade }),
    });
    const json = await res.json();
    if (!res.ok) throw Object.assign(new Error(json.message ?? 'toggle failed'), json);
    return json;
  },
  broadcast: (code: string, isEnabled: boolean, tenants?: string[], cascade = true) =>
    fetch(`${API}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, isEnabled, cascade, tenants }),
    }).then((r) => r.json()),
};
```

Recommended UX in the external admin app: `preview()` → confirm the
`alsoDisabled` / `alsoEnabled` list → `toggle(..., cascade: true)` → re-render from
the returned `snapshot`.

---

## 4. How the guard works inside this app

| Layer | Mechanism |
| --- | --- |
| Data | `GET /api/plugins` (authenticated, tenant-scoped) → `usePlugins()` resolves effective state, cached in localStorage for offline/cold start |
| Routes | `<PluginGate code="PL00xx…">` wraps each module's `Routes`; disabled → blurred `<PluginPaywall />` |
| Embedded features | `useIsPluginEnabled('PL00xx…')` (e.g. the Payments tab on invoices renders nothing when Payments is off) |
| Sidebar/nav | `isSidebarItemEnabled(title, isEnabled)` via `sidebarPluginGating.ts` |
| Cross-feature soft rules | Sale → Service Order conversion hidden when `PL0015FIELD` is off |
| Write path | **none** — users open the "Request module change" dialog, which emails the request |

Failure behaviour: if `/api/plugins` is unreachable, the last cached snapshot is used;
with no cache at all, everything defaults to ON (never locks a tenant out).

## 5. Continuous verification

```bash
node scripts/verify-modules.mjs
```

Checks parity (39 manifests ↔ 39 backend entries), dependency validity, cycles,
`PluginGate` coverage for every route-declaring module, sidebar map validity,
absence of any in-app write path, and the cascade tables above. Exit code ≠ 0 = broken.
