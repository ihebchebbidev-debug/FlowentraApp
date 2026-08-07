import { apiFetch } from "@/services/api/apiClient";
import { isHiddenFromSyncUi } from "@/services/offline/syncUiVisibility";

export interface SyncHistoryItem {
  opId: string;
  deviceId: string;
  status: string;
  serverEntityId?: number;
  entityType?: string;
  operation?: string;
  method?: string;
  endpoint?: string;
  transactionGroupId?: string;
  conflictStrategy?: string;
  createdAt: string;
  error?: string;
  canRetry: boolean;
  operationJson?: string;
  responseJson?: string;
}

export interface SyncHistoryResponse {
  items: SyncHistoryItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export async function getSyncHistory(params: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  deviceId?: string;
}): Promise<SyncHistoryResponse> {
  const q = new URLSearchParams();
  if (params.status && params.status !== "all") q.set("status", params.status);
  if (params.search) q.set("search", params.search);
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.deviceId) q.set("deviceId", params.deviceId);
  q.set("includePayloads", "true");
  const result = await apiFetch<SyncHistoryResponse>(`/api/sync/history?${q.toString()}`, { method: "GET" });
  if (!result.data) throw new Error(result.error || "Failed to load sync history");
  const items = result.data.items.filter(
    (i) => !isHiddenFromSyncUi({ entityType: i.entityType, endpoint: i.endpoint }),
  );
  return { ...result.data, items };
}

export async function retrySyncItem(payload: { deviceId: string; opId: string }): Promise<void> {
  const result = await apiFetch(`/api/sync/retry`, {
    method: "POST",
    headers: { "X-Bypass-Offline-Queue": "true" },
    body: JSON.stringify(payload),
  });
  if (result.status >= 400) throw new Error(result.error || "Retry failed");
}
