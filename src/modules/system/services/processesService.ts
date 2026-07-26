/**
 * Real-execution service layer for Administration > Processes.
 *
 * Uses the FE mock catalog (processesMock.ts) as the source of truth for
 * process metadata (name, workspace, description, diagnostics templates),
 * and augments each entry with the live schedule + run history from the
 * backend Processes module (Backend/Modules/Processes).
 *
 * Backend endpoints (see Backend/Modules/Processes/Controllers/ProcessesController.cs):
 *   GET  /api/processes/schedules
 *   PUT  /api/processes/schedules
 *   POST /api/processes/schedules/{key}/pause?paused=
 *   POST /api/processes/schedules/{key}/enable?enabled=
 *   GET  /api/processes/runs/{key}?limit=
 *   POST /api/processes/run   { key }
 *
 * Handlers wired backend-side today (see Backend/Modules/Processes/Services/Handlers):
 *   - admin.purge-system-logs
 *   - admin.retry-failed-emails
 * Both auto-seed on scheduler boot and run on their own interval; the
 * "Run now" button reuses the same handler through POST /api/processes/run.
 */
import { apiFetch } from "@/services/api/apiClient";
import { PROCESSES, type ProcessDefinition, type ProcessRun } from "./processesMock";

/**
 * Process keys that are backed by a real, end-to-end reliable backend handler.
 * The UI filters the catalog to just these so users never see jobs whose logic
 * isn't proven — every entry here has a registered handler in
 * Backend/Modules/Processes/Services/Handlers and runs automatically on the
 * scheduler with no admin setup required.
 */
export const REAL_HANDLER_KEYS = new Set<string>([
  "admin.purge-system-logs",
  "admin.retry-failed-emails",
  "admin.invoices-mark-overdue",
  "admin.offers-mark-expired",
  "admin.dispatches-mark-missed",
  "admin.payment-installments-mark-overdue",
  "admin.support-tickets-autoclose-resolved",
  "admin.draft-offers-purge",
  "admin.draft-invoices-purge",
  "admin.notifications-purge-read",
  "admin.notifications-purge-stale-unread",
  "admin.calendar-events-purge-past",
  "admin.sync-changes-purge",
  "admin.sync-receipts-purge",
  "admin.webhook-jobs-purge",
  "admin.external-endpoint-logs-purge",
  "admin.dispatch-audit-purge",
  "admin.hr-audit-purge",
  "admin.soft-deleted-purge",
  "admin.recurring-task-logs-purge",
]);

export interface ProcessSchedule {
  key: string;
  name: string;
  enabled: boolean;
  paused: boolean;
  interval_minutes: number;
  max_retries: number;
  retry_backoff_seconds: number;
  config: Record<string, unknown>;
  timezone: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_status: string | null;
  consecutive_failures: number;
  block_reason: string | null;
  updated_at: string;
  // Live runtime state projected from the latest run by GET /schedules.
  is_running?: boolean;
  last_error?: string | null;
  last_duration_ms?: number | null;
  last_items_processed?: number | null;
  last_triggered_by?: string | null;
  last_attempt?: number | null;
  next_retry_at?: string | null;
  has_handler?: boolean;
  recent_total?: number;
  recent_success?: number;
}

type ApiRun = {
  id: number;
  process_key: string;
  triggered_by: "schedule" | "manual" | "retry";
  attempt: number;
  status: "running" | "success" | "failed" | "blocked" | "skipped";
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  items_processed: number | null;
  error: string | null;
  block_reason: string | null;
  next_retry_at: string | null;
};

export class ProcessesApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ProcessesApiError";
  }
}

function unwrap<T>(res: { data: T | null; error?: string; status: number }): T {
  if (res.error) throw new ProcessesApiError(res.status, res.error);
  if (res.data == null) throw new ProcessesApiError(res.status, `Empty response (HTTP ${res.status})`);
  return res.data;
}

export async function listSchedules(): Promise<Map<string, ProcessSchedule>> {
  const rows = unwrap(await apiFetch<ProcessSchedule[]>("/api/processes/schedules"));
  return new Map(rows.map((r) => [r.key, r]));
}

