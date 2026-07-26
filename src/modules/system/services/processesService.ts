/**
 * Real-execution service layer for Administration > Processes.
 *
 * Uses the static catalog (processesCatalog.ts) for process METADATA ONLY —
 * name, workspace, description, module anchor. Every runtime value shown in the
 * UI (status, last/next run, duration, items processed, success rate,
 * diagnostics, effective settings) is read from the backend Processes module
 * (Backend/Modules/Processes); nothing is simulated or defaulted to a
 * flattering placeholder.
 *
 * Backend endpoints (see Backend/Modules/Processes/Controllers/ProcessesController.cs):
 *   GET  /api/processes/schedules
 *   PUT  /api/processes/schedules
 *   POST /api/processes/schedules/{key}/pause?paused=
 *   POST /api/processes/schedules/{key}/enable?enabled=
 *   GET  /api/processes/runs/{key}?limit=
 *   POST /api/processes/run   { key }
 *
 * All 20 keys in REAL_HANDLER_KEYS have a registered handler in
 * Backend/Modules/Processes/Services/Handlers and an entry in
 * ProcessSchedulerService.BuiltInSchedules, so they auto-seed on scheduler boot
 * and run on their own interval. "Run now" invokes the same handler through
 * POST /api/processes/run.
 */
import { apiFetch } from "@/services/api/apiClient";
import { PROCESSES, type DiagnosticCheck, type ProcessDefinition, type ProcessRun } from "./processesCatalog";
import { effectiveSettings } from "./processesConfigSpec";


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
  // The shared api client can short-circuit a mutation into the offline sync
  // queue and hand back a synthetic { queued: true } envelope with HTTP 202.
  // Processes are live server-side jobs — a queued "Run now" never executes and
  // nothing persists, which looked exactly like a silent success in the UI.
  // Treat any queued/synthetic envelope as a hard error instead.
  const envelope = res.data as unknown as { queued?: boolean; offline?: boolean; skippedOffline?: boolean };
  if (envelope && typeof envelope === "object" && (envelope.queued || envelope.offline || envelope.skippedOffline)) {
    throw new ProcessesApiError(
      503,
      "You appear to be offline. Background processes run on the server and cannot be queued — reconnect and try again."
    );
  }
  return res.data;
}

/**
 * Every Processes request must hit the real server.
 *
 * The shared api client otherwise (a) queues mutations into the offline sync
 * engine and (b) can answer GETs from the hydration cache. Both make this page
 * lie: "Run now" reports started but nothing ever runs, and a reload shows a
 * cached snapshot, so no change appears to persist. These headers opt the whole
 * module out of both layers.
 */
function processesFetch<T>(endpoint: string, options: RequestInit = {}) {
  return apiFetch<T>(endpoint, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      "X-Bypass-Offline-Queue": "true",
      "X-Bypass-Hydration-Cache": "true",
    },
  });
}

/**
 * Hard-refresh escape hatch. Even with the bypass headers, an intermediate
 * proxy / service worker / browser heuristic cache can keep serving the same
 * GET body. When the UI detects it is being fed stale data it retries with a
 * unique query string plus explicit no-store headers, which no cache layer can
 * satisfy from a stored response.
 */
