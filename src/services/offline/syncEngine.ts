import { API_URL } from "@/config/api";
import { getAuthHeaders } from "@/utils/apiHeaders";
import { getCurrentTenant } from "@/utils/tenant";
import { authService } from "@/services/authService";
import { enqueueOperation, listOperationBlobs, listOperations, putOperationBlob, removeOperations } from "./offlineStore";
import type {
  OfflineConflictStrategy,
  OfflineOperation,
  OfflineBlobRef,
  OfflineSyncFailureItem,
  OfflineSyncLastDetail,
  SyncPushResponse,
} from "./types";
import { isHiddenFromSyncUi, sanitizeOfflineSyncLastDetailForUi } from "./syncUiVisibility";
import { OFFLINE_SYNC_BINARY_CONCURRENCY } from "./hydrationLimits";
import { runPool } from "./parallelPool";
import { runPostSyncCacheRefresh } from "./syncCacheRefresh";
import { SERVICE_ORDER_JOB_PATH_REGEX } from "@/services/api/serviceOrderJobPaths";

const OFFLINE_ENABLED_KEY = "offline-mode-enabled";
const OFFLINE_DEVICE_KEY = "offline-device-id";
const LAST_SYNC_AT_KEY = "offline-last-sync-at";
const LAST_SYNC_ERROR_KEY = "offline-last-sync-error";
const LAST_SYNC_DETAIL_KEY = "offline-last-sync-detail-json";

const OFFLINE_HYDRATION_PREFS_PREFIX = "offline-hydration-module-prefs";

/**
 * Client telemetry / system log POSTs must never be queued: they often return 403 on sync
 * (permission mismatch) and are not business data to replay.
 */
export function shouldSkipOfflineQueueForEndpoint(endpoint: string): boolean {
  const path = endpoint.split("?")[0].toLowerCase();
  if (path.includes("/systemlogs")) return true;
  // Read-only validation used by planning UI; no persisted mutation.
  if (path.includes("/planning/validate-assignment")) return true;
  // Authentication operations must happen online or fail immediately.
  if (path.includes("/auth/")) return true;
  return false;
}

/**
 * JWT / storage: MainAdmin uses MainAdminUsers (id = 1); tenant users use Users (id ≥ 2).
 * `login_type` from auth (`admin` vs `user`) is included so offline caches never mix principals
 * if numeric ids ever overlapped between tables.
 */
export function getOfflinePrincipalKind(): "mainadmin" | "user" {
  if (typeof localStorage === "undefined") return "user";
  const loginType =
    localStorage.getItem("login_type") || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("login_type") : null) || "";
  return loginType === "admin" ? "mainadmin" : "user";
}

/**
 * Previous scope format (before principal kind). Used for migration + queue equivalence.
 */
export function getLegacyOfflineScopeKey(): string {
  const tenant = getCurrentTenant() || "default";
  try {
    const raw = localStorage.getItem("user_data");
    if (!raw) return `tenant:${tenant}|anon`;
    const user = JSON.parse(raw) as Record<string, unknown>;
    const userId = user.id ?? user.userId ?? user.sub;
    const email = user.email;
    if (userId != null) return `tenant:${tenant}|user:${String(userId)}`;
    if (email != null) return `tenant:${tenant}|email:${String(email).toLowerCase()}`;
  } catch {
    // no-op
  }
  return `tenant:${tenant}|anon`;
}

/**
 * New-format scope key (tenant + principal + uid). No migration side effects.
 * MainAdmin id is 1 (login_type `admin`); tenant users are 2+ (`user`).
 */
function computeOfflineScopeKey(): string {
  const tenant = getCurrentTenant() || "default";
  const principal = getOfflinePrincipalKind();
  try {
    const raw = localStorage.getItem("user_data");
    if (!raw) return `tenant:${tenant}|${principal}|anon`;
    const user = JSON.parse(raw) as Record<string, unknown>;
    const userId = user.id ?? user.userId ?? user.sub;
    const email = user.email;
    if (userId != null) return `tenant:${tenant}|${principal}|uid:${String(userId)}`;
    if (email != null) return `tenant:${tenant}|${principal}|email:${String(email).toLowerCase()}`;
  } catch {
    // no-op
  }
  return `tenant:${tenant}|${principal}|anon`;
}

/**
 * Skip redundant migrate work when legacy/current pair is unchanged; re-run after logout/login
 * or any session change (unlike a single boolean that breaks user switches in the same tab).
 */
let lastOfflineScopeMigrationPair: string | null = null;

/** Tenant + principal kind + user id for offline queue, hydration cache, and device keys. */
export function getOfflineScopeKey(): string {
  migrateLegacyOfflineScopedKeys();
  return computeOfflineScopeKey();
}

/** True if two scope strings refer to the same session (handles pre-migration vs new format). */
export function areOfflineScopesEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  try {
    const legacy = getLegacyOfflineScopeKey();
    const current = computeOfflineScopeKey();
    return (a === legacy && b === current) || (a === current && b === legacy);
  } catch {
    return false;
  }
}

