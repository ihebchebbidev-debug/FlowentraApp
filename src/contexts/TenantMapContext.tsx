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

export function TenantMapProvider({ children }: { children: ReactNode }) {
  const { isMainAdmin } = usePermissions();
  const [tenantMap, setTenantMap] = useState<Map<number, string>>(new Map());
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isMainAdmin) {
      setLoaded(true);
      return;
    }

    tenantsApi.list()
      .then((data) => {
        const active = data.filter(t => t.isActive);
        setTenants(active);
        const map = new Map<number, string>();
        active.forEach(t => map.set(t.id, t.companyName));
        setTenantMap(map);
        // Tell the tenant-header helpers how to translate header company ids
        // into X-Tenant slugs and X-Target-Tenant values.
        registerTenantHeaderMetadata(active.map(t => ({ id: t.id, slug: t.slug, isDefault: t.isDefault })));
        // Single-tenant deployments must never be stuck in view-all mode.
        // If a stale `__all__` override exists, silently pin to the only tenant.
        if (active.length <= 1 && isViewAllMode()) {
          const only = active[0];
          setTenantOverrideWithoutReload(only?.slug ?? null);
        }
      })
      .catch(() => {
        // API may not exist yet
      })
      .finally(() => setLoaded(true));
  }, [isMainAdmin]);

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
