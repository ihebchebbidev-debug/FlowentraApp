import { getCachedResponse, putCachedResponse } from "./hydrationStore";
import { getOfflineEnabled, normalizeHeaders, queueHttpOperation, shouldQueueOfflineWrites } from "./syncEngine";
import {
  headersBypassHydrationCache,
  headersContainOfflineQueueBypass,
  isApiRequestUrl,
  isOfflineLike,
  newOfflineApiGetNoCachedResponse,
  toAbsoluteApiUrl,
  toRelativeApiEndpoint,
} from "./offlineRequestPolicy";
import { shouldSkipOfflineQueueForEndpoint } from "./syncEngine";

let installed = false;

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function buildAcceptedResponse(): Response {
  return new Response(JSON.stringify({ queued: true, offline: true }), {
    status: 202,
    headers: { "Content-Type": "application/json" },
  });
}

async function extractBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  if (init?.body !== undefined) {
    const body = init.body;
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return body;
  }
  if (typeof input === "string" || input instanceof URL) return undefined;
  const req = input as Request;
  if (!req.bodyUsed && req.method.toUpperCase() !== "GET" && req.method.toUpperCase() !== "HEAD") {
    const contentType = req.headers.get("Content-Type")?.toLowerCase() || "";
    const clone = req.clone();
    if (contentType.includes("application/json")) {
      const text = await clone.text();
      if (!text) return undefined;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    }
    if (contentType.includes("multipart/form-data")) return await clone.formData();
    if (contentType.includes("application/x-www-form-urlencoded")) return await clone.text();
    return await clone.text();
  }
  return undefined;
}

export function installOfflineFetchGuard(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const reqUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET") || "GET").toUpperCase();
    const bypass =
      headersContainOfflineQueueBypass(init?.headers) ||
      (typeof input !== "string" && !(input instanceof URL) && headersContainOfflineQueueBypass(input.headers));
    const bypassHydration =
      headersBypassHydrationCache(init?.headers) ||
      (typeof input !== "string" && !(input instanceof URL) && headersBypassHydrationCache(input.headers));

    if (MUTATION_METHODS.has(method) && shouldQueueOfflineWrites() && !bypass && isApiRequestUrl(reqUrl)) {
      const rel = toRelativeApiEndpoint(reqUrl);
      if (shouldSkipOfflineQueueForEndpoint(rel)) {
        return new Response(JSON.stringify({ ok: true, skippedOffline: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const body = await extractBody(input, init);
      await queueHttpOperation({
        endpoint: toRelativeApiEndpoint(reqUrl),
        method,
        body,
        headers: normalizeHeaders(init?.headers || (typeof input !== "string" && !(input instanceof URL) ? input.headers : undefined)),
      });
      window.dispatchEvent(new CustomEvent("offline:queue-updated"));
      return buildAcceptedResponse();
    }

    const absUrl = toAbsoluteApiUrl(reqUrl);

    if (method === "GET" && isApiRequestUrl(reqUrl) && !bypassHydration && isOfflineLike()) {
      const cached = await getCachedResponse("GET", absUrl);
      if (cached?.ok) return cached;
      return newOfflineApiGetNoCachedResponse();
    }

    try {
      const res = await originalFetch(input as Request, init);

      if (method === "GET" && res.ok && isApiRequestUrl(reqUrl) && !bypassHydration && getOfflineEnabled()) {
        void putCachedResponse("GET", absUrl, res.clone()).catch(() => undefined);
      }

      return res;
    } catch (err) {
      if (method === "GET" && isApiRequestUrl(reqUrl) && !bypassHydration) {
        const cached = await getCachedResponse("GET", absUrl);
        if (cached?.ok) return cached;
      }
      throw err;
    }
  };
}
