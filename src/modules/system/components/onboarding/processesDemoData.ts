/**
 * Data layer for the Processes onboarding demo.
 *
 * The demo is a scripted walkthrough, so it cannot hit the API — but every
 * value it shows is still produced by the REAL production code path:
 *
 *   scripted ProcessSchedule row  →  overlay()  →  rendered row
 *
 * overlay() is the exact function the live Administration > Processes page
 * uses, so the demo's statuses, block reasons, failure handling, success
 * rates, effective settings and diagnostics are computed by production logic
 * rather than hand-written strings. If the status rules change, the demo
 * changes with them — it can never drift into showing something the real page
 * would never show.
 *
 * The only invented part is the *scenario input* (which job is mid-run, which
 * one the scheduler missed, which one failed), chosen so the tour can explain
 * every state an admin will actually meet.
 */

import {
  overlay,
  type ProcessSchedule,
} from "@/modules/system/services/processesService";
import { PROCESSES, type ProcessDefinition, type ProcessRun } from "@/modules/system/services/processesCatalog";
import { DEMO_REAL_PROCESSES } from "./processesDemoScript";

/** The job the drawer chapter deep-dives into. */
export const DEMO_FOCUS_KEY = "admin.invoices-mark-overdue";
/** The job shown mid-execution, so the "Running now" KPI has something to count. */
export const DEMO_EXECUTING_KEY = "admin.retry-failed-emails";
/** The job whose last run failed and is awaiting retry. */
export const DEMO_FAILED_KEY = "admin.external-endpoint-logs-purge";
/** The job the scheduler stopped picking up — overlay() derives "blocked" from this. */
export const DEMO_OVERDUE_KEY = "admin.hr-audit-purge";
/** The job an operator paused. */
export const DEMO_PAUSED_KEY = "admin.recurring-task-logs-purge";

const CATALOG = new Map(PROCESSES.map((p) => [p.key, p]));
const BASE = Date.now();
const ago = (min: number) => new Date(BASE - min * 60_000).toISOString();
const ahead = (min: number) => new Date(BASE + min * 60_000).toISOString();

/** Same "Every N min" phrasing the real page renders. */
function fmtSchedule(minutes: number, paused: boolean, enabled: boolean): string {
  const every =
    minutes % 1440 === 0 ? `Every ${minutes / 1440} day${minutes / 1440 > 1 ? "s" : ""}` :
    minutes % 60 === 0 ? `Every ${minutes / 60} hour${minutes / 60 > 1 ? "s" : ""}` :
    `Every ${minutes} min`;
  if (!enabled) return `${every} (disabled)`;
  if (paused) return `${every} (paused)`;
  return every;
}

/** Builds the scripted server row for one process. */
function scheduleFor(def: ProcessDefinition, index: number): ProcessSchedule {
  const interval = def.intervalMinutes ?? 60;
  // Spread last/next runs across the list so it reads like a live scheduler.
  const sinceLast = Math.round(interval * (0.2 + ((index * 37) % 60) / 100));
  const base: ProcessSchedule = {
    key: def.key,
    name: def.name,
    enabled: true,
    paused: false,
    interval_minutes: interval,
    max_retries: 3,
    retry_backoff_seconds: 60,
    config: {},
    timezone: def.timezone,
    next_run_at: ahead(Math.max(1, interval - sinceLast)),
    last_run_at: ago(sinceLast),
    last_status: "success",
    consecutive_failures: 0,
    block_reason: null,
    updated_at: ago(sinceLast),
    has_handler: true,
    last_duration_ms: 120 + ((index * 53) % 400),
    last_items_processed: (index * 7) % 12,
    last_triggered_by: "schedule",
    // Real 30-run statistics: overlay() turns these into the success rate, and
    // renders "—" when a job has no runs recorded yet.
    recent_total: 30,
    recent_success: 30,
  };

  switch (def.key) {
    case DEMO_EXECUTING_KEY:
      return { ...base, is_running: true, last_items_processed: 2 };
    case DEMO_FAILED_KEY:
      return {
        ...base,
        last_status: "failed",
        consecutive_failures: 2,
        last_error: "Statement timeout while deleting ExternalEndpointLogs (30s) — will retry.",
        last_attempt: 2,
        next_retry_at: ahead(4),
        last_items_processed: 0,
        recent_success: 28,
      };
    case DEMO_OVERDUE_KEY:
      // next_run_at far in the past + enabled + not paused ⇒ overlay() decides
      // this is blocked and writes the "overdue" reason itself.
      return { ...base, next_run_at: ago(interval * 12), last_run_at: ago(interval * 13) };
    case DEMO_PAUSED_KEY:
      return { ...base, paused: true, next_run_at: null };
    case DEMO_FOCUS_KEY:
      return { ...base, config: { grace_hours: 24 }, last_duration_ms: 184, last_items_processed: 3 };
    default:
      return base;
  }
}

