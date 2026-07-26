import "./localStorageShim";
import { describe, it, expect } from "vitest";
import { PROCESSES } from "../processesCatalog";
import { REAL_HANDLER_KEYS, overlay, type ProcessSchedule } from "../processesService";
import { PROCESS_CONFIG_FIELDS, effectiveSettings } from "../processesConfigSpec";

/**
 * The Processes page must never present invented data as live server state.
 * These tests pin the two ways that used to leak through: static catalog
 * placeholders rendering as if they were real, and settings values that did
 * not match what the backend handler would actually apply.
 */

const fmt = (m: number) => `Every ${m} min`;
const texts = {
  notRegistered: "not registered",
  overdue: (n: string) => `overdue ${n}`,
  disabled: "disabled",
  configDefault: "(default)",
};

function schedule(over: Partial<ProcessSchedule> = {}): ProcessSchedule {
  return {
    key: "admin.notifications-purge-read",
    name: "Purge read notifications",
    enabled: true,
    paused: false,
    interval_minutes: 1440,
    max_retries: 3,
    retry_backoff_seconds: 60,
    config: {},
    timezone: "UTC",
    next_run_at: new Date(Date.now() + 60_000).toISOString(),
    last_run_at: new Date().toISOString(),
    last_status: "success",
    consecutive_failures: 0,
    block_reason: null,
    updated_at: new Date().toISOString(),
    has_handler: true,
    ...over,
  };
}

const def = (key: string) => PROCESSES.find((p) => p.key === key)!;

describe("processes: no fabricated data", () => {
  it("catalog entries carry no invented runtime state", () => {
    for (const p of PROCESSES) {
      // A row that never got overlaid with server data must look unusable,
      // not healthy — no "100% success", no all-green diagnostics.
      expect(p.successRate30).toBeUndefined();
      expect(p.diagnostics).toEqual([]);
      expect(p.settings).toEqual([]);
      expect(p.history).toEqual([]);
      expect(p.status).toBe("blocked");
    }
  });

  it("a process with no schedule row reports blocked, not healthy", () => {
    const o = overlay(def("admin.notifications-purge-read"), undefined, fmt, new Set(), texts);
    expect(o.status).toBe("blocked");
    expect(o.blockReason).toBe(texts.notRegistered);
    expect(o.successRate30).toBeUndefined();
    expect(o.lastRunAt).toBeUndefined();
  });

  it("success rate comes from real run counts only", () => {
    const none = overlay(def("admin.notifications-purge-read"), schedule(), fmt, new Set(), texts);
    expect(none.successRate30).toBeUndefined();

    const some = overlay(
      def("admin.notifications-purge-read"),
      schedule({ recent_total: 4, recent_success: 3 }),
      fmt, new Set(), texts
    );
    expect(some.successRate30).toBe(75);
  });

  it("settings show stored config, or the handler's real default flagged as such", () => {
    const stored = overlay(
      def("admin.notifications-purge-read"),
      schedule({ config: { age_days: 7 } }),
      fmt, new Set(), texts
    );
    expect(stored.settings).toEqual([{ label: "Age (days)", value: 7 }]);

    const fallback = overlay(def("admin.notifications-purge-read"), schedule(), fmt, new Set(), texts);
    // 30 is the literal default in CoreProcessHandlers.NotificationsPurgeReadHandler.
    expect(fallback.settings).toEqual([{ label: "Age (days)", value: "30 (default)" }]);
  });

  it("handlers that take no config expose no settings", () => {
    const o = overlay(
      def("admin.invoices-mark-overdue"),
      schedule({ key: "admin.invoices-mark-overdue", interval_minutes: 60 }),
      fmt, new Set(), texts
    );
    expect(o.settings).toEqual([]);
  });

  it("config values are clamped to the handler's own range", () => {
    // The handler clamps age_days to 1..3650, so the UI must not promise 9999.
    expect(effectiveSettings("admin.notifications-purge-read", { age_days: 9999 }))
      .toEqual([{ label: "Age (days)", value: 3650 }]);
  });

  it("every config spec targets a real handler key", () => {
    const unknown = Object.keys(PROCESS_CONFIG_FIELDS).filter((k) => !REAL_HANDLER_KEYS.has(k));
    expect(unknown).toEqual([]);
  });
});

describe("processes: status reflects the service, never a placeholder", () => {
  it("an enabled, on-time schedule is running but not executing", () => {
    const o = overlay(def("admin.notifications-purge-read"), schedule(), fmt, new Set(), texts);
    expect(o.status).toBe("running");
    expect(o.isExecuting).toBe(false);
  });

  it("an in-flight run is marked executing", () => {
    const o = overlay(def("admin.notifications-purge-read"), schedule({ is_running: true }), fmt, new Set(), texts);
    expect(o.isExecuting).toBe(true);
    expect(o.status).toBe("running");
  });

  it("a long-overdue schedule is blocked, not quietly running", () => {
    const o = overlay(
      def("admin.notifications-purge-read"),
      schedule({ next_run_at: new Date(Date.now() - 30 * 24 * 3600_000).toISOString() }),
      fmt, new Set(), texts
    );
    expect(o.status).toBe("blocked");
    expect(o.blockReason).toContain("overdue");
  });

  it("a failing schedule reports failed", () => {
    const o = overlay(
      def("admin.notifications-purge-read"),
      schedule({ last_status: "failed", consecutive_failures: 2, last_error: "boom" }),
      fmt, new Set(), texts
    );
    expect(o.status).toBe("failed");
    expect(o.lastError).toBe("boom");
  });

  it("a paused or disabled schedule reports paused", () => {
    expect(overlay(def("admin.notifications-purge-read"), schedule({ paused: true }), fmt, new Set(), texts).status)
      .toBe("paused");
    expect(overlay(def("admin.notifications-purge-read"), schedule({ enabled: false }), fmt, new Set(), texts).status)
      .toBe("paused");
  });
});