/**
 * Copy scoped localStorage values from legacy scope key to the current scope key (one-time per key).
 */
export function migrateLegacyOfflineScopedKeys(): void {
  if (typeof localStorage === "undefined") return;
  const legacy = getLegacyOfflineScopeKey();
  const current = computeOfflineScopeKey();
  const pair = `${legacy}\0${current}`;
  if (lastOfflineScopeMigrationPair === pair) return;
  lastOfflineScopeMigrationPair = pair;
  if (legacy === current) return;

  const bases = [
    OFFLINE_ENABLED_KEY,
    OFFLINE_DEVICE_KEY,
    LAST_SYNC_AT_KEY,
    LAST_SYNC_ERROR_KEY,
    LAST_SYNC_DETAIL_KEY,
    OFFLINE_HYDRATION_PREFS_PREFIX,
  ];
  for (const base of bases) {
    const oldKey = `${base}:${legacy}`;
    const newKey = `${base}:${current}`;
    if (localStorage.getItem(newKey) != null) continue;
    const v = localStorage.getItem(oldKey);
    if (v != null) localStorage.setItem(newKey, v);
  }
}

function getOfflineScope(): string {
  return getOfflineScopeKey();
}

function scopedKey(base: string): string {
  return `${base}:${getOfflineScope()}`;
}

function isOperationInScope(op: OfflineOperation, scope: string): boolean {
  if (op.userScope) {
    if (op.userScope === scope) return true;
    return areOfflineScopesEquivalent(op.userScope, scope);
  }
  // Legacy fallback: only treat unscoped rows as current if they belong to same device.
  return op.deviceId === getDeviceId();
}

export function normalizeHeaders(headers?: unknown): Record<string, string> | undefined {
  if (!headers) return undefined;
  const out: Record<string, string> = {};
  try {
    const normalized = new Headers(headers as HeadersInit);
    normalized.forEach((value, key) => {
      if (!key) return;
      out[key] = value;
    });
    return Object.keys(out).length ? out : undefined;
  } catch {
    if (typeof headers === "object") {
      for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
        if (!k || v == null) continue;
        out[k] = String(v);
      }
      return Object.keys(out).length ? out : undefined;
    }
  }
  return undefined;
}

