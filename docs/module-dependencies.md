# Module (Plugin) Activation & Dependency Logic

Single source of truth for how modules turn on/off. Enforced identically in:

- Frontend manifests: `src/modules/<module>/plugin.ts` (40 modules)
- Frontend resolver: `src/modules/shared/plugins/usePlugins.ts` + `registry.ts`
- Backend catalog: `Backend/Modules/Plugins/KnownPlugins.cs`
- Backend engine: `Backend/Modules/Plugins/Services/PluginService.cs`
- Public admin API: `Backend/Modules/Plugins/Controllers/PublicPluginsController.cs`

Verified by `node scripts/verify-modules.mjs`: 40 manifests vs 40 backend entries —
identical codes, core flags and edges; 0 unknown dependency codes; 0 cycles; 16 edges.

## 1. Storage model

`ActivatedModules` lives **inside each tenant database**, resolved from the `X-Tenant`
request header (in-app) or the `?tenant=` query parameter (public admin API). Every
tenant's module set is independent.

Rows are overrides only. **Absence of a row = enabled (default-on).**
Core plugins are always on and ignore stored rows.

## 2. The 40 modules

| Code | Module | Core | Direct dependencies |
|---|---|---|---|
| PL0033SYSTEM | System | ✅ | — |
| PL0034SETTINGS | Settings | ✅ | — |
| PL0035AUTH | Auth | ✅ | — |
| PL0036DASHBOARD | Dashboard | ✅ | — |
| PL0001CONTACTS | Contacts / Customers / Suppliers | | — |
| PL0002SALES | Sales / Orders | | PL0001CONTACTS |
| PL0003DEALS | Deals / Pipeline | | PL0001CONTACTS |
| PL0004INVOICES | Invoices | | PL0001CONTACTS, PL0002SALES |
| PL0004PROJECTS | Projects | | PL0001CONTACTS |
| PL0005OFFERS | Offers / Quotations | | PL0001CONTACTS |
| PL0006SUPPORT | Service desk / Tickets | | — |
| PL0007ARTICLES | Articles | | — |
| PL0008INVSERVICES | Inventory & services catalog | | — |
| PL0009STOCK | Stock management | | PL0007ARTICLES |
| PL0010CALENDAR | Calendar | | — |
| PL0011TASKS | Tasks / To-do | | — |
| PL0012DOCUMENTS | Documents | | — |
| PL0013HR | HR | | — |
| PL0014SKILLS | Skills matrix | | — |
| PL0015FIELD | Field service (service orders) | | PL0001CONTACTS |
| PL0018INSTALLATIONS | Installations | | PL0015FIELD, PL0007ARTICLES |
| PL0023SCHEDULING | Planning board / Scheduler | | PL0015FIELD, PL0024DISPATCHER |
| PL0024DISPATCHER | Dispatches / Operations | | PL0015FIELD |
| PL0025PURCHASES | Purchases | | PL0001CONTACTS, PL0007ARTICLES |
| PL0026PAYMENTS | Payments | | PL0004INVOICES |
| PL0027COMMUNICATION | Communication | | — |
| PL0028EMAILCALENDAR | Email & calendar sync | | — |
| PL0029NOTIFICATIONS | Notifications | | — |
| PL0030EXTERNAL | External APIs | | — |
| PL0031WORKFLOW | Workflow | | — |
| PL0032DYNAMICFORMS | Dynamic forms | | — |
| PL0037LOOKUPS | Lookups | | — |
| PL0038WEBSITEBLDR | Website builder | | — |
| PL0039DASHBLDR | Dashboard builder | | — |
| PL0040ANALYTICS | Analytics | | — |
| PL0041AIASSISTANT | AI assistant | | — |
| PL0042AUTOMATION | Automation | | — |
| PL0043USERS | Users | | — |
| PL0044PREFERENCES | Preferences | | — |
| PL0045ONBOARDING | Onboarding | | — |

