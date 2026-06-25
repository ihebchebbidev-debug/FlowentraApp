import { API_URL } from '@/config/api';
import { getCurrentTenant, TENANT_HEADER, isViewAllMode } from '@/utils/tenant';
import { getTargetTenantHeaders, getTargetTenantId } from '@/utils/targetTenant';
import type {
  AutoIncidentResult,
  IncidentReportPayload,
  IncidentSeverity,
  IncidentType,
  ReportIssuePrefill,
} from './incidentTypes';
import { INCIDENT_PREFILL_EVENT, INCIDENT_SKIP_ENDPOINTS } from './incidentTypes';
import {
  isActionableErrorMessage,
  isChunkLoadMessage,
  isIgnorableIncidentMessage,
  shouldTicketHttpStatus,
} from './incidentFilters';
import { bumpOccurrence, pruneOccurrenceTracker } from './incidentOccurrenceTracker';
import { getBreadcrumbsSummary, pushBreadcrumb } from './incidentBreadcrumbs';

const CLIENT_DEDUP_MS = 30_000;
const recentReports = new Map<string, number>();

function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

function getUserContext(): { userId?: string; userEmail?: string; userName?: string } {
  try {
    const raw = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    if (!raw) return {};
    const user = JSON.parse(raw) as Record<string, unknown>;
    const firstName = String(user.firstName ?? '');
    const lastName = String(user.lastName ?? '');
    const name = `${firstName} ${lastName}`.trim();
    return {
      userId: user.id != null ? String(user.id) : undefined,
      userEmail: user.email != null ? String(user.email) : undefined,
      userName: name || undefined,
    };
  } catch {
    return {};
  }
}

export function shouldReportIncidentForEndpoint(endpoint: string): boolean {
  const path = endpoint.split('?')[0];
  return !INCIDENT_SKIP_ENDPOINTS.some((skip) => path.includes(skip));
}

export function inferModuleFromPath(pathname?: string): string {
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  const dash = path.match(/\/dashboard\/([^/]+)/);
  if (dash?.[1]) return dash[1];
  if (path.includes('/support')) return 'support';
  return path.split('/').filter(Boolean)[0] || 'app';
}

function normalizeRoute(path?: string): string {
  if (!path) return '';
  return path.replace(/\/\d+/g, '/:id');
}

function normalizeEndpoint(endpoint?: string): string {
  if (!endpoint) return '';
  return endpoint.split('?')[0].replace(/\/\d+/g, '/:id');
}

function extractStackTop(stack?: string): string {
  if (!stack) return '';
  const line = stack.split('\n').find((l) => l.includes('at ') && !l.includes('node_modules'));
  return line?.trim() || stack.split('\n')[0]?.trim() || '';
}

function normalizeMessage(message: string): string {
  const trimmed = message.trim();
  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed;
}

