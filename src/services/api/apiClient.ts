// API Client with automatic logging for all CRUD operations
import { authService } from '@/services/authService';
import { logger } from '@/hooks/useLogger';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { API_URL } from '@/config/api';
import { dedupFetch } from '@/utils/requestDedup';
import { getCachedResponse } from '@/services/offline/hydrationStore';
import { headersBypassHydrationCache, toRelativeApiEndpoint } from '@/services/offline/offlineRequestPolicy';
import {
  normalizeHeaders,
  queueHttpOperation,
  shouldQueueOfflineWrites,
  shouldSkipOfflineQueueForEndpoint,
  canReplayEndpointOffline,
} from '@/services/offline/syncEngine';
import { getSyntheticDataForOfflineCacheMissGet } from '@/services/offline/offlineApiGetDefaults';
import { getOfflineDetailPlaceholder } from '@/services/offline/offlineDetailPlaceholders';
import { isOfflineNoCache503, parseOfflineNoCacheBody } from '@/services/offline/offlineHttpRead';
import { toast } from 'sonner';
import { reportApiErrorIncident, reportNetworkErrorIncident } from '@/services/incident/incidentService';
import { pushBreadcrumb } from '@/services/incident/incidentBreadcrumbs';
import { extractApiErrorMessage } from '@/utils/extractApiErrorMessage';

// Helper to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Helper to create auth headers (includes TENANT_HEADER when applicable)
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const tenant = getCurrentTenant();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenant) {
    headers[TENANT_HEADER] = tenant;
    if (import.meta.env.DEV) {
      console.info(`🏢 [API] ${TENANT_HEADER}: "${tenant}"`);
    }
  } else if (token && import.meta.env.DEV) {
    // Authenticated but no tenant resolved → backend will default to TenantId=0
    // and any FK-bound insert (CreateExternalEndpoint etc.) will 500.
    console.warn(`⚠️ [API] No ${TENANT_HEADER} header — request will hit the default tenant. Set a tenant override or wait for AuthContext.resolveDefaultTenant.`);
  }
  return headers;
};

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Attempt to refresh the token
const attemptTokenRefresh = async (): Promise<boolean> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const result = await authService.refreshToken();
      return result !== null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
};

