/**
 * Active-company / target-tenant state for multi-company row-level scoping.
 *
 * Two-layer tenancy model:
 *   • X-Tenant         → app/database (krossier, demo, dev) — pinned from URL/env.
 *   • X-Target-Tenant  → row-level TenantId of the active company inside that DB.
 *
 * The in-app company picker now writes ONLY to the active-company store here;
 * it never touches the X-Tenant header. As a result, switching companies stays
 * inside the same DB and properly exercises EF global query filters + the
 * ModuleScope (shared vs per_company) attribute system.
 */
import { getCurrentTenant, TARGET_TENANT_HEADER, VIEW_ALL_HEADER } from '@/utils/tenant';

/** localStorage keys */
const ACTIVE_COMPANY_ID_KEY = 'active_company_id';
const ACTIVE_COMPANY_VIEW_ALL_KEY = 'active_company_view_all';
const TENANT_ID_SLUG_CACHE_KEY = 'tenant_id_slug_map_v1';
const COMPANY_FILTER_PREFIX = 'companyFilter:';

/** In-memory mirror so synchronous reads in headers/interceptors are cheap. */
let _activeCompanyId: number | undefined;
let _activeCompanyViewAll: boolean | undefined;

/** Tenant.Id → slug cache so API clients can resolve names from ids. */
const _tenantSlugsById = new Map<number, string>();
const _tenantIdsBySlug = new Map<string, number>();
const _defaultTenantIds = new Set<number>();

export function registerDefaultTenantIds(ids: number[]): void {
  _defaultTenantIds.clear();
  ids.forEach(id => _defaultTenantIds.add(id));
}

export function registerTenantHeaderMetadata(
  tenants: Array<{ id: number; slug: string; isDefault?: boolean }>,
): void {
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
    window.localStorage.setItem(
      TENANT_ID_SLUG_CACHE_KEY,
      JSON.stringify(Array.from(_tenantSlugsById.entries())),
    );
  } catch {
    /* ignore storage failures */
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
    /* ignore malformed cache */
  }
}

function getTenantIdForSlug(slug: string): number | undefined {
  ensureTenantSlugCacheLoaded();
  return _tenantIdsBySlug.get(slug.trim().toLowerCase());
}

/** Translate a real Tenant.Id to the data-table TenantId (default → 0). */
function toDataTenantId(realId: number): number {
  return _defaultTenantIds.has(realId) ? 0 : realId;
}

// ─── Active company persistence ─────────────────────────────────────────────

const TARGET_TENANT_CHANGED_EVENT = 'flowentra:target-tenant-changed';
function notifyTargetTenantChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(TARGET_TENANT_CHANGED_EVENT));
  } catch {
    /* ignore older browsers */
  }
}

function hydrateActiveCompanyFromStorage(): void {
  if (_activeCompanyId !== undefined || _activeCompanyViewAll !== undefined) return;
  if (typeof window === 'undefined') return;
  try {
    const va = window.localStorage.getItem(ACTIVE_COMPANY_VIEW_ALL_KEY);
    _activeCompanyViewAll = va === 'true';
    const raw = window.localStorage.getItem(ACTIVE_COMPANY_ID_KEY);
    if (raw !== null && raw !== '') {
      const n = Number(raw);
      if (Number.isFinite(n)) _activeCompanyId = n;
    }
  } catch {
    /* ignore */
  }
}

function clearReactQueryCaches(): void {
  if (typeof window === 'undefined') return;
  try {
    // company-logo must survive the reload — it's read by bootstrap to show
    // the tenant's logo before the network resolves. Only the PDF blob cache
    // and React Query persistence keys need clearing on company switch.
    localStorage.removeItem('company-logo-blob-data');
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('flowentra-query-cache-v1')) keysToRemove.push(key);
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/**
 * Set the active company for row-level scoping.
 * Pass {viewAll:true} to enter cross-company audit mode (MainAdmin only).
 * Pass {id:null} to clear.
 */
/**
 * If `pathname` is an entity detail/edit page (it contains an id-like segment —
 * a number or a UUID), return the path up to that segment (the owning module's
 * list page). Returns null for list/overview pages so the caller reloads in place.
 *
 * Examples:
 *   /dashboard/contacts/5            → /dashboard/contacts
 *   /dashboard/sales/12/edit         → /dashboard/sales
 *   /dashboard/tasks/projects/3      → /dashboard/tasks/projects
 *   /dashboard/contacts              → null (stay)
 */
export function stripEntityDetailPath(pathname: string): string | null {
  const segs = pathname.split('/').filter(Boolean); // ['dashboard','contacts','5']
  // An entity id segment is anything containing a digit (numeric ids, numeric-string
  // ids, GUIDs, slug-with-number ids) or a UUID. Structural/section/action segments
  // in this app are purely alphabetic (list, edit, create, projects, service-orders,
  // manage-scheduler, …), so they're never mistaken for ids. Truncating to a resource
  // base is safe even for nested modules — their index route redirects to the list.
  const isIdLike = (s: string) =>
    /\d/.test(s) ||
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(s);
  // Start at 2: keep at least /dashboard/<module> as the destination.
  for (let i = 2; i < segs.length; i++) {
    if (isIdLike(segs[i])) {
      return '/' + segs.slice(0, i).join('/');
    }
  }
  return null;
}

export function setActiveCompany(
  payload: { id?: number | null; viewAll?: boolean; reload?: boolean } = {},
): void {
  const { id, viewAll = false, reload = false } = payload;
  _activeCompanyViewAll = viewAll;
  _activeCompanyId = viewAll ? undefined : (id ?? undefined);

  if (typeof window !== 'undefined') {
    try {
      if (viewAll) {
        window.localStorage.setItem(ACTIVE_COMPANY_VIEW_ALL_KEY, 'true');
        window.localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
      } else {
        window.localStorage.removeItem(ACTIVE_COMPANY_VIEW_ALL_KEY);
        // Scrub the legacy X-Tenant=__all__ sentinel left behind by the old
        // TenantManagement "view all" toggle. Without this, isViewAllMode()
        // keeps returning true via getCurrentTenant() and the UI stays stuck
        // on "Viewing all companies" even after picking a specific one.
        const legacyOverride = window.localStorage.getItem('tenant_override');
        if (legacyOverride && legacyOverride.trim().toLowerCase() === '__all__') {
          window.localStorage.removeItem('tenant_override');
        }
        // Clear any stale companyFilter:* keys so readActiveCompanyFilterTenantId
        // never returns an old selection and creates a ghost X-Target-Tenant header.
        try {
          const filterKeysToRemove: string[] = [];
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k && k.startsWith(COMPANY_FILTER_PREFIX)) filterKeysToRemove.push(k);
          }
          filterKeysToRemove.forEach(k => window.localStorage.removeItem(k));
        } catch { /* ignore */ }
        if (id === null || id === undefined) {
          window.localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
        } else {
          window.localStorage.setItem(ACTIVE_COMPANY_ID_KEY, String(id));
        }
      }
    } catch {
      /* ignore */
    }
  }

  clearReactQueryCaches();
  notifyTargetTenantChanged();

  if (reload && typeof window !== 'undefined') {
    if (window.location.pathname.startsWith('/dashboard')) {
      // A detail/edit page (e.g. /dashboard/contacts/5) points at one record. That
      // record almost never exists under the newly-selected company, so reloading it
      // would 404. Send the user up to the owning module's list instead; otherwise
      // reload in place to preserve navigation context on list/overview pages.
      const listPath = stripEntityDetailPath(window.location.pathname);
      if (listPath) {
        window.location.replace(listPath);
      } else {
        window.location.reload();
      }
    } else {
      window.location.replace('/dashboard');
    }
  }
}

