import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { subDays, startOfDay, endOfDay, startOfYear, subMonths } from 'date-fns';

export type DatePreset = 'all' | '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';
export type RefreshInterval = 'off' | '30s' | '1m' | '5m' | '10m' | '30m';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DashboardFilterContextValue {
  preset: DatePreset;
  dateRange: DateRange;
  setPreset: (preset: DatePreset) => void;
  setDateRange: (range: DateRange) => void;
  filterItems: <T extends Record<string, any>>(items: T[], dateField?: string) => T[];
  refreshInterval: RefreshInterval;
  setRefreshInterval: (interval: RefreshInterval) => void;
  lastRefreshed: Date | null;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | null>(null);

function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case '7d': return { from: startOfDay(subDays(now, 7)), to: endOfDay(now) };
    case '30d': return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) };
    case '90d': return { from: startOfDay(subDays(now, 90)), to: endOfDay(now) };
    case '6m': return { from: startOfDay(subMonths(now, 6)), to: endOfDay(now) };
    case '1y': return { from: startOfYear(subMonths(now, 11)), to: endOfDay(now) };
    case 'all':
    default: return { from: undefined, to: undefined };
  }
}

const INTERVAL_MS: Record<RefreshInterval, number> = {
  off: 0,
  '30s': 30_000,
  '1m': 60_000,
  '5m': 300_000,
  '10m': 600_000,
  '30m': 1_800_000,
};

export function DashboardFilterProvider({ children, onRefresh }: { children: ReactNode; onRefresh?: () => void }) {
  const [preset, setPresetState] = useState<DatePreset>('all');
  const [dateRange, setDateRangeState] = useState<DateRange>({ from: undefined, to: undefined });
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>('off');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const setPreset = (p: DatePreset) => {
    setPresetState(p);
    if (p !== 'custom') {
      setDateRangeState(getPresetRange(p));
    }
  };

  const setDateRange = (range: DateRange) => {
    setPresetState('custom');
    setDateRangeState(range);
  };

  // Silent auto-refresh
  useEffect(() => {
    const ms = INTERVAL_MS[refreshInterval];
    if (!ms) return;

    const id = setInterval(() => {
      onRefreshRef.current?.();
      setLastRefreshed(new Date());
    }, ms);

    return () => clearInterval(id);
  }, [refreshInterval]);

  const filterItems = useCallback(<T extends Record<string, any>>(items: T[], dateField?: string): T[] => {
    const { from, to } = preset === 'custom' ? dateRange : getPresetRange(preset);
    if (!from && !to) return items;

    return items.filter((item) => {
      const raw = item[dateField || 'createdAt'] || item.date || item.created_at;
      if (!raw) return true;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [preset, dateRange]);

  return (
    <DashboardFilterContext.Provider value={{ preset, dateRange, setPreset, setDateRange, filterItems, refreshInterval, setRefreshInterval, lastRefreshed }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilter() {
  const ctx = useContext(DashboardFilterContext);
  if (!ctx) throw new Error('useDashboardFilter must be used within DashboardFilterProvider');
  return ctx;
}
