# Module Map — every module, what it needs, and what dies with it

40 modules. 4 core (never disablable). 16 dependency edges. This file is generated
against `src/modules/*/plugin.ts` and `Backend/Modules/Plugins/KnownPlugins.cs`,
which are verified 1:1 by `node scripts/verify-modules.mjs`.

## 1. Full table

| Code | Module | Requires (direct) | Requires (full chain) | Turning it OFF also turns off |
| --- | --- | --- | --- | --- |
| PL0033SYSTEM | System | core | — | — |
| PL0034SETTINGS | Settings | core | — | — |
| PL0035AUTH | Auth | core | — | — |
| PL0036DASHBOARD | Dashboard | core | — | — |
| PL0001CONTACTS | Contacts / Customers / Suppliers | — | — | Sales, Offers, Deals, Projects, Purchases, Invoices, Payments, Field, Dispatcher, Planning, Installations |
| PL0007ARTICLES | Articles | — | — | Stock, Purchases, Installations |
| PL0008INVSERVICES | Inventory & services catalog | — | — | — |
| PL0009STOCK | Stock management | Articles | Articles | — |
| PL0002SALES | Sales / Orders | Contacts | Contacts | Invoices, Payments |
| PL0005OFFERS | Offers / Quotations | Contacts | Contacts | — |
| PL0003DEALS | Deals / Pipeline | Contacts | Contacts | — |
| PL0004INVOICES | Invoices | Contacts, Sales | Contacts, Sales | Payments |
| PL0026PAYMENTS | Payments | Invoices | Invoices, Sales, Contacts | — |
| PL0025PURCHASES | Purchases | Contacts, Articles | Contacts, Articles | — |
| PL0004PROJECTS | Projects | Contacts | Contacts | — |
| PL0015FIELD | Field service (service orders) | Contacts | Contacts | Dispatcher, Planning, Installations |
| PL0024DISPATCHER | Dispatches / Operations | Field | Field, Contacts | Planning |
| PL0023SCHEDULING | Planning board / Scheduler | Field, Dispatcher | Field, Dispatcher, Contacts | — |
| PL0018INSTALLATIONS | Installations | Field, Articles | Field, Contacts, Articles | — |
| PL0011TASKS | Tasks / To-do | — | — | — |
| PL0010CALENDAR | Calendar | — | — | — |
| PL0012DOCUMENTS | Documents | — | — | — |
| PL0013HR | HR (employees, payroll, leaves, recruitment, performance) | — | — | — |
| PL0014SKILLS | Skills matrix | — | — | — |
| PL0006SUPPORT | Service desk / Tickets | — | — | — |
| PL0027COMMUNICATION | Communication | — | — | — |
| PL0028EMAILCALENDAR | Email & calendar sync | — | — | — |
| PL0029NOTIFICATIONS | Notifications | — | — | — |
| PL0030EXTERNAL | External APIs | — | — | — |
| PL0031WORKFLOW | Workflow | — | — | — |
| PL0032DYNAMICFORMS | Dynamic forms | — | — | — |
| PL0037LOOKUPS | Lookups | — | — | — |
| PL0038WEBSITEBLDR | Website builder | — | — | — |
| PL0039DASHBLDR | Dashboard builder | — | — | — |
| PL0040ANALYTICS | Analytics | — | — | — |
| PL0041AIASSISTANT | AI assistant | — | — | — |
| PL0042AUTOMATION | Automation | — | — | — |
| PL0043USERS | Users & access | — | — | — |
| PL0044PREFERENCES | Preferences | — | — | — |
| PL0045ONBOARDING | Onboarding | — | — | — |

HR, Dynamic forms, Documents, Lookups, Calendar, Tasks, Skills, Analytics,
Automation, Workflow, Website/Dashboard builder, Support, Communication and
Notifications are **standalone**: they can be enabled or disabled without
touching anything else. They deliberately have no hard edges — HR does not
require Contacts (employees are not contacts), and Dynamic forms attaches to any
entity that happens to be enabled.

## 2. Graph

```text
PL0001CONTACTS (root of the commercial chain)
├── PL0002SALES ─── PL0004INVOICES ─── PL0026PAYMENTS
├── PL0005OFFERS
├── PL0003DEALS
├── PL0004PROJECTS
├── PL0025PURCHASES        (also needs PL0007ARTICLES)
└── PL0015FIELD ─── PL0024DISPATCHER ─── PL0023SCHEDULING (planning board)
        └── PL0018INSTALLATIONS  (also needs PL0007ARTICLES)

PL0007ARTICLES
├── PL0009STOCK
├── PL0025PURCHASES
└── PL0018INSTALLATIONS
```

## 3. Soft (non-blocking) cross-module rules

These do **not** create a dependency — the module stays usable, the feature just
disappears:

| Feature | Hidden when |
| --- | --- |
| Sale → Service order conversion (button, banner, auto-convert modal) | `PL0015FIELD` off |
| Payments tab on invoices/sales | `PL0026PAYMENTS` off |
| Planning/scheduler entries inside Dispatcher | `PL0023SCHEDULING` off |
| Installation picker on service orders | `PL0018INSTALLATIONS` off |
| Article picker on sales/offers/purchases lines | `PL0007ARTICLES` off |
| Skills tab on employees | `PL0014SKILLS` off |

## 4. What a user with a disabled module actually sees: nothing

Gating layers (all driven by the same effective state):

| Layer | File | Behaviour |
| --- | --- | --- |
| Desktop workspace rail + panel | `WorkspaceSidebar.tsx` → `visibleWorkspaces()` | module entry not rendered; a workspace whose every gated module is off is removed from the rail |
| Mobile drawer | `MobileWorkspaceNav.tsx` → `visibleWorkspaces()` | identical filtering, including nested children |
| Legacy sidebar items | `AppSidebar.tsx` → `isSidebarItemEnabled()` | item filtered out |
| Routes | `<PluginGate code="…">` | direct URL access shows the paywall screen, not the module |
| Embedded widgets/tabs | `useIsPluginEnabled('…')` | renders `null` |
| Landing navigation | `workspaceEntryUrl()` | a workspace click never lands on a disabled module |

There is **no toggle in the app**. Users open Settings → Modules, see status only,
and press "Request module" which emails the request (`POST /api/module-requests`).
`scripts/verify-modules.mjs` fails the build if any component ever wires a
plugin-toggle mutation.

## 5. Public APIs

Full contract, curl examples and copy-paste client: **`docs/module-public-api.md`**.
Quick reference (no auth, no keys, tenant via `?tenant=`):

```
GET    /api/public/plugins/tenants
GET    /api/public/plugins/graph
GET    /api/public/plugins?tenant=krossier
GET    /api/public/plugins/all
GET    /api/public/plugins/preview/{code}?tenant=krossier&isEnabled=false
PATCH  /api/public/plugins/{code}?tenant=krossier      { "isEnabled": false, "cascade": true }
POST   /api/public/plugins/bulk?tenant=krossier        { "codes": [...], "isEnabled": true, "cascade": true }
POST   /api/public/plugins/broadcast                   { "code": "...", "isEnabled": false, "cascade": true, "tenants": [...] }
```

Semantics your admin app must respect:
* no stored row = **enabled** (default-on)
* enable X ⇒ X + its whole dependency chain are set enabled
* disable X with `cascade: true` ⇒ X + all transitive dependents are set disabled
* disable X without cascade and with live dependents ⇒ **409** `dependencyConflict` + `blockingDependents`
* core codes ⇒ **400** `coreLocked`