> Known cosmetic quirk: `PL0004INVOICES` and `PL0004PROJECTS` share the numeric part
> `0004`. Codes are compared as **full strings**, so this is harmless — but never
> shorten a code to its number anywhere in client code.

## 3. Dependency graph (16 edges)

```text
PL0001CONTACTS  (root)
├── PL0002SALES ──> PL0004INVOICES ──> PL0026PAYMENTS
├── PL0003DEALS
├── PL0005OFFERS
├── PL0004PROJECTS
├── PL0025PURCHASES        (also needs PL0007ARTICLES)
└── PL0015FIELD
    ├── PL0024DISPATCHER ──> PL0023SCHEDULING   (SCHEDULING also needs FIELD directly)
    └── PL0018INSTALLATIONS (also needs PL0007ARTICLES)
PL0007ARTICLES ──> PL0009STOCK, PL0025PURCHASES, PL0018INSTALLATIONS
Core (never disablable): PL0033SYSTEM, PL0034SETTINGS, PL0035AUTH, PL0036DASHBOARD
```

The 24 modules not listed above have no edges at all.

## 4. Cascade table — disable X, these go OFF too (transitive dependents)

| Disabled | Also switched off |
|---|---|
| PL0001CONTACTS | SALES, DEALS, PROJECTS, OFFERS, PURCHASES, FIELD, INVOICES, PAYMENTS, DISPATCHER, SCHEDULING, INSTALLATIONS (11) |
| PL0007ARTICLES | STOCK, PURCHASES, INSTALLATIONS (3) |
| PL0002SALES | INVOICES, PAYMENTS |
| PL0004INVOICES | PAYMENTS |
| PL0015FIELD | DISPATCHER, SCHEDULING, INSTALLATIONS |
| PL0024DISPATCHER | SCHEDULING |
| any other module | — |

## 5. Auto-enable table — enable X, these turn ON first (transitive dependencies)

| Enabled | Chain switched on |
|---|---|
| PL0026PAYMENTS | INVOICES, SALES, CONTACTS |
| PL0004INVOICES | SALES, CONTACTS |
| PL0023SCHEDULING | DISPATCHER, FIELD, CONTACTS |
| PL0024DISPATCHER | FIELD, CONTACTS |
| PL0018INSTALLATIONS | FIELD, CONTACTS, ARTICLES |
| PL0025PURCHASES | CONTACTS, ARTICLES |
| PL0009STOCK | ARTICLES |
| SALES / DEALS / PROJECTS / OFFERS / FIELD | CONTACTS |

## 6. Resolution algorithm (identical everywhere)

```
for each plugin p:
  if p.isCore                       -> enabled
  else:
    on = stored[p] ?? true                      # no row = ON
    if on: on = every transitive dependency d of p
                is core OR (stored[d] ?? true)
    effective[p] = on
```

`disabledByDependency = effective == false && (stored ?? true) == true`
— the module is not switched off itself, one of its dependencies is.

## 7. Write rules

- **Enable** a module → its whole transitive dependency chain is enabled first.
- **Disable** a module → `409 dependencyConflict` listing `blockingDependents`,
  unless `cascade: true`, which then disables all transitive dependents.
- **Core** modules reject `isEnabled:false` with `400 coreLocked`.
- In-app users have **no write path** — the app only reads state and can email a
  change request (`POST /api/module-requests`). All writes go through the public
  admin API (see `docs/module-public-api.md` and `docs/admin-app-integration.md`).

## 8. Guarding in the app

- Route level: `<PluginGate code="PL0002SALES">` inside each `*Module.tsx`.
- Navigation: desktop + mobile nav configs gate every entry on its plugin code.
- 4 embedded features (AI assistant, dashboard builder, onboarding, preferences)
  are sidebar-gated only — they own no routes.

Run `node scripts/verify-modules.mjs` after touching any manifest, `KnownPlugins.cs`,
nav config or gate; it fails the build on any drift.
