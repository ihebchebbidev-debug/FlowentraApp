export type OfflineOperationType = "create" | "update" | "delete" | "upsert";
export type OfflineConflictStrategy = "last_write_wins" | "merge" | "reject";

export interface OfflineBlobRef {
  blobId: string;
  fieldName: string;
  fileName: string;
  contentType: string;
  size: number;
}

export interface OfflineOperation {
  opId: string;
  entityType: string;
  operation: OfflineOperationType;
  entityId?: number;
  clientTempId?: string;
  payload?: unknown;
  clientTimestamp: string;
  method: string;
  endpoint: string;
  headers?: Record<string, string>;
  deviceId: string;
  userScope?: string;
  transactionGroupId?: string;
  conflictStrategy?: OfflineConflictStrategy;
  blobRefs?: OfflineBlobRef[];
  /**
   * Tenant slug captured at write time (X-Tenant). Ensures the sync push uses
   * the ORIGINAL tenant the mutation was made under, even if the user switches
   * tenant/company between queuing and syncing (prevents cross-tenant leaks).
   */
  capturedTenant?: string | null;
  /** Row-level active company id captured at write time (X-Target-Tenant). */
  capturedTargetTenant?: number | null;
}

/**
 * An operation the server permanently refused (rejected / unresolvable conflict).
 * Archived instead of discarded so the user can inspect, retry or dismiss it.
 */
export interface OfflineFailedOperation {
  opId: string;
  operation: OfflineOperation;
  status: string;
  error?: string;
  failedAt: string;
  userScope?: string;
}


export interface SyncPushRequest {
  deviceId: string;
  sessionId?: string;
  operations: OfflineOperation[];
}

export interface SyncPushResultItem {
  opId: string;
  status: "applied" | "duplicate" | "conflict" | "rejected";
  serverEntityId?: number;
  serverVersion?: number;
  error?: string;
}

export interface SyncPushResponse {
  results: SyncPushResultItem[];
}

/** One row persisted after sync (localStorage) for UI: exact server / client errors. */
export interface OfflineSyncFailureItem {
  opId: string;
  /** Server result status or client-side phase (e.g. binary upload). */
  status: string;
  error?: string;
  endpoint?: string;
  method?: string;
  entityType?: string;
}

/** Full last sync report (scoped per tenant + user). */
export interface OfflineSyncLastDetail {
  at: string;
  /** Short line for banners + localStorage `offline-last-sync-error` */
  summary: string;
  syncedCount?: number;
  failedCount?: number;
  failedOperations: OfflineSyncFailureItem[];
  binaryFailures?: OfflineSyncFailureItem[];
  httpStatus?: number;
  /** Raw body when POST /api/sync/push returns non-OK */
  httpBody?: string;
  /** Fetch failed before HTTP response */
  fatalError?: string;
}

export interface OfflineStateSnapshot {
  enabled: boolean;
  syncing: boolean;
  pendingCount: number;
  lastSyncAt?: string;
  lastError?: string;
}
