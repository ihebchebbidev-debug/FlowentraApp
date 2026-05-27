/**
 * TenantMapContext — Provides a cached tenantId→companyName mapping.
 * Only fetches when the current user is a MainAdminUser.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { tenantsApi, type Tenant } from '@/services/api/tenantsApi';
import { useAuth } from '@/contexts/AuthContext';
import { registerTenantHeaderMetadata, setActiveCompany, getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';

interface TenantMapContextValue {
  /** Resolve a tenantId to its company name. Returns "Company #id" as fallback. */
  getCompanyName: (tenantId: number) => string;
  /** Full tenant list (active only) */
  tenants: Tenant[];
  /** Whether the map has loaded */
  loaded: boolean;
}

const TenantMapContext = createContext<TenantMapContextValue>({
  getCompanyName: (id) => `#${id}`,
  tenants: [],
  loaded: false,
});

const CACHE_KEY = 'tenants:cache:v1';

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

function readCache(): Tenant[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCache(tenants: Tenant[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(tenants));
  } catch {
    /* ignore */
  }
}

export function TenantMapProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Fix #5: hydrate from cache so the switcher doesn't flash empty on reload.
  const initialCache = readCache() ?? [];
  const [tenantMap, setTenantMap] = useState<Map<number, string>>(() => {
    const m = new Map<number, string>();
    initialCache.forEach(t => m.set(t.id, t.companyName));
    return m;
  });
  const [tenants, setTenants] = useState<Tenant[]>(initialCache);
  const [loaded, setLoaded] = useState(initialCache.length > 0);

  useEffect(() => {
    // Fix #1: fetch for ANY authenticated user. Backend already scopes the
    // returned list to tenants the user actually belongs to, so regular
    // multi-company users now see the switcher too.
    // Fix #2: depend on userId as well so the effect re-runs once auth
    // data lands (closing the isMainAdmin race on first paint).
    if (isLoading) return;

    const token = getStoredAccessToken();
    if (!isAuthenticated || !token) {
      setTenants([]);
      setTenantMap(new Map());
      setLoaded(true);
      return;
    }

    setLoaded(initialCache.length > 0);

    tenantsApi.list()
      .then((data) => {
        const active = data.filter(t => t.isActive);
        setTenants(active);
        const map = new Map<number, string>();
        active.forEach(t => map.set(t.id, t.companyName));
        setTenantMap(map);
        writeCache(active);
        registerTenantHeaderMetadata(active.map(t => ({ id: t.id, slug: t.slug, isDefault: t.isDefault })));
        // Single-tenant accounts: auto-pin so the user skips /select-company.
        if (active.length === 1 && getActiveCompanyId() === undefined && !isActiveCompanyViewAll()) {
          setActiveCompany({ id: active[0].id });
        }
      })
      .catch((err) => {
        // Fix #3: surface failures instead of silently swallowing — keeps
        // 401/403/500 visible during QA without breaking the app.
        // eslint-disable-next-line no-console
        console.warn('[TenantMapContext] Failed to load tenant list:', err);
      })
      .finally(() => setLoaded(true));
  }, [isAuthenticated, isLoading, user?.id]);

  const getCompanyName = useCallback(
    (tenantId: number): string => {
      return tenantMap.get(tenantId) || `Company #${tenantId}`;
    },
    [tenantMap]
  );

  return (
    <TenantMapContext.Provider value={{ getCompanyName, tenants, loaded }}>
      {children}
    </TenantMapContext.Provider>
  );
}

export function useTenantMap() {
  return useContext(TenantMapContext);
}
