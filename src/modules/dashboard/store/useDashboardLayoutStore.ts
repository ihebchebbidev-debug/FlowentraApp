import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';
import {
  fetchDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout,
} from '@/services/api/dashboardLayoutApi';

/**
 * Per-user customization of the main "/dashboard" landing page.
 *
 * The layout is scoped per active company (like reporting favorites) so it does
 * not leak across tenants. It is persisted to the backend
 * (`/api/DashboardLayout`) so it follows the user across devices/logins, with a
 * localStorage mirror for instant hydration and offline resilience.
 *
 *  - `order`  : ordered list of card ids (default cards + pinned reporting
 *               widget ids). Cards not present are appended in their natural order.
 *  - `hidden` : default card ids the user removed. (Reporting widgets are
 *               "removed" by un-pinning them via the favorites store.)
 */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
}

interface LayoutState {
  byScope: Record<string, DashboardLayout>;
  hydratedScopes: Record<string, boolean>;
  setScope: (scope: string, layout: DashboardLayout) => void;
  markHydrated: (scope: string) => void;
  patch: (scope: string, next: Partial<DashboardLayout>) => void;
}

const EMPTY: DashboardLayout = { order: [], hidden: [] };

const useLayoutStoreInternal = create<LayoutState>()(
  persist(
    (set, get) => ({
      byScope: {},
      hydratedScopes: {},
      setScope: (scope, layout) =>
        set({ byScope: { ...get().byScope, [scope]: layout } }),
      markHydrated: (scope) =>
        set({ hydratedScopes: { ...get().hydratedScopes, [scope]: true } }),
      patch: (scope, next) => {
        const current = get().byScope[scope] ?? EMPTY;
        set({ byScope: { ...get().byScope, [scope]: { ...current, ...next } } });
      },
    }),
    {
      name: 'dashboard-layout-v1',
      partialize: (state) => ({ byScope: state.byScope }),
    }
  )
);

const getScopeKey = () => {
  if (isActiveCompanyViewAll()) return 'all';
  const id = getActiveCompanyId();
  return id != null ? `c:${id}` : 'default';
};

const fetchingScopes = new Set<string>();

const hydrateFromBackend = async (scope: string) => {
  if (fetchingScopes.has(scope)) return;
  fetchingScopes.add(scope);
  try {
    const res = await fetchDashboardLayout(scope);
    const data = res?.data?.data;
    useLayoutStoreInternal.getState().setScope(scope, {
      order: Array.isArray(data?.order) ? data!.order : [],
      hidden: Array.isArray(data?.hidden) ? data!.hidden : [],
    });
    useLayoutStoreInternal.getState().markHydrated(scope);
  } catch {
    // Keep locally-persisted values on failure; retry next mount.
  } finally {
    fetchingScopes.delete(scope);
  }
};

const persistLayout = async (scope: string, layout: DashboardLayout) => {
  try {
    await saveDashboardLayout({ scope, order: layout.order, hidden: layout.hidden });
  } catch {
    /* handled by apiClient */
  }
};

export const useDashboardLayout = () => {
  const byScope = useLayoutStoreInternal((s) => s.byScope);
  const hydratedScopes = useLayoutStoreInternal((s) => s.hydratedScopes);
  const patch = useLayoutStoreInternal((s) => s.patch);
  const scope = getScopeKey();
  const layout = useMemo(() => byScope[scope] ?? EMPTY, [byScope, scope]);
  const hydrated = !!hydratedScopes[scope];

  useEffect(() => {
    if (!hydratedScopes[scope]) {
      void hydrateFromBackend(scope);
    }
  }, [scope, hydratedScopes]);

  const commit = (next: DashboardLayout) => {
    patch(scope, next);
    void persistLayout(scope, next);
  };

  return {
    order: layout.order,
    hidden: layout.hidden,
    hydrated,
    /** Persist a new ordering of visible card ids. */
    setOrder: (order: string[]) => commit({ order, hidden: layout.hidden }),
    /** Hide a default card. */
    hide: (id: string) =>
      commit({
        order: layout.order.filter((x) => x !== id),
        hidden: layout.hidden.includes(id) ? layout.hidden : [...layout.hidden, id],
      }),
    /** Restore a previously-hidden default card (appended to the end). */
    unhide: (id: string) =>
      commit({
        order: layout.order.includes(id) ? layout.order : [...layout.order, id],
        hidden: layout.hidden.filter((x) => x !== id),
      }),
    /** Reset to the built-in default layout. */
    reset: () => {
      patch(scope, { order: [], hidden: [] });
      void resetDashboardLayout(scope);
    },
  };
};
