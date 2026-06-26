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

/** GET /api/OfflineHydrationPreferences — current user / tenant. */
export async function fetchOfflineHydrationPreferences() {
  return apiFetch<OfflineHydrationPreferencesPayload>("/api/OfflineHydrationPreferences", {
    // Skip system logging so 400/404 from a not-yet-configured backend
    // doesn't generate incident tickets — the caller handles the error gracefully.
    headers: { "X-Skip-Logging": "true" },
  });
}

/** PUT /api/OfflineHydrationPreferences — only explicit `false` entries are stored server-side. */
export async function putOfflineHydrationPreferences(modules: Record<string, boolean>) {
  return apiFetch<OfflineHydrationPreferencesPayload>("/api/OfflineHydrationPreferences", {
    method: "PUT",
    body: JSON.stringify({ modules }),
    headers: {
      "X-Bypass-Offline-Queue": "true",
      // Suppress the global apiClient error toast — persistToServer() shows its own.
      "X-Suppress-Error-Toast": "true",
      "X-Skip-Logging": "true",
    },
  });
}
