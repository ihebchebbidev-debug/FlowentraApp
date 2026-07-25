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
 * Two handlers are wired backend-side today:
 *   - admin.retry-unsent-emails
 *   - admin.purge-system-logs
 * Every other process still persists its schedule but its "Run now" will
 * respond with a 400 until a handler is registered.
 */
import { apiFetch } from "@/services/api/apiClient";
import { PROCESSES, type ProcessDefinition, type ProcessRun } from "./processesMock";

export const REAL_HANDLER_KEYS = new Set<string>([
  "admin.retry-unsent-emails",
  "admin.purge-system-logs",
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

function unwrap<T>(res: { data: T | null; error?: string; status: number }): T {
  if (res.error) throw new Error(res.error);
  if (res.data == null) throw new Error(`Empty response (HTTP ${res.status})`);
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
  const body = {
    key: input.key,
    name: input.name ?? def?.name ?? input.key,
    enabled: input.enabled ?? true,
    paused: input.paused ?? false,
    intervalMinutes: input.interval_minutes ?? def?.intervalMinutes ?? 60,
    maxRetries: input.max_retries ?? 3,
    retryBackoffSeconds: input.retry_backoff_seconds ?? 60,
    config: input.config ?? {},
    timezone: input.timezone ?? def?.timezone ?? "UTC",
  };
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
  const status: ProcessRun["status"] =
    r.status === "success" ? "success" :
    r.status === "failed"  ? "failed"  :
    r.status === "blocked" ? "blocked" : "cancelled";
  return {
    id: String(r.id),
    startedAt: r.started_at,
    finishedAt: r.finished_at ?? undefined,
    durationMs: r.duration_ms ?? 0,
    status,
    itemsProcessed: r.items_processed ?? 0,
    error: r.error ?? undefined,
    blockReason: r.block_reason ?? undefined,
    triggeredBy: r.triggered_by === "manual" ? "manual" : "schedule",
  };
}

/**
 * Merge the mock catalog with the persisted schedules so the UI can render
 * every known process, with live status for those that have schedule rows.
 */
export function overlay(def: ProcessDefinition, s: ProcessSchedule | undefined): ProcessDefinition {
  if (!s) return def;
  return {
    ...def,
    isEnabled: s.enabled,
    isPaused: s.paused,
    intervalMinutes: s.interval_minutes,
    scheduleHuman: `Every ${s.interval_minutes} min${s.paused ? " (paused)" : s.enabled ? "" : " (disabled)"}`,
    status: !s.enabled ? "idle" :
            s.paused ? "paused" :
            s.block_reason ? "blocked" :
            s.last_status === "failed" ? "failed" : "idle",
    lastRunAt: s.last_run_at ?? def.lastRunAt,
    nextRunAt: s.next_run_at ?? def.nextRunAt,
    blockReason: s.block_reason ?? undefined,
    consecutiveFailures: s.consecutive_failures,
  };
}
