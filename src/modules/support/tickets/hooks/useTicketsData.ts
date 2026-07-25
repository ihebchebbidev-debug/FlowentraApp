import { useCallback, useEffect, useMemo, useState } from 'react';
import { supportTicketsApi, SupportTicketResponse } from '@/services/api/supportTicketsApi';

export type TicketScope = 'user' | 'admin';

function getCurrentUserEmail(): string | undefined {
  try {
    const raw = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { email?: string };
    return parsed.email;
  } catch {
    return undefined;
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TicketKpis {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  criticalOpen: number;
  avgAgeDays: number;
  createdThisWeek: number;
  createdLastWeek: number;
  weekOverWeekDelta: number; // percent, e.g. 12.5 or -8.3
  unassigned: number;
  oldestOpenId: number | null;
}

export interface DistributionEntry {
  key: string;
  label: string;
  value: number;
}

export interface TrendPoint {
  date: string; // yyyy-mm-dd
  count: number;
}

export interface TicketSeries {
  byStatus: DistributionEntry[];
  byUrgency: DistributionEntry[];
  byCategory: DistributionEntry[];
  byModule: DistributionEntry[];
  trend30d: TrendPoint[];
}

interface UseTicketsDataOptions {
  scope: TicketScope;
  currentUserEmail?: string;
}

export function useTicketsData({ scope, currentUserEmail }: UseTicketsDataOptions) {
  const [list, setList] = useState<SupportTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const email = currentUserEmail ?? getCurrentUserEmail();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await supportTicketsApi.getAll();
      // Hide auto/system-generated tickets from the UI
      setList(data.filter((t) => (t.source || 'manual').toLowerCase() !== 'auto'));
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const onSyncDone = (ev: Event) => {
      const types = (ev as CustomEvent<{ entityTypes?: string[] }>).detail?.entityTypes;
      if (!types?.some((t) => t.startsWith('support_ticket'))) return;
      fetchAll();
    };
    window.addEventListener('offline:sync-completed', onSyncDone);
    return () => window.removeEventListener('offline:sync-completed', onSyncDone);
  }, [fetchAll]);

  const scoped = useMemo(() => {
    if (scope === 'admin') return list;
    if (!email) return [];
    const e = email.toLowerCase();
    return list.filter(t => (t.userEmail || '').toLowerCase() === e);
  }, [list, scope, email]);

  const kpis: TicketKpis = useMemo(() => {
    const now = Date.now();
    const startOfWeek = now - 7 * DAY_MS;
    const startOfPrevWeek = now - 14 * DAY_MS;

    const counts = { open: 0, inProgress: 0, resolved: 0, closed: 0 };
    let criticalOpen = 0;
    let ageSum = 0;
    let openCount = 0;
    let createdThisWeek = 0;
    let createdLastWeek = 0;
    let unassigned = 0;
    let oldestOpenTs = Infinity;
    let oldestOpenId: number | null = null;

    for (const t of scoped) {
      const s = (t.status || '').toLowerCase();
      if (s === 'open') counts.open++;
      else if (s === 'in_progress') counts.inProgress++;
      else if (s === 'resolved') counts.resolved++;
      else if (s === 'closed') counts.closed++;

      const isOpenish = s === 'open' || s === 'in_progress';
      if (isOpenish) {
        const created = new Date(t.createdAt).getTime();
        if (!Number.isNaN(created)) {
          ageSum += (now - created) / DAY_MS;
          openCount++;
          if (created < oldestOpenTs) {
            oldestOpenTs = created;
            oldestOpenId = t.id;
          }
        }
        if ((t.urgency || '').toLowerCase() === 'critical') criticalOpen++;
        if (!t.userEmail) unassigned++;
      }

      const createdTs = new Date(t.createdAt).getTime();
      if (!Number.isNaN(createdTs)) {
        if (createdTs >= startOfWeek) createdThisWeek++;
        else if (createdTs >= startOfPrevWeek) createdLastWeek++;
      }
    }

    const avgAgeDays = openCount > 0 ? ageSum / openCount : 0;
    const weekOverWeekDelta = createdLastWeek === 0
      ? (createdThisWeek > 0 ? 100 : 0)
      : ((createdThisWeek - createdLastWeek) / createdLastWeek) * 100;

    return {
      total: scoped.length,
      open: counts.open,
      inProgress: counts.inProgress,
      resolved: counts.resolved,
      closed: counts.closed,
      criticalOpen,
      avgAgeDays: Math.round(avgAgeDays * 10) / 10,
      createdThisWeek,
      createdLastWeek,
      weekOverWeekDelta: Math.round(weekOverWeekDelta * 10) / 10,
      unassigned,
      oldestOpenId,
    };
  }, [scoped]);

  const series: TicketSeries = useMemo(() => {
    const bump = (map: Map<string, number>, key?: string | null) => {
      if (!key) return;
      map.set(key, (map.get(key) ?? 0) + 1);
    };
    const status = new Map<string, number>();
    const urgency = new Map<string, number>();
    const category = new Map<string, number>();
    const modul = new Map<string, number>();

    for (const t of scoped) {
      bump(status, (t.status || 'open').toLowerCase());
      bump(urgency, (t.urgency || 'medium').toLowerCase());
      bump(category, t.category || 'uncategorized');
      bump(modul, t.module || 'other');
    }

    const toEntries = (m: Map<string, number>): DistributionEntry[] =>
      Array.from(m.entries())
        .map(([key, value]) => ({ key, label: key, value }))
        .sort((a, b) => b.value - a.value);

    // 30-day creation trend
    const trend: TrendPoint[] = [];
    const bucket = new Map<string, number>();
    for (const t of scoped) {
      const created = new Date(t.createdAt);
      if (Number.isNaN(created.getTime())) continue;
      const key = created.toISOString().slice(0, 10);
      bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 29);
    for (let i = 0; i < 30; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      trend.push({ date: key, count: bucket.get(key) ?? 0 });
    }

    return {
      byStatus: toEntries(status),
      byUrgency: toEntries(urgency),
      byCategory: toEntries(category).slice(0, 8),
      byModule: toEntries(modul).slice(0, 8),
      trend30d: trend,
    };
  }, [scoped]);

  const recent = useMemo(() => {
    return [...scoped]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [scoped]);

  return {
    list: scoped,
    allTickets: list,
    kpis,
    series,
    recent,
    loading,
    error,
    refresh: fetchAll,
    email,
  };
}
