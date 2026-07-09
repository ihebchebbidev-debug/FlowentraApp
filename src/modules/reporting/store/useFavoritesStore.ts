import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';

export interface FavoriteWidget {
  id: string;
  title: string;
  source: 'Sales' | 'Service' | 'Finance' | 'HR' | 'Purchase';
}

/**
 * Favorites are scoped per active company so pinned widgets do not leak
 * across tenants. The persisted shape is `{ [scopeKey]: FavoriteWidget[] }`
 * where scopeKey is the active company id, or `all` when the user is in
 * the "view all companies" mode.
 */
interface FavoritesState {
  byScope: Record<string, FavoriteWidget[]>;
  toggle: (scope: string, w: FavoriteWidget) => void;
  remove: (scope: string, id: string) => void;
}

const useFavoritesStoreInternal = create<FavoritesState>()(
  persist(
    (set, get) => ({
      byScope: {},
      toggle: (scope, w) => {
        const list = get().byScope[scope] ?? [];
        const exists = list.some((x) => x.id === w.id);
        set({
          byScope: {
            ...get().byScope,
            [scope]: exists ? list.filter((x) => x.id !== w.id) : [...list, w],
          },
        });
      },
      remove: (scope, id) =>
        set({
          byScope: {
            ...get().byScope,
            [scope]: (get().byScope[scope] ?? []).filter((x) => x.id !== id),
          },
        }),
    }),
    { name: 'reporting-favorites-v2' }
  )
);

const getScopeKey = () => {
  if (isActiveCompanyViewAll()) return 'all';
  const id = getActiveCompanyId();
  return id != null ? `c:${id}` : 'default';
};

/**
 * Hook to read/write favorites scoped to the currently active company.
 * Keeps the same API (`widgets`, `toggle`, `remove`, `has`) that pages use.
 */
export const useFavoritesStore = () => {
  const byScope = useFavoritesStoreInternal((s) => s.byScope);
  const toggleRaw = useFavoritesStoreInternal((s) => s.toggle);
  const removeRaw = useFavoritesStoreInternal((s) => s.remove);
  const scope = getScopeKey();
  const widgets = useMemo(() => byScope[scope] ?? [], [byScope, scope]);
  return {
    widgets,
    toggle: (w: FavoriteWidget) => toggleRaw(scope, w),
    remove: (id: string) => removeRaw(scope, id),
    has: (id: string) => widgets.some((x) => x.id === id),
  };
};
