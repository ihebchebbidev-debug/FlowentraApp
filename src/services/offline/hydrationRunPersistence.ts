/**
 * Persists the last completed offline hydration run (per tenant/user scope) so
 * Settings / Sync views can show timings and errors after navigation or reload.
 */
import { getOfflineScopeKey } from "./syncEngine";

const STORAGE_PREFIX = "offline-hydration-last-run-v1";

/** Serializable hydration module row (matches HydrationModuleSnapshot). */
export type PersistedHydrationModule = {
  id: string;
  labelKey: string;
  status: "pending" | "running" | "done" | "error" | "skipped";
  done: number;
  total: number;
  error?: string;
  durationMs?: number;
};

export type PersistedHydrationRun = {
  scopeKey: string;
  finishedAt: string;
  startedAt?: string;
  totalDurationMs: number;
  modulesFailed: number;
  fatalError?: string;
  modules: PersistedHydrationModule[];
};

function storageKey(): string {
  return `${STORAGE_PREFIX}:${getOfflineScopeKey()}`;
}

export function savePersistedHydrationRun(payload: PersistedHydrationRun): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function loadPersistedHydrationRun(): PersistedHydrationRun | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedHydrationRun;
    if (!parsed || !Array.isArray(parsed.modules)) return null;
    return parsed;
  } catch {
    return null;
  }
}
