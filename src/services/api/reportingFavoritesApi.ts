import { apiFetch } from "@/services/api/apiClient";

export interface ReportingFavoriteDto {
  widgetId: string;
  title: string;
  source: string;
  position: number;
}

export interface ReportingFavoritesResponse {
  success: boolean;
  data: {
    scope: string;
    items: ReportingFavoriteDto[];
  };
}

const commonHeaders = {
  // Don't spam incident/toast pipelines for a per-user preference endpoint.
  "X-Skip-Logging": "true",
  "X-Suppress-Error-Toast": "true",
};

export async function fetchReportingFavorites(scope: string) {
  const qs = `?scope=${encodeURIComponent(scope)}`;
  return apiFetch<ReportingFavoritesResponse>(`/api/ReportingFavorites${qs}`, {
    headers: commonHeaders,
  });
}

export async function upsertReportingFavorite(payload: {
  scope: string;
  widgetId: string;
  title: string;
  source: string;
  position: number;
}) {
  return apiFetch<{ success: boolean; data: ReportingFavoriteDto }>(
    `/api/ReportingFavorites`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: commonHeaders,
    }
  );
}

export async function deleteReportingFavorite(scope: string, widgetId: string) {
  const qs = `?scope=${encodeURIComponent(scope)}`;
  return apiFetch<{ success: boolean }>(
    `/api/ReportingFavorites/${encodeURIComponent(widgetId)}${qs}`,
    { method: "DELETE", headers: commonHeaders }
  );
}

export async function deleteAllReportingFavorites(scope: string) {
  const qs = `?scope=${encodeURIComponent(scope)}`;
  return apiFetch<{ success: boolean; removed: number }>(
    `/api/ReportingFavorites${qs}`,
    { method: "DELETE", headers: commonHeaders }
  );
}

export async function reorderReportingFavorites(scope: string, orderedWidgetIds: string[]) {
  return apiFetch<{ success: boolean }>(`/api/ReportingFavorites/reorder`, {
    method: "PUT",
    body: JSON.stringify({ scope, orderedWidgetIds }),
    headers: commonHeaders,
  });
}