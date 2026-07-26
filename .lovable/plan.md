
# Processes — unified configurable settings (revised)

## Current state (verified)

- 20 handlers registered; 14 read config keys via `ProcessConfig.Int(cfg, "...", fallback, min, max)`, 6 read nothing.
- Generic knobs already stored per schedule: `interval_minutes`, `max_retries`, `retry_backoff_seconds`, `timezone`, plus free-form `ConfigJson` (jsonb).
- Frontend mirror in `processesConfigSpec.ts` — hand-maintained, easy to drift.
- Translations already scaffolded: `processes.en.json` / `processes.fr.json` contain `units.{minutes,hours,days,weeks}`, `labels.config_default`, and per-process `items.<key>.name/description/hints`. Field labels ("System log retention (days)", etc.) currently live only in `processesConfigSpec.ts` in English — not translated.
- No DB schema change needed: `ProcessSchedules.ConfigJson jsonb` already stores arbitrary config.

## Goal

One backend-owned schema drives validation, defaults, the settings display and an auto-generated form. All 20 processes end up with sensible knobs, edits actually apply, and every visible label goes through i18n.

## Changes

### 1. Backend — central schema (source of truth)

New `Backend/Modules/Processes/Services/ProcessConfigSchema.cs`:

- `ProcessConfigField { Key, LabelI18nKey, Type ("int"|"bool"|"enum"), Fallback, Min, Max, Unit ("days"|"hours"|"count"|"minutes"), HelpI18nKey, EnumValues? }`
- `ProcessConfigSchemas` — static `Dictionary<string, ProcessConfigField[]>` keyed by process key, listing every field each handler reads.
- Helpers `GetInt(key, cfg, field)` / `GetBool(...)` that pull fallback+clamp from the schema entry, so handlers no longer repeat magic numbers.

Refactor `CoreProcessHandlers.cs`, `PurgeSystemLogsHandler.cs`, `RetryFailedEmailsHandler.cs`, `RetryUnsentEmailsHandler.cs` to call the schema helpers.

**Fill the gaps** so every process has at least one knob:

- `admin.invoices-mark-overdue` → `grace_days` (0..60, default 0)
- `admin.offers-mark-expired` → `grace_days` (0..60, default 0)
- `admin.payment-installments-mark-overdue` → `grace_days` (0..60, default 0)
- `admin.external-endpoint-logs-purge` → `fallback_retention_days` (7..3650, default 90) — used only when a row has no per-endpoint value
- Purge handlers → add uniform `batch_size` (100..50000, default 5000) — passed to `ExecuteDeleteAsync` in chunks so a single run can't lock a huge table

### 2. Backend — expose schema + validate on save

- `ProcessesController`: new `GET /api/processes/schemas` returning `{ [processKey]: ProcessConfigField[] }` plus per-process default clamps for `interval_minutes` (e.g. purges min 5 min), `max_retries`, `retry_backoff_seconds`.
- `POST /api/processes/schedule` (upsert): validate incoming `config` against the schema — drop unknown keys, coerce types, clamp `[min, max]`, reject unknown enum values with 400. Same clamp applied to interval/retries/backoff.

### 3. Backend — migration

No table change. Add a **data migration** `Backend/Migrations/20260728_processes_backfill_config_defaults.sql` that:

- For every `ProcessSchedules` row whose `ConfigJson` is `{}` or missing a schema key, merges the schema defaults so admins immediately see explicit values in the UI (no "(default)" ambiguity).
- Uses `jsonb_set` with `ON CONFLICT DO NOTHING` semantics via `COALESCE`. Idempotent, safe to re-run.
- Followed by the standard grant block if `app_user` role exists (mirrors `Processes_Migration.sql`).

### 4. Frontend — form, service, translations

New files:
- `src/modules/system/services/processSchemasApi.ts` — `getProcessSchemas()` fetches `/api/processes/schemas`, memoised, with `processesConfigSpec.ts` as offline fallback (kept as types-only + last-known snapshot).
- `src/modules/system/components/processes/ProcessConfigForm.tsx` — generic renderer: number input (with unit suffix, min/max/step), switch for bool, select for enum. Per-field "Reset to default" and per-process "Reset all". Uses `t()` for every label/help.

