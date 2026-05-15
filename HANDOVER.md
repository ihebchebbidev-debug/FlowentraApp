# Flowentra — Technical Handover (Frontend + Backend)

This document is the **complete technical handover** for the Flowentra platform. It targets a technical client / lead engineer taking ownership of operations, deployment, and day‑to‑day maintenance.

For deep architecture, see:
- `README.md` — root overview
- `Backend/README.md` — backend deep dive
- `BACKEND_HANDOVER.md` — backend operations / VPS runbook

---

## 1. Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript, TanStack Query, react-router-dom, i18next, Tailwind + shadcn/ui |
| Backend | ASP.NET Core 8 Web API, EF Core 8, SignalR, JWT Bearer auth |
| Database | PostgreSQL (Neon, primary) — also runnable on any Postgres 14+ |
| Realtime | SignalR hubs (workflow, notifications, sync) |
| File storage | UploadThing (frontend) + local `wwwroot/uploads` fallback |
| AI | OpenRouter (frontend gateway) + optional Ollama (backend, local LLM) |
| Hosting (frontend) | Vercel (`vercel.json`) |
| Hosting (backend) | OVH VPS — `vps-cf5a8c99.vps.ovh.net` (systemd + nginx reverse proxy) |
| CI/CD backend | Auto-build on each git commit via `Backend/buildscript.ps` (`dotnet publish` → systemd restart) |

---

## 2. Repository Layout (top level)

```
.
├── src/                        # React frontend
│   ├── modules/                # 38 vertical-slice modules (plugin.ts manifest each)
│   ├── services/               # API clients (axios) + offline sync + AI services
│   ├── shared/                 # Cross-module hooks, components, locales
│   ├── contexts/               # Tenant, Offline, Preferences, ProductTour
│   ├── i18n/locales/           # en / fr translations
│   └── App.tsx                 # Providers + routes (monolithic, 359 lines)
├── public/sw.js                # Service worker (offline + chunk reload self-heal)
├── Backend/                    # .NET 8 API
│   ├── Modules/                # 39 vertical-slice modules (Controllers/DTOs/Models/Services)
│   ├── Infrastructure/         # Tenant resolution, caching, global exception middleware
│   ├── Database/Migrations/    # SQL + EF migrations (FRAGMENTED — see §10)
│   ├── Neon/                   # Initial Postgres bootstrap SQL (numbered 01_…29_)
│   ├── Migrations/             # EF migrations (.cs) + ad-hoc SQL
│   ├── Scripts/                # One-off operational SQL scripts
│   ├── appsettings.json        # Connection strings + JWT config
│   └── buildscript.ps          # VPS auto-deploy script (bash, despite extension)
└── HANDOVER.md / BACKEND_HANDOVER.md
```

---

## 3. Frontend — Technical Features

### 3.1 Module / Plugin system
- 38 modules under `src/modules/<code>/` each with a `plugin.ts` manifest:
  `code`, `moduleKey`, `category`, `nameI18nKey`, `icon`, `version`, `isCore`, `dependencies`, `routes`, `sidebarKeys`.
- Activation is **global** (not per-tenant) — see `src/modules/shared/plugins/BACKEND_CONTRACT.md`.
- Categories: `crm`, `field`, `hr`, `finance`, `system`, `comms`, `analytics`.
- Core (un-disable-able): `system`, `settings`, `auth`, `dashboard`.

### 3.2 Multi-tenancy (frontend)
- Subdomain → tenant slug (`krossier.flowentra.app` → tenant `krossier`).
- Override via `localStorage.tenant` (dev/admin only — subdomain wins in prod).
- `X-Tenant` header sent on every request (`src/utils/apiHeaders.ts`).
- `X-Target-Tenant` for cross-tenant admin mutations.
- `useTargetTenant`, `TenantMapContext`, `TenantTitleSync` keep UI/title/cache scoped.

