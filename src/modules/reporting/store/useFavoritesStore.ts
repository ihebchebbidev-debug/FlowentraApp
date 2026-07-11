import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';
import {
  fetchReportingFavorites,
  upsertReportingFavorite,
  deleteReportingFavorite,
  deleteAllReportingFavorites,
  reorderReportingFavorites,
} from '@/services/api/reportingFavoritesApi';

export interface FavoriteWidget {
  id: string;
  title: string;
  source: 'Sales' | 'Service' | 'Finance' | 'HR' | 'Purchase';
}

/**
 * Favorites are scoped per active company so pinned widgets do not leak
 * across tenants. The persisted shape is `{ [scopeKey]: FavoriteWidget[] }`.
 * Order within each scope is user-controlled (drag-and-drop) and mirrored
 * to the backend `ReportingFavorites.Position` column (via the
 * `/api/ReportingFavorites` endpoints) so it survives across devices/sessions.
 */
interface FavoritesState {
  byScope: Record<string, FavoriteWidget[]>;
  hydratedScopes: Record<string, boolean>;
  setScope: (scope: string, widgets: FavoriteWidget[]) => void;
  markHydrated: (scope: string) => void;
  toggle: (scope: string, w: FavoriteWidget) => { added: boolean };
  remove: (scope: string, id: string) => void;
  clear: (scope: string) => void;
  reorder: (scope: string, orderedIds: string[]) => void;
}

const useFavoritesStoreInternal = create<FavoritesState>()(
  persist(
    (set, get) => ({
      byScope: {},
      hydratedScopes: {},
      setScope: (scope, widgets) =>
        set({ byScope: { ...get().byScope, [scope]: widgets } }),
      markHydrated: (scope) =>
        set({ hydratedScopes: { ...get().hydratedScopes, [scope]: true } }),
      toggle: (scope, w) => {
        const list = get().byScope[scope] ?? [];
        const exists = list.some((x) => x.id === w.id);
        set({
          byScope: {
            ...get().byScope,
            [scope]: exists ? list.filter((x) => x.id !== w.id) : [...list, w],
          },
        });
        return { added: !exists };
      },
      remove: (scope, id) =>
        set({
          byScope: {
            ...get().byScope,
            [scope]: (get().byScope[scope] ?? []).filter((x) => x.id !== id),
          },
        }),
      clear: (scope) =>
        set({
          byScope: { ...get().byScope, [scope]: [] },
        }),
      reorder: (scope, orderedIds) => {
        const list = get().byScope[scope] ?? [];
        const map = new Map(list.map((w) => [w.id, w]));
        const next = orderedIds
          .map((id) => map.get(id))
          .filter((w): w is FavoriteWidget => Boolean(w));
        // preserve any items missing from orderedIds at the end
        for (const w of list) if (!orderedIds.includes(w.id)) next.push(w);
        set({ byScope: { ...get().byScope, [scope]: next } });
      },
    }),
    {
      name: 'reporting-favorites-v2',
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
    const res = await fetchReportingFavorites(scope);
    const items = res?.data?.data?.items ?? [];
    const widgets: FavoriteWidget[] = items.map((r) => ({
      id: r.widgetId,
      title: r.title,
      source: r.source as FavoriteWidget['source'],
    }));
    useFavoritesStoreInternal.getState().setScope(scope, widgets);
    useFavoritesStoreInternal.getState().markHydrated(scope);
  } catch {
    // Keep locally-persisted values on failure; will retry next mount.
  } finally {
    fetchingScopes.delete(scope);
  }
};

const persistAdd = async (scope: string, w: FavoriteWidget, position: number) => {
  try {
    await upsertReportingFavorite({
      scope,
      widgetId: w.id,
      title: w.title,
      source: w.source,
      position,
    });
  } catch {
    /* handled by apiClient */
  }
};

const persistRemove = async (scope: string, id: string) => {
  try {
    await deleteReportingFavorite(scope, id);
  } catch {
    /* handled by apiClient */
  }
};

const persistOrder = async (scope: string, orderedIds: string[]) => {
  try {
    await reorderReportingFavorites(scope, orderedIds);
  } catch {
    /* handled by apiClient */
  }
};

const persistClear = async (scope: string) => {
  try {
    await deleteAllReportingFavorites(scope);
  } catch {
    /* handled by apiClient */
  }
};

export const useFavoritesStore = () => {
  const byScope = useFavoritesStoreInternal((s) => s.byScope);
  const hydratedScopes = useFavoritesStoreInternal((s) => s.hydratedScopes);
  const toggleRaw = useFavoritesStoreInternal((s) => s.toggle);
  const removeRaw = useFavoritesStoreInternal((s) => s.remove);
  const reorderRaw = useFavoritesStoreInternal((s) => s.reorder);
  const clearRaw = useFavoritesStoreInternal((s) => s.clear);
  const scope = getScopeKey();
  const widgets = useMemo(() => byScope[scope] ?? [], [byScope, scope]);

  useEffect(() => {
    if (!hydratedScopes[scope]) {
      void hydrateFromBackend(scope);
    }
  }, [scope, hydratedScopes]);

  return {
    widgets,
    toggle: (w: FavoriteWidget) => {
      const { added } = toggleRaw(scope, w);
      if (added) {
        const position = (useFavoritesStoreInternal.getState().byScope[scope] ?? []).length - 1;
        void persistAdd(scope, w, position);
      } else {
        void persistRemove(scope, w.id);
      }
    },
    remove: (id: string) => {
      removeRaw(scope, id);
      void persistRemove(scope, id);
    },
    reorder: (orderedIds: string[]) => {
      reorderRaw(scope, orderedIds);
      void persistOrder(scope, orderedIds);
    },
    resetAll: () => {
      clearRaw(scope);
      void persistClear(scope);
    },
    has: (id: string) => widgets.some((x) => x.id === id),
  };
};