Changes:
- `src/modules/system/pages/ProcessesPage.tsx` — replace the current per-key manual config UI with `<ProcessConfigForm schema={schema[key]} value={cfg} onChange={...} />`. `effectiveSettings()` continues to drive the read-only summary but is fed from the API schema.
- `processesConfigSpec.ts` becomes: (a) `ProcessConfigField` type, (b) static snapshot used only when the API call fails. New fields (grace_days, batch_size, fallback_retention_days) added here too.

**Translations** — every new label goes into both locales:

- `src/modules/system/locale/processes.en.json` and `.fr.json`:
  - `units.count`, `units.minutes` (already present) — add `units.count`
  - `config.fields.<field_key>.label` / `.help` for every schema field (`retention_days`, `run_retention_days`, `batch_size`, `grace_hours`, `grace_days`, `days_resolved`, `age_days`, `fallback_retention_days`)
  - `config.reset_field`, `config.reset_all`, `config.default_hint`, `config.out_of_range`, `config.saved`
  - Update existing per-process `hints` strings that hard-code "Config: age_days (default 60, min 7)" to use the same keys via i18n interpolation, so changing a default touches one place.

Backend returns i18n keys, not English strings — the frontend resolves them so both languages stay in sync automatically.

### 5. Verification

- Extend `src/modules/system/services/__tests__/processesCatalog.test.ts`:
  - Every `REAL_HANDLER_KEYS` entry has a schema entry in the snapshot.
  - Every schema field's `LabelI18nKey` / `HelpI18nKey` exists in both `processes.en.json` and `processes.fr.json`.
- New `Backend/Modules/Processes/Tests/ProcessConfigSchemaTests.cs`:
  - `GetInt` returns fallback on empty JSON.
  - Values below `Min` / above `Max` clamp.
  - String-typed numbers accepted (existing behaviour preserved).
  - Upsert endpoint rejects unknown enum, drops unknown keys.
- Manual smoke: open Processes page, edit `age_days` on `admin.notifications-purge-read`, save, Run now, confirm `output.age_days` and `deleted` reflect the new value; toggle language to FR and confirm labels translate.

## Files touched

**Added**
- `Backend/Modules/Processes/Services/ProcessConfigSchema.cs`
- `Backend/Modules/Processes/Tests/ProcessConfigSchemaTests.cs`
- `Backend/Migrations/20260728_processes_backfill_config_defaults.sql`
- `src/modules/system/services/processSchemasApi.ts`
- `src/modules/system/components/processes/ProcessConfigForm.tsx`

**Changed**
- `Backend/Modules/Processes/Services/Handlers/CoreProcessHandlers.cs`
- `Backend/Modules/Processes/Services/Handlers/PurgeSystemLogsHandler.cs`
- `Backend/Modules/Processes/Services/Handlers/RetryFailedEmailsHandler.cs`
- `Backend/Modules/Processes/Services/Handlers/RetryUnsentEmailsHandler.cs`
- `Backend/Modules/Processes/Controllers/ProcessesController.cs`
- `Backend/Modules/Processes/DTOs/ProcessDtos.cs` (new `ProcessConfigFieldDto`, schemas response)
- `src/modules/system/pages/ProcessesPage.tsx`
- `src/modules/system/services/processesConfigSpec.ts` (types + fallback snapshot + new fields)
- `src/modules/system/services/__tests__/processesCatalog.test.ts`
- `src/modules/system/locale/processes.en.json`
- `src/modules/system/locale/processes.fr.json`
- `Backend/Modules/Processes/PROCESSES_SCHEMA.md` (document the schema mechanism + new fields)

## Out of scope

- Cron-style scheduling — still interval-based.
- Per-tenant overrides — still one row per process key.
- Adding processes beyond the existing 20.
