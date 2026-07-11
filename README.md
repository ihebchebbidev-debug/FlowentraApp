# Flowentra — Full Stack ERP / Field Service Platform

Flowentra is a multi-tenant business management platform combining a React + Vite frontend with a .NET 8 (ASP.NET Core) backend, backed by PostgreSQL (Neon). It covers CRM, Sales, Purchases, Inventory, Field Service Dispatch, Projects, HR, Calendar, Website Builder, Dynamic Forms, Workflow Automation, AI Assistant, Dashboards and more.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Repository Layout](#repository-layout)
4. [Prerequisites](#prerequisites)
5. [Quick Start (Local Development)](#quick-start-local-development)
6. [Frontend Documentation](#frontend-documentation)
7. [Backend Documentation](#backend-documentation)
8. [Database](#database)
9. [Authentication & Multi-Tenancy](#authentication--multi-tenancy)
10. [Modules](#modules)
11. [Environment Variables](#environment-variables)
12. [Building & Deployment](#building--deployment)
13. [Testing](#testing)
14. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌──────────────────────────┐        HTTPS / JSON         ┌──────────────────────────┐
│   Frontend (React/Vite)  │  ───────────────────────►   │  Backend (.NET 8 API)    │
│   - SPA on Vercel/Lovable│  ◄───────────────────────   │  - ASP.NET Core, EF Core │
│   - TanStack Query       │      JWT Bearer auth        │  - SignalR realtime      │
│   - shadcn/ui + Tailwind │                             │  - Modular vertical slice│
└──────────────────────────┘                             └────────────┬─────────────┘
        │                                                              │
        │ UploadThing (file storage)                                   │
        │ Mapbox / Leaflet (maps)                                      │
        ▼                                                              ▼
┌──────────────────────────┐                             ┌──────────────────────────┐
│   Browser local cache    │                             │  PostgreSQL (Neon)       │
│   IndexedDB (offline)    │                             │  Per-tenant DB or schema │
│   Service Worker (sw.js) │                             │  Redis (optional cache)  │
└──────────────────────────┘                             └──────────────────────────┘
```

Multi-tenancy is **database-per-tenant**: each tenant has its own connection string resolved at request time from the `X-Tenant` header (or subdomain). EF Core opens a scoped `DbContext` against the matching connection.

---

## Tech Stack

### Frontend
- **React 18** + **TypeScript** + **Vite 5** (SWC)
- **TanStack Query** for server state, **Axios** for HTTP
- **React Router DOM** for routing
- **shadcn/ui** (Radix primitives) + **Tailwind CSS** + **lucide-react** icons
- **react-hook-form** + **zod** for forms & validation
- **@react-pdf/renderer** for PDF documents
- **@dnd-kit**, **react-grid-layout**, **@xyflow/react** for drag/drop, dashboards, workflow canvas
- **Mapbox GL** / **Leaflet** for maps
- **i18next** for English / French
- **@microsoft/signalr** for live notifications & dispatch updates
- **UploadThing** client for uploads
- **Service Worker** (`public/sw.js`) for offline caching & smart updates

### Backend
- **.NET 8** / **ASP.NET Core**
- **Entity Framework Core 8** + **Npgsql** (PostgreSQL)
- **JWT Bearer** authentication + Google / Microsoft OAuth
- **SignalR** for realtime
- **BCrypt.Net-Next** password hashing
- **MailKit / MimeKit** for SMTP
- **StackExchange.Redis** caching (optional)
- **Swashbuckle** (Swagger / OpenAPI)
- **Microsoft.AspNetCore.DataProtection** for secret encryption

### Infrastructure
- **PostgreSQL** via **Neon** (serverless Postgres)
- **Render** for backend hosting (`Backend/render.yaml`)
- **Vercel** / **Lovable** for frontend (`vercel.json`)
- **Cloudflare** in front (optional)

---

## Repository Layout

```
.
├─ src/                          # Frontend source
│  ├─ modules/                   # Feature modules (vertical slices)
│  ├─ components/                # Shared UI (shadcn)
│  ├─ hooks/                     # Reusable hooks
│  ├─ services/                  # API clients & domain services
│  ├─ contexts/                  # React contexts (auth, tenant, prefs)
│  ├─ i18n/                      # Translations (en/fr)
│  ├─ types/                     # Shared TypeScript types
│  ├─ config/                    # API & runtime config
│  ├─ pages/                     # Top-level routed pages
│  └─ main.tsx                   # App entry
├─ public/                       # Static assets, sw.js, version.json
├─ Backend/                      # .NET 8 API
│  ├─ Modules/                   # Vertical slices (Articles, Sales, ...)
│  ├─ Infrastructure/            # DI, middleware, multi-tenancy
│  ├─ Configuration/             # Swagger / token helpers
│  ├─ Data/                      # Seed data & EF migrations folder
│  ├─ Database/ + Neon/          # Raw .sql migrations (canonical schema)
│  ├─ Migrations/                # Additional SQL migrations
│  ├─ Scripts/                   # One-off SQL scripts
│  ├─ Program.cs                 # API bootstrap
│  ├─ appsettings*.json          # Config
│  ├─ Dockerfile, render.yaml    # Deployment
│  └─ FlowServiceBackend.csproj
├─ tailwind.config.ts
├─ vite.config.ts
└─ package.json
```

---

## Prerequisites

| Tool                      | Version          | Purpose                          |
|---------------------------|------------------|----------------------------------|
| Node.js                   | ≥ 18 (20 LTS rec.) | Frontend toolchain             |
| Bun **or** npm/pnpm/yarn  | latest           | Frontend package manager         |
| .NET SDK                  | 8.0.x            | Backend build & run              |
| PostgreSQL                | ≥ 14 (Neon ok)   | Database                         |
| Redis (optional)          | ≥ 6              | Caching                          |
| Git                       | latest           | Version control                  |

---

## Quick Start (Local Development)

### 1. Clone

```bash
git clone <repo-url> flowentra
cd flowentra
```

### 2. Backend

```bash
cd Backend

# Configure DB & secrets in appsettings.Development.json (already includes a Neon dev DB)
# Or set env vars (preferred):
export ConnectionStrings__DefaultConnection="postgresql://USER:PASS@HOST/DB?sslmode=require"
export Jwt__Key="ChangeMe-AtLeast32CharsLongRandomKey1234"
export Jwt__Issuer="MyApi"
export Jwt__Audience="MyApiClients"

# Restore + run
dotnet restore
dotnet run
# API → http://localhost:5000  (Swagger UI at /swagger)
```

Apply database schema (one-time, against an empty DB):

```bash
# Run the Neon canonical scripts in order, or use the consolidated file:
psql "$DATABASE_URL" -f Database/cleanup_database.sql        # optional reset
for f in Neon/*.sql; do psql "$DATABASE_URL" -f "$f"; done
# Then any extra migrations:
for f in Migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

### 3. Frontend

```bash
# from repo root
bun install            # or: npm install / pnpm install

# Copy/edit env
cat > .env <<EOF
VITE_API_URL=http://localhost:5000
VITE_DEFAULT_TENANT=demo
VITE_UPLOADTHING_TOKEN=             # optional
EOF

bun run dev            # Vite dev server → http://localhost:8080
```

Open `http://localhost:8080`. Login with a seeded user (see `Backend/Data/SeedData/`) or create one through the onboarding flow.

---

## Frontend Documentation

### Entry & Bootstrap

- `src/main.tsx` — mounts `<App />`, registers the service worker (`/sw.js`).
- `src/App.tsx` — wires providers (Query, Theme, Tenant, Auth, Tour, Offline, i18n) and the router.
- `src/pages/MainApp.tsx` — authenticated app shell with sidebar / topbar.

### Routing

React Router DOM v6. Each module defines its own routes under `src/modules/<module>/routes` and is imported into the main router. Lazy-loaded with `lazyWithRetry` (`src/lib/lazyWithRetry.ts`) to survive transient chunk failures after deploys.

### State & Data

- **Server state**: TanStack Query (`src/lib/queryClient.ts`). Default `staleTime`, retry & error toast policies are centralized.
- **HTTP**: Axios instances under `src/services/api/` — every request injects `Authorization: Bearer <jwt>` and `X-Tenant: <slug>` via interceptors (`src/utils/apiHeaders.ts`).
- **Auth**: `src/modules/auth/` — JWT stored in `localStorage` plus refresh token rotation. Token decoded on boot to hydrate user/tenant.
- **Tenant**: detected in `src/config/api.ts` (subdomain → query → env). Map context in `src/contexts/TenantMapContext.tsx`.
- **Offline**: `src/contexts/OfflineContext.tsx` + `src/services/offline/` use IndexedDB for hydration & a background sync queue. The Service Worker caches static assets and last successful API responses.
- **Preferences / Theme**: `src/contexts/PreferencesProvider.tsx`, `src/hooks/useTheme.ts`, `src/hooks/useCustomTheme.ts`.

### UI

- shadcn/ui in `src/components/ui/*`. Always use semantic tokens defined in `src/index.css` / Tailwind config — never hardcoded colors.
- Icons: `lucide-react`.
- Forms: `react-hook-form` + `zod` resolvers, with shared form scaffolding in `src/shared/components/`.
- Tables: TanStack Table-based `DataTable` in `src/shared/components/`.
- Charts: Recharts.
- PDFs: `@react-pdf/renderer` templates per document type (Offers, Sales, etc.).

### Internationalization

`src/i18n/` with `en` / `fr` JSON files per module. Use `useTranslation("module")` and the `t("key")` helper. Add new strings to **both** locales.

### Modules (Frontend)

Each module lives under `src/modules/<name>/` and contains:
- `pages/` — top-level screens
- `components/` — module-only components
- `services/` — API wrappers
- `hooks/` — module hooks
- `types.ts` — module types
- `routes.tsx` — exported route config (when applicable)
- `locale/` — i18n keys

Module catalog: `ai-assistant`, `analytics`, `articles`, `auth`, `automation`, `calendar`, `communication`, `contacts`, `dashboard`, `dashboard-builder`, `deals`, `dispatcher`, `documents`, `dynamic-forms`, `email-calendar`, `external`, `field`, `hr`, `inventory-services`, `lookups`, `notifications`, `offers`, `onboarding`, `payments`, `preferences`, `projects`, `purchases`, `sales`, `scheduling`, `settings`, `skills`, `stock-management`, `support`, `system`, `tasks`, `users`, `website-builder`, `workflow`.

### Available scripts

```bash
bun run dev         # Vite dev server (port 8080)
bun run build       # Production build → dist/
bun run build:dev   # Development-mode build (sourcemaps, no minify)
bun run preview     # Serve dist/ locally
bun run lint        # ESLint
```

### Service Worker

`public/sw.js` is registered from `main.tsx`. It implements:
- App-shell precache (HTML, JS, CSS, fonts)
- Stale-while-revalidate for API `GET`s
- A `version.json` poll (every 60 s) for zero-downtime updates — when the version changes a banner prompts the user to reload.

To force a fresh build during development, unregister the SW from DevTools → Application → Service Workers.

---

## Backend Documentation

### Bootstrap (`Backend/Program.cs`)

Configures:
1. **EF Core** with Npgsql, **per-tenant** `DbContext` factory (`Infrastructure/TenantDbContextFactory.cs`).
2. **JWT Bearer** authentication + role-based authorization.
3. **OAuth** (Google, Microsoft) callbacks under `/oauth/{provider}/callback`.
4. **CORS** for the frontend origins.
5. **SignalR** hubs (notifications, dispatcher, sync).
6. **Swagger** (Swashbuckle) with bearer auth, file upload filter, and a custom UI under `/swagger`.
7. **DataProtection** keys persisted under `/app/keys` (Docker volume).
8. **Redis** cache (if `Redis:ConnectionString` set) — otherwise falls back to in-memory.
9. **Global exception middleware** (`Infrastructure/GlobalExceptionMiddleware.cs`) → consistent JSON error envelope.

### Modular Architecture

Every feature is a vertical slice under `Backend/Modules/<Feature>/`:

```
Modules/Articles/
├─ Controllers/        # REST endpoints (e.g. ArticlesController.cs)
├─ Services/           # Business logic (IArticleService + impl)
├─ Models/             # EF Core entities
├─ DTOs/               # Request / response contracts
├─ Mappings/           # Entity ↔ DTO
└─ Validators/         # FluentValidation / DataAnnotations
```

Module catalog (Backend): `AiChat`, `Articles`, `Auth`, `Calendar`, `Contacts`, `Dashboards`, `Dispatches`, `Documents`, `DynamicForms`, `EmailAccounts`, `ExternalEndpoints`, `HR`, `Installations`, `Lookups`, `Notifications`, `Numbering`, `Offers`, `OfflineHydration`, `Payments`, `Planning`, `Plugins`, `Preferences`, `Projects`, `Purchases`, `RetenueSource`, `Roles`, `Sales`, `ServiceOrders`, `Settings`, `Shared`, `Signatures`, `Skills`, `SupportTickets`, `Sync`, `Tenants`, `UserAiSettings`, `Users`, `WebsiteBuilder`, `WorkflowEngine`.

### Multi-Tenancy

- `Infrastructure/ITenantEntity.cs` — every tenant-scoped EF entity implements `int TenantId { get; set; }`.
- `Infrastructure/TenantDbContextFactory.cs` — resolves the tenant from the request (`X-Tenant` header / JWT claim / subdomain), looks up its connection string from configuration (`TENANT_<SLUG>_DATABASE_URL` env vars on Render), and constructs a scoped `AppDbContext`.
- `Infrastructure/TenantSlugCache.cs` — in-process cache of slug → connection string for hot paths.
- EF Core **Global Query Filters** add `WHERE "TenantId" = @current` automatically. `SaveChangesAsync` stamps `TenantId` on inserts.
- `MainAdminUser` and `Tenant` tables are **non-tenant-scoped** (root catalog).

### Authentication

- **Login**: `POST /api/auth/login` → returns `{ accessToken, refreshToken, user }`.
- **Refresh**: `POST /api/auth/refresh` (rotation; old refresh token invalidated).
- **OAuth**: `GET /oauth/{google|microsoft}/login` → redirects to provider → `/oauth/{provider}/callback` → mints JWT and bounces back to the frontend with `#token=...`.
- **Roles & permissions**: stored in `Roles` / `RolePermissions` / `UserRoles` (see `Neon/02_roles_and_skills.sql`, `03_role_permissions.sql`). `[Authorize(Roles = "Admin")]` and a custom `[HasPermission("articles.write")]` policy.
- **Password hashing**: BCrypt (cost 11).

### Realtime (SignalR)

Hubs registered in `Program.cs`:
- `/hubs/notifications` — push notifications & toasts
- `/hubs/dispatch` — live dispatcher board (jobs, technician status)
- `/hubs/sync` — offline sync events

Frontend connects via `@microsoft/signalr` from `src/services/` (one connection per hub, auto-reconnect).

### File Uploads

- Local: `multipart/form-data` to dedicated controller endpoints; files stored under `wwwroot/uploads/<scope>/`.
- Remote: **UploadThing** — client uploads directly, then sends the URL to the API to persist.

### Background Jobs

- Webhook forwarding (`Migrations/20260420_AddWebhookForwardJobs.cs`) — outbox pattern, retried with exponential backoff.
- Low stock notifications, document numbering, sync queue processors run as `IHostedService` background workers.

### Configuration

`appsettings.json` / `appsettings.Development.json`:

```jsonc
{
  "ConnectionStrings": { "DefaultConnection": "postgresql://..." },
  "Jwt":   { "Key": "...", "Issuer": "MyApi", "Audience": "MyApiClients" },
  "OAuth": {
    "Google":    { "ClientId": "...", "ClientSecret": "...", "RedirectUri": "https://api.flowentra.app/oauth/google/callback" },
    "Microsoft": { "ClientId": "...", "ClientSecret": "...", "RedirectUri": "https://api.flowentra.app/oauth/microsoft/callback" }
  },
  "UploadThing": { "Token": "" },
  "Ollama":      { "BaseUrl": "http://localhost:11434", "DefaultModel": "mistral" },
  "Redis":       { "ConnectionString": "" }
}
```

In production, prefer env vars (Render injects `DATABASE_URL`, `JWT_KEY`, etc.). The double-underscore notation maps to nested keys: `Jwt__Key`, `OAuth__Google__ClientId`, etc.

### Running

```bash
cd Backend
dotnet restore
dotnet build
dotnet run                              # http://localhost:5000
dotnet run --launch-profile https       # https://localhost:7000
dotnet watch run                        # hot reload
```

Open `http://localhost:5000/swagger` for interactive API docs.

### Docker

```bash
cd Backend
docker build -t flowentra-api .
docker run -p 8080:8080 \
  -e ConnectionStrings__DefaultConnection="postgresql://..." \
  -e Jwt__Key="..." \
  flowentra-api
```

Healthcheck: `GET /health`.

---

## Database

The canonical schema lives in **`Backend/Neon/*.sql`** (numbered, run in order). Subsequent changes are in **`Backend/Database/Migrations/`** and **`Backend/Migrations/`**. EF Core migrations under `Backend/Data/Migrations/` are used for code-first changes during development.

Key table groups (full list with all 67 tables / 963 columns is generated into `src/modules/settings/data/dbTables.ts` and rendered inside the in-app Documentation page → **Database** tab):

- **Identity**: `MainAdminUsers`, `Tenants`, `Users`, `Roles`, `UserRoles`, `RolePermissions`, `RefreshTokens`, `OAuthAccounts`.
- **Lookups & Numbering**: `Lookups`, `LookupItems`, `NumberingRules`, `NumberSequences`.
- **CRM**: `Contacts`, `ContactAddresses`, `ContactGeolocations`, `ContactNotes`.
- **Inventory**: `Articles`, `ArticleNotes`, `ArticleGroups` (now via lookups), `StockTransactions`.
- **Sales**: `Sales`, `SaleItems`, `SaleAttachments`, `Offers`, `OfferItems`, `Payments`, `FiscalStamps`.
- **Procurement**: `Purchases`, `PurchaseItems`, `Suppliers`, `GoodsReceipts`.
- **Field Service**: `ServiceOrders`, `ServiceOrderMaterials`, `Dispatches`, `DispatchJobs`, `Installations`, `Technicians`.
- **Projects**: `Projects`, `ProjectActivities`, `ProjectNotes`, `ProjectLinks`, `ProjectSettings`, `Tasks`, `TaskChecklists`, `TaskTimeEntries`.
- **Calendar**: `CalendarEvents`, `SyncedCalendarEvents`, `EventTypes`.
- **HR**: `Employees`, `Contracts`, `Attendance`, `LeaveRequests`, `LeaveTypes`.
- **Email**: `EmailAccounts`, `CustomEmailAccounts`, `SyncedEmails`, `SyncedEmailAttachments`.
- **Website Builder**: `Sites`, `Pages`, `Sections`, `MediaAssets`.
- **Dynamic Forms**: `DynamicForms`, `FormFields`, `FormSubmissions`.
- **Workflow / Automation**: `Workflows`, `WorkflowSteps`, `WorkflowProcessedEntities`, `WebhookForwardJobs`.
- **Dashboards**: `Dashboards`, `DashboardWidgets`.
- **AI**: `AiChatHistory`, `UserAiSettings`.
- **Sync (Offline)**: `SyncQueue`, `SyncHistory`, `OfflineHydrationPreferences`.
- **System**: `SystemLogs`, `Notifications`, `Signatures`, `PluginActivations`, `ExternalEndpoints`, `Documents`, `DocumentCompressions`.

For complete column-level documentation (PK / FK / NN / type / source migration), open the app and navigate to **Settings → Backend Documentation → Database**.

---

## Authentication & Multi-Tenancy

1. The frontend resolves the active **tenant slug** (subdomain `<slug>.flowentra.app` or `?tenant=` query). It is added to every API call as `X-Tenant: <slug>`.
2. The user signs in (email/password or OAuth). The backend validates against the *root* `MainAdminUsers` table for cross-tenant accounts, then the per-tenant `Users` table.
3. The backend issues a **JWT** containing `sub`, `tenant`, `roles[]`, `permissions[]` and a paired **refresh token**.
4. On every request, the JWT is validated and the tenant claim is cross-checked with the `X-Tenant` header (mismatch → `403`).
5. EF Core opens the matching tenant `DbContext` and applies global filters.

---

## Modules

A short index of feature modules (frontend ↔ backend pairs):

| Module             | Frontend (`src/modules/`)        | Backend (`Backend/Modules/`)   | Purpose                                  |
|--------------------|----------------------------------|--------------------------------|------------------------------------------|
| Articles           | `articles`                       | `Articles`                     | Catalog of materials & services          |
| Contacts           | `contacts`                       | `Contacts`                     | CRM contacts, addresses, geolocation     |
| Sales              | `sales`                          | `Sales`                        | Quotes / Invoices                        |
| Offers             | `offers`                         | `Offers`                       | Commercial offers + e-sign               |
| Purchases          | `purchases`                      | `Purchases`                    | Supplier orders, goods receipts          |
| Inventory / Stock  | `inventory-services`, `stock-management` | `Articles`, `Installations` | Stock levels, transactions          |
| Projects           | `projects`                       | `Projects`                     | Project management & tasks               |
| Tasks              | `tasks`                          | `Projects`                     | Task lists, checklists, time entries     |
| Field / Dispatch   | `field`, `dispatcher`, `scheduling` | `Dispatches`, `ServiceOrders`, `Planning` | Field service workflow      |
| Calendar           | `calendar`, `email-calendar`     | `Calendar`, `EmailAccounts`    | Internal & synced calendars              |
| HR                 | `hr`                             | `HR`                           | Employees, contracts, attendance, leave  |
| Documents          | `documents`                      | `Documents`, `Signatures`      | File library + e-signature               |
| Dynamic Forms      | `dynamic-forms`                  | `DynamicForms`                 | Form builder + public submissions        |
| Website Builder    | `website-builder`                | `WebsiteBuilder`               | Public sites/pages                       |
| Workflow           | `workflow`, `automation`         | `WorkflowEngine`               | Visual automation graph                  |
| Dashboards         | `dashboard`, `dashboard-builder`, `analytics` | `Dashboards`     | Custom widget dashboards                 |
| AI Assistant       | `ai-assistant`                   | `AiChat`, `UserAiSettings`     | OpenRouter / Ollama integration          |
| Notifications      | `notifications`, `communication` | `Notifications`                | In-app + push + email                    |
| Payments           | `payments`                       | `Payments`                     | Payment tracking + Stripe webhooks       |
| Settings / Admin   | `settings`, `users`, `lookups`, `preferences`, `skills`, `system`, `support`, `external`, `onboarding` | `Settings`, `Users`, `Roles`, `Lookups`, `Preferences`, `Skills`, `Tenants`, `Plugins`, `ExternalEndpoints`, `RetenueSource`, `SupportTickets`, `Numbering` | Tenant administration |
| Offline Sync       | `(offline ctx + services)`       | `Sync`, `OfflineHydration`     | Offline queue, conflict resolution       |

---

## Environment Variables

### Frontend (`.env`)

| Var                            | Required | Description                                          |
|--------------------------------|----------|------------------------------------------------------|
| `VITE_API_URL`                 | yes      | Backend base URL (e.g. `http://localhost:5000`)      |
| `VITE_DEFAULT_TENANT`          | no       | Fallback tenant slug if none detected                |
| `VITE_OAUTH_REDIRECT_ORIGIN`   | no       | Override OAuth redirect host                         |
| `VITE_UPLOADTHING_TOKEN`       | no       | UploadThing client token                             |
| `VITE_CLERK_PUBLISHABLE_KEY`   | no       | Only if Clerk auth is enabled                        |
| `VITE_SUPABASE_URL`            | no       | Optional Lovable Cloud integration                   |
| `VITE_SUPABASE_PUBLISHABLE_KEY`| no       | Optional Lovable Cloud integration                   |

### Backend (env vars / `appsettings*.json`)

| Var                                       | Required | Description                                  |
|-------------------------------------------|----------|----------------------------------------------|
| `ConnectionStrings__DefaultConnection`    | yes      | Default Postgres connection string           |
| `TENANT_<SLUG>_DATABASE_URL`              | per tenant | One per tenant (e.g. `TENANT_DEMO_DATABASE_URL`) |
| `Jwt__Key`                                | yes      | ≥ 32 char signing key                        |
| `Jwt__Issuer` / `Jwt__Audience`           | yes      | JWT issuer / audience                        |
| `OAuth__Google__ClientId` / `…__ClientSecret` | OAuth | Google OAuth credentials                  |
| `OAuth__Microsoft__ClientId` / `…__ClientSecret` | OAuth | Microsoft OAuth credentials            |
| `UploadThing__Token`                      | uploads  | UploadThing server token                     |
| `Ollama__BaseUrl` / `Ollama__DefaultModel`| AI       | Local Ollama config                          |
| `Redis__ConnectionString`                 | optional | Enables Redis cache                          |
| `Smtp__Host` / `Smtp__Port` / `Smtp__User` / `Smtp__Pass` | email | Outgoing email                |
| `ASPNETCORE_ENVIRONMENT`                  | yes      | `Development` / `Production`                 |
| `PORT`                                    | Render   | Listening port (Render injects)              |

---

## Building & Deployment

### Frontend (Vercel / Lovable)

```bash
bun run build           # outputs to dist/
```

`vercel.json` already configures SPA rewrites. Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, Lovable).

### Backend (Render)

`Backend/render.yaml` documents the configuration. Build / start commands:

```bash
# Build
dotnet publish -c Release -o out
# Start
dotnet out/MyApi.dll
```

Add per-tenant env vars in Render → *Environment* using the pattern `TENANT_<SLUG>_DATABASE_URL`.

### Backend (Docker)

```bash
docker build -t flowentra-api Backend/
docker run -p 8080:8080 --env-file Backend/.env.prod flowentra-api
```

---

## Testing

- **Frontend**: ESLint via `bun run lint`. Add unit tests with Vitest under `src/**/__tests__` (not yet wired by default).
- **Backend**: `dotnet test` (test projects to be added under `Backend.Tests/`). Use Swagger UI for manual API testing during development.

---

## Troubleshooting

| Symptom                                              | Likely cause / fix                                                                 |
|------------------------------------------------------|-------------------------------------------------------------------------------------|
| `401 Unauthorized` on every request                  | Missing/expired JWT — clear `localStorage` and re-login                             |
| `403 Forbidden` after login                          | `X-Tenant` header mismatch with JWT `tenant` claim                                  |
| `Connection refused` on `dotnet run`                 | Wrong `ConnectionStrings__DefaultConnection`, or DB not reachable                   |
| `relation "X" does not exist`                        | Skipped a SQL migration — re-run `Neon/*.sql` then `Migrations/*.sql` in order      |
| Frontend stuck on old version after deploy           | Service Worker — bump `public/version.json` (auto on `vite build`) and reload       |
| OAuth callback fails with `redirect_uri_mismatch`    | Register `https://api.flowentra.app/oauth/<provider>/callback` in provider console  |
| `CORS error` in browser                              | Add the frontend origin to the backend CORS policy in `Program.cs`                  |
| Tenant DB not found                                  | Add `TENANT_<SLUG>_DATABASE_URL` env var on the backend host                        |
| Uploads fail with `413`                              | Increase `Kestrel:Limits:MaxRequestBodySize` and reverse proxy body limits          |
| Service Worker won't update during dev               | DevTools → Application → Service Workers → *Unregister* and hard reload             |

---

## License

Proprietary — © Flowentra. All rights reserved.