export interface PendingSyncGroup {
  entityType: string;
  count: number;
  sampleEndpoints: string[];
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `op-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inferConflictStrategy(entityType: string): OfflineConflictStrategy {
  if (entityType.startsWith("support_ticket")) return "last_write_wins";
  if (entityType === "daily_task") return "last_write_wins";
  if (entityType.startsWith("task_checklist")) return "merge";
  if (entityType === "lookup_item" || entityType === "lookup_bulk" || entityType === "currency") return "last_write_wins";
  if (entityType.startsWith("planning_")) return "last_write_wins";
  if (entityType.startsWith("dispatch_")) return "last_write_wins";
  if (entityType.startsWith("hr_")) return "last_write_wins";
  if (
    entityType === "offer" ||
    entityType === "sale" ||
    entityType === "service_order" ||
    entityType === "service_order_job"
  ) {
    return "last_write_wins";
  }
  return "reject";
}

export function getOfflineEnabled(): boolean {
  const scoped = localStorage.getItem(scopedKey(OFFLINE_ENABLED_KEY));
  if (scoped != null) return scoped === "true";
  return localStorage.getItem(OFFLINE_ENABLED_KEY) === "true";
}

export function shouldQueueOfflineWrites(): boolean {
  return getOfflineEnabled() || !navigator.onLine;
}

export function setOfflineEnabled(value: boolean): void {
  localStorage.setItem(scopedKey(OFFLINE_ENABLED_KEY), value ? "true" : "false");
}

export function getDeviceId(): string {
  let id = localStorage.getItem(scopedKey(OFFLINE_DEVICE_KEY));
  if (!id) id = localStorage.getItem(OFFLINE_DEVICE_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(scopedKey(OFFLINE_DEVICE_KEY), id);
  }
  return id;
}

function inferEntityType(endpoint: string): string {
  const normalized = endpoint.replace(/^\/+/, "").toLowerCase();
  // HR — most specific paths first
  if (normalized.includes("/hr/employees/") && normalized.includes("salary-config")) return "hr_salary_config";
  if (normalized.includes("/hr/attendance/import")) return "hr_attendance_import";
  if (normalized.includes("/hr/attendance/settings")) return "hr_attendance_settings";
  if (normalized.includes("/hr/leaves/balances")) return "hr_leave_balance";
  if (normalized.includes("/hr/payroll/run") || (normalized.includes("/hr/payroll/runs/") && normalized.includes("/confirm")))
    return "hr_payroll_run";
  if (normalized.includes("/hr/departments")) return "hr_department";
  if (normalized.includes("/hr/attendance")) return "hr_attendance";
  // Planning board (assign / schedule / leaves)
  if (normalized.includes("/planning/batch-assign")) return "planning_assign";
  if (normalized.includes("/planning/assign")) return "planning_assign";
  if (normalized.includes("/planning/schedule")) return "planning_schedule";
  if (normalized.includes("/planning/leaves")) return "planning_leave";
  // Dispatch sub-resources (before generic /dispatches → dispatch)
  if (normalized.includes("/dispatches/") && normalized.includes("/history")) return "dispatch_history";
  if (normalized.includes("/dispatches/") && normalized.includes("/time-entries/") && normalized.includes("/approve"))
    return "dispatch_time_entry_approve";
  if (normalized.includes("/dispatches/") && normalized.includes("/time-entries")) return "dispatch_time_entry";
  if (normalized.includes("/dispatches/") && normalized.includes("/expenses/") && normalized.includes("/approve"))
    return "dispatch_expense_approve";
  if (normalized.includes("/dispatches/") && normalized.includes("/expenses")) return "dispatch_expense";
  if (normalized.includes("/dispatches/") && normalized.includes("/materials/") && normalized.includes("/approve"))
    return "dispatch_material_approve";
  if (normalized.includes("/dispatches/") && normalized.includes("/materials")) return "dispatch_material";
  if (normalized.includes("/dispatches/") && normalized.includes("/notes")) return "dispatch_note";
  if (normalized.includes("/dispatches/") && normalized.includes("/status")) return "dispatch_status";
  if (normalized.includes("/dispatches/") && normalized.includes("/start")) return "dispatch_start";
  if (normalized.includes("/dispatches/") && normalized.includes("/complete")) return "dispatch_complete";
  // Daily tasks (/api/Tasks/daily-task, /api/Tasks/daily/user/...) — must be before broad /tasks → project task
  if (normalized.includes("daily-task") || normalized.includes("tasks/daily")) {
    return "daily_task";
  }
  // Dynamic form responses: POST /api/DynamicForms/:id/responses (exclude /responses/count)
  if (normalized.includes("dynamicforms") && normalized.includes("/responses") && !normalized.includes("/responses/count")) {
    return "dynamic_form_response";
  }
  // Form definitions use /api/DynamicForms (PascalCase → dynamicforms); hyphenated /api/dynamic-forms also exists
  if (normalized.includes("dynamicforms") || normalized.includes("dynamic-forms")) return "dynamic_form";
  if (normalized.includes("public/forms") && normalized.includes("/responses")) return "dynamic_form_response";
  // Synced email mutations: PATCH .../emails/:id/star|read, DELETE .../emails/:id
  if (normalized.includes("/emails/")) return "synced_email";
  if (normalized.includes("stock-transactions")) return "stock_transaction";
  if (normalized.includes("/articles")) return "article";
  if (normalized.includes("/contacts")) return "contact";
  if (normalized.includes("/installations")) return "installation";
  if (normalized.includes("/documents")) return "document";
  if (normalized.includes("/lookups/currencies")) return "currency";
  if (normalized.includes("/lookups/") && normalized.includes("/bulk")) return "lookup_bulk";
  if (normalized.includes("/lookups/")) return "lookup_item";
  if (normalized.includes("supporttickets") && normalized.includes("/comments")) return "support_ticket_comment";
  if (normalized.includes("supporttickets") && normalized.includes("/links")) return "support_ticket_link";
  if (normalized.includes("supporttickets")) return "support_ticket";
  if (normalized.includes("taskchecklists") && normalized.includes("/items")) return "task_checklist_item";
  if (normalized.includes("taskchecklists")) return "task_checklist";
  if (normalized.includes("/calendar") || normalized.startsWith("calendar/")) return "calendar_event";
  if (normalized.includes("email") || normalized.includes("customemail")) return "email_account";
  if (normalized.includes("project-task") || normalized.includes("/tasks")) return "task";
  if (normalized.includes("/projects")) return "project";
  if (normalized.includes("/offers")) return "offer";
  if (normalized.includes("/sales")) return "sale";
  if (
    (normalized.includes("serviceorder") || normalized.includes("service-orders")) &&
    SERVICE_ORDER_JOB_PATH_REGEX.test(endpoint.replace(/^\/+/, ""))
  ) {
    return "service_order_job";
  }
  if (normalized.includes("serviceorder") || normalized.includes("service-orders")) return "service_order";
  if (normalized.includes("/dispatch") || normalized.includes("/dispatches")) return "dispatch";
  if (normalized.includes("systemlogs")) return "system_log";
  if (import.meta.env.DEV) {
    console.warn(
      "[offline] Mutation queued with entityType \"generic\" — sync push will reject unless the backend adds a handler:",
      endpoint,
    );
  }
  return "generic";
}

/** First numeric id after `segment/` — mirrors server ParseIdFromEndpoint (case-insensitive path). */
function parseIdAfterSegment(endpoint: string, segment: string): number | undefined {
  const normalized = endpoint.replace(/^\/+/, "").toLowerCase();
  const seg = segment.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = normalized.match(new RegExp(`${seg}/(\\d+)(?:/|$|\\?)`, "i"));
  if (!m) return undefined;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? undefined : n;
}

/** Sets entityId for sync push when the client omits it in the JSON body (status-only PUTs, etc.). */
function inferEntityIdFromEndpoint(endpoint: string, entityType: string): number | undefined {
  if (entityType === "service_order_job") {
    const m = endpoint.replace(/^\/+/, "").match(SERVICE_ORDER_JOB_PATH_REGEX);
    if (m) {
      const jobId = parseInt(m[2], 10);
      return Number.isNaN(jobId) ? undefined : jobId;
    }
    return undefined;
  }
  if (entityType === "offer") return parseIdAfterSegment(endpoint, "offers");
  if (entityType === "sale") return parseIdAfterSegment(endpoint, "sales");
  if (entityType === "service_order") return parseIdAfterSegment(endpoint, "service-orders");
  if (entityType === "dispatch") return parseIdAfterSegment(endpoint, "dispatches");
  return undefined;
}

async function formDataToPayload(opId: string, formData: FormData): Promise<{ payload: Record<string, unknown>; blobRefs: OfflineBlobRef[] }> {
  const payload: Record<string, unknown> = {};
  const blobRefs: OfflineBlobRef[] = [];
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[key] = value;
      continue;
    }
    const blobId = `${opId}-${uuid()}`;
    await putOperationBlob({
      blobId,
      opId,
      fieldName: key,
      fileName: value.name,
      contentType: value.type || "application/octet-stream",
      blob: value,
    });
    blobRefs.push({
      blobId,
      fieldName: key,
      fileName: value.name,
      contentType: value.type || "application/octet-stream",
      size: value.size,
    });
    payload[`_file_${key}`] = value.name;
  }
  return { payload, blobRefs };
}

/** Parse accountId and emailId from paths like /api/email-accounts/{accountId}/emails/{emailId}/star */
function parseSyncedEmailIdsFromEndpoint(endpoint: string): { accountId?: string; emailId?: string } | null {
  const match = endpoint.match(/email-accounts\/([a-f0-9-]+)\/emails\/([a-f0-9-]+)(?:\/star|\/read)?\/?$/i);
  if (!match) return null;
  return { accountId: match[1], emailId: match[2] };
}

export async function queueHttpOperation(input: {
  endpoint: string;
  method: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<OfflineOperation> {
  const opId = uuid();
  const entityType = inferEntityType(input.endpoint);
  const entityId = inferEntityIdFromEndpoint(input.endpoint, entityType);
  let payload = input.body;
  let blobRefs: OfflineBlobRef[] | undefined = undefined;
  if (input.body instanceof FormData) {
    const serialized = await formDataToPayload(opId, input.body);
    payload = serialized.payload;
    blobRefs = serialized.blobRefs.length ? serialized.blobRefs : undefined;
  }
  // Enrich synced_email operations (star/read/delete) with accountId and emailId from path
  if (entityType === "synced_email") {
    const ids = parseSyncedEmailIdsFromEndpoint(input.endpoint);
    payload = ids ? { ...(typeof payload === "object" && payload ? payload : {}), ...ids } : payload;
  }
  const normalizedHeaders = normalizeHeaders(input.headers);
  const transactionGroupFromHeaders = normalizedHeaders?.["X-Transaction-Group"] || normalizedHeaders?.["x-transaction-group"];
  const conflictFromHeaders = normalizedHeaders?.["X-Conflict-Strategy"] || normalizedHeaders?.["x-conflict-strategy"];
  const payloadTxGroup =
    typeof payload === "object" && payload && "transactionGroupId" in (payload as Record<string, unknown>)
      ? String((payload as Record<string, unknown>).transactionGroupId ?? "")
      : undefined;
  const txGroup = transactionGroupFromHeaders || payloadTxGroup;
  const chosenConflict = (conflictFromHeaders as OfflineConflictStrategy | undefined) || inferConflictStrategy(entityType);

  const op: OfflineOperation = {
    opId,
    entityType,
    ...(entityId != null ? { entityId } : {}),
    operation: input.method === "DELETE" ? "delete" : "upsert",
    payload,
    clientTimestamp: new Date().toISOString(),
    method: input.method.toUpperCase(),
    endpoint: input.endpoint,
    headers: normalizedHeaders,
    deviceId: getDeviceId(),
    userScope: getOfflineScope(),
    transactionGroupId: txGroup && txGroup.trim().length ? txGroup : undefined,
    conflictStrategy: chosenConflict,
    blobRefs,
  };
  await enqueueOperation(op);
  return op;
}

async function replayBinaryOperation(op: OfflineOperation): Promise<boolean> {
  if (!op.blobRefs?.length) return false;
  const blobs = await listOperationBlobs(op.opId);
  if (!blobs.length) return false;
  const formData = new FormData();
  if (op.payload && typeof op.payload === "object") {
    for (const [k, v] of Object.entries(op.payload as Record<string, unknown>)) {
      if (k.startsWith("_file_")) continue;
      if (v == null) continue;
      formData.append(k, String(v));
    }
  }
  for (const ref of op.blobRefs) {
    const row = blobs.find((b) => b.blobId === ref.blobId);
    if (!row) continue;
    const file = new File([row.blob], ref.fileName, { type: ref.contentType || row.contentType });
    formData.append(ref.fieldName, file, ref.fileName);
  }
  const endpoint = op.endpoint.startsWith("http") ? op.endpoint : `${API_URL}${op.endpoint.startsWith("/") ? "" : "/"}${op.endpoint}`;
  const headers = getAuthHeaders() as Record<string, string>;
  const originalHeaders = op.headers ?? {};
  for (const [k, v] of Object.entries(originalHeaders)) {
    if (!v) continue;
    const key = k.toLowerCase();
    if (key === "content-type" || key === "content-length" || key === "host") continue;
    headers[k] = v;
  }
  // Let browser set multipart boundary
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === "content-type") delete headers[key];
  }
  const res = await fetch(endpoint, {
    method: op.method,
    headers: { ...headers, "X-Bypass-Offline-Queue": "true" },
    body: formData,
  });
  return res.ok;
}

export async function getPendingCount(): Promise<number> {
  const items = await listOperations();
  const scope = getOfflineScope();
  return items.filter((op) => isOperationInScope(op, scope) && !isHiddenFromSyncUi(op)).length;
}

export async function getPendingSyncGroups(): Promise<PendingSyncGroup[]> {
  const scope = getOfflineScope();
  const scoped = (await listOperations()).filter(
    (op) => isOperationInScope(op, scope) && !isHiddenFromSyncUi(op),
  );
  const byEntity = new Map<string, { count: number; samples: Set<string> }>();
  for (const op of scoped) {
    const key = op.entityType || "generic";
    const current = byEntity.get(key) ?? { count: 0, samples: new Set<string>() };
    current.count += 1;
    if (current.samples.size < 3 && op.endpoint) current.samples.add(op.endpoint);
    byEntity.set(key, current);
  }
  return Array.from(byEntity.entries())
    .map(([entityType, val]) => ({
      entityType,
      count: val.count,
      sampleEndpoints: Array.from(val.samples),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getLastSyncAt(): string | undefined {
  return localStorage.getItem(scopedKey(LAST_SYNC_AT_KEY)) ?? localStorage.getItem(LAST_SYNC_AT_KEY) ?? undefined;
}

export function getLastSyncError(): string | undefined {
  if (typeof localStorage === "undefined") return undefined;
  const raw =
    localStorage.getItem(scopedKey(LAST_SYNC_ERROR_KEY)) ?? localStorage.getItem(LAST_SYNC_ERROR_KEY) ?? undefined;
  const sanitized = sanitizeOfflineSyncLastDetailForUi(readLastSyncDetailFromStorage());
  if (!sanitized) {
    if (raw && /systemlogs/i.test(raw)) return undefined;
    return raw;
  }
  if (sanitized.summary?.trim()) return sanitized.summary;
  const stillHasIssues =
    (sanitized.failedOperations?.length ?? 0) > 0 ||
    (sanitized.binaryFailures?.length ?? 0) > 0 ||
    sanitized.httpStatus != null ||
    !!sanitized.fatalError;
  if (stillHasIssues) {
    if (raw && /systemlogs/i.test(raw)) return undefined;
    return raw;
  }
  if (raw && /systemlogs/i.test(raw)) return undefined;
  return raw;
}

function persistLastSyncDetail(detail: OfflineSyncLastDetail | null): void {
  if (typeof localStorage === "undefined") return;
  const k = scopedKey(LAST_SYNC_DETAIL_KEY);
  if (!detail) {
    localStorage.removeItem(k);
    localStorage.removeItem(LAST_SYNC_DETAIL_KEY);
    return;
  }
  try {
    const json = JSON.stringify(detail);
    localStorage.setItem(k, json);
  } catch {
    /* quota */
  }
}

function readLastSyncDetailFromStorage(): OfflineSyncLastDetail | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(scopedKey(LAST_SYNC_DETAIL_KEY)) ?? localStorage.getItem(LAST_SYNC_DETAIL_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineSyncLastDetail;
  } catch {
    return null;
  }
}

/** Last sync report for UI — system log rows are stripped. */
export function getLastSyncDetail(): OfflineSyncLastDetail | null {
  return sanitizeOfflineSyncLastDetailForUi(readLastSyncDetailFromStorage());
}

function buildOpLookup(ops: OfflineOperation[]): Map<string, OfflineOperation> {
  const m = new Map<string, OfflineOperation>();
  for (const op of ops) m.set(op.opId, op);
  return m;
}

function collectEntityTypesFromOpIds(ids: string[], lookup: Map<string, OfflineOperation>): string[] {
  const out: string[] = [];
  for (const id of ids) {
    const et = lookup.get(id)?.entityType;
    if (et) out.push(et);
  }
  return out;
}

function truncateStr(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

function buildSyncFailureSummary(
  failedOps: OfflineSyncFailureItem[],
  binary: OfflineSyncFailureItem[],
): string {
  const lines: string[] = [];
  for (const f of failedOps) {
    const where = f.endpoint || f.entityType || f.opId;
    const err = f.error || f.status;
    lines.push(`${where}: ${err}`);
  }
  for (const b of binary) {
    const where = b.endpoint || b.opId;
    const err = b.error || b.status;
    lines.push(`[upload] ${where}: ${err}`);
  }
  if (!lines.length) return "One or more operations failed to sync";
  const joined = lines.slice(0, 6).join(" · ");
  return truncateStr(lines.length > 6 ? `${joined} (+${lines.length - 6} more)` : joined, 900);
}

export async function forceClearQueue(): Promise<void> {
  const scope = getOfflineScope();
  const items = await listOperations();
  const scopedOpIds = items.filter((op) => isOperationInScope(op, scope)).map((op) => op.opId);
  if (scopedOpIds.length) await removeOperations(scopedOpIds);
}

/** Remove queued ops that should never sync (e.g. client SystemLogs). Returns how many were removed. */
export async function dropExcludedFromOfflineQueue(): Promise<number> {
  const scope = getOfflineScope();
  const items = await listOperations();
  const toRemove = items.filter(
    (op) => isOperationInScope(op, scope) && shouldSkipOfflineQueueForEndpoint(op.endpoint)
  );
  if (toRemove.length) await removeOperations(toRemove.map((o) => o.opId));
  return toRemove.length;
}

function notifyOfflineQueueUpdated(): void {
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("offline:queue-updated"));
    }
  } catch {
    /* ignore */
  }
}

/** Transient server / rate-limit errors — safe to retry without changing queue state. */
function isTransientSyncPushHttpStatus(status: number): boolean {
  return status >= 500 || status === 429;
}

/**
 * POST /api/sync/push with retries (network failures, 5xx, 429). Does not retry 4xx validation/auth errors.
 * ✅ NEW: Includes automatic token refresh for expired tokens
 */
async function fetchSyncPushWithRetry(bodyJson: string): Promise<Response> {
  // ✅ SOLUTION 1: Check and refresh token if expiring soon
  try {
    if (typeof authService !== 'undefined' && authService.isTokenExpiringSoon?.()) {
      console.warn("[OFFLINE SYNC] Token expiring soon, attempting refresh...");
      const refreshed = await authService.refreshToken?.();
      if (refreshed?.success) {
        console.info("[OFFLINE SYNC] Token successfully refreshed before sync push");
      } else if (refreshed === null) {
        // Silent fail - token doesn't need refresh
        console.debug("[OFFLINE SYNC] No refresh token available");
      } else {
        throw new Error("Token refresh failed - please log in again");
      }
    }
  } catch (refreshError) {
    const msg = refreshError instanceof Error ? refreshError.message : String(refreshError);
    console.warn("[OFFLINE SYNC] Token refresh error:", msg);
    // Don't throw on refresh errors - let sync attempt with current token
    // If token is actually invalid, sync will fail with 401/403
  }

  const maxAttempts = 4;
  let lastErr: unknown;
  let refreshAttempted = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_URL}/api/sync/push`, {
        method: "POST",
        headers: { ...(getAuthHeaders() as Record<string, string>), "X-Bypass-Offline-Queue": "true" },
        body: bodyJson,
      });

      // ✅ If we get 401/403 on first attempt, try refreshing once
      if ((response.status === 401 || response.status === 403) && attempt === 1 && !refreshAttempted) {
        console.warn(`[OFFLINE SYNC] Got ${response.status} on first attempt, trying token refresh...`);
        refreshAttempted = true;
        try {
          const refreshed = await authService.refreshToken?.();
          if (refreshed?.success) {
            console.info("[OFFLINE SYNC] Token refreshed after 403, retrying...");
            attempt = 0; // Will increment to 1 in next iteration
            continue;
          }
        } catch (e) {
          console.error("[OFFLINE SYNC] Refresh after 403/401 failed:", e);
          // Fall through to return error response
        }
      }

      if (!isTransientSyncPushHttpStatus(response.status)) return response;
      lastErr = new Error(`HTTP ${response.status}`);
    } catch (e) {
      lastErr = e;
    }
    if (attempt < maxAttempts) {
      const delay = Math.min(8000, 400 * 2 ** (attempt - 1));
      console.debug(`[OFFLINE SYNC] Retry attempt ${attempt} in ${delay}ms`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function syncNow(): Promise<{ synced: number; failed: number }> {
  try {
  // Early guard: sync requires authentication
  const hasToken = typeof localStorage !== "undefined" && !!localStorage.getItem("access_token");
  const hasRefreshToken = typeof localStorage !== "undefined" && !!localStorage.getItem("refresh_token");
  if (!hasToken && !hasRefreshToken) {
    const summary = "Please log in to sync your offline changes.";
    persistLastSyncDetail({
      at: new Date().toISOString(),
      summary,
      fatalError: "No auth token",
      failedOperations: [],
      syncedCount: 0,
      failedCount: 0,
    });
    localStorage.setItem(scopedKey(LAST_SYNC_ERROR_KEY), summary);
    throw new Error(summary);
  }

  await dropExcludedFromOfflineQueue();
  const scope = getOfflineScope();
  const queuedAll = (await listOperations()).filter((op) => isOperationInScope(op, scope));
  const at = new Date().toISOString();

  const mkDetail = (partial: Partial<OfflineSyncLastDetail> & Pick<OfflineSyncLastDetail, "summary">): OfflineSyncLastDetail => ({
    at,
    summary: partial.summary,
    failedOperations: partial.failedOperations ?? [],
    syncedCount: partial.syncedCount,
    failedCount: partial.failedCount,
    binaryFailures: partial.binaryFailures,
    httpStatus: partial.httpStatus,
    httpBody: partial.httpBody,
    fatalError: partial.fatalError,
  });

  if (!queuedAll.length) {
    localStorage.removeItem(scopedKey(LAST_SYNC_ERROR_KEY));
    persistLastSyncDetail(null);
    localStorage.setItem(scopedKey(LAST_SYNC_AT_KEY), new Date().toISOString());
    return { synced: 0, failed: 0 };
  }

  const allOpLookup = buildOpLookup(queuedAll);

  const binaryOps = queuedAll.filter((op) => op.blobRefs?.length);
  const binarySucceeded: string[] = [];
  const binaryFailures: OfflineSyncFailureItem[] = [];
  await runPool(binaryOps, OFFLINE_SYNC_BINARY_CONCURRENCY, async (op) => {
    try {
      const ok = await replayBinaryOperation(op);
      if (ok) binarySucceeded.push(op.opId);
      else {
        binaryFailures.push({
          opId: op.opId,
          status: "binary_upload_failed",
          error: "Server rejected the upload or returned a non-success status",
          endpoint: op.endpoint,
          method: op.method,
          entityType: op.entityType,
        });
      }
    } catch (e) {
      binaryFailures.push({
        opId: op.opId,
        status: "binary_upload_exception",
        error: e instanceof Error ? e.message : String(e),
        endpoint: op.endpoint,
        method: op.method,
        entityType: op.entityType,
      });
    }
  });
  if (binarySucceeded.length) await removeOperations(binarySucceeded);

  const queued = (await listOperations()).filter((op) => isOperationInScope(op, scope) && !op.blobRefs?.length);
  const binaryFailedCount = binaryFailures.length;

  if (!queued.length) {
    localStorage.setItem(scopedKey(LAST_SYNC_AT_KEY), new Date().toISOString());
    if (binaryFailedCount) {
      const summary = buildSyncFailureSummary([], binaryFailures);
      const detail = mkDetail({
        summary,
        syncedCount: binarySucceeded.length,
        failedCount: binaryFailedCount,
        binaryFailures,
      });
      persistLastSyncDetail(detail);
      localStorage.setItem(scopedKey(LAST_SYNC_ERROR_KEY), summary);
    } else {
      localStorage.removeItem(scopedKey(LAST_SYNC_ERROR_KEY));
      persistLastSyncDetail(null);
    }
    await runPostSyncCacheRefresh(collectEntityTypesFromOpIds(binarySucceeded, allOpLookup));
    return { synced: binarySucceeded.length, failed: binaryFailedCount };
  }

  const opLookup = buildOpLookup(queued);
  const pushBody = JSON.stringify({
    deviceId: getDeviceId(),
    operations: queued,
  });
  let response: Response;
  try {
    response = await fetchSyncPushWithRetry(pushBody);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    
    // ✅ SOLUTION 4: Detect and flag auth-related errors
    const isAuthError = msg.includes("401") || msg.includes("403") || msg.includes("token") || msg.includes("expired");
    
    const summary = isAuthError 
      ? `⚠️ Auth error during sync: ${msg}. Your session may have expired.`
      : `Sync request failed: ${msg}`;
      
    const detail = mkDetail({
      summary,
      fatalError: msg,
      failedOperations: [],
      binaryFailures: binaryFailures.length ? binaryFailures : undefined,
    });
    persistLastSyncDetail(detail);
    localStorage.setItem(scopedKey(LAST_SYNC_ERROR_KEY), truncateStr(summary, 900));
    
    // Dispatch event for UI to show auth requirement
    if (isAuthError) {
      try {
        window.dispatchEvent(new CustomEvent("offline:auth-required", {
          detail: { message: "Your session has expired. Please log in to continue syncing.", error: msg }
        }));
      } catch {
        console.warn("[OFFLINE SYNC] Failed to dispatch offline:auth-required event");
      }
    }
    
    throw new Error(summary);
  }

  // ✅ SOLUTION 4: Special handling for 401/403 status codes
  if (response.status === 401 || response.status === 403) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      /* ignore */
    }
    
    const summary = `🔐 Sync blocked by server (HTTP ${response.status}). Your session may have expired. Please log in again.`;
    const detail = mkDetail({
      summary,
      httpStatus: response.status,
      httpBody: bodyText ? truncateStr(bodyText, 8000) : undefined,
      failedOperations: queued.map(op => ({
        opId: op.opId,
        status: "blocked",
        error: `Server authentication failure (${response.status})`,
        endpoint: op.endpoint,
        method: op.method,
        entityType: op.entityType,
      })),
      binaryFailures: binaryFailures.length ? binaryFailures : undefined,
    });
    persistLastSyncDetail(detail);
    localStorage.setItem(scopedKey(LAST_SYNC_ERROR_KEY), truncateStr(summary, 900));
    
    // Dispatch auth event
    try {
      window.dispatchEvent(new CustomEvent("offline:auth-required", {
        detail: { 
          message: "Your session has expired. Please log in to sync your changes.",
          httpStatus: response.status,
          timestamp: new Date().toISOString()
        }
      }));
    } catch {
      console.warn("[OFFLINE SYNC] Failed to dispatch offline:auth-required event");
    }
    
    return { synced: binarySucceeded.length, failed: queued.length + binaryFailedCount };
  }

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      /* ignore */
    }
    let parsedMsg = bodyText;
    try {
      const j = JSON.parse(bodyText) as { message?: string; title?: string; error?: string; errors?: string };
      parsedMsg = j.message || j.error || j.title || (typeof j.errors === "string" ? j.errors : bodyText);
    } catch {
      /* raw */
    }
    const summary = `HTTP ${response.status}: ${truncateStr(parsedMsg || response.statusText || "Request failed", 400)}`;
    const detail = mkDetail({
      summary,
      httpStatus: response.status,
      httpBody: bodyText ? truncateStr(bodyText, 8000) : undefined,
      failedOperations: [],
      binaryFailures: binaryFailures.length ? binaryFailures : undefined,
    });
    persistLastSyncDetail(detail);
    localStorage.setItem(scopedKey(LAST_SYNC_ERROR_KEY), truncateStr(summary, 900));
    throw new Error(summary);
  }

  let data: SyncPushResponse;
  try {
    data = (await response.json()) as SyncPushResponse;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const summary = `Invalid sync response: ${msg}`;
    const detail = mkDetail({
      summary,
      fatalError: summary,
      failedOperations: [],
      binaryFailures: binaryFailures.length ? binaryFailures : undefined,
    });
    persistLastSyncDetail(detail);
    localStorage.setItem(scopedKey(LAST_SYNC_ERROR_KEY), truncateStr(summary, 900));
    throw new Error(summary);
  }

  const results = Array.isArray(data.results) ? data.results : [];
  if (import.meta.env.DEV && results.length !== queued.length) {
    const ids = new Set(results.map((r) => r.opId));
    const missing = queued.filter((op) => !ids.has(op.opId)).length;
    if (missing > 0) {
      console.warn(
        `[offline sync] Expected ${queued.length} result(s), got ${results.length}; ${missing} operation(s) left in queue.`,
      );
    }
  }
  const succeeded = results.filter((r) => r.status === "applied" || r.status === "duplicate").map((r) => r.opId);
  const failed = results.filter((r) => r.status !== "applied" && r.status !== "duplicate");

  await removeOperations(succeeded);
  localStorage.setItem(scopedKey(LAST_SYNC_AT_KEY), new Date().toISOString());

  const failedOperations: OfflineSyncFailureItem[] = failed.map((r) => {
    const op = opLookup.get(r.opId);
    return {
      opId: r.opId,
      status: String(r.status),
      error: r.error,
      endpoint: op?.endpoint,
      method: op?.method,
      entityType: op?.entityType,
    };
  });

  const totalFailed = failed.length + binaryFailedCount;
  const totalSynced = succeeded.length + binarySucceeded.length;

  if (totalFailed > 0) {
    const summary = buildSyncFailureSummary(failedOperations, binaryFailures);
    const detail = mkDetail({
      summary,
      syncedCount: totalSynced,
      failedCount: totalFailed,
      failedOperations,
      binaryFailures: binaryFailures.length ? binaryFailures : undefined,
    });
    persistLastSyncDetail(detail);
    localStorage.setItem(scopedKey(LAST_SYNC_ERROR_KEY), truncateStr(summary, 900));
  } else {
    localStorage.removeItem(scopedKey(LAST_SYNC_ERROR_KEY));
    persistLastSyncDetail(null);
  }

  await runPostSyncCacheRefresh([
    ...collectEntityTypesFromOpIds(binarySucceeded, allOpLookup),
    ...collectEntityTypesFromOpIds(succeeded, allOpLookup),
  ]);

  return { synced: totalSynced, failed: totalFailed };
  } finally {
    notifyOfflineQueueUpdated();
  }
}
