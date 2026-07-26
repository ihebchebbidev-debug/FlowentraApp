/**
 * Config contract for every real process handler.
 *
 * Entries mirror the backend schema at Backend/Modules/Processes/Services/
 * ProcessConfigSchema.cs 1:1. The C# schema is the source of truth (it's what
 * the handler AND the /api/processes/schemas endpoint agree on); this file
 * exists so `effectiveSettings()` can render the exact same defaults, clamps
 * and labels without a network round-trip on first paint, and so a translation
 * catalog can be looked up per field.
 *
 * When a backend default or clamp changes, change it here and in the C# schema
 * AND add a follow-up backfill migration modelled on
 * Backend/Migrations/20260728_processes_backfill_config_defaults.sql.
 */
import { apiFetch } from "@/services/api/apiClient";

export type ProcessConfigUnit = "days" | "hours" | "count";

export interface ProcessConfigField {
  /** Exact JSON property name the handler reads. */
  key: string;
  /** i18n key resolved under `processes.<lang>.json`; falls back to a humanised key. */
  labelI18nKey?: string;
  /** Optional short hint. */
  helpI18nKey?: string;
  /** Human label rendered when the translation is missing. */
  label: string;
  /** Value the handler applies when the key is absent from config. */
  fallback: number;
  /** Clamp range enforced by the handler. */
  min?: number;
  max?: number;
  /** Unit shown next to the field ("days" / "hours" / "count"). */
  unit?: ProcessConfigUnit;
}

// ── Local fallback catalog ────────────────────────────────────────────────
// If the /schemas API is unreachable (offline dev, backend down), the UI still
// renders correct defaults. This IS allowed to drift only until the next fetch
// completes — the fetched schema always wins when both are present.
const DAYS = (key: string, fallback: number, min: number, max = 3650): ProcessConfigField =>
  ({ key, label: humanise(key), fallback, min, max, unit: "days", labelI18nKey: `config.fields.${key}.label`, helpI18nKey: `config.fields.${key}.help` });
const HOURS = (key: string, fallback: number, min: number, max: number): ProcessConfigField =>
  ({ key, label: humanise(key), fallback, min, max, unit: "hours", labelI18nKey: `config.fields.${key}.label`, helpI18nKey: `config.fields.${key}.help` });
const COUNT = (key: string, fallback: number, min: number, max: number): ProcessConfigField =>
  ({ key, label: humanise(key), fallback, min, max, unit: "count", labelI18nKey: `config.fields.${key}.label`, helpI18nKey: `config.fields.${key}.help` });

export const PROCESS_CONFIG_FIELDS: Record<string, ProcessConfigField[]> = {
  "admin.invoices-mark-overdue":             [DAYS("grace_days", 0, 0, 60)],
  "admin.offers-mark-expired":               [DAYS("grace_days", 0, 0, 60)],
  "admin.dispatches-mark-missed":            [HOURS("grace_hours", 2, 1, 168)],
  "admin.payment-installments-mark-overdue": [DAYS("grace_days", 0, 0, 60)],
  "admin.support-tickets-autoclose-resolved":[DAYS("days_resolved", 7, 1, 365)],
  "admin.draft-offers-purge":                [DAYS("age_days", 60, 7)],
  "admin.draft-invoices-purge":              [DAYS("age_days", 60, 7)],
  "admin.notifications-purge-read":          [DAYS("age_days", 30, 1)],
  "admin.notifications-purge-stale-unread":  [DAYS("age_days", 180, 30)],
  "admin.calendar-events-purge-past":        [DAYS("age_days", 180, 30)],
  "admin.sync-changes-purge":                [DAYS("age_days", 30, 1)],
  "admin.sync-receipts-purge":               [DAYS("age_days", 30, 1)],
  "admin.webhook-jobs-purge":                [DAYS("age_days", 30, 1)],
  "admin.external-endpoint-logs-purge":      [DAYS("fallback_retention_days", 30, 1)],
  "admin.dispatch-audit-purge":              [DAYS("age_days", 180, 30)],
  "admin.hr-audit-purge":                    [DAYS("age_days", 365, 90)],
  "admin.soft-deleted-purge":                [DAYS("age_days", 90, 30)],
  "admin.recurring-task-logs-purge":         [DAYS("age_days", 180, 30)],
  "admin.purge-system-logs": [
    DAYS("retention_days", 30, 1),
    // Handler floors at 30 days regardless — see PurgeSystemLogsHandler.
    DAYS("run_retention_days", 30, 30),
  ],
  "admin.retry-failed-emails":               [COUNT("batch_size", 50, 1, 500)],
};