export async function upsertSchedule(
  input: Partial<ProcessSchedule> & { key: string }
): Promise<ProcessSchedule> {
  const def = PROCESSES.find((p) => p.key === input.key);
  // PATCH semantics: only send fields the caller actually set. The backend applies
  // each field only when present, so sending defaults here would silently re-enable
  // / un-pause a schedule when the user is merely editing its interval.
  const body: Record<string, unknown> = {
    key: input.key,
    name: input.name ?? def?.name ?? input.key,
  };
  if (input.enabled !== undefined) body.enabled = input.enabled;
  if (input.paused !== undefined) body.paused = input.paused;
  if (input.interval_minutes !== undefined) body.intervalMinutes = input.interval_minutes;
  if (input.max_retries !== undefined) body.maxRetries = input.max_retries;
  if (input.retry_backoff_seconds !== undefined) body.retryBackoffSeconds = input.retry_backoff_seconds;
  if (input.config !== undefined) body.config = input.config;
  if (input.timezone !== undefined) body.timezone = input.timezone;
  return unwrap(
    await apiFetch<ProcessSchedule>("/api/processes/schedules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function setEnabled(key: string, enabled: boolean): Promise<void> {
  unwrap(
    await apiFetch<ProcessSchedule>(
      `/api/processes/schedules/${encodeURIComponent(key)}/enable?enabled=${enabled}`,
      { method: "POST" }
    )
  );
}

export async function setPaused(key: string, paused: boolean): Promise<void> {
  unwrap(
    await apiFetch<ProcessSchedule>(
      `/api/processes/schedules/${encodeURIComponent(key)}/pause?paused=${paused}`,
      { method: "POST" }
    )
  );
}

export async function resetFailures(key: string): Promise<ProcessSchedule> {
  return unwrap(
    await apiFetch<ProcessSchedule>(
      `/api/processes/schedules/${encodeURIComponent(key)}/reset-failures`,
      { method: "POST" }
    )
  );
}


/** Keys whose most recent run is still in-flight. Used to show a live "running" pill. */
export async function listRunningKeys(): Promise<Set<string>> {
  try {
    const rows = unwrap(await apiFetch<string[]>("/api/processes/running-keys"));
    return new Set(rows);
  } catch {
    return new Set();
  }
}

export async function listRuns(key: string, limit = 20): Promise<ProcessRun[]> {
  const rows = unwrap(
    await apiFetch<ApiRun[]>(
      `/api/processes/runs/${encodeURIComponent(key)}?limit=${limit}`
    )
  );
  return rows.map(apiRunToUi);
}

/** Trigger a single process now via the backend controller. */
export async function runNow(
  key: string
): Promise<{ status: string; duration_ms: number; error?: string; block_reason?: string; output?: unknown }> {
  return unwrap(
    await apiFetch("/api/processes/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key }),
    })
  );
}

function apiRunToUi(r: ApiRun): ProcessRun {
  // "running" and "skipped" are real backend states — mapping them to "cancelled"
  // (the old behaviour) mislabelled in-flight and no-op runs in the history tab.
  const status: ProcessRun["status"] =
    r.status === "success" ? "success" :
    r.status === "failed"  ? "failed"  :
    r.status === "blocked" ? "blocked" :
    r.status === "running" ? "running" :
    r.status === "skipped" ? "skipped" : "cancelled";
  return {
    id: String(r.id),
    startedAt: r.started_at,
    finishedAt: r.finished_at ?? undefined,
    durationMs: r.duration_ms ?? 0,
    status,
    itemsProcessed: r.items_processed ?? 0,
    error: r.error ?? undefined,
    blockReason: r.block_reason ?? undefined,
    triggeredBy: r.triggered_by, // schedule | manual | retry — shown verbatim (translated) in history
  };
}

/**
 * Merge the mock catalog with the persisted schedules so the UI can render
 * every known process, with live status for those that have schedule rows.
 * `runningKeys` (optional) forces the status to "running" for keys whose
 * most recent run is still in-flight on the server.
 */
export function overlay(
  def: ProcessDefinition,
  s: ProcessSchedule | undefined,
  runningKeys?: Set<string>,
  /** Localised "Every N min (paused)" formatter — keeps the row text translated. */
  fmtSchedule?: (minutes: number, paused: boolean, enabled: boolean) => string
): ProcessDefinition {
  // A key can be reported as running by either source: the dedicated
  // running-keys endpoint, or the live projection embedded in the schedule row.
  const isRunning = (runningKeys?.has(def.key) ?? false) || (s?.is_running ?? false);
  if (!s) {
    // No schedule row on the server yet: the catalog's placeholder runtime
    // fields (status/lastError/lastRunAt) are NOT real, so blank them out
    // rather than displaying fiction as live state.
    return {
      ...def,
      status: isRunning ? "running" : "idle",
      lastError: undefined,
      blockReason: undefined,
      lastRunAt: undefined,
      nextRunAt: undefined,
      consecutiveFailures: 0,
    };
  }
  const lastError = s.last_error ?? undefined;
  const blockReason = s.block_reason ?? undefined;
  return {
    ...def,
    isEnabled: s.enabled,
    isPaused: s.paused,
    intervalMinutes: s.interval_minutes,
    scheduleHuman: fmtSchedule
      ? fmtSchedule(s.interval_minutes, s.paused, s.enabled)
      : `Every ${s.interval_minutes} min${s.paused ? " (paused)" : s.enabled ? "" : " (disabled)"}`,
    // Real status precedence: in-flight > blocked (incl. no handler) > failing
    // > paused/disabled > idle. Blocked outranks paused because the operator
    // needs to see the problem, not just that the job is stopped.
    status: isRunning ? "running" :
            blockReason || s.has_handler === false ? "blocked" :
            s.last_status === "failed" || s.consecutive_failures > 0 ? "failed" :
            !s.enabled ? "idle" :
            s.paused ? "paused" : "idle",
    lastRunAt: s.last_run_at ?? undefined,
    nextRunAt: s.next_run_at ?? undefined,
    lastDurationMs: s.last_duration_ms ?? undefined,
    lastItems: s.last_items_processed ?? undefined,
    lastError,
    blockReason,
    consecutiveFailures: s.consecutive_failures,
    successRate30: s.recent_total && s.recent_total > 0
      ? Math.round(((s.recent_success ?? 0) / s.recent_total) * 100)
      : def.successRate30,
  };
}
