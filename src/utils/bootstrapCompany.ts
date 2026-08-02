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
import { getAuthClaims } from '@/utils/authClaims';
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

/**
 * Resolve main-admin without React context.
 * The JWT claims (UserType / login_type) are authoritative; the legacy
 * `user.id === 1` heuristic is only a last-resort fallback for old sessions.
 */
export function isMainAdminFromStorage(): boolean {
  if (typeof window === 'undefined') return false;
  const claims = getAuthClaims();
  if (claims.isMainAdmin) return true;
  if (claims.isRegularUser) return false;
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

/**
 * The company a REGULAR user is bound to (Users.TenantId → JWT `tenant_id`).
 * A data TenantId of 0 means "the default company of this database".
 * Returns undefined when the claim is missing (legacy token) or the bound
 * company is not in the list (inactive / not visible).
 */
export function findBoundTenant(active: Tenant[]): Tenant | undefined {
  const { boundTenantId } = getAuthClaims();
  if (boundTenantId === null) return undefined;
  if (boundTenantId === 0) return active.find((t) => t.isDefault) ?? undefined;
  return active.find((t) => t.id === boundTenantId);
}

/**
 * True when the signed-in account is a regular user LOCKED to one company
 * (no settings.switch_company grant). Such users must never see a picker.
 */
export function isCompanyLockedUser(): boolean {
  const claims = getAuthClaims();
  return claims.isRegularUser && !claims.canSwitchCompany;
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
 *
 * Regular users are ALWAYS pinned — to the company their account is bound to
 * (JWT `tenant_id`), regardless of how many companies exist in the database.
 * Only users who may actually switch (main admins, or staff with
 * settings.switch_company) are left unpinned so the picker can run.
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

  // Company-locked staff: pin their own company, never show a picker.
  if (!effectiveMainAdmin && isCompanyLockedUser()) {
    const bound = findBoundTenant(active) ?? pickFallbackTenant(active);
    if (!bound) return { pinned: false, reason: 'no_companies' };
    setActiveCompany({ id: bound.id });
    syncLogoForTenant(bound, active);
    return { pinned: true, tenant: bound };
  }

  if (active.length > 1) {
    // Multiple choices AND the user is allowed to switch → let them pick,
    // but pre-select their bound company when the token carries one.
    const bound = findBoundTenant(active);
    if (!effectiveMainAdmin && bound) {
      setActiveCompany({ id: bound.id });
      syncLogoForTenant(bound, active);
      return { pinned: true, tenant: bound };
    }
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
 * Manual company picker is only needed when the user has more than one
 * workspace AND is actually allowed to switch between them:
 *   • MainAdminUser — always.
 *   • Regular user with settings.switch_company — yes.
 *   • Company-locked regular user — never (they are auto-pinned instead).
 */
export function shouldShowCompanyPicker(tenants: Tenant[], isMainAdmin = false): boolean {
  const active = filterActiveTenants(tenants);
  if (active.length <= 1) return false;
  if (isMainAdmin || isMainAdminFromStorage()) return true;
  return getAuthClaims().canSwitchCompany;
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
