/**
 * Global target tenant state for multi-company mutations.
 *
 * Forms set this via setTargetTenantId() when user picks a company.
 * apiClient.ts reads it via getTargetTenantHeaders() and auto-attaches
 * X-Target-Tenant header to mutation requests.
 */
import { getCurrentTenant, isViewAllMode, TARGET_TENANT_HEADER, TENANT_HEADER } from '@/utils/tenant';

/** In-memory target tenant for the current form session */
let _targetTenantId: number | undefined;
const TENANT_ID_SLUG_CACHE_KEY = 'tenant_id_slug_map_v1';
const COMPANY_FILTER_PREFIX = 'companyFilter:';

/** Tenant.Id → slug cache so API clients can turn the header picker's id into X-Tenant. */
const _tenantSlugsById = new Map<number, string>();
/** Tenant.slug → Tenant.Id cache so mutation requests can send numeric company ids. */
const _tenantIdsBySlug = new Map<string, number>();

/**
 * Real Tenant.Id values that map to the data-table TenantId 0 on the backend
 * (tenants flagged isDefault=true). The backend stamps default-tenant rows
 * with TenantId=0, so X-Target-Tenant must also send 0 for those tenants.
 * TenantMapContext populates this on load.
 */
const _defaultTenantIds = new Set<number>();

export function registerDefaultTenantIds(ids: number[]): void {
  _defaultTenantIds.clear();
  ids.forEach(id => _defaultTenantIds.add(id));
}

export function registerTenantHeaderMetadata(tenants: Array<{ id: number; slug: string; isDefault?: boolean }>): void {
  _tenantSlugsById.clear();
  _tenantIdsBySlug.clear();
  tenants.forEach((tenant) => {
    if (tenant.id && tenant.slug) {
      const normalizedSlug = tenant.slug.trim().toLowerCase();
      _tenantSlugsById.set(tenant.id, normalizedSlug);
      _tenantIdsBySlug.set(normalizedSlug, tenant.id);
    }
  });
  registerDefaultTenantIds(tenants.filter(t => t.isDefault).map(t => t.id));
  try {
    window.localStorage.setItem(TENANT_ID_SLUG_CACHE_KEY, JSON.stringify(Array.from(_tenantSlugsById.entries())));
  } catch {
    // ignore storage failures
  }
}

function ensureTenantSlugCacheLoaded(): void {
  if ((_tenantSlugsById.size > 0 && _tenantIdsBySlug.size > 0) || typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(TENANT_ID_SLUG_CACHE_KEY);
    const entries = raw ? JSON.parse(raw) as Array<[number, string]> : [];
    entries.forEach(([id, slug]) => {
      const numericId = Number(id);
      const normalizedSlug = typeof slug === 'string' ? slug.trim().toLowerCase() : '';
      if (Number.isFinite(numericId) && normalizedSlug) {
        _tenantSlugsById.set(numericId, normalizedSlug);
        _tenantIdsBySlug.set(normalizedSlug, numericId);
      }
    });
  } catch {
    // ignore malformed cache
  }
}

function getTenantSlugForId(tenantId: number): string | undefined {
  ensureTenantSlugCacheLoaded();
  return _tenantSlugsById.get(tenantId);
}

function getTenantIdForSlug(slug: string): number | undefined {
  ensureTenantSlugCacheLoaded();
  return _tenantIdsBySlug.get(slug.trim().toLowerCase());
}

/** Translate a frontend Tenant.Id to the data-table TenantId the backend expects. */
function toDataTenantId(realId: number): number {
  return _defaultTenantIds.has(realId) ? 0 : realId;
}

/**
 * Notify same-tab listeners (e.g. useCreateActionGuard) that the
 * target-tenant selection changed. Kept inline to avoid an import cycle
 * with the hooks layer.
 */