function humanise(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Schema fetch: API is the runtime truth ───────────────────────────────
interface ApiSchemaField {
  key: string;
  type: string;
  label_i18n_key: string;
  help_i18n_key?: string | null;
  unit?: string | null;
  fallback: number | boolean;
  min?: number | null;
  max?: number | null;
}
interface ApiSchemaEntry { key: string; fields: ApiSchemaField[]; }

let cache: Record<string, ProcessConfigField[]> | null = null;
let inflight: Promise<Record<string, ProcessConfigField[]>> | null = null;

/**
 * Fetch process schemas from the backend and merge over the local fallback.
 * Cached for the tab session — schemas change with a code deploy, not at runtime.
 */
export async function loadProcessSchemas(): Promise<Record<string, ProcessConfigField[]>> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await apiFetch<{ schemas: ApiSchemaEntry[] }>("/api/processes/schemas");
      const schemas = res.data?.schemas ?? [];
      const merged: Record<string, ProcessConfigField[]> = { ...PROCESS_CONFIG_FIELDS };
      for (const e of schemas) {
        merged[e.key] = e.fields.map((f) => ({
          key: f.key,
          label: humanise(f.key),
          labelI18nKey: f.label_i18n_key,
          helpI18nKey: f.help_i18n_key ?? undefined,
          fallback: typeof f.fallback === "number" ? f.fallback : 0,
          min: f.min ?? undefined,
          max: f.max ?? undefined,
          unit: (f.unit as ProcessConfigUnit | null) ?? undefined,
        }));
      }
      cache = merged;
      return merged;
    } catch {
      cache = { ...PROCESS_CONFIG_FIELDS };
      return cache;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Suffix appended to a value the admin has not overridden. */
export interface ConfigSettingsTexts {
  /** e.g. "(default)" */
  defaultSuffix: string;
  /** Optional per-unit label resolver ("days" -> "d", etc). */
  unit?: (unit: ProcessConfigUnit) => string;
  /** Optional i18n resolver for a field's `labelI18nKey`. */
  translateLabel?: (field: ProcessConfigField) => string;
}

/**
 * Effective settings for a process: the stored config value where one exists,
 * otherwise the handler's real default, flagged as such. Returns [] for
 * handlers that take no configuration — the UI then renders no settings block.
 *
 * Uses the fetched schema when available (accepts the fields map explicitly so
 * callers control caching), otherwise the local fallback.
 */
export function effectiveSettings(
  processKey: string,
  config: Record<string, unknown> | undefined,
  texts: ConfigSettingsTexts = { defaultSuffix: "(default)" },
  fieldsMap: Record<string, ProcessConfigField[]> = PROCESS_CONFIG_FIELDS,
): { label: string; value: string | number | boolean }[] {
  const fields = fieldsMap[processKey];
  if (!fields) return [];
  return fields.map((f) => {
    const raw = config?.[f.key];
    const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    const isSet = Number.isFinite(num);
    const value = isSet ? clamp(num, f.min, f.max) : f.fallback;
    const unitLabel = f.unit && texts.unit ? ` ${texts.unit(f.unit)}` : f.unit ? ` ${f.unit}` : "";
    const label = texts.translateLabel ? texts.translateLabel(f) : f.label;
    return {
      label,
      value: isSet ? `${value}${unitLabel}`.trim() : `${value}${unitLabel} ${texts.defaultSuffix}`.trim(),
    };
  });
}

function clamp(v: number, min?: number, max?: number): number {
  let out = v;
  if (min !== undefined) out = Math.max(min, out);
  if (max !== undefined) out = Math.min(max, out);
  return out;
}

/** Test seam: clear the fetched schema cache between tests. */
export function __resetProcessSchemasCache(): void {
  cache = null;
  inflight = null;
}
