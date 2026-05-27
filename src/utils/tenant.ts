/**
 * Multi-tenant subdomain detection utility.
 *
 * Extracts the tenant identifier from the current hostname.
 * For example: demo.flowentra.app → "demo", krossier.demo.dev → "krossier"
 *
 * Priority chain:
 * 1. localStorage override (for dev/testing)
 * 2. Subdomain of configured base domains
 * 3. Query param ?tenant=xxx (useful for preview URLs)
 * 4. VITE_DEFAULT_TENANT env var (fallback)
 * 5. null (no tenant — uses default DB)
 */

const DEFAULT_TENANT = import.meta.env.VITE_DEFAULT_TENANT || null;
const TENANT_OVERRIDE_KEY = 'tenant_override';
const DEFAULT_BASE_DOMAINS = ['flowentra.app', 'demo.dev'];
const PREVIEW_HOST_SUFFIXES = ['.lovable.app', '.lovableproject.com'];

export const TENANT_HEADER = 'X-Tenant';

/** Header for targeting a specific tenant during mutations in view-all mode */
export const TARGET_TENANT_HEADER = 'X-Target-Tenant';

function getConfiguredBaseDomains(): string[] {
  const raw = import.meta.env.VITE_TENANT_BASE_DOMAINS as string | undefined;
  const configured = raw
    ?.split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean) ?? [];

  return Array.from(new Set([...configured, ...DEFAULT_BASE_DOMAINS]));
}

function getTenantFromKnownBaseDomains(hostname: string): string | null {
  for (const baseDomain of getConfiguredBaseDomains()) {
    if (!hostname.endsWith(`.${baseDomain}`)) continue;

    const subdomain = hostname.slice(0, hostname.length - `.${baseDomain}`.length);
    if (subdomain && !subdomain.includes('.')) {
      return subdomain.toLowerCase();
    }
  }

  return null;
}

function isPreviewHost(hostname: string): boolean {
  return PREVIEW_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

export function getTenantFromHostname(hostname: string = window.location.hostname): string | null {
  const normalizedHostname = hostname.trim().toLowerCase();

  // Detect tenant from real subdomain FIRST. On a real tenant URL like
  // krossier.flowentra.app the subdomain is the source of truth — a stale
  // localStorage override (often left behind from preview/dev work) must NOT
  // shadow it, otherwise users see another tenant's data on their own URL.
  const tenantFromDomain = getTenantFromKnownBaseDomains(normalizedHostname);
  if (tenantFromDomain) {
    return tenantFromDomain;
  }

  // 1. Manual override via localStorage — only honored on hosts that don't
  // carry their own tenant identity (Lovable previews, localhost, bare IPs).
  // This keeps the dev/preview ergonomics while making real tenant URLs
  // immune to a leftover override on the same browser profile.
  const override = localStorage.getItem(TENANT_OVERRIDE_KEY);
  if (override) {
    const normalized = override.trim().toLowerCase();
    // Empty string clears the override; otherwise honor the value as-is.
    // Note: 'default' is a real tenant slug in the backend (TenantSlugCache maps it
    // to the default tenant) — do NOT strip it, or X-Tenant won't be sent and the
    // backend middleware falls back to TenantId=0, breaking FK-bound inserts.
    return normalized || null;
  }

  // Skip generic preview hosts so random preview prefixes aren't treated as tenant slugs
  if (!isPreviewHost(normalizedHostname)) {
    const parts = normalizedHostname.split('.').filter(Boolean);
    if (parts.length === 2 && parts[0] !== 'www' && parts[0] !== 'app') {
      return parts[0];
    }
  }

  // 3. Query param ?tenant=xxx (useful for Lovable preview / any environment)
  try {
    const url = new URL(window.location.href);
    const tenantParam = url.searchParams.get('tenant');
    if (tenantParam) {
      return tenantParam.trim().toLowerCase();
    }
  } catch {
    // ignore
  }

  // 4. Env var fallback (only if explicitly set and non-empty)
  if (DEFAULT_TENANT) {
    return DEFAULT_TENANT;
  }

  // 5. No tenant detected
  return null;
}

/** Sentinel value sent in X-Tenant header for legacy cross-company view */
export const VIEW_ALL_SENTINEL = '__all__';

/**
 * Returns true when the user is in "View All Companies" mode.
 * Source of truth is the new active-company store (localStorage). The legacy
 * X-Tenant sentinel is kept as a fallback for back-compat.
 */
export function isViewAllMode(): boolean {
  if (typeof window !== 'undefined') {
    try {
      if (window.localStorage.getItem('active_company_view_all') === 'true') return true;
    } catch {
      /* ignore */
    }
  }
  return getCurrentTenant() === VIEW_ALL_SENTINEL;
}

/**
 * Returns the current tenant identifier (cached per page load).
 */
let cachedTenant: string | null | undefined;
export function getCurrentTenant(): string | null {
  if (cachedTenant === undefined) {
    cachedTenant = getTenantFromHostname();
  }
  return cachedTenant;
}

/**
 * Clear cached company logos upon tenant change to ensure fresh fetch.
 */
function clearLogoCaches(): void {
  localStorage.removeItem('company-logo');
  localStorage.removeItem('company-logo-blob-data');

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flowentra-query-cache-v1')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
  }

  try {
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      if (userData?.companyLogoUrl) {
        delete userData.companyLogoUrl;
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
    }
  } catch {
  }
}

/**
 * Set a tenant override (for dev/preview environments).
 * Reloads the page to apply.
 */
export function setTenantOverride(tenant: string | null): void {
  const normalized = tenant?.trim().toLowerCase() || null;
  if (normalized) {
    localStorage.setItem(TENANT_OVERRIDE_KEY, normalized);
  } else {
    localStorage.removeItem(TENANT_OVERRIDE_KEY);
  }
  clearLogoCaches();
  cachedTenant = undefined;
  window.location.reload();
}

/**
 * Set a tenant override silently (useful for login flows)
 */
export function setTenantOverrideWithoutReload(tenant: string | null): void {
  const normalized = tenant?.trim().toLowerCase() || null;
  if (normalized) {
    localStorage.setItem(TENANT_OVERRIDE_KEY, normalized);
    cachedTenant = normalized;
  } else {
    localStorage.removeItem(TENANT_OVERRIDE_KEY);
    cachedTenant = undefined;
    cachedTenant = getTenantFromHostname();
  }
  clearLogoCaches();
}
