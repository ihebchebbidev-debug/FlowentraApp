/**
 * Tenant+user-scoped IndexedDB cache for GET responses (offline hydration).
 * JSON/text in IndexedDB; binary in IDB (small) or Cache API (larger).
 */
import { API_URL } from "@/config/api";
import {
  deleteHydrationCacheApiScope,
  matchCachedResponseInCacheApi,
  matchCachedResponseInCacheApiIgnoreSearch,
  putCachedBufferInCacheApi,
  putCachedTextInCacheApi,
} from "./hydrationCacheApi";
import {
  HYDRATION_CACHE_API_MAX_BYTES,
  HYDRATION_EVICTION_FRACTION,
  HYDRATION_EVICTION_THRESHOLD,
  HYDRATION_MAX_BINARY_BYTES,
  HYDRATION_MAX_TEXT_BYTES,
} from "./hydrationLimits";
import { getOfflineScopeKey } from "./syncEngine";

const DB_VERSION = 2;
const STORE = "responses";
const META_STORE = "meta";

export type CachedHttpEntry = {
  key: string;
  status: number;
  contentType: string;
  savedAt: string;
  bodyText?: string;
  bodyBytes?: ArrayBuffer;
};

export type HydrationManifest = {
  scopeKey: string;
  version: number;
  lastFullHydrationAt?: string;
  lastHydrationError?: string;
};

function scopeHash(scope: string): string {
  let h = 2166136261;
  for (let i = 0; i < scope.length; i++) {
    h ^= scope.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function dbName(): string {
  return `flowentra-hydration-v1-${scopeHash(getOfflineScopeKey())}`;
}

function normalizeSearch(search: string): string {
  if (!search || search === "?") return "";
  const qs = search.startsWith("?") ? search.slice(1) : search;
  if (!qs) return "";
  const p = new URLSearchParams(qs);
  p.sort();
  const out = p.toString();
  return out ? `?${out}` : "";
}

function normalizeApiPath(path: string): string {
  const p = path.replace(/\/+$/, "") || "/";
  if (p.toLowerCase().startsWith("/api/")) {
    return p.toLowerCase();
  }
  return p;
}

/**
 * List endpoints where hydration uses different query strings than runtime (e.g. pageNumber vs filters).
 * Allows serving any cached GET for the same path when the exact URL misses.
 * @see isLooseHydrationListPath — also matches `/api/lookups/*`, `/api/taskchecklists/*`, etc.
 */
const LOOSE_HYDRATION_LIST_PATHS = new Set([
  "/api/projects",
  "/api/contacts",
  "/api/documents",
  "/api/offers",
  "/api/sales",
  "/api/service-orders",
  "/api/dispatches",
  "/api/installations",
  "/api/supporttickets",
  "/api/dynamicforms",
  "/api/articles",
  "/api/articles/groups",
  "/api/sync/pull",
  "/api/documents/stats",
  "/api/projects/settings",
  "/api/workflows",
  "/api/notifications",
  "/api/tasktimeentries/query",
  "/api/settings/app",
  "/api/projects/search",
  "/api/tasks/search",
  "/api/tasks/overdue",
  "/api/articles/categories",
  "/api/articles/locations",
  "/api/articles/transactions",
  "/api/dispatches/statistics",
  "/api/service-orders/statistics",
  "/api/offlinehydrationpreferences",
  "/api/calendar/events",
  "/api/calendar/event-types",
  "/api/dashboards",
  // HR & planning
  "/api/hr/employees",
  "/api/hr/departments",
  "/api/hr/attendance",
  "/api/hr/leaves/balances",
  "/api/hr/payroll/runs",
  // Stock & inventory
  "/api/stock-transactions",
]);

/** True when any cached GET for this pathname may satisfy a different query string for the same path. */
function isLooseHydrationListPath(pathname: string): boolean {
  const p = normalizeApiPath(pathname);
  if (LOOSE_HYDRATION_LIST_PATHS.has(p)) return true;
  if (p.startsWith("/api/lookups/")) return true;
  if (p.startsWith("/api/taskchecklists/")) return true;
  // User directory & skills (assignee dropdowns, etc.)
  if (p === "/api/users" || p === "/api/skills") return true;
  // Single reference endpoints often called with varying cache-busting or sort params
  if (p === "/api/roles/all-user-roles") return true;
  // Offer/sale activity feeds: same path, different page/limit query params
  if ((p.startsWith("/api/offers/") || p.startsWith("/api/sales/")) && p.endsWith("/activities")) return true;
  // HR planning (schedule/leaves) — varying user id in path
  if (p.startsWith("/api/planning/")) return true;
  // Recurring task rules per task id
  if (p.startsWith("/api/recurringtasks/")) return true;
  return false;
}

export function buildCacheKey(method: string, requestUrl: string): string {
  const m = method.toUpperCase();
  try {
    const base = requestUrl.startsWith("http") ? undefined : API_URL;
    const u = new URL(requestUrl, base);
    const path = normalizeApiPath(u.pathname);
    const search = normalizeSearch(u.search || "");
    return `${m}\t${path}${search}`;
  } catch {
    return `${m}\t${requestUrl}`;
  }
}

export function isBinaryCacheableApiPath(pathname: string): boolean {
  const p = normalizeApiPath(pathname);
  return (
    p.includes("/api/documents/download/") ||
    p.includes("/api/documents/preview/") ||
    p.includes("/api/profilepicture/") ||
    p.includes("/api/profile-picture/")
  );
}

function shouldStoreBinaryGet(pathname: string, contentType: string): boolean {
  const p = normalizeApiPath(pathname);
  if (!p.startsWith("/api/")) return false;
  const ct = contentType.toLowerCase();
  if (isBinaryCacheableApiPath(p)) return true;
  return ct.startsWith("image/") || ct.includes("application/pdf");
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName(), DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function maybeEvictIfStoragePressure(): Promise<void> {
  try {
    const est = await navigator.storage?.estimate?.();
    if (!est?.quota) return;
    const usage = est.usage ?? 0;
    const quota = est.quota || 1;
    if (usage / quota < HYDRATION_EVICTION_THRESHOLD) return;
    await evictOldestIdbEntries(HYDRATION_EVICTION_FRACTION);
  } catch {
    // ignore
  }
}

async function evictOldestIdbEntries(fraction: number): Promise<void> {
  const db = await openDb();
  const rows = await new Promise<CachedHttpEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result || []) as CachedHttpEntry[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (rows.length === 0) return;
  rows.sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  const toRemove = Math.max(1, Math.ceil(rows.length * fraction));
  const keys = rows.slice(0, toRemove).map((r) => r.key);
  const db2 = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db2.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const k of keys) store.delete(k);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db2.close();
}

function isQuotaExceeded(e: unknown): boolean {
  return e instanceof DOMException && e.name === "QuotaExceededError";
}

async function putEntry(entry: CachedHttpEntry): Promise<void> {
  await maybeEvictIfStoragePressure();
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function putEntryWithRetry(entry: CachedHttpEntry, maxAttempts = 2): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await putEntry(entry);
      return;
    } catch (e) {
      if (!isQuotaExceeded(e) || attempt === maxAttempts - 1) throw e;
      await evictOldestIdbEntries(HYDRATION_EVICTION_FRACTION);
    }
  }
}

