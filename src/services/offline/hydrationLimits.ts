/**
 * Central limits for offline hydration (IndexedDB + Cache API).
 * Override via Vite env (must be prefixed with VITE_) for production tuning.
 */

function readEnv(key: string): string | undefined {
  return (import.meta.env as Record<string, string | boolean | undefined>)[key] as string | undefined;
}

function envInt(key: string, fallback: number): number {
  try {
    const raw = readEnv(key);
    if (raw == null || raw === "") return fallback;
    const n = parseInt(String(raw), 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

function envFloat01(key: string, fallback: number): number {
  try {
    const raw = readEnv(key);
    if (raw == null || raw === "") return fallback;
    const n = parseFloat(String(raw));
    return Number.isFinite(n) && n > 0 && n <= 1 ? n : fallback;
  } catch {
    return fallback;
  }
}

/** Max JSON/text body stored per IndexedDB entry (UTF-8). Default 8 MiB. */
export const HYDRATION_MAX_TEXT_BYTES = envInt("VITE_HYDRATION_MAX_TEXT_BYTES", 8 * 1024 * 1024);

/** Max binary per IndexedDB entry. Default 8 MiB. Larger bodies may use Cache API (below). */
export const HYDRATION_MAX_BINARY_BYTES = envInt("VITE_HYDRATION_MAX_BINARY_BYTES", 8 * 1024 * 1024);

/**
 * Max binary stored via Cache API (larger files than IDB cap, still offline-served).
 * Default 32 MiB. Requires HTTPS or localhost; same CORS rules as fetch.
 */
export const HYDRATION_CACHE_API_MAX_BYTES = envInt("VITE_HYDRATION_CACHE_API_MAX_BYTES", 32 * 1024 * 1024);

/** Total binary bytes budget for document image prefetch in one hydration run. Default 96 MiB. */
export const HYDRATION_PREFETCH_BINARY_BUDGET_BYTES = envInt(
  "VITE_HYDRATION_PREFETCH_BINARY_BUDGET_BYTES",
  96 * 1024 * 1024
);

/** Max document download prefetches (image types) per hydration. Default 80. */
export const HYDRATION_MAX_DOCUMENT_DOWNLOADS = envInt("VITE_HYDRATION_MAX_DOCUMENT_DOWNLOADS", 80);

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Concurrent GET prefetches during offline hydration (per module pool). Default 6, max 16.
 * Set `VITE_HYDRATION_PARALLEL_FETCHES` to tune (e.g. 4 on slow networks, 10+ on fast).
 */
export const HYDRATION_PARALLEL_FETCHES = clampInt(envInt("VITE_HYDRATION_PARALLEL_FETCHES", 6), 1, 16);

/**
 * Concurrent binary operation replays during sync. Default 4, max 8.
 */
export const OFFLINE_SYNC_BINARY_CONCURRENCY = clampInt(envInt("VITE_OFFLINE_SYNC_BINARY_CONCURRENCY", 4), 1, 8);

/**
 * If `usage / quota` from `navigator.storage.estimate()` exceeds this, evict oldest IDB rows first.
 * Default 0.85 (85%).
 */
export const HYDRATION_EVICTION_THRESHOLD = envFloat01("VITE_HYDRATION_EVICTION_THRESHOLD", 0.85);

/** Fraction of IDB rows to delete when evicting (oldest `savedAt` first). Default 0.25. */
export const HYDRATION_EVICTION_FRACTION = envFloat01("VITE_HYDRATION_EVICTION_FRACTION", 0.25);
