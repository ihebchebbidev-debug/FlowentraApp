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
 * Fetch companies and auto-pin when there is a single choice (or a default).
 * Main admins with multiple companies are left unpinned for /select-company.
 */
export async function bootstrapActiveCompany(isMainAdmin: boolean): Promise<BootstrapCompanyResult> {
  if (getActiveCompanyId() !== undefined || isActiveCompanyViewAll()) {
    return { pinned: false, reason: 'already_pinned' };
  }

  try {
    const tenants = await tenantsApi.list();
    const active = tenants.filter((t) => t.isActive !== false);

    registerTenantHeaderMetadata(
      active.map((t) => ({ id: t.id, slug: t.slug, isDefault: t.isDefault })),
    );

    if (isMainAdmin && active.length > 1) {
      return { pinned: false, reason: 'multiple_companies' };
    }

    const fallback = pickFallbackTenant(active);
    if (!fallback) {
      return { pinned: false, reason: 'no_companies' };
    }

    setActiveCompany({ id: fallback.id });
    syncLogoForTenant(fallback, active);
    return { pinned: true, tenant: fallback };
  } catch (err) {
    console.warn('[bootstrapCompany] Failed to resolve active company', err);
    return { pinned: false, reason: 'error' };
  }
}