export async function putCachedResponse(method: string, requestUrl: string, response: Response): Promise<void> {
  if (!response.ok) return;

  const ct = response.headers.get("Content-Type") || "application/octet-stream";
  const cl = response.headers.get("Content-Length");
  const parsedLen = cl ? parseInt(cl, 10) : NaN;

  const key = buildCacheKey(method, requestUrl);
  let pathname = "";
  try {
    pathname = new URL(requestUrl, API_URL).pathname;
  } catch {
    pathname = "";
  }

  if (ct.includes("application/json") || ct.includes("text/") || /\+json\b/i.test(ct)) {
    const bodyText = await response.clone().text();
    const utf8Len = new TextEncoder().encode(bodyText).byteLength;
    if (utf8Len <= HYDRATION_MAX_TEXT_BYTES) {
      const entry: CachedHttpEntry = {
        key,
        status: response.status,
        contentType: ct,
        bodyText,
        savedAt: new Date().toISOString(),
      };
      await putEntryWithRetry(entry);
      return;
    }
    if (utf8Len <= HYDRATION_CACHE_API_MAX_BYTES) {
      await putCachedTextInCacheApi(requestUrl, bodyText, response.status, ct);
    }
    return;
  }

  if (!shouldStoreBinaryGet(pathname, ct)) return;
  if (!Number.isNaN(parsedLen) && parsedLen > HYDRATION_CACHE_API_MAX_BYTES) return;

  const buf = await response.clone().arrayBuffer();
  const len = buf.byteLength;
  if (len > HYDRATION_CACHE_API_MAX_BYTES) return;

  const hdrs = new Headers(response.headers);

  if (len <= HYDRATION_MAX_BINARY_BYTES) {
    const entry: CachedHttpEntry = {
      key,
      status: response.status,
      contentType: ct,
      bodyBytes: buf,
      savedAt: new Date().toISOString(),
    };
    await putEntryWithRetry(entry);
    return;
  }

  await putCachedBufferInCacheApi(requestUrl, buf, response.status, hdrs);
}

