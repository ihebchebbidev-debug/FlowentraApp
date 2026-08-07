import { useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityEvent, ActivitySource } from '../types';
import { fetchAggregated, ADAPTER_KEYS } from '../services/adapters';

export interface UseAggregatedActivityOptions {
  sources?: ActivitySource[];
  enabled?: boolean;
  /** Polling interval in ms. 0 disables auto-refresh. */
  pollIntervalMs?: number;
  /** Pause polling when the tab is hidden. Default true. */
  pauseWhenHidden?: boolean;
  /** Refresh immediately when the tab regains focus. Default true. */
  refreshOnFocus?: boolean;
}

const DEFAULT_INTERVAL = 30_000;

export function useAggregatedActivity(opts: UseAggregatedActivityOptions = {}) {
  const {
    sources = ADAPTER_KEYS,
    enabled = true,
    pollIntervalMs = DEFAULT_INTERVAL,
    pauseWhenHidden = true,
    refreshOnFocus = true,
  } = opts;

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(pollIntervalMs > 0);

  const runIdRef = useRef(0);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const sourcesKey = useMemo(() => sources.join(','), [sources]);

  const load = useMemo(
    () => async (silent: boolean) => {
      if (!enabled) return;
      const runId = ++runIdRef.current;
      if (silent) setIsRefetching(true);
      else setLoading(true);
      try {
        const list = await fetchAggregated(sources);
        if (runId !== runIdRef.current) return;
        const prevKnown = knownIdsRef.current;
        if (prevKnown.size > 0) {
          const fresh = new Set<string>();
          for (const ev of list) {
            if (!prevKnown.has(ev.id)) fresh.add(ev.id);
          }
          if (fresh.size > 0) {
            setNewEventIds(fresh);
            // Highlight decays after 6s
            window.setTimeout(() => {
              setNewEventIds((cur) => {
                if (cur === fresh) return new Set();
                const next = new Set(cur);
                fresh.forEach((id) => next.delete(id));
                return next;
              });
            }, 6000);
          }
        }
        knownIdsRef.current = new Set(list.map((e) => e.id));
        setEvents(list);
        setLastUpdatedAt(new Date());
        setError(null);
      } catch (e: any) {
        if (runId !== runIdRef.current) return;
        setError(e?.message || 'Failed to load activity');
      } finally {
        if (runId === runIdRef.current) {
          setLoading(false);
          setIsRefetching(false);
        }
      }
    },
    [enabled, sourcesKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Initial + on source change: reset baseline, do a non-silent load
  useEffect(() => {
    if (!enabled) return;
    knownIdsRef.current = new Set();
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sourcesKey]);

  // Polling
  useEffect(() => {
    if (!enabled || !autoRefresh || pollIntervalMs <= 0) return;
    const id = window.setInterval(() => {
      if (pauseWhenHidden && document.hidden) return;
      load(true);
    }, pollIntervalMs);
    return () => window.clearInterval(id);
  }, [enabled, autoRefresh, pollIntervalMs, pauseWhenHidden, load]);

  // Focus / visibility change: refresh right away
  useEffect(() => {
    if (!enabled || !refreshOnFocus) return;
    const onVis = () => {
      if (!document.hidden && autoRefresh) load(true);
    };
    const onFocus = () => {
      if (autoRefresh) load(true);
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, refreshOnFocus, autoRefresh, load]);

  return {
    events,
    loading,
    isRefetching,
    error,
    lastUpdatedAt,
    newEventIds,
    autoRefresh,
    setAutoRefresh,
    refresh: () => load(true),
  };
}