### 3.3 Data layer
- `axiosInstance` (`src/services/api/`) — primary HTTP client, adds JWT + tenant headers, refreshes 401, dedupes via `requestDedup`.
- `TanStack Query` (`src/lib/queryClient.ts`) — localStorage persistence per tenant.
- Older flat `src/services/*.ts` clients still in use for some entities (refactor target).

### 3.4 Offline / PWA
- `public/sw.js` — versioned cache + chunk-reload self-heal on stale chunks.
- `src/services/offline/*` — IndexedDB queue, conflict resolution, retry policies.
- `OfflineSyncRedirector`, `OfflineContext` orchestrate replay on reconnect.
- Backend counterparts: `Backend/Modules/Sync` + `Backend/Modules/OfflineHydration`.

### 3.5 i18n
- `i18next` with namespaces per module under `src/i18n/locales/{en,fr}/`.
- Per-module locale files (`src/modules/<m>/locale/{en,fr}.json`) merged into runtime cache.
- Fallback chain: tenant override → user pref → browser → `en`.

### 3.6 AI features
- `services/ai/*` — OpenRouter SSE streaming, intent analyzer, follow-up suggestions.
- `useSpeechRecognition` / `useSpeechSynthesis` — browser-native STT/TTS.
- Gated by `aiNetworkGate` (no AI calls when offline / on metered networks).
- Backend: `IOllamaService` (optional local LLM) + `UserAiSettings` table (per-user keys).

### 3.7 Cross-cutting providers (App.tsx)
`AppErrorBoundary`, `GlobalErrorTracker`, `DeploymentNotificationSystem`, `SessionExpiredBanner`, `TopProgressBar`, `TenantTitleSync`, `ProductTourContext`, `PreferencesProvider`, `LoadingContext`, `OfflineContext`.

### 3.8 Build / deploy (frontend)
```bash
npm install
npm run dev          # vite dev server (port 5173)
npm run build        # outputs dist/
npm run preview      # serve dist/ locally
```
- Production deploy: push to `main` → Vercel auto-deploys (`vercel.json` rewrites).
- Env vars (`.env`):
  - `VITE_API_URL=https://api.flowentra.app`
  - `VITE_UPLOADTHING_TOKEN=…`
  - `VITE_DEFAULT_TENANT=` (empty = subdomain-based)

### 3.9 Frontend env / secrets cheat-sheet
| Var | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | `.env`, Vercel | Backend base URL |
| `VITE_UPLOADTHING_TOKEN` | `.env`, Vercel | UploadThing client token |
| `VITE_DEFAULT_TENANT` | `.env` (dev only) | Override subdomain in local dev |

---

## 4. Backend — Technical Features

### 4.1 Module shape (39 modules)
Each `Backend/Modules/<Name>/` contains:
```
Controllers/   ASP.NET Core controllers (REST + SignalR hubs)
DTOs/          Request/response shapes
Models/        EF entities (implement ITenantEntity when scoped)
Data/          DbContext partials, EF configurations
Database/      SQL bootstrap & per-module migrations
Services/      Business logic, interfaces
```

### 4.2 Multi-tenancy (backend)
- `ITenantEntity` interface — every tenant-scoped row has `TenantId`.
- `TenantSlugCache` — in-memory slug → id resolver (invalidated on tenant CRUD).
- `TenantDbContextFactory` — produces a DbContext bound to the resolved tenant.
- Resolution order: subdomain → `X-Tenant` header → JWT claim.
- Plugin activations are **global** (see `BACKEND_CONTRACT.md`).

### 4.3 Authentication
- JWT Bearer (HS256), `Microsoft.AspNetCore.Authentication.JwtBearer 8.0.8`.
- Tokens issued by `AuthController` (login / refresh / impersonate).
- Refresh tokens stored hashed in `RefreshTokens` table.
- Roles: `Admin`, `Manager`, `User`, `Viewer` + per-module permission matrix.
- Password hashing: `BCrypt.Net-Next 4.0.3` (cost 11).