export interface DemoRow {
  /** Fully overlaid definition — identical shape to the live page's rows. */
  process: ProcessDefinition;
  /** Pre-rendered relative labels, so the demo never re-computes on each frame. */
  lastLabel: string;
  nextLabel: string;
  moduleLabel: string;
}

function relative(iso: string | undefined, future: boolean): string {
  if (!iso) return "—";
  const diff = Math.abs(new Date(iso).getTime() - BASE);
  const m = Math.round(diff / 60_000);
  const text = m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`;
  return future ? `in ${text}` : `${text} ago`;
}

export const DEMO_ROWS: DemoRow[] = DEMO_REAL_PROCESSES.map((p, i) => {
  const def = CATALOG.get(p.key)!;
  const process = overlay(def, scheduleFor(def, i), fmtSchedule);
  return {
    process,
    lastLabel: relative(process.lastRunAt, false),
    nextLabel: process.isPaused ? "paused" : relative(process.nextRunAt, true),
    moduleLabel: p.module,
  };
});

/** KPI counters, counted exactly the way the real header counts them. */
export const DEMO_KPIS = {
  running: DEMO_ROWS.filter((r) => r.process.isExecuting).length,
  failed: DEMO_ROWS.filter((r) => r.process.status === "failed").length,
  blocked: DEMO_ROWS.filter((r) => r.process.status === "blocked").length,
  paused: DEMO_ROWS.filter((r) => r.process.status === "paused").length,
  total: DEMO_ROWS.length,
};

export const DEMO_FOCUS_ROW: DemoRow =
  DEMO_ROWS.find((r) => r.process.key === DEMO_FOCUS_KEY) ?? DEMO_ROWS[0];

/** Run history for the drawer — the same ProcessRun shape the API returns. */
export const DEMO_HISTORY: ProcessRun[] = [
  { id: "h1", startedAt: ago(12),  finishedAt: ago(12), durationMs: 184, status: "success", itemsProcessed: 3, triggeredBy: "schedule" },
  { id: "h2", startedAt: ago(72),  finishedAt: ago(72), durationMs: 191, status: "success", itemsProcessed: 2, triggeredBy: "schedule" },
  { id: "h3", startedAt: ago(132), finishedAt: ago(132), durationMs: 208, status: "success", itemsProcessed: 5, triggeredBy: "schedule" },
  {
    id: "h4", startedAt: ago(192), finishedAt: ago(192), durationMs: 512, status: "failed", itemsProcessed: 0,
    triggeredBy: "schedule", error: "Database connection reset — retried automatically on the next tick.",
  },
  {
    id: "h5", startedAt: ago(252), finishedAt: ago(252), durationMs: 0, status: "skipped", itemsProcessed: 0,
    triggeredBy: "schedule", blockReason: "Previous run still holding the advisory lock — this tick was skipped.",
  },
  { id: "h6", startedAt: ago(312), finishedAt: ago(312), durationMs: 173, status: "success", itemsProcessed: 1, triggeredBy: "schedule" },
];

/** The manual run the tour triggers, prepended once the "Run now" step plays. */
export const DEMO_MANUAL_RUN: ProcessRun = {
  id: "h0", startedAt: ago(0), finishedAt: ago(0), durationMs: 186,
  status: "success", itemsProcessed: 4, triggeredBy: "manual",
};

export const relativeLabel = relative;
