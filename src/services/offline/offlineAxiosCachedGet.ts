/**
 * Shared logic: build axios custom adapter from a cached GET Response (request + response error fallback).
 */
import type { InternalAxiosRequestConfig } from "axios";

/** Map cached binary GET to axios `data` + responseType (Blob vs ArrayBuffer vs text). */
export function shapeCachedBinaryPayload(
  buf: ArrayBuffer,
  contentType: string,
  config: Record<string, unknown>
): { data: unknown; responseType: string } {
  const mime = (contentType.split(";")[0] || "").trim().toLowerCase();
  const wanted = String(config.responseType || "").toLowerCase();
  if (wanted === "arraybuffer") {
    return { data: buf, responseType: "arraybuffer" };
  }
  if (wanted === "blob") {
    return {
      data: new Blob([buf], { type: mime || "application/octet-stream" }),
      responseType: "blob",
    };
  }
  if (wanted === "json") {
    const text = new TextDecoder().decode(buf);
    try {
      return { data: JSON.parse(text), responseType: "json" };
    } catch {
      return { data: buf, responseType: "arraybuffer" };
    }
  }
  if (wanted === "text" || wanted === "document") {
    const text = new TextDecoder().decode(buf);
    return { data: text, responseType: wanted };
  }
  if (mime.startsWith("image/") || mime.includes("pdf") || mime.includes("octet-stream") || mime.includes("zip")) {
    return {
      data: new Blob([buf], { type: mime || "application/octet-stream" }),
      responseType: "blob",
    };
  }
  return { data: buf, responseType: "arraybuffer" };
}

/**
 * Attach a custom adapter to `config` that serves `cachedRes`.
 * @returns true if the body type was handled; false if caller should treat as cache miss.
 */
export async function attachCachedGetAdapter(
  config: InternalAxiosRequestConfig,
  cachedRes: Response
): Promise<boolean> {
  if (!cachedRes.ok) return false;
  const ct = (cachedRes.headers.get("content-type") || "").toLowerCase();
  const isJsonLike =
    ct.includes("application/json") || ct.includes("text/json") || /\+json\b/i.test(ct) || ct.endsWith("/json");
  if (isJsonLike) {
    const text = await cachedRes.text();
    let data: unknown;
    try {
      data = text.length ? JSON.parse(text) : null;
    } catch {
      return false;
    }
    (config as unknown as { adapter?: (c: InternalAxiosRequestConfig) => Promise<unknown> }).adapter = () =>
      Promise.resolve({
        data,
        status: cachedRes.status,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      });
    return true;
  }
  if (ct.startsWith("text/")) {
    const text = await cachedRes.text();
    (config as unknown as { adapter?: (c: InternalAxiosRequestConfig) => Promise<unknown> }).adapter = () =>
      Promise.resolve({
        data: text,
        status: cachedRes.status,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      });
    return true;
  }
  const buf = await cachedRes.arrayBuffer();
  const { data, responseType } = shapeCachedBinaryPayload(buf, ct, config as unknown as Record<string, unknown>);
  (config as unknown as { responseType?: string }).responseType = responseType;
  (config as unknown as { adapter?: (c: InternalAxiosRequestConfig) => Promise<unknown> }).adapter = () =>
    Promise.resolve({
      data,
      status: cachedRes.status,
      statusText: "OK",
      headers: {},
      config,
      request: {},
    });
  return true;
}

export function attachOfflineNoCacheAdapter(config: InternalAxiosRequestConfig): void {
  const body = {
    offline: true,
    cached: false,
    message: "No cached response for this request",
  };
  (config as unknown as { adapter?: (c: InternalAxiosRequestConfig) => Promise<unknown> }).adapter = () =>
    Promise.resolve({
      data: body,
      status: 503,
      statusText: "Service Unavailable",
      headers: {},
      config,
      request: {},
    });
}

export function isAxiosNetworkError(error: unknown): boolean {
  const err = error as { response?: unknown; code?: string; message?: string };
  if (err.response != null) return false;
  const code = String(err.code || "");
  const msg = String(err.message || "").toLowerCase();
  return (
    code === "ERR_NETWORK" ||
    code === "ECONNABORTED" ||
    msg.includes("network error") ||
    msg === "network error"
  );
}
