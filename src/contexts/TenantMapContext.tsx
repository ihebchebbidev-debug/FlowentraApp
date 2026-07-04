/**
 * TenantMapContext — Provides a cached tenantId→companyName mapping.
 * Only fetches when the current user is a MainAdminUser.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { tenantsApi, type Tenant } from '@/services/api/tenantsApi';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentTenant } from '@/utils/tenant';
import { clearTenantListCache } from '@/utils/bootstrapCompany';
import { registerTenantHeaderMetadata, setActiveCompany, getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';
import { setCompanyLogo, setCompanyLogoExplicitNone } from '@/hooks/useCompanyLogo';

interface TenantMapContextValue {
  /** Resolve a tenantId to its company name. Returns "Company #id" as fallback. */
  getCompanyName: (tenantId: number) => string;
  /** Full tenant list (active only) */
  tenants: Tenant[];
  /** Whether the map has loaded */
  loaded: boolean;
  /** Force a refetch (e.g. after creating a company). Pass bustCache after onboarding. */
  refetch: (opts?: { bustCache?: boolean }) => Promise<void>;
}

const TenantMapContext = createContext<TenantMapContextValue>({
  getCompanyName: (id) => `#${id}`,
  tenants: [],
  loaded: false,
  refetch: async () => {},
});

const CACHE_KEY_PREFIX = 'tenants:cache:v2:';

/**
 * Cache is keyed by the X-Tenant slug (i.e. the database) so a user who
 * switches subdomain never reads another DB's company list. The old
 * 'tenants:cache:v1' key was global and caused cross-DB bleed in production.
 */
function cacheKeyFor(slug: string | null): string {
  return `${CACHE_KEY_PREFIX}${slug ?? '__default__'}`;
}

function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    window.localStorage.getItem('access_token') ||
    window.sessionStorage.getItem('access_token') ||
    window.localStorage.getItem('auth_token') ||
    window.sessionStorage.getItem('auth_token') ||
    window.localStorage.getItem('token') ||
    window.sessionStorage.getItem('token')
  );
}

function readCache(slug: string | null): Tenant[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(cacheKeyFor(slug));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(slug: string | null, tenants: Tenant[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(cacheKeyFor(slug), JSON.stringify(tenants));
    // Best-effort: drop the legacy v1 key so we never read stale cross-DB data again.
    window.localStorage.removeItem('tenants:cache:v1');
  } catch {
    /* ignore */
  }
}

export function TenantMapProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const currentSlug = getCurrentTenant();

  // Hydrate from the slug-scoped cache so the switcher doesn't flash empty on
  // reload. If the user just switched subdomains, the previous DB's cache key
  // is different and won't bleed across.
  const initialCache = readCache(currentSlug) ?? [];
  const [tenantMap, setTenantMap] = useState<Map<number, string>>(() => {
    const m = new Map<number, string>();
    initialCache.forEach(t => m.set(t.id, t.companyName));
    return m;
  });
  const [tenants, setTenants] = useState<Tenant[]>(initialCache);
  const [loaded, setLoaded] = useState(initialCache.length > 0);

  const fetchTenants = useCallback(async (opts?: { bustCache?: boolean }): Promise<void> => {
    const token = getStoredAccessToken();
    if (!isAuthenticated || !token) {
      setTenants([]);
      setTenantMap(new Map());
      setLoaded(true);
      return;
    }
    if (opts?.bustCache) {
      clearTenantListCache();
    }
    try {
      const data = await tenantsApi.list();
      const active = data.filter(t => t.isActive);
      setTenants(active);
      const map = new Map<number, string>();
      active.forEach(t => map.set(t.id, t.companyName));
      setTenantMap(map);
      writeCache(currentSlug, active);
      registerTenantHeaderMetadata(active.map(t => ({ id: t.id, slug: t.slug, isDefault: t.isDefault })));
      if (active.length === 1 && getActiveCompanyId() === undefined && !isActiveCompanyViewAll()) {
        setActiveCompany({ id: active[0].id });
      }
      // Keep the global logo singleton in sync with the active tenant's
      // companyLogoUrl — covers reloads, direct URL navigation, and cases
      // where the active company changed via something other than the
      // TenantSwitcher (SelectCompany screen, single-tenant auto-pick, etc.).
      try {
        const defaultTenant = active.find(t => t.isDefault) ?? active[0];
        const defaultLogoUrl = defaultTenant?.companyLogoUrl ?? null;

        if (isActiveCompanyViewAll()) {
          if (defaultLogoUrl) setCompanyLogo(defaultLogoUrl);
          else setCompanyLogoExplicitNone();
        } else {
          const targetId = getActiveCompanyId()
            ?? (active.length === 1 ? active[0].id : undefined);
          const activeTenant = targetId !== undefined
            ? active.find(t => t.id === targetId)
            : undefined;
          const resolved = activeTenant?.companyLogoUrl ?? defaultLogoUrl;
          if (resolved) setCompanyLogo(resolved);
          else setCompanyLogoExplicitNone();
        }
      } catch { /* non-fatal */ }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[TenantMapContext] Failed to load tenant list:', err);
    } finally {
      setLoaded(true);
    }
  }, [isAuthenticated, currentSlug]);

  useEffect(() => {
    if (isLoading) return;
    void fetchTenants();
  }, [isAuthenticated, isLoading, user?.id, fetchTenants]);

  const getCompanyName = useCallback(
    (tenantId: number): string => {
      return tenantMap.get(tenantId) || `Company #${tenantId}`;
    },
    [tenantMap]
  );

  return (
    <TenantMapContext.Provider value={{ getCompanyName, tenants, loaded, refetch: fetchTenants }}>
      {children}
    </TenantMapContext.Provider>
  );
}

export function useTenantMap() {
  return useContext(TenantMapContext);
}