### 4.4 Workflow Engine (`Backend/Modules/Workflow*`)
- Triggers (status-change, scheduled, webhook), Rules, Actions, Executions.
- State-based polling de-dup via `WorkflowProcessedEntities` (see `Neon/18_workflow_processed_entities.sql`).
- SignalR hub broadcasts execution events to subscribed clients.

### 4.5 Realtime (SignalR)
- Hubs: `/hubs/workflow`, `/hubs/notifications`, `/hubs/sync`.
- Auth via JWT in `access_token` query param (browser WebSocket limitation).

### 4.6 Caching
- `Microsoft.Extensions.Caching.StackExchangeRedis 8.0.8` (optional — falls back to in-memory if Redis URL absent).
- Cache keys are tenant-prefixed (`t:{tenantId}:…`).
- Invalidation patterns documented in `Backend/Infrastructure/Caching/CachingImplementationExamples.cs`.

### 4.7 Email (SMTP)
- `MailKit 4.13.0` + `MimeKit 4.13.0`.
- Per-tenant SMTP settings stored in `CustomEmailAccounts` table.
- Falls back to global SMTP from `appsettings.json` → `Smtp:*`.

### 4.8 OpenAPI / Swagger
- `Swashbuckle.AspNetCore 6.7.3` + Annotations.
- Custom Swagger UI: `Backend/wwwroot/swagger-ui/` (token helper auto-pastes JWT in dev).
- Available at `/swagger` on the VPS.

### 4.9 Global error handling
- `Backend/Infrastructure/GlobalExceptionMiddleware.cs` converts unhandled exceptions → `ProblemDetails` JSON (RFC 7807).
- Logs to `SystemLogs` table + stdout (captured by systemd journal).

### 4.10 Data protection (cookies / antiforgery)
- Keys persisted to `/app/keys` (Docker) or `/home/backend/.aspnet/DataProtection-Keys` (VPS) so they survive restarts.

---

## 5. Database

- Engine: PostgreSQL 14+ (Neon in production).
- Connection string in `appsettings.json` → `ConnectionStrings:DefaultConnection`.
- Bootstrap order:
  1. Run all `Backend/Neon/01_…29_*.sql` (in numeric order).
  2. Apply `Backend/Database/Migrations/*.sql` (chronological by filename date prefix).
  3. Apply `Backend/Migrations/*.cs` via `dotnet ef database update` (or run the `.sql` siblings).
  4. Apply `Backend/Scripts/*.sql` (one-off operational migrations).
- **Known issue**: migrations are fragmented across 5 locations (Neon, Database/Migrations, Migrations, Scripts, per-module `Database/`). Consolidating is a recommended post-handover task.

Backups (Neon): point-in-time restore is enabled by default on the project's branch. For the VPS Postgres (if used), use `pg_dump` daily via cron.

---

## 6. Frontend ↔ Backend Contract Highlights

- All endpoints prefixed `/api`.
- Auth: `Authorization: Bearer <jwt>` on every call (auto-attached by axios interceptor).
- Tenant: `X-Tenant: <slug>` (auto from subdomain).
- Envelope: most endpoints return raw payload; some return `{ success, data, message }`. The frontend `unwrap<T>()` helper accepts both.
- Pagination: query `?page=1&pageSize=50` → `{ items, total, page, pageSize }`.
- Errors: RFC 7807 `ProblemDetails` JSON.

---

## 7. Local Development

```bash
# Frontend
npm install
npm run dev                       # http://localhost:5173

# Backend (requires .NET 8 SDK)
cd Backend
dotnet restore
dotnet build
dotnet run                        # http://localhost:5000  (or whatever launchSettings.json says)
```

Point the frontend at local backend by editing `.env`:
```
VITE_API_URL=http://localhost:5000
```

---

See **`BACKEND_HANDOVER.md`** for the full VPS / deployment / nginx / systemd runbook.
