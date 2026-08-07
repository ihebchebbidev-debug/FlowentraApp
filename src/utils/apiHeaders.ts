/**
 * Centralized auth + tenant headers for ALL API calls (fetch-based).
 * Import this instead of defining your own getAuthHeaders().
 */
import { getCurrentTenant, TENANT_HEADER } from './tenant';
import { getTargetTenantHeaders, getTenantRequestHeaders } from './targetTenant';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Get fully authenticated headers for standard requests
export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  const tenant = getCurrentTenant();
  const tenantReqHeaders = getTenantRequestHeaders();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...tenantReqHeaders,
  };
  
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenant) headers[TENANT_HEADER] = tenant;
  
  return headers;
};

/**
 * Headers for mutation requests (POST, PUT, PATCH, DELETE).
 * Includes X-Target-Tenant header for view-all mode multi-tenant support.
 */
export const getMutationHeaders = (): HeadersInit => {
  const base = getAuthHeaders() as Record<string, string>;
  const targetHeaders = getTargetTenantHeaders();
  return { ...base, ...targetHeaders };
};

// For file uploads, don't set Content-Type (fetch deals with FormData automatically)
export const getAuthHeadersNoContentType = (): HeadersInit => {
  const token = localStorage.getItem('access_token');
  const tenant = getCurrentTenant();
  const tenantReqHeaders = getTenantRequestHeaders();
  const headers: Record<string, string> = {
    ...tenantReqHeaders,
  };
  
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenant) headers[TENANT_HEADER] = tenant;

  return headers;
};

/**
 * File upload headers for mutation requests.
 * Includes X-Target-Tenant but no Content-Type (FormData sets it).
 */
export const getMutationHeadersNoContentType = (): HeadersInit => {
  const base = getAuthHeadersNoContentType() as Record<string, string>;
  const targetHeaders = getTargetTenantHeaders();
  return { ...base, ...targetHeaders };
};
