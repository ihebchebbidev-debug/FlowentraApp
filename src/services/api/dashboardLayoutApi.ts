import { apiFetch } from "@/services/api/apiClient";

export interface DashboardLayoutDto {
  scope: string;
  order: string[];
  hidden: string[];
}

interface DashboardLayoutResponse {
  success: boolean;
  data: DashboardLayoutDto;
}

const commonHeaders = {
  // Per-user preference endpoint — don't spam incident/toast pipelines.
  "X-Skip-Logging": "true",
  "X-Suppress-Error-Toast": "true",
};

export async function fetchDashboardLayout(scope: string) {
  const qs = `?scope=${encodeURIComponent(scope)}`;
  return apiFetch<DashboardLayoutResponse>(`/api/DashboardLayout${qs}`, {
    headers: commonHeaders,
  });
}

export async function saveDashboardLayout(payload: {
  scope: string;
  order: string[];
  hidden: string[];
}) {
  return apiFetch<DashboardLayoutResponse>(`/api/DashboardLayout`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: commonHeaders,
  });
}

export async function resetDashboardLayout(scope: string) {
  const qs = `?scope=${encodeURIComponent(scope)}`;
  return apiFetch<{ success: boolean }>(`/api/DashboardLayout${qs}`, {
    method: "DELETE",
    headers: commonHeaders,
  });
}
