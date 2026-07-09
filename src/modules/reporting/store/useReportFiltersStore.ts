import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveCompanyId, isActiveCompanyViewAll } from '@/utils/targetTenant';

/**
 * Persisted applied filters keyed by (report page, active company scope) so
 * navigating away and back re-hydrates the FilterBar and query key.
 */
export type ReportPageKey = 'sales' | 'service' | 'finance' | 'hr' | 'purchase';

type FilterMap = Record<string, string>;

interface FiltersState {
  byKey: Record<string, FilterMap>;
  set: (key: string, values: FilterMap) => void;
  reset: (key: string) => void;
}

const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      byKey: {},
      set: (key, values) => set({ byKey: { ...get().byKey, [key]: values } }),
      reset: (key) => {
        const { [key]: _drop, ...rest } = get().byKey;
        set({ byKey: rest });
      },
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
