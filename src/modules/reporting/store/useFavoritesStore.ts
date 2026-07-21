import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/lib/i18n';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';
import { toast } from '@/hooks/use-toast';
import {
  fetchReportingFavorites,
  upsertReportingFavorite,
  deleteReportingFavorite,
  deleteAllReportingFavorites,
  reorderReportingFavorites,
} from '@/services/api/reportingFavoritesApi';

export type FavoriteSource = 'Sales' | 'Service' | 'Finance' | 'HR' | 'Purchase';

const KNOWN_SOURCES: readonly FavoriteSource[] = [
  'Sales', 'Service', 'Finance', 'HR', 'Purchase',
];
export const isFavoriteSource = (s: unknown): s is FavoriteSource =>
  typeof s === 'string' && (KNOWN_SOURCES as readonly string[]).includes(s);

export interface FavoriteWidget {
  id: string;
  title: string;
  source: FavoriteSource;
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
  markHydrated: (scope: string, value: boolean) => void;
  toggle: (scope: string, w: FavoriteWidget) => { added: boolean; prev: FavoriteWidget[] };
  remove: (scope: string, id: string) => { prev: FavoriteWidget[] };
  clear: (scope: string) => { prev: FavoriteWidget[] };
  reorder: (scope: string, orderedIds: string[]) => { prev: FavoriteWidget[] };
}

const useFavoritesStoreInternal = create<FavoritesState>()(
  persist(
    (set, get) => ({
      byScope: {},
      hydratedScopes: {},
      setScope: (scope, widgets) =>
        set({ byScope: { ...get().byScope, [scope]: widgets } }),
      markHydrated: (scope, value) =>
        set({ hydratedScopes: { ...get().hydratedScopes, [scope]: value } }),
      toggle: (scope, w) => {
        const prev = get().byScope[scope] ?? [];
        const exists = prev.some((x) => x.id === w.id);
        set({
          byScope: {
            ...get().byScope,
            [scope]: exists ? prev.filter((x) => x.id !== w.id) : [...prev, w],
          },
        });
        return { added: !exists, prev };
      },
      remove: (scope, id) => {
        const prev = get().byScope[scope] ?? [];
        set({
          byScope: {
            ...get().byScope,
            [scope]: prev.filter((x) => x.id !== id),
          },
        });
        return { prev };
      },
      clear: (scope) => {
        const prev = get().byScope[scope] ?? [];
        set({ byScope: { ...get().byScope, [scope]: [] } });
        return { prev };
      },
      reorder: (scope, orderedIds) => {
        const prev = get().byScope[scope] ?? [];
        const map = new Map(prev.map((w) => [w.id, w]));
        const next = orderedIds
          .map((id) => map.get(id))
          .filter((w): w is FavoriteWidget => Boolean(w));
        for (const w of prev) if (!orderedIds.includes(w.id)) next.push(w);
        set({ byScope: { ...get().byScope, [scope]: next } });
        return { prev };
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
    // Defensive: drop any row with an unknown/legacy source rather than
    // rendering `undefined` in <PinnedReportingWidgets> / <FavoriteWidgetCard>.
    const widgets: FavoriteWidget[] = items
      .filter((r) => isFavoriteSource(r.source))
      .map((r) => ({
        id: r.widgetId,
        title: r.title,
        source: r.source as FavoriteSource,
      }));
    useFavoritesStoreInternal.getState().setScope(scope, widgets);
    useFavoritesStoreInternal.getState().markHydrated(scope, true);
  } catch {
    // Keep locally-persisted values on failure; will retry next mount.
  } finally {
    fetchingScopes.delete(scope);
  }
};

/** Rollback helper: revert `byScope[scope]` and force a re-hydrate next mount. */
const rollback = (scope: string, prev: FavoriteWidget[], errMsg: string) => {
  useFavoritesStoreInternal.getState().setScope(scope, prev);
  useFavoritesStoreInternal.getState().markHydrated(scope, false);
  const t = i18n.getFixedT(null, 'reporting');
  toast({
    title: t('favorites.saveFailedTitle', { defaultValue: 'Could not save your pinned widgets' }),
    description: errMsg || t('favorites.networkError', { defaultValue: 'Network error' }),
    variant: 'destructive',
  });
};

/** Called from `remove()` and `toggle()` when unpinning, so orphan widget ids
 *  don't pile up in `DashboardLayout.order`/`hidden`. Kept as a soft-import to
 *  avoid a circular dependency between the two stores. */
const scrubDashboardLayout = (scope: string, id: string) => {
  // Dynamic import breaks the store↔store cycle at bundle time.
  import('@/modules/dashboard/store/useDashboardLayoutStore')
    .then((m) => m.stripIdFromLayout?.(scope, id))
    .catch(() => { /* non-critical */ });
};

export const useFavoritesStore = () => {
  const scope = getScopeKey();
  // Scoped subscription: only re-render when THIS scope's list changes,
  // not on any change to the global byScope map.
  const widgetsRaw = useFavoritesStoreInternal((s) => s.byScope[scope]);
  const hydrated = useFavoritesStoreInternal((s) => !!s.hydratedScopes[scope]);
  const toggleRaw = useFavoritesStoreInternal((s) => s.toggle);
  const removeRaw = useFavoritesStoreInternal((s) => s.remove);
  const reorderRaw = useFavoritesStoreInternal((s) => s.reorder);
  const clearRaw = useFavoritesStoreInternal((s) => s.clear);
  const widgets = useMemo(() => widgetsRaw ?? [], [widgetsRaw]);

  useEffect(() => {
    if (!hydrated) void hydrateFromBackend(scope);
  }, [scope, hydrated]);

  return {
    widgets,
    hydrated,
    toggle: (w: FavoriteWidget) => {
      if (!isFavoriteSource(w.source)) return;
      const { added, prev } = toggleRaw(scope, w);
      if (added) {
        const position = (useFavoritesStoreInternal.getState().byScope[scope] ?? []).length - 1;
        upsertReportingFavorite({
          scope, widgetId: w.id, title: w.title, source: w.source, position,
        }).catch((e) => rollback(scope, prev, e?.message || 'Network error'));
      } else {
        deleteReportingFavorite(scope, w.id)
          .then(() => scrubDashboardLayout(scope, w.id))
          .catch((e) => rollback(scope, prev, e?.message || 'Network error'));
      }
    },
    remove: (id: string) => {
      const { prev } = removeRaw(scope, id);
      deleteReportingFavorite(scope, id)
        .then(() => scrubDashboardLayout(scope, id))
        .catch((e) => rollback(scope, prev, e?.message || 'Network error'));
    },
    reorder: (orderedIds: string[]) => {
      const { prev } = reorderRaw(scope, orderedIds);
      reorderReportingFavorites(scope, orderedIds)
        .catch((e) => rollback(scope, prev, e?.message || 'Network error'));
    },
    resetAll: () => {
      const { prev } = clearRaw(scope);
      deleteAllReportingFavorites(scope)
        .then(() => prev.forEach((w) => scrubDashboardLayout(scope, w.id)))
        .catch((e) => rollback(scope, prev, e?.message || 'Network error'));
    },
    has: (id: string) => widgets.some((x) => x.id === id),
  };
};
