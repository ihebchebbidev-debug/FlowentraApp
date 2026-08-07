import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';

/**
 * Persisted applied filters keyed by (report page, active company scope) so
 * navigating away and back re-hydrates the FilterBar and query key.
 *
 * Scope cap: the store keeps at most MAX_SCOPES most-recently-used entries to
 * bound localStorage growth as users switch between many companies.
 */
export type ReportPageKey = 'sales' | 'service' | 'finance' | 'hr' | 'purchase';

type FilterMap = Record<string, string>;

/** Maximum (page × scope) combinations retained. LRU-trimmed on every write. */
const MAX_SCOPES = 30;

interface FiltersState {
  byKey: Record<string, FilterMap>;
  /** Access order; last entry is most-recently used. */
  order: string[];
  set: (key: string, values: FilterMap) => void;
  reset: (key: string) => void;
  clearAll: () => void;
}

const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      byKey: {},
      order: [],
      set: (key, values) => {
        const { byKey, order } = get();
        const nextOrder = [...order.filter((k) => k !== key), key];
        const nextByKey = { ...byKey, [key]: values };
        // Trim LRU entries beyond MAX_SCOPES
        while (nextOrder.length > MAX_SCOPES) {
          const evict = nextOrder.shift();
          if (evict) delete nextByKey[evict];
        }
        set({ byKey: nextByKey, order: nextOrder });
      },
      reset: (key) => {
        const { byKey, order } = get();
        const { [key]: _drop, ...rest } = byKey;
        set({ byKey: rest, order: order.filter((k) => k !== key) });
      },
      clearAll: () => set({ byKey: {}, order: [] }),
    }),
    { name: 'reporting-filters-v1' }
  )
);

const getScopeKey = () => {
  if (isActiveCompanyViewAll()) return 'all';
  const id = getActiveCompanyId();
  return id != null ? `c:${id}` : 'default';
};

const buildKey = (page: ReportPageKey) => `${page}::${getScopeKey()}`;

/**
 * useReportFilters — read/write the persisted applied filters for a report page,
 * scoped to the currently active company.
 */
export const useReportFilters = (page: ReportPageKey) => {
  const key = buildKey(page);
  const values = useFiltersStore((s) => s.byKey[key] ?? {});
  const setRaw = useFiltersStore((s) => s.set);
  const resetRaw = useFiltersStore((s) => s.reset);

  const setValues = useCallback(
    (next: FilterMap) => setRaw(key, next),
    [key, setRaw]
  );
  const clearValues = useCallback(() => resetRaw(key), [key, resetRaw]);

  return { values, setValues, clearValues };
};

/**
 * Purge every persisted report filter (all pages, all company scopes).
 * Call on logout to prevent cross-user leakage and bound localStorage growth.
 */
export const clearAllReportFilters = () => {
  useFiltersStore.getState().clearAll();
  try {
    localStorage.removeItem('reporting-filters-v1');
  } catch {
    /* ignore */
  }
};
