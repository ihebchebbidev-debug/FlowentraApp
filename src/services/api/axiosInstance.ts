/**
 * Shared Axios instance with automatic TENANT_HEADER injection.
 * ALL API services should import this instead of raw `axios`.
 */
import axios, { type InternalAxiosRequestConfig } from "axios";
import { getCurrentTenant, TENANT_HEADER, TARGET_TENANT_HEADER, isViewAllMode } from "@/utils/tenant";
import { getTargetTenantHeaders, getTenantRequestHeaders } from "@/utils/targetTenant";
import { API_CONFIG } from "@/config/api.config";
import { getCachedResponse } from "@/services/offline/hydrationStore";
import {
  normalizeHeaders,
  queueHttpOperation,
  shouldQueueOfflineWrites,
  shouldSkipOfflineQueueForEndpoint,
} from "@/services/offline/syncEngine";
import {
  attachCachedGetAdapter,
  attachOfflineNoCacheAdapter,
  isAxiosNetworkError,
} from "@/services/offline/offlineAxiosCachedGet";
import {
  headersBypassHydrationCache,
  isOfflineLike,
  toRelativeApiEndpoint,
} from "@/services/offline/offlineRequestPolicy";
import { getSyntheticDataForOfflineCacheMissGet } from "@/services/offline/offlineApiGetDefaults";
import { getOfflineDetailPlaceholder } from "@/services/offline/offlineDetailPlaceholders";

const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Interceptor: attach JWT + TENANT_HEADER on every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const tenant = getCurrentTenant();
  if (tenant) {
    config.headers[TENANT_HEADER] = tenant;
  }
  const method = (config.method || "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // Always emit X-Target-Tenant for row-level company scoping on EVERY request
  // (GET + mutations). In view-all mode, getTargetTenantHeaders() returns {} so
  // the backend reads union across companies. Existing explicit header wins.
  const existingTarget = (config.headers as Record<string, unknown>)?.[TARGET_TENANT_HEADER];
  if (existingTarget == null || existingTarget === "") {
    Object.entries(getTargetTenantHeaders()).forEach(([key, value]) => {
      config.headers[key] = value;
    });
  }

  if (isViewAllMode()) {
    Object.entries(getTenantRequestHeaders()).forEach(([key, value]) => {
      if (key === TENANT_HEADER || (config.headers as Record<string, unknown>)?.[key] == null) {
        config.headers[key] = value;
      }
    });
  }

  const normalizedHeaders = normalizeHeaders(config.headers);
  const bypassOfflineQueue =
    normalizedHeaders?.["x-bypass-offline-queue"] === "true" || normalizedHeaders?.["X-Bypass-Offline-Queue"] === "true";
  if (shouldQueueOfflineWrites() && isMutation && !bypassOfflineQueue) {
    const fullUrl = axios.getUri(config);
    const endpoint = toRelativeApiEndpoint(fullUrl);
    if (shouldSkipOfflineQueueForEndpoint(endpoint)) {
      return Promise.reject(new axios.Cancel("OFFLINE_SKIP_NON_QUEUEABLE"));
    }
    const data = config.data;
    return queueHttpOperation({
      endpoint,
      method,
      body: data,
      headers: normalizedHeaders,
    }).then(() => {
      window.dispatchEvent(new CustomEvent("offline:queue-updated"));
      return Promise.reject(new axios.Cancel("OFFLINE_QUEUED"));
    });
  }

  const bypassHydration = headersBypassHydrationCache(config.headers);
  if (method === "GET" && !bypassHydration && isOfflineLike()) {
    const uri = axios.getUri(config);
    return getCachedResponse("GET", uri)
      .then(async (cachedRes) => {
        if (cachedRes && cachedRes.ok) {
          const attached = await attachCachedGetAdapter(config, cachedRes);
          if (attached) return config;
        }
        attachOfflineNoCacheAdapter(config);
        return config;
      })
      .catch(() => {
        attachOfflineNoCacheAdapter(config);
        return config;
      });
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error) && error.message === "OFFLINE_QUEUED") {
      return Promise.resolve({
        data: { queued: true, offline: true },
        status: 202,
        statusText: "Accepted",
        headers: {},
        config: {} as any,
      } as any);
    }
    if (axios.isCancel(error) && error.message === "OFFLINE_SKIP_NON_QUEUEABLE") {
      return Promise.resolve({
        data: { ok: true, skippedOffline: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      } as any);
    }

    const cfg = error.config as InternalAxiosRequestConfig | undefined;
    if (!cfg || (cfg.method || "get").toUpperCase() !== "GET") {
      return Promise.reject(error);
    }
    if (headersBypassHydrationCache(cfg.headers)) {
      return Promise.reject(error);
    }
    if (!isAxiosNetworkError(error)) {
      return Promise.reject(error);
    }

    try {
      const uri = axios.getUri(cfg);
      const cached = await getCachedResponse("GET", uri);
      if (cached && cached.ok) {
        const attached = await attachCachedGetAdapter(cfg, cached);
        if (attached) {
          const adapter = (cfg as unknown as { adapter?: () => Promise<unknown> }).adapter;
          if (adapter) return adapter();
        }
      }
    } catch {
      // fall through
    }
    return Promise.reject(error);
  }
);

/** Offline cache miss: axios adapter resolves 503 with { offline, cached }; map list GETs to empty payloads. */
axiosInstance.interceptors.response.use((response) => {
  if (response.status === 503 && response.data && typeof response.data === "object") {
    const d = response.data as Record<string, unknown>;
    if (d.offline === true && d.cached === false) {
      const method = (response.config.method || "get").toUpperCase();
      if (method === "GET") {
        const uri = axios.getUri(response.config);
        const rel = toRelativeApiEndpoint(uri);
        const listOrTab = getSyntheticDataForOfflineCacheMissGet(rel);
        const fallback = listOrTab ?? getOfflineDetailPlaceholder(rel);
        if (fallback !== null) {
          return { ...response, status: 200, statusText: "OK", data: fallback };
        }
      }
    }
  }
  return response;
});

export default axiosInstance;