function bust(endpoint: string, hard: boolean) {
  if (!hard) return endpoint;
  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}_hr=${Date.now()}`;
}

function hardHeaders(hard: boolean): Record<string, string> {
  return hard ? { "Cache-Control": "no-cache, no-store", Pragma: "no-cache" } : {};
}

export async function listSchedules(hard = false): Promise<Map<string, ProcessSchedule>> {
  const rows = unwrap(
    await processesFetch<ProcessSchedule[]>(bust("/api/processes/schedules", hard), {
      headers: hardHeaders(hard),
    })
  );
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
  // Snake_case keys — the backend DTO binds each field via [JsonPropertyName]
  // with the exact snake_case name, so camelCase silently no-ops the update.
  if (input.interval_minutes !== undefined) body.interval_minutes = input.interval_minutes;
  if (input.max_retries !== undefined) body.max_retries = input.max_retries;
  if (input.retry_backoff_seconds !== undefined) body.retry_backoff_seconds = input.retry_backoff_seconds;
  if (input.config !== undefined) body.config = input.config;
  if (input.timezone !== undefined) body.timezone = input.timezone;
  return unwrap(
    await processesFetch<ProcessSchedule>("/api/processes/schedules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  );
}

export async function setEnabled(key: string, enabled: boolean): Promise<void> {
  unwrap(
    await processesFetch<ProcessSchedule>(
      `/api/processes/schedules/${encodeURIComponent(key)}/enable?enabled=${enabled}`,
      { method: "POST" }
    )
  );
}

export async function setPaused(key: string, paused: boolean): Promise<void> {
  unwrap(
    await processesFetch<ProcessSchedule>(
      `/api/processes/schedules/${encodeURIComponent(key)}/pause?paused=${paused}`,
      { method: "POST" }
    )
  );
}

export async function resetFailures(key: string): Promise<ProcessSchedule> {
  return unwrap(
    await processesFetch<ProcessSchedule>(
      `/api/processes/schedules/${encodeURIComponent(key)}/reset-failures`,
      { method: "POST" }
    )
  );
}

/**
 * Cooperatively stop the in-flight run for a process. Backend cancels the
 * handler's CancellationToken so it aborts at the next await point.
 * Returns whether a run was actually in flight.
 */
export async function stopRun(key: string): Promise<boolean> {
  const res = unwrap(
    await processesFetch<{ key: string; stopped: boolean }>(
      `/api/processes/schedules/${encodeURIComponent(key)}/stop`,
      { method: "POST" }
    )
  );
  return res.stopped;
}



/** Keys whose most recent run is still in-flight. Used to show a live "running" pill. */
export async function listRunningKeys(hard = false): Promise<Set<string>> {
  try {
    const rows = unwrap(
      await processesFetch<string[]>(bust("/api/processes/running-keys", hard), {
        headers: hardHeaders(hard),
      })
    );
    return new Set(rows);
  } catch {
    return new Set();
  }
}

export async function listRuns(key: string, limit = 20, hard = false): Promise<ProcessRun[]> {
  const rows = unwrap(
    await processesFetch<ApiRun[]>(
      bust(`/api/processes/runs/${encodeURIComponent(key)}?limit=${limit}`, hard),
      { headers: hardHeaders(hard) }
    )
  );
  return rows.map(apiRunToUi);
}

/** Trigger a single process now via the backend controller. */
export async function runNow(
  key: string
): Promise<{ status: string; duration_ms: number; items_processed?: number; error?: string; block_reason?: string; output?: unknown }> {
  const res = unwrap(
    await processesFetch<{ status?: string; duration_ms?: number; items_processed?: number; error?: string; block_reason?: string; output?: unknown }>(
      "/api/processes/run",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      }
    )
  );
  // A real execution always reports a status. Anything else means the request
  // never reached the handler (proxy/offline shim) — fail loudly rather than
  // showing a success toast for a run that never happened.
  if (!res || typeof res.status !== "string") {
    throw new ProcessesApiError(502, "The server did not confirm the run — no execution result was returned.");
  }
  return { ...res, status: res.status, duration_ms: res.duration_ms ?? 0 };
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

/** Localised reason strings for the states the overlay derives itself. */
export interface OverlayTexts {
  /** No schedule row exists on the server for this key. */
  notRegistered: string;
  /** next_run_at is far in the past — the scheduler is not picking the job up. */
  overdue: (nextRunAt: string) => string;
  /** Enabled === false (stopped by an operator, not merely paused). */
  disabled: string;
  /** Marks a setting the admin has not overridden, e.g. "(default)". */
  configDefault: string;
}

const DEFAULT_OVERLAY_TEXTS: OverlayTexts = {
  notRegistered: "Not registered on the server — this job is not scheduled and will never run.",
  overdue: (n) => `Overdue — the scheduler has not executed this job since it was due at ${new Date(n).toLocaleString()}.`,
  disabled: "Disabled — switched off by an administrator.",
  configDefault: "(default)",
};


/**
 * Merge the mock catalog with the persisted schedules so the UI can render
 * every known process, with live status for those that have schedule rows.
 *
 * Status semantics (deliberately: no "idle"):
 *   running — the service is live: either executing right now, or enabled,
 *             scheduled and on time. `isExecuting` distinguishes the two.
 *   blocked — something stops it: no handler, a block reason, no schedule row
 *             on the server, or a next_run_at far enough in the past that the
 *             scheduler is demonstrably not picking it up.
 *   failed  — last run failed / consecutive failures pending retry.
 *   paused  — deliberately stopped by an operator (paused or disabled).
 *
 * A scheduled job spends almost all its life between runs, so the old "idle"
 * resting state made every healthy service look dead. "running" now describes
 * the service, and `isExecuting` describes the instant.
 */
export function overlay(
  def: ProcessDefinition,
  s: ProcessSchedule | undefined,
  /** Localised "Every N min (paused)" formatter — required so the row text is always translated. */
  fmtSchedule: (minutes: number, paused: boolean, enabled: boolean) => string,
  runningKeys?: Set<string>,
  texts: OverlayTexts = DEFAULT_OVERLAY_TEXTS
): ProcessDefinition {
  // A key can be reported as running by either source: the dedicated
  // running-keys endpoint, or the live projection embedded in the schedule row.
  const isExecuting = (runningKeys?.has(def.key) ?? false) || (s?.is_running ?? false);
  if (!s) {
    // No schedule row on the server yet: every runtime signal is unknown.
    // Show blanks/unknown instead of the catalog placeholders so we never
    // display fabricated "100% success" or "all green" diagnostics.
    // This is NOT idle — nothing is scheduled, so the job genuinely cannot run.
    return {
      ...def,
      status: isExecuting ? "running" : "blocked",
      isExecuting,
      lastError: undefined,
      blockReason: isExecuting ? undefined : texts.notRegistered,
      lastRunAt: undefined,
      nextRunAt: undefined,
      consecutiveFailures: 0,
      successRate30: undefined,
      // No row means no stored config — show the handler's real defaults, which
      // is exactly what would apply if the schedule were created right now.
      settings: effectiveSettings(def.key, undefined, { defaultSuffix: texts.configDefault }),
      diagnostics: buildDiagnostics(undefined),
    };
  }


  const lastError = s.last_error ?? undefined;
  // A schedule that is enabled, unpaused and whose next_run_at is well in the
  // past is not "waiting" — the scheduler is not picking it up. Grace = three
  // intervals (min 10 min) so a busy tick or a slow run never trips it.
  const graceMs = Math.max(10, (s.interval_minutes || 60) * 3) * 60_000;
  const isOverdue =
    !isExecuting &&
    s.enabled &&
    !s.paused &&
    !!s.next_run_at &&
    Date.now() - new Date(s.next_run_at).getTime() > graceMs;
  const blockReason =
    s.block_reason ??
    (isOverdue && s.next_run_at ? texts.overdue(s.next_run_at) : undefined) ??
    (!s.enabled ? texts.disabled : undefined);
  return {
    ...def,
    isEnabled: s.enabled,
    isPaused: s.paused,
    isExecuting,
    intervalMinutes: s.interval_minutes,
    scheduleHuman: fmtSchedule(s.interval_minutes, s.paused, s.enabled),
    // Real status precedence: executing now > blocked (no handler / block reason
    // / overdue) > failing > stopped by an operator (paused or disabled) >
    // running. Blocked outranks paused because the operator needs to see the
    // problem, not just that the job is stopped. There is deliberately no
    // "idle": an enabled, on-schedule job IS running, it is simply between ticks.
    status: isExecuting ? "running" :
            s.block_reason || s.has_handler === false || isOverdue ? "blocked" :
            s.last_status === "failed" || s.consecutive_failures > 0 ? "failed" :
            !s.enabled || s.paused ? "paused" :
            "running",
    lastRunAt: s.last_run_at ?? undefined,
    nextRunAt: s.next_run_at ?? undefined,
    nextRetryAt: s.next_retry_at ?? undefined,
    maxRetries: s.max_retries,
    lastAttempt: s.last_attempt ?? undefined,
    lastStatus: s.last_status ?? undefined,
    hasHandler: s.has_handler !== false,
    lastDurationMs: s.last_duration_ms ?? undefined,
    lastItems: s.last_items_processed ?? undefined,
    lastError,
    blockReason,

    consecutiveFailures: s.consecutive_failures,
    // Real success rate only — no fabricated 100% baseline. undefined means
    // "no runs recorded yet"; the UI renders it as "—".
    successRate30: s.recent_total && s.recent_total > 0
      ? Math.round(((s.recent_success ?? 0) / s.recent_total) * 100)
      : undefined,
    // Effective settings = what the handler will actually use on its next run:
    // the stored config value, or the handler's own default marked as such.
    settings: effectiveSettings(def.key, s.config, { defaultSuffix: texts.configDefault }),
    diagnostics: buildDiagnostics(s),

  };
}


/**
 * Diagnostics derived from the live schedule row — never from a static template.
 * Each check is a boolean answering "is this reason to be blocked?" so the UI
 * shows red only when the backend is actually in a bad state.
 */
function buildDiagnostics(s: ProcessSchedule | undefined): DiagnosticCheck[] {
  if (!s) {
    return [
      { label: "Schedule registered", ok: false, detail: "No schedule row on the server yet." },
    ];
  }
  return [
    {
      label: "Handler registered",
      ok: s.has_handler !== false,
      detail: s.has_handler === false ? "No backend handler is wired for this key." : undefined,
    },
    { label: "Schedule enabled", ok: s.enabled },
    { label: "Not paused", ok: !s.paused },
    {
      label: "Not blocked",
      ok: !s.block_reason,
      detail: s.block_reason ?? undefined,
    },
    {
      label: "No recent failures",
      ok: s.consecutive_failures === 0 && s.last_status !== "failed",
      detail: s.last_error ?? undefined,
    },
  ];
}