// Extract module name and action from endpoint
const parseEndpointForLogging = (endpoint: string, method: string): { module: string; action: 'create' | 'read' | 'update' | 'delete' | 'other'; entityId?: string } => {
  // Remove query params and clean up
  const cleanPath = endpoint.split('?')[0].replace(/^\/api\//, '').replace(/^\//, '');
  const parts = cleanPath.split('/');
  
  // Get module name (first part, capitalize)
  const module = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Unknown';
  
  // Get entity ID if present (usually second part if it's a number or GUID-like)
  const entityId = parts[1] && /^[\d]+$|^[a-f0-9-]{36}$/i.test(parts[1]) ? parts[1] : undefined;
  
  // Determine action from HTTP method
  let action: 'create' | 'read' | 'update' | 'delete' | 'other' = 'other';
  switch (method.toUpperCase()) {
    case 'GET':
      action = 'read';
      break;
    case 'POST':
      action = 'create';
      break;
    case 'PUT':
    case 'PATCH':
      action = 'update';
      break;
    case 'DELETE':
      action = 'delete';
      break;
  }
  
  return { module, action, entityId };
};

// List of endpoints to skip logging (to avoid infinite loops)
const SKIP_LOGGING_ENDPOINTS = [
  '/api/SystemLogs',
  '/api/logs',
  '/api/Incidents',
  '/api/Auth/refresh',
  '/api/workflows/default', // Skip logging for default workflow to avoid cascades when backend is down
];

// Endpoints exempt from the "view-all write guard" — admin/auth/system surfaces
// that legitimately run while viewing all companies (e.g. logging in, managing
// the companies themselves). Per-company data endpoints are NOT listed and are
// therefore blocked when no single company is selected.
const VIEW_ALL_WRITE_EXEMPT_ENDPOINTS = [
  '/api/Auth',
  '/api/Tenants',
  '/api/SystemLogs',
  '/api/logs',
  '/api/Incidents',
  '/api/workflow', // best-effort workflow triggers are already fire-and-forget
];

// API fetch wrapper with automatic token refresh on 401 and logging
export const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; status: number; error?: string }> => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  const method = options.method || 'GET';
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());

  if (endpoint.includes('/api/') && !endpoint.includes('/api/Incidents') && !endpoint.includes('/api/SystemLogs')) {
    pushBreadcrumb({ type: 'api', label: `${method.toUpperCase()} ${endpoint.split('?')[0]}` });
  }

  const normalizedHeaders = normalizeHeaders(options.headers);

  // ── View-all write guard ───────────────────────────────────────────────────
  // When a MainAdmin is viewing ALL companies (no single company selected), every
  // add/edit/delete of per-company data is blocked here so the action is a no-op
  // app-wide with one clear message — matching the backend, which rejects
  // tenant-scoped writes without an X-Target-Tenant. Admin/auth surfaces that
  // legitimately operate across companies are exempt (endpoint prefix or the
  // X-Allow-View-All-Write opt-out header).
  if (isMutation) {
    const allowViewAllWrite =
      normalizedHeaders?.['x-allow-view-all-write'] === 'true' ||
      normalizedHeaders?.['X-Allow-View-All-Write'] === 'true';
    const isExemptEndpoint = VIEW_ALL_WRITE_EXEMPT_ENDPOINTS.some(p => endpoint.includes(p));
    // Only main-admin users can be in cross-company view-all mode; never gate
    // regular (single-tenant) users even if a stale flag lingers in storage.
    const isMainAdmin = (() => {
      try {
        const u = JSON.parse(localStorage.getItem('user_data') || '{}');
        const id = u?.id ?? u?.userId;
        return id === 1 || id === '1';
      } catch { return false; }
    })();
    if (isMainAdmin && !allowViewAllWrite && !isExemptEndpoint) {
      const { isViewAllWriteBlocked } = await import('@/utils/targetTenant');
      if (isViewAllWriteBlocked()) {
        const msg = 'Select a company first — adding and editing are disabled while viewing all companies.';
        try { toast.error(msg); } catch {}
        return { data: null, status: 0, error: msg };
      }
    }
  }
  const bypassOfflineQueue = normalizedHeaders?.['x-bypass-offline-queue'] === 'true' || normalizedHeaders?.['X-Bypass-Offline-Queue'] === 'true';
  const relativeForQueue = toRelativeApiEndpoint(url);
  if (shouldQueueOfflineWrites() && isMutation && !bypassOfflineQueue && shouldSkipOfflineQueueForEndpoint(relativeForQueue)) {
    return {
      data: ({ ok: true, skippedOffline: true, message: 'System logs are not queued for sync.' } as unknown) as T,
      status: 200,
    };
  }
  if (shouldQueueOfflineWrites() && isMutation && !bypassOfflineQueue && !canReplayEndpointOffline(relativeForQueue)) {
    const msg = "This action isn't available offline yet — reconnect to save your changes.";
    try { toast.error(msg); } catch {}
    return { data: null, status: 503, error: msg };
  }
  if (shouldQueueOfflineWrites() && isMutation && !bypassOfflineQueue) {
    let parsedBody: unknown;
    if (typeof options.body === 'string') {
      try {
        parsedBody = JSON.parse(options.body);
      } catch {
        parsedBody = options.body;
      }
    } else {
      parsedBody = options.body;
    }
    await queueHttpOperation({
      endpoint: relativeForQueue,
      method,
      body: parsedBody,
      headers: normalizedHeaders,
    });
    window.dispatchEvent(new CustomEvent('offline:queue-updated'));
    return {
      data: ({
        success: true,
        queued: true,
        offline: true,
        message: 'Saved offline — will sync when you are back online or turn off offline mode.',
      } as unknown) as T,
      status: 202,
    };
  }
  
  // Check if we should skip logging for this endpoint (via list or header)
  const skipHeader = (options.headers as Record<string, string>)?.['X-Skip-Logging'] === 'true';
  const shouldSkipLogging = skipHeader || SKIP_LOGGING_ENDPOINTS.some(skip => endpoint.includes(skip));
  
  const makeRequest = async (): Promise<Response> => {
    const fetchFn = method === 'GET' ? dedupFetch : fetch;
    // Always attach X-Target-Tenant when an active company is selected (reads + writes).
    let tenantRequestHeaders: Record<string, string> = {};
    try {
      const { getTargetTenantHeaders } = await import('@/utils/targetTenant');
      tenantRequestHeaders = getTargetTenantHeaders();
    } catch {}
    return fetchFn(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...tenantRequestHeaders,
        ...options.headers,
      },
    });
  };

  try {
    let response = await makeRequest();
    
    // If 401 Unauthorized, try to refresh token and retry once
    if (response.status === 401) {
      console.log('Received 401, attempting token refresh...');
      const refreshed = await attemptTokenRefresh();
      
      if (refreshed) {
        console.log('Token refreshed successfully, retrying request...');
        response = await makeRequest();
      } else {
        // Refresh failed for an authenticated request → the session is truly
        // expired. Notify the app so the SessionExpiredBanner can auto-redirect
        // the user to the login page (preserving their current location).
        if (!shouldSkipLogging) {
          logger.warning('Request returned 401 (token refresh failed); session expired', 'Auth', 'logout');
        }
        try {
          const hadToken =
            typeof window !== 'undefined' &&
            !!(localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
          if (hadToken && typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
          }
        } catch {
          /* ignore */
        }
        return {
          data: null,
          status: 401,
          error: 'Session expired. Please log in again.'
        };
      }
    }

    if (!response.ok) {
      if (response.status === 503) {
        const offlineBody = await parseOfflineNoCacheBody(response);
        if (isOfflineNoCache503(offlineBody)) {
          if (method.toUpperCase() === 'GET') {
            const listOrTab = getSyntheticDataForOfflineCacheMissGet(endpoint);
            const fallback = listOrTab ?? getOfflineDetailPlaceholder(endpoint);
            if (fallback !== null) {
              return { data: fallback as T, status: 200 };
            }
          }
          return {
            data: null,
            status: 503,
            error: offlineBody?.message || 'No cached data for this request',
          };
        }
        return {
          data: null,
          status: 503,
          error: offlineBody?.message || 'Service unavailable',
        };
      }

      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      const errorMessage = extractApiErrorMessage(errorData, response.status);
      
      // Log errors (except for endpoints we skip)
      if (!shouldSkipLogging && method !== 'GET') {
        const { module, action, entityId } = parseEndpointForLogging(endpoint, method);
        logger.error(
          `Failed to ${action} ${module}${entityId ? ` (ID: ${entityId})` : ''}: ${errorMessage}`,
          module,
          action,
          { entityId, details: errorMessage }
        );
      }

      // Surface mutation errors to the user — many call-sites swallow errors silently.
      // Skip 401 (handled via redirect) and the logging endpoints themselves.
      const suppressToast = (options.headers as Record<string, string>)?.['X-Suppress-Error-Toast'] === 'true';
      if (
        !suppressToast &&
        method !== 'GET' &&
        response.status !== 401 &&
        !SKIP_LOGGING_ENDPOINTS.some(skip => endpoint.includes(skip))
      ) {
        try { toast.error(errorMessage); } catch {}
      }

      if (!SKIP_LOGGING_ENDPOINTS.some(skip => endpoint.includes(skip))) {
        reportApiErrorIncident({
          endpoint,
          method,
          status: response.status,
          message: errorMessage,
          incidentType: method !== 'GET' ? 'mutation_error' : 'query_error',
        });
      }

      return {
        data: null, 
        status: response.status, 
        error: errorMessage 
      };
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      // Log successful delete operations
      if (!shouldSkipLogging && method === 'DELETE') {
        const { module, action, entityId } = parseEndpointForLogging(endpoint, method);
        logger.success(
          `${module} deleted successfully${entityId ? ` (ID: ${entityId})` : ''}`,
          module,
          action,
          { entityId }
        );
      }
      return { data: null, status: 204 };
    }

    const data = await response.json();
    
    // Log successful mutations (create, update, delete)
    if (!shouldSkipLogging && method !== 'GET') {
      const { module, action, entityId } = parseEndpointForLogging(endpoint, method);
      const successEntityId = entityId || (data as any)?.id || (data as any)?.Id;
      
      const actionWord = action === 'create' ? 'created' : action === 'update' ? 'updated' : action === 'delete' ? 'deleted' : 'processed';
      logger.success(
        `${module} ${actionWord} successfully${successEntityId ? ` (ID: ${successEntityId})` : ''}`,
        module,
        action,
        { entityId: successEntityId?.toString() }
      );
    }
    
    return { data, status: response.status };
  } catch (error: any) {
    // Flaky network: navigator.onLine can be true; try hydration cache for GET JSON APIs.
    if (
      method.toUpperCase() === 'GET' &&
      !headersBypassHydrationCache(options.headers) &&
      endpoint.includes('/api/')
    ) {
      try {
        const cached = await getCachedResponse('GET', url);
        if (cached?.ok) {
          const ct = (cached.headers.get('content-type') || '').toLowerCase();
          if (ct.includes('application/json') || ct.includes('text/json') || /\+json\b/i.test(ct)) {
            const text = await cached.text();
            const data = text.length ? JSON.parse(text) : null;
            return { data: data as T, status: cached.status };
          }
        }
      } catch {
        // ignore cache fallback errors
      }
    }

    console.error('API request error:', error);
    
    // Log network errors
    if (!shouldSkipLogging) {
      const { module, action, entityId } = parseEndpointForLogging(endpoint, method);
      logger.error(
        `Network error in ${module}: ${error.message || 'Unknown error'}`,
        module,
        action,
        { entityId, details: error.message }
      );
    }

    reportNetworkErrorIncident({
      endpoint,
      method,
      message: error.message || 'Network error',
    });
    
    return {
      data: null, 
      status: 0, 
      error: error.message || 'Network error' 
    };
  }
};

export { API_URL, getAuthToken, getAuthHeaders };