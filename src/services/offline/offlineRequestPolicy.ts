/**
 * Single source of truth for offline / explicit-offline-mode API behavior.
 * Used by fetch guard + axios so paths stay aligned.
 */
import { API_URL } from "@/config/api";
import { getOfflineEnabled } from "./syncEngine";

/** True when the browser reports offline OR the user turned on explicit offline mode. */
export function isOfflineLike(): boolean {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine || getOfflineEnabled();
}

export function toAbsoluteApiUrl(reqUrl: string): string {
  if (reqUrl.startsWith("http://") || reqUrl.startsWith("https://")) return reqUrl;
  const path = reqUrl.startsWith("/") ? reqUrl : `/${reqUrl}`;
  return `${API_URL.replace(/\/$/, "")}${path}`;
}

/** Relative `/api/...` path + query for sync queue (matches backend + fetch guard). */
export function toRelativeApiEndpoint(reqUrl: string): string {
  try {
    const abs = toAbsoluteApiUrl(reqUrl);
    const u = new URL(abs);
    return `${u.pathname}${u.search}`;
  } catch {
    if (reqUrl.startsWith(API_URL)) return reqUrl.slice(API_URL.length) || "/";
    return reqUrl.startsWith("/") ? reqUrl : `/${reqUrl}`;
  }
}

export function isApiRequestUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/api/")) return true;
  return url.startsWith(`${API_URL}/api/`);
}

export function offlineApiGetNoCacheBody(): Record<string, unknown> {
  return {
    offline: true,
    cached: false,
    message: "No cached response for this request",
  };
}

export function newOfflineApiGetNoCachedResponse(): Response {
  return new Response(JSON.stringify(offlineApiGetNoCacheBody()), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

/** Headers that skip hydration / offline GET interception (hydration prefetch, etc.). */
export function headersBypassHydrationCache(headers?: HeadersInit): boolean {
  if (!headers) return false;
  const normalized = new Headers(headers);
  return normalized.get("X-Bypass-Hydration-Cache") === "true";
}

export function headersContainOfflineQueueBypass(headers?: HeadersInit): boolean {
  if (!headers) return false;
  const normalized = new Headers(headers);
  return normalized.get("X-Bypass-Offline-Queue") === "true";
}