async function sha256(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export async function computeIncidentFingerprint(
  parts: Pick<
    IncidentReportPayload,
    'incidentType' | 'message' | 'httpStatus' | 'httpMethod' | 'endpoint' | 'currentPage' | 'stack'
  >
): Promise<string> {
  const raw = [
    parts.incidentType,
    normalizeMessage(parts.message),
    parts.httpStatus?.toString() ?? '',
    parts.httpMethod ?? '',
    normalizeEndpoint(parts.endpoint),
    normalizeRoute(parts.currentPage),
    extractStackTop(parts.stack),
  ].join('|');
  return sha256(raw);
}

const ALWAYS_TICKET_TYPES = new Set<IncidentType>([
  'app_crash',
  'react_boundary',
  'unhandled_rejection',
  'window_error',
  'chunk_load_error',
  'sync_failure',
  'backend_health',
  'security_violation',
]);

function getOccurrenceCategory(incidentType: IncidentType, httpStatus?: number): string {
  if (incidentType === 'console_error') return 'console_error';
  if (incidentType === 'network_error' || httpStatus === 0) return 'network_error';
  if (httpStatus && httpStatus >= 400 && httpStatus < 500) return 'api_4xx';
  return 'default';
}

function shouldSendIncident(
  incidentType: IncidentType,
  message: string,
  httpStatus: number | undefined,
  clientOccurrenceCount: number
): boolean {
  if (isIgnorableIncidentMessage(message)) return false;
  if (ALWAYS_TICKET_TYPES.has(incidentType)) return true;
  if (incidentType === 'logger_error') return isActionableErrorMessage(message);
  if (incidentType === 'console_error') return clientOccurrenceCount >= 2 && isActionableErrorMessage(message);
  if (httpStatus !== undefined) return shouldTicketHttpStatus(httpStatus, clientOccurrenceCount);
  if (incidentType === 'network_error' || incidentType === 'query_error' || incidentType === 'mutation_error') {
    return clientOccurrenceCount >= 1 && isActionableErrorMessage(message);
  }
  return isActionableErrorMessage(message);
}

export function mapSeverityForType(
  incidentType: IncidentType,
  httpStatus?: number,
  clientOccurrenceCount = 1
): IncidentSeverity {
  if (clientOccurrenceCount >= 10) return 'critical';
  if (clientOccurrenceCount >= 5) return 'high';
  if (incidentType === 'app_crash' || incidentType === 'react_boundary' || incidentType === 'backend_health') {
    return 'critical';
  }
  if (incidentType === 'chunk_load_error' || incidentType === 'sync_failure') return 'high';
  if (incidentType === 'unhandled_rejection' || incidentType === 'window_error' || incidentType === 'security_violation') {
    return 'high';
  }
  if (httpStatus && httpStatus >= 500) return 'high';
  if (incidentType === 'network_error') return 'medium';
  return 'medium';
}

function shouldSuppressIncidentReporting(): boolean {
  return isViewAllMode() && getTargetTenantId() === undefined;
}

function shouldClientDedup(fingerprint: string, incidentType: IncidentType): boolean {
  const windowMs = ALWAYS_TICKET_TYPES.has(incidentType) ? 15_000 : CLIENT_DEDUP_MS;
  const now = Date.now();
  const last = recentReports.get(fingerprint);
  if (last && now - last < windowMs) return true;
  recentReports.set(fingerprint, now);
  if (recentReports.size > 300) pruneOccurrenceTracker();
  return false;
}

function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Suppress-Error-Toast': 'true',
    'X-Bypass-Offline-Queue': 'true',
  };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const tenant = getCurrentTenant();
  if (tenant) headers[TENANT_HEADER] = tenant;
  Object.entries(getTargetTenantHeaders()).forEach(([k, v]) => {
    headers[k] = v;
  });
  return headers;
}

function enrichDetails(base?: string): string | undefined {
  const crumbs = getBreadcrumbsSummary();
  if (!crumbs && !base) return undefined;
  const parts = [];
  if (base) parts.push(base);
  if (crumbs) {
    parts.push('--- Recent user activity ---');
    parts.push(crumbs);
  }
  return parts.join('\n');
}