const TARGET_TENANT_CHANGED_EVENT = 'flowentra:target-tenant-changed';
function notifyTargetTenantChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(TARGET_TENANT_CHANGED_EVENT));
  } catch {
    // ignore older browsers
  }
}

export function setTargetTenantId(tenantId: number | undefined): void {
  _targetTenantId = tenantId;
  notifyTargetTenantChanged();
}

export function getTargetTenantId(): number | undefined {
  return _targetTenantId;
}

export function clearTargetTenant(): void {
  _targetTenantId = undefined;
  notifyTargetTenantChanged();
}

function readActiveCompanyFilterTenantId(): number | undefined {
  if (typeof window === 'undefined') return undefined;
  const readKey = (key: string): number | undefined => {
    const raw = window.localStorage.getItem(`${COMPANY_FILTER_PREFIX}${key}`);
    if (!raw || raw === 'all') return undefined;
    const id = Number(raw);
    return Number.isFinite(id) ? id : undefined;
  };

  try {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const preferredKeys = Array.from(new Set([segments[0], segments[1], segments[2], 'default'].filter(Boolean)));
    for (const key of preferredKeys) {
      const id = readKey(key);
      if (id !== undefined) return id;
    }

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith(COMPANY_FILTER_PREFIX)) continue;
      const id = readKey(key.slice(COMPANY_FILTER_PREFIX.length));
      if (id !== undefined) return id;
    }
  } catch {
    // ignore storage/path failures
  }

  return undefined;
}

export function getSelectedTargetTenantId(tenantId?: number): number | undefined {
  const selected = tenantId ?? _targetTenantId ?? readActiveCompanyFilterTenantId();
  if (selected !== undefined && selected !== null) return selected;

  const currentTenant = getCurrentTenant();
  if (!currentTenant || currentTenant === '__all__') return undefined;

  return getTenantIdForSlug(currentTenant);
}

/**
 * Same as getSelectedTargetTenantId(), but defaults to 0 (the default company /
 * data-table TenantId 0 bucket) instead of undefined. Use this in API plumbing
 * so view-all mutations never miss the X-Target-Tenant header — that header
 * being absent causes a 400 from TenantMiddleware.
 */
export function getSelectedTargetTenantIdOrDefault(tenantId?: number): number {
  const id = getSelectedTargetTenantId(tenantId);
  return id === undefined || id === null ? 0 : id;
}

/**
 * Returns headers object with X-Target-Tenant set whenever a numeric company id
 * can be resolved for the current mutation context.
 * The id is remapped so the header matches the backend's data-table TenantId
 * convention (default tenant → 0). Falls back to TenantId=0 only in view-all
 * mode so mutations there never miss a target company header.
 */
export function getTargetTenantHeaders(tenantId?: number): Record<string, string> {
  const id = getSelectedTargetTenantIdOrDefault(tenantId);
  if (!isViewAllMode() && id === 0) return {};
  return { [TARGET_TENANT_HEADER]: String(toDataTenantId(id)) };
}

/**
 * Headers for the currently selected active company while the app is in view-all mode.
 * A numeric selection from the header dropdown narrows reads by overriding X-Tenant,
 * and keeps X-Target-Tenant available for mutations/forms.
 */
export function getTenantRequestHeaders(tenantId?: number): Record<string, string> {
  if (!isViewAllMode()) return {};
  const id = getSelectedTargetTenantId(tenantId);
  if (id === undefined || id === null) return {};

  const headers = getTargetTenantHeaders(id);
  const slug = getTenantSlugForId(id);
  if (slug && slug !== getCurrentTenant()) {
    headers[TENANT_HEADER] = slug;
  }
  return headers;
}

/**
 * Merges target tenant headers into an existing AxiosRequestConfig headers object.
 */
export function withTargetTenant(tenantId?: number): { headers: Record<string, string> } | undefined {
  const headers = getTargetTenantHeaders(tenantId);
  if (Object.keys(headers).length === 0) return undefined;
  return { headers };
}