export async function getCachedEntry(method: string, requestUrl: string): Promise<CachedHttpEntry | null> {
  const key = buildCacheKey(method, requestUrl);
  const db = await openDb();
  const row = await new Promise<CachedHttpEntry | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as CachedHttpEntry) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return row;
}

/** When exact URL misses, reuse any cached GET for the same list path (hydration vs app query mismatch). */
async function getCachedEntryLooseListFallback(method: string, requestUrl: string): Promise<CachedHttpEntry | null> {
  const m = method.toUpperCase();
  let pathname: string;
  try {
    const base = requestUrl.startsWith("http") ? undefined : API_URL;
    const u = new URL(requestUrl, base);
    pathname = normalizeApiPath(u.pathname);
  } catch {
    return null;
  }
  if (!isLooseHydrationListPath(pathname)) return null;
  const prefix = `${m}\t${pathname}`;
  const db = await openDb();
  const rows = await new Promise<CachedHttpEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result || []) as CachedHttpEntry[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  const candidates = rows.filter((r) => r.key === prefix || r.key.startsWith(`${prefix}?`));
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""));
  return candidates[0] ?? null;
}

function withHydrationHeader(res: Response): Response {
  const h = new Headers(res.headers);
  h.set("X-From-Hydration-Cache", "1");
  const c = res.clone();
  return new Response(c.body, { status: c.status, statusText: c.statusText, headers: h });
}

export async function getCachedResponse(method: string, requestUrl: string): Promise<Response | null> {
  let row = await getCachedEntry(method, requestUrl);
  let idbLoose = false;
  if (!row) {
    row = await getCachedEntryLooseListFallback(method, requestUrl);
    idbLoose = !!row;
  }
  if (row) {
    const baseHdr: Record<string, string> = {
      "Content-Type": row.contentType,
      "X-From-Hydration-Cache": "1",
    };
    if (idbLoose) baseHdr["X-Offline-Cache-Query-Fallback"] = "1";
    if (row.bodyBytes) {
      return new Response(row.bodyBytes, {
        status: row.status,
        headers: baseHdr,
      });
    }
    if (row.bodyText != null) {
      return new Response(row.bodyText, {
        status: row.status,
        headers: baseHdr,
      });
    }
  }

  try {
    const fromSw = await matchCachedResponseInCacheApi(requestUrl);
    if (fromSw) return withHydrationHeader(fromSw);
  } catch {
    // ignore
  }

  let pathnameLoose = "";
  try {
    const base = requestUrl.startsWith("http") ? undefined : API_URL;
    pathnameLoose = normalizeApiPath(new URL(requestUrl, base).pathname);
  } catch {
    pathnameLoose = "";
  }
  if (pathnameLoose && isLooseHydrationListPath(pathnameLoose)) {
    try {
      const fromSwLoose = await matchCachedResponseInCacheApiIgnoreSearch(requestUrl);
      if (fromSwLoose) {
        const h = new Headers(fromSwLoose.headers);
        h.set("X-From-Hydration-Cache", "1");
        h.set("X-Offline-Cache-Query-Fallback", "1");
        return new Response(fromSwLoose.body, { status: fromSwLoose.status, statusText: fromSwLoose.statusText, headers: h });
      }
    } catch {
      // ignore
    }
  }

  return null;
}

type ManifestRow = HydrationManifest & { id: string };

export async function getManifest(): Promise<HydrationManifest | null> {
  const db = await openDb();
  const row = await new Promise<ManifestRow | null>((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const req = tx.objectStore(META_STORE).get("manifest");
    req.onsuccess = () => resolve((req.result as ManifestRow) || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!row) return null;
  const { id: _id, ...rest } = row;
  return rest;
}

export async function saveManifest(partial: Partial<HydrationManifest>): Promise<void> {
  const prev = (await getManifest()) || {
    scopeKey: getOfflineScopeKey(),
    version: 1,
  };
  const next: ManifestRow = {
    id: "manifest",
    scopeKey: getOfflineScopeKey(),
    version: 1,
    ...prev,
    ...partial,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).put(next);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function clearHydrationCacheForCurrentScope(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE, META_STORE], "readwrite");
    tx.objectStore(STORE).clear();
    tx.objectStore(META_STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  await deleteHydrationCacheApiScope();
}
