import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/lib/i18n';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';
import { toast } from '@/hooks/use-toast';
import {
  fetchDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout,
} from '@/services/api/dashboardLayoutApi';

/**
 * Per-user customization of the main "/dashboard" landing page.
 *
 * Scoped per active company (like reporting favorites) so it does not leak
 * across tenants. Persisted to the backend (`/api/DashboardLayout`) so it
 * follows the user across devices/logins, with a localStorage mirror for
 * instant hydration and offline resilience.
 *
 *  - `order`  : ordered list of **default** dashboard card ids ONLY. Pinned
 *               reporting widget ids are NOT stored here anymore — pinned
 *               widgets always render at the top of the dashboard, ordered
 *               by the reporting favorites store (single source of truth).
 *  - `hidden` : default card ids the user hid. Reporting widgets are "removed"
 *               by un-pinning them via the favorites store.
 */
export interface DashboardLayout {
  order: string[];
  hidden: string[];
}

interface LayoutState {
  byScope: Record<string, DashboardLayout>;
  hydratedScopes: Record<string, boolean>;
  setScope: (scope: string, layout: DashboardLayout) => void;
  markHydrated: (scope: string, value: boolean) => void;
  patch: (scope: string, next: Partial<DashboardLayout>) => { prev: DashboardLayout };
}

const EMPTY: DashboardLayout = { order: [], hidden: [] };

const useLayoutStoreInternal = create<LayoutState>()(
  persist(
    (set, get) => ({
      byScope: {},
      hydratedScopes: {},
      setScope: (scope, layout) =>
        set({ byScope: { ...get().byScope, [scope]: layout } }),
      markHydrated: (scope, value) =>
        set({ hydratedScopes: { ...get().hydratedScopes, [scope]: value } }),
      patch: (scope, next) => {
        const prev = get().byScope[scope] ?? EMPTY;
        set({ byScope: { ...get().byScope, [scope]: { ...prev, ...next } } });
        return { prev };
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
    useLayoutStoreInternal.getState().markHydrated(scope, true);
  } catch {
    // Keep locally-persisted values on failure; retry next mount.
  } finally {
    fetchingScopes.delete(scope);
  }
};

const persistLayout = (scope: string, layout: DashboardLayout, prev: DashboardLayout) => {
  saveDashboardLayout({ scope, order: layout.order, hidden: layout.hidden }).catch((e) => {
    // Roll back and force re-hydrate so client/server don't drift silently.
    useLayoutStoreInternal.getState().setScope(scope, prev);
    useLayoutStoreInternal.getState().markHydrated(scope, false);
    const t = i18n.getFixedT(null, 'dashboard');
    toast({
      title: t('layout.saveFailedTitle', { defaultValue: 'Could not save your dashboard layout' }),
      description: e?.message || t('layout.networkError', { defaultValue: 'Network error' }),
      variant: 'destructive',
    });
  });
};

/**
 * Cross-store cleanup called by the favorites store when a widget is unpinned:
 * strips the id from `order` and `hidden` so orphan ids do not accumulate
 * indefinitely in the JSONB blob. Safe to call for ids that aren't present.
 */
export const stripIdFromLayout = (scope: string, id: string) => {
  const current = useLayoutStoreInternal.getState().byScope[scope] ?? EMPTY;
  if (!current.order.includes(id) && !current.hidden.includes(id)) return;
  const next: DashboardLayout = {
    order: current.order.filter((x) => x !== id),
    hidden: current.hidden.filter((x) => x !== id),
  };
  useLayoutStoreInternal.getState().setScope(scope, next);
  persistLayout(scope, next, current);
};

export const useDashboardLayout = () => {
  const scope = getScopeKey();
  const layoutRaw = useLayoutStoreInternal((s) => s.byScope[scope]);
  const hydrated = useLayoutStoreInternal((s) => !!s.hydratedScopes[scope]);
  const patch = useLayoutStoreInternal((s) => s.patch);
  const layout = useMemo(() => layoutRaw ?? EMPTY, [layoutRaw]);

  useEffect(() => {
    if (!hydrated) void hydrateFromBackend(scope);
  }, [scope, hydrated]);

  const commit = (next: DashboardLayout) => {
    const { prev } = patch(scope, next);
    persistLayout(scope, next, prev);
  };

  return {
    order: layout.order,
    hidden: layout.hidden,
    hydrated,
    /** Persist a new ordering of default-card ids. */
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
      const prev = layout;
      useLayoutStoreInternal.getState().setScope(scope, EMPTY);
      resetDashboardLayout(scope).catch((e) => {
        useLayoutStoreInternal.getState().setScope(scope, prev);
        useLayoutStoreInternal.getState().markHydrated(scope, false);
        const t = i18n.getFixedT(null, 'dashboard');
        toast({
          title: t('layout.resetFailedTitle', { defaultValue: 'Could not reset your dashboard layout' }),
          description: e?.message || t('layout.networkError', { defaultValue: 'Network error' }),
          variant: 'destructive',
        });
      });
    },
  };
};
