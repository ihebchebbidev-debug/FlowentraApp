/**
 * TenantMapContext — Provides a cached tenantId→companyName mapping.
 * Only fetches when the current user is a MainAdminUser.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { tenantsApi, type Tenant } from '@/services/api/tenantsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { registerTenantHeaderMetadata } from '@/utils/targetTenant';
import { isViewAllMode, setTenantOverrideWithoutReload, VIEW_ALL_SENTINEL } from '@/utils/tenant';

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
  const { isMainAdmin } = usePermissions();
  const userId = typeof window !== 'undefined' ? window.localStorage.getItem('user_id') : null;

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
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('auth_token') || window.localStorage.getItem('token');
      if (!token) {
        setLoaded(true);
        return;
      }
    }

    tenantsApi.list()
      .then((data) => {
        const active = data.filter(t => t.isActive);
        setTenants(active);
        const map = new Map<number, string>();
        active.forEach(t => map.set(t.id, t.companyName));
        setTenantMap(map);
        writeCache(active);
        registerTenantHeaderMetadata(active.map(t => ({ id: t.id, slug: t.slug, isDefault: t.isDefault })));
        if (active.length <= 1 && isViewAllMode()) {
          const only = active[0];
          setTenantOverrideWithoutReload(only?.slug ?? null);
        }
      })
      .catch((err) => {
        // Fix #3: surface failures instead of silently swallowing — keeps
        // 401/403/500 visible during QA without breaking the app.
        // eslint-disable-next-line no-console
        console.warn('[TenantMapContext] Failed to load tenant list:', err);
      })
      .finally(() => setLoaded(true));
  }, [isMainAdmin, userId]);

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
