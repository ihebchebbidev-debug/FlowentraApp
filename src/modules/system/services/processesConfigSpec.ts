/**
 * Config contract for every real process handler.
 *
 * These entries mirror the backend handlers 1:1 — each `key`, `fallback`, `min`
 * and `max` is the literal value the C# handler reads out of its config JSON
 * (see Backend/Modules/Processes/Services/Handlers). They exist so the UI can
 * show a process's *actual* effective settings: the value stored on the
 * schedule row when the admin has set one, otherwise the exact default the
 * handler will apply at runtime.
 *
 * Nothing here is decorative. A process with no entry genuinely takes no
 * configuration, and the UI must show no settings for it rather than inventing
 * plausible-looking ones.
 *
 * When a backend handler's default changes, change it here in the same commit.
 */

export interface ProcessConfigField {
  /** Exact JSON property name the handler reads. */
  key: string;
  /** Human label for the settings list. */
  label: string;
  /** Value the handler applies when the key is absent from config. */
  fallback: number;
  /** Clamp range enforced by the handler, if any. */
  min?: number;
  max?: number;
}

export const PROCESS_CONFIG_FIELDS: Record<string, ProcessConfigField[]> = {
  // PurgeSystemLogsHandler
  "admin.purge-system-logs": [
    { key: "retention_days", label: "System log retention (days)", fallback: 30, min: 1 },
    // Defaults to retention_days, then floored at 30 by the handler so shortening
    // log retention can never truncate the process run history below a month.
    { key: "run_retention_days", label: "Run history retention (days)", fallback: 30, min: 30 },
  ],
  // RetryFailedEmailsHandler
  "admin.retry-failed-emails": [
    { key: "batch_size", label: "Batch size", fallback: 50, min: 1, max: 500 },
  ],
  // CoreProcessHandlers
  "admin.dispatches-mark-missed": [
    { key: "grace_hours", label: "Grace period (hours)", fallback: 2, min: 1, max: 168 },
  ],
  "admin.support-tickets-autoclose-resolved": [
    { key: "days_resolved", label: "Resolved for (days)", fallback: 7, min: 1, max: 365 },
  ],
  "admin.draft-offers-purge": [
    { key: "age_days", label: "Age (days)", fallback: 60, min: 7, max: 3650 },
  ],
  "admin.draft-invoices-purge": [
    { key: "age_days", label: "Age (days)", fallback: 60, min: 7, max: 3650 },
  ],
  "admin.notifications-purge-read": [
    { key: "age_days", label: "Age (days)", fallback: 30, min: 1, max: 3650 },
  ],
  "admin.notifications-purge-stale-unread": [
    { key: "age_days", label: "Age (days)", fallback: 180, min: 30, max: 3650 },
  ],
  "admin.calendar-events-purge-past": [
    { key: "age_days", label: "Age (days)", fallback: 180, min: 30, max: 3650 },
  ],
  "admin.sync-changes-purge": [
    { key: "age_days", label: "Age (days)", fallback: 30, min: 1, max: 3650 },
  ],
  "admin.sync-receipts-purge": [
    { key: "age_days", label: "Age (days)", fallback: 30, min: 1, max: 3650 },
  ],
  "admin.webhook-jobs-purge": [
    { key: "age_days", label: "Age (days)", fallback: 30, min: 1, max: 3650 },
  ],
  "admin.dispatch-audit-purge": [
    { key: "age_days", label: "Age (days)", fallback: 180, min: 30, max: 3650 },
  ],
  "admin.hr-audit-purge": [
    { key: "age_days", label: "Age (days)", fallback: 365, min: 90, max: 3650 },
  ],
  "admin.soft-deleted-purge": [
    { key: "age_days", label: "Age (days)", fallback: 90, min: 30, max: 3650 },
  ],
  "admin.recurring-task-logs-purge": [
    { key: "age_days", label: "Age (days)", fallback: 180, min: 30, max: 3650 },
  ],

  // Deliberately empty — these handlers take no config:
  //   admin.invoices-mark-overdue, admin.offers-mark-expired,
  //   admin.payment-installments-mark-overdue (pure due-date comparisons)
  //   admin.external-endpoint-logs-purge (retention is per-endpoint, from the
  //     ExternalEndpoints.LogRetentionDays column, not from process config)
};

/** Suffix appended to a value the admin has not overridden. */
export interface ConfigSettingsTexts {
  /** e.g. "(default)" */
  defaultSuffix: string;
}

/**
 * Effective settings for a process: the stored config value where one exists,
 * otherwise the handler's real default, flagged as such. Returns [] for
 * handlers that take no configuration — the UI then renders no settings block.
 */
export function effectiveSettings(
  processKey: string,
  config: Record<string, unknown> | undefined,
  texts: ConfigSettingsTexts = { defaultSuffix: "(default)" }
): { label: string; value: string | number | boolean }[] {
  const fields = PROCESS_CONFIG_FIELDS[processKey];
  if (!fields) return [];
  return fields.map((f) => {
    const raw = config?.[f.key];
    const num = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    const isSet = Number.isFinite(num);
    const value = isSet ? clamp(num, f.min, f.max) : f.fallback;
    return { label: f.label, value: isSet ? value : `${value} ${texts.defaultSuffix}` };
  });
}

function clamp(v: number, min?: number, max?: number): number {
  let out = v;
  if (min !== undefined) out = Math.max(min, out);
  if (max !== undefined) out = Math.min(max, out);
  return out;
}
