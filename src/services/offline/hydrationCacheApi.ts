/**
 * Secondary offline layer: Cache API for larger GET responses than fit comfortably in IndexedDB.
 * Scoped per tenant + user (same hash as hydration IndexedDB).
 */
import { API_URL } from "@/config/api";
import { HYDRATION_CACHE_API_MAX_BYTES } from "./hydrationLimits";
import { getOfflineScopeKey } from "./syncEngine";

function scopeHash(scope: string): string {
  let h = 2166136261;
  for (let i = 0; i < scope.length; i++) {
    h ^= scope.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function getHydrationCacheApiName(): string {
  return `flowentra-hydration-sw-${scopeHash(getOfflineScopeKey())}`;
}

function toAbsoluteUrl(requestUrl: string): string {
  if (requestUrl.startsWith("http://") || requestUrl.startsWith("https://")) return requestUrl;
  const path = requestUrl.startsWith("/") ? requestUrl : `/${requestUrl}`;
  return `${API_URL.replace(/\/$/, "")}${path}`;
}

/**
 * Store a GET response body in Cache API (single read — pass `body` from caller).
 */
/** UTF-8 byte length for large JSON/text that exceeds IndexedDB text cap. */
function utf8ByteLength(s: string): number {
  return new TextEncoder().encode(s).byteLength;
}

/**
 * Store a large JSON/text GET body in Cache API (when it exceeds IDB text limit but fits here).
 */
export async function putCachedTextInCacheApi(
  requestUrl: string,
  bodyText: string,
  status: number,
  contentType: string
): Promise<void> {
  if (typeof caches === "undefined") return;
  if (utf8ByteLength(bodyText) > HYDRATION_CACHE_API_MAX_BYTES) return;
  try {
    const url = toAbsoluteUrl(requestUrl);
    const cache = await caches.open(getHydrationCacheApiName());
    const req = new Request(url, { method: "GET" });
    const res = new Response(bodyText, {
      status,
      headers: { "Content-Type": contentType },
    });
    await cache.put(req, res);
  } catch {
    // quota / blocked
  }
}

export async function putCachedBufferInCacheApi(
  requestUrl: string,
  body: ArrayBuffer,
  status: number,
  headers: Headers
): Promise<void> {
  if (typeof caches === "undefined") return;
  if (body.byteLength > HYDRATION_CACHE_API_MAX_BYTES) return;

  try {
    const url = toAbsoluteUrl(requestUrl);
    const cache = await caches.open(getHydrationCacheApiName());
    const req = new Request(url, { method: "GET" });
    const res = new Response(body, { status, headers: new Headers(headers) });
    await cache.put(req, res);
  } catch {
    // Quota / private mode / blocked Cache API — ignore; IDB path may still work for smaller payloads.
  }
}

export async function matchCachedResponseInCacheApi(requestUrl: string): Promise<Response | null> {
  if (typeof caches === "undefined") return null;
  try {
    const url = toAbsoluteUrl(requestUrl);
    const cache = await caches.open(getHydrationCacheApiName());
    const hit = await cache.match(new Request(url, { method: "GET" }), { ignoreSearch: false });
    return hit ?? null;
  } catch {
    return null;
  }
}

/**
 * Same pathname as hydration, different query string (e.g. pageNumber vs isArchived) — match any cached GET.
 */
export async function matchCachedResponseInCacheApiIgnoreSearch(requestUrl: string): Promise<Response | null> {
  if (typeof caches === "undefined") return null;
  try {
    const url = toAbsoluteUrl(requestUrl);
    const cache = await caches.open(getHydrationCacheApiName());
    const hit = await cache.match(new Request(url, { method: "GET" }), { ignoreSearch: true });
    return hit ?? null;
  } catch {
    return null;
  }
}

export async function deleteHydrationCacheApiScope(): Promise<void> {
  if (typeof caches === "undefined") return;
  await caches.delete(getHydrationCacheApiName());
}
