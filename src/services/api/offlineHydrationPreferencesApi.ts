import { apiFetch } from "@/services/api/apiClient";

export type OfflineHydrationPreferencesPayload = {
  success?: boolean;
  /** Present when the request was queued locally (offline mode) instead of sent to the server. */
  queued?: boolean;
  offline?: boolean;
  data?: {
    modules: Record<string, boolean>;
    updatedAt?: string | null;
  };
};

const BYPASS_QUEUE: HeadersInit = {
  "X-Bypass-Offline-Queue": "true",
};

/** GET /api/OfflineHydrationPreferences — current user / tenant. */
export async function fetchOfflineHydrationPreferences() {
  return apiFetch<OfflineHydrationPreferencesPayload>("/api/OfflineHydrationPreferences");
}

/** PUT /api/OfflineHydrationPreferences — only explicit `false` entries are stored server-side. */
export async function putOfflineHydrationPreferences(modules: Record<string, boolean>) {
  return apiFetch<OfflineHydrationPreferencesPayload>("/api/OfflineHydrationPreferences", {
    method: "PUT",
    body: JSON.stringify({ modules }),
    headers: BYPASS_QUEUE,
  });
}
