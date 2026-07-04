/**
 * Bootstrap active-company selection after login or onboarding.
 * Skips /select-company when the user has exactly one workspace (or a default).
 */
import { tenantsApi, type Tenant } from '@/services/api/tenantsApi';
import {
  getActiveCompanyId,
  isActiveCompanyViewAll,
  registerTenantHeaderMetadata,
  setActiveCompany,
} from '@/utils/targetTenant';
import { getCurrentTenant } from '@/utils/tenant';
import { setCompanyLogo, setCompanyLogoExplicitNone } from '@/hooks/useCompanyLogo';

const CACHE_KEY_PREFIX = 'tenants:cache:v2:';

function cacheKeyFor(slug: string | null): string {
  return `${CACHE_KEY_PREFIX}${slug ?? '__default__'}`;
}

/** Drop the slug-scoped tenant list cache so the next fetch is fresh. */
export function clearTenantListCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(cacheKeyFor(getCurrentTenant()));
    window.localStorage.removeItem('tenants:cache:v1');
  } catch {
    /* ignore */
  }
}

/** Resolve main-admin from storage when React context has not caught up yet (e.g. right after signup). */
export function isMainAdminFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const userData = window.localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData) as { id?: number };
      if (user.id === 1) return true;
    }
    const loginType =
      window.localStorage.getItem('login_type') ||
      window.sessionStorage.getItem('login_type');
    return loginType === 'admin';
  } catch {
    return false;
  }
}

export function filterActiveTenants(tenants: Tenant[]): Tenant[] {
  return tenants.filter((t) => t.isActive !== false);
}

function pickFallbackTenant(active: Tenant[]): Tenant | undefined {
  return active.find((t) => t.isDefault) ?? active[0];
}

function syncLogoForTenant(tenant: Tenant | undefined, active: Tenant[]): void {
  const defaultTenant = active.find((t) => t.isDefault) ?? active[0];
  const resolved = tenant?.companyLogoUrl ?? defaultTenant?.companyLogoUrl ?? null;
  if (resolved) setCompanyLogo(resolved);
  else setCompanyLogoExplicitNone();
}

export type BootstrapCompanyResult =
  | { pinned: true; tenant: Tenant }
  | { pinned: false; reason: 'already_pinned' | 'multiple_companies' | 'no_companies' | 'error' };

/**
 * Pin active company from an already-fetched tenant list (no network call).
 */
export function pinActiveCompanyFromList(
  tenants: Tenant[],
  isMainAdmin = false,
): BootstrapCompanyResult {
  if (getActiveCompanyId() !== undefined || isActiveCompanyViewAll()) {
    return { pinned: false, reason: 'already_pinned' };
  }

  const active = filterActiveTenants(tenants);
  const effectiveMainAdmin = isMainAdmin || isMainAdminFromStorage();

  registerTenantHeaderMetadata(
    active.map((t) => ({ id: t.id, slug: t.slug, isDefault: t.isDefault })),
  );

  if (effectiveMainAdmin && active.length > 1) {
    return { pinned: false, reason: 'multiple_companies' };
  }

  const fallback = pickFallbackTenant(active);
  if (!fallback) {
    return { pinned: false, reason: 'no_companies' };
  }

  setActiveCompany({ id: fallback.id });
  syncLogoForTenant(fallback, active);
  return { pinned: true, tenant: fallback };
}

/** True when the user has a company pinned or opted into view-all mode. */
export function hasActiveCompanySelection(): boolean {
  return getActiveCompanyId() !== undefined || isActiveCompanyViewAll();
}

/**
 * Fetch companies and auto-pin when there is a single choice (or a default).
 * Main admins with multiple companies are left unpinned for /select-company.
 */
export async function bootstrapActiveCompany(isMainAdmin = false): Promise<BootstrapCompanyResult> {
  if (hasActiveCompanySelection()) {
    return { pinned: false, reason: 'already_pinned' };
  }

  try {
    const tenants = await tenantsApi.list();
    return pinActiveCompanyFromList(tenants, isMainAdmin);
  } catch (err) {
    console.warn('[bootstrapCompany] Failed to resolve active company', err);
    return { pinned: false, reason: 'error' };
  }
}

/**
 * After a fresh tenant refetch (e.g. onboarding), pin the company if possible.
 * Uses the refetched list when provided to avoid a duplicate API call.
 */
export async function ensureActiveCompanyPinned(
  isMainAdmin = false,
  tenantsFromRefetch?: Tenant[],
): Promise<BootstrapCompanyResult> {
  if (hasActiveCompanySelection()) {
    return { pinned: false, reason: 'already_pinned' };
  }

  if (tenantsFromRefetch && tenantsFromRefetch.length > 0) {
    return pinActiveCompanyFromList(tenantsFromRefetch, isMainAdmin);
  }

  return bootstrapActiveCompany(isMainAdmin);
}