export async function reportIncident(
  input: Omit<IncidentReportPayload, 'fingerprint' | 'userEmail' | 'userId' | 'userName' | 'userAgent' | 'currentPage' | 'relatedUrl'> &
    Partial<Pick<IncidentReportPayload, 'fingerprint' | 'userEmail' | 'userId' | 'userName' | 'userAgent' | 'currentPage' | 'relatedUrl' | 'clientOccurrenceCount'>>
): Promise<AutoIncidentResult | null> {
  if (shouldSuppressIncidentReporting()) return null;
  if (typeof window === 'undefined') return null;
  if (isIgnorableIncidentMessage(input.message)) return null;

  const user = getUserContext();
  const payload: IncidentReportPayload = {
    incidentType: input.incidentType,
    message: input.message,
    severity: input.severity,
    module: input.module ?? inferModuleFromPath(input.currentPage),
    currentPage: input.currentPage ?? window.location.pathname,
    relatedUrl: input.relatedUrl ?? window.location.href,
    userEmail: input.userEmail ?? user.userEmail,
    userId: input.userId ?? user.userId,
    userName: input.userName ?? user.userName,
    stack: input.stack,
    componentStack: input.componentStack,
    httpStatus: input.httpStatus,
    httpMethod: input.httpMethod,
    endpoint: input.endpoint,
    entityType: input.entityType,
    entityId: input.entityId,
    referenceId: input.referenceId,
    systemLogId: input.systemLogId,
    details: enrichDetails(input.details),
    userAgent: input.userAgent ?? navigator.userAgent,
  };

  payload.fingerprint =
    input.fingerprint ??
    (await computeIncidentFingerprint({
      incidentType: payload.incidentType,
      message: payload.message,
      httpStatus: payload.httpStatus,
      httpMethod: payload.httpMethod,
      endpoint: payload.endpoint,
      currentPage: payload.currentPage,
      stack: payload.stack,
    }));

  const category = getOccurrenceCategory(payload.incidentType, payload.httpStatus);
  payload.clientOccurrenceCount =
    input.clientOccurrenceCount ?? bumpOccurrence(payload.fingerprint!, category);

  if (!shouldSendIncident(payload.incidentType, payload.message, payload.httpStatus, payload.clientOccurrenceCount)) {
    return null;
  }

  payload.severity =
    payload.severity ?? mapSeverityForType(payload.incidentType, payload.httpStatus, payload.clientOccurrenceCount);

  if (shouldClientDedup(payload.fingerprint!, payload.incidentType)) return null;

  pushBreadcrumb({ type: 'error', label: `${payload.incidentType}: ${normalizeMessage(payload.message)}` });

  try {
    const response = await fetch(`${API_URL}/api/Incidents/auto`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        incidentType: payload.incidentType,
        message: payload.message,
        severity: payload.severity,
        module: payload.module,
        currentPage: payload.currentPage,
        relatedUrl: payload.relatedUrl,
        userEmail: payload.userEmail,
        userId: payload.userId,
        userName: payload.userName,
        stack: payload.stack,
        componentStack: payload.componentStack,
        fingerprint: payload.fingerprint,
        httpStatus: payload.httpStatus,
        httpMethod: payload.httpMethod,
        endpoint: payload.endpoint,
        entityType: payload.entityType,
        entityId: payload.entityId,
        referenceId: payload.referenceId,
        systemLogId: payload.systemLogId,
        details: payload.details,
        userAgent: payload.userAgent,
        clientOccurrenceCount: payload.clientOccurrenceCount,
      }),
    });

    if (!response.ok) return null;
    return (await response.json()) as AutoIncidentResult;
  } catch {
    return null;
  }
}

export function openReportIssuePrefill(prefill: ReportIssuePrefill): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(INCIDENT_PREFILL_EVENT, { detail: prefill }));
}

export function reportApiErrorIncident(params: {
  endpoint: string;
  method: string;
  status: number;
  message: string;
  incidentType?: IncidentType;
}): void {
  if (!shouldReportIncidentForEndpoint(params.endpoint)) return;
  if (params.status === 401 || params.status === 403) return;

  void reportIncident({
    incidentType: params.incidentType ?? 'api_error',
    message: params.message,
    httpStatus: params.status,
    httpMethod: params.method,
    endpoint: params.endpoint,
  });
}

export function reportNetworkErrorIncident(params: {
  endpoint: string;
  method: string;
  message: string;
}): void {
  if (!shouldReportIncidentForEndpoint(params.endpoint)) return;
  void reportIncident({
    incidentType: 'network_error',
    message: params.message,
    httpMethod: params.method,
    endpoint: params.endpoint,
    httpStatus: 0,
  });
}

export function reportConsoleErrorIncident(message: string, stack?: string): void {
  if (isIgnorableIncidentMessage(message) || !isActionableErrorMessage(message)) return;
  const incidentType: IncidentType = isChunkLoadMessage(message) ? 'chunk_load_error' : 'console_error';
  void reportIncident({ incidentType, message, stack });
}

export function reportLoggerErrorIncident(params: {
  message: string;
  module: string;
  entityType?: string;
  entityId?: string;
  details?: string;
}): void {
  if (isIgnorableIncidentMessage(params.message)) return;
  void reportIncident({
    incidentType: 'logger_error',
    message: params.message,
    module: params.module,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details,
  });
}

export function reportChunkLoadError(error: Error, context?: string): void {
  void reportIncident({
    incidentType: 'chunk_load_error',
    message: context ? `${context}: ${error.message}` : error.message,
    stack: error.stack,
    severity: 'high',
  });
}