export function clearActiveCompany(): void {
  setActiveCompany({ id: null, viewAll: false });
}

export function getActiveCompanyId(): number | undefined {
  hydrateActiveCompanyFromStorage();
  return _activeCompanyId;
}

export function isActiveCompanyViewAll(): boolean {
  hydrateActiveCompanyFromStorage();
  return _activeCompanyViewAll === true;
}

// ─── Legacy in-memory target (kept for form-level overrides) ────────────────

let _targetTenantId: number | undefined;
export function setTargetTenantId(tenantId: number | undefined): void {
  _targetTenantId = tenantId;
  notifyTargetTenantChanged();
}
export function getTargetTenantId(): number | undefined { return _targetTenantId; }
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
    /* ignore */
  }
  return undefined;
}

/**
 * Resolve the company id to send as X-Target-Tenant.
 * Priority: explicit arg → form-level override → active company → per-module filter → X-Tenant slug.
 * Returns undefined in view-all mode (caller should not send the header).
 */
export function getSelectedTargetTenantId(tenantId?: number): number | undefined {
  if (isActiveCompanyViewAll()) return undefined;
  const explicit = tenantId ?? _targetTenantId;
  if (explicit !== undefined && explicit !== null) return explicit;

  const activeId = getActiveCompanyId();
  if (activeId !== undefined) return activeId;

  const filterId = readActiveCompanyFilterTenantId();
  if (filterId !== undefined) return filterId;

  const currentTenant = getCurrentTenant();
  if (!currentTenant || currentTenant === '__all__') return undefined;
  return getTenantIdForSlug(currentTenant);
}

/** Same as getSelectedTargetTenantId but defaults to 0 (default-company bucket). */
export function getSelectedTargetTenantIdOrDefault(tenantId?: number): number {
  const id = getSelectedTargetTenantId(tenantId);
  return id === undefined || id === null ? 0 : id;
}

/**
 * Headers to attach for row-level company scoping.
 * Emits X-Target-Tenant on EVERY request when an active company is selected
 * (incl. id 0 for the default company). In view-all mode emits X-View-All
 * so the backend returns rows across all companies — UNLESS an explicit
 * tenantId is provided (e.g. from a create/edit form), in which case we
 * scope the mutation to that specific company even in view-all mode.
 */
export function getTargetTenantHeaders(tenantId?: number): Record<string, string> {
  if (isActiveCompanyViewAll()) {
    // An explicit form-level target takes priority over the view-all flag so
    // that mutations in view-all mode are properly scoped to the company the
    // user selected in the form (backend requires X-Target-Tenant for writes).
    const explicit = tenantId !== undefined && tenantId !== null ? tenantId : _targetTenantId;
    if (explicit !== undefined && explicit !== null) {
      return { [TARGET_TENANT_HEADER]: String(toDataTenantId(explicit)) };
    }
    return { [VIEW_ALL_HEADER]: 'true' };
  }
  const id = getSelectedTargetTenantId(tenantId);
  if (id === undefined || id === null) return {};
  return { [TARGET_TENANT_HEADER]: String(toDataTenantId(id)) };
}

/**
 * Legacy alias kept for callers that historically used a separate "view-all
 * read" header path. Both helpers now resolve to the same set.
 */
export function getTenantRequestHeaders(tenantId?: number): Record<string, string> {
  return getTargetTenantHeaders(tenantId);
}

/** Merges target tenant headers into an existing AxiosRequestConfig headers object. */
export function withTargetTenant(tenantId?: number): { headers: Record<string, string> } | undefined {
  const headers = getTargetTenantHeaders(tenantId);
  if (Object.keys(headers).length === 0) return undefined;
  return { headers };
}
