import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { dealsApi, type Deal, type DealStats, type DealSearchParams } from '@/services/api/dealsApi';

const EMPTY_STATS: DealStats = {
  totalDeals: 0, openDeals: 0, wonDeals: 0, lostDeals: 0,
  totalValue: 0, openValue: 0, wonValue: 0, averageValue: 0, winRate: 0,
};

/** Loads deals + stats and exposes mutation helpers. Mirrors the offers hook pattern. */
export function useDeals(params?: DealSearchParams) {
  const { t } = useTranslation('deals');
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      // The list filters/searches client-side, so it needs the whole (tenant-scoped)
      // set — not just the first server page, otherwise the cards' stats and the
      // rows below them disagree as soon as there are more than `PAGE_SIZE` deals.
      const PAGE_SIZE = 200;
      const MAX_PAGES = 25; // hard stop: 5000 deals
      const [first, statsData] = await Promise.all([
        dealsApi.getAll({ limit: PAGE_SIZE, page: 1, ...params }),
        dealsApi.getStats(),
      ]);
      const all = [...first.deals];
      const totalPages = Math.min(first.pagination?.totalPages ?? 1, MAX_PAGES);
      if (!params?.page && totalPages > 1) {
        const rest = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) =>
            dealsApi.getAll({ limit: PAGE_SIZE, ...params, page: i + 2 }),
          ),
        );
        rest.forEach(r => all.push(...r.deals));
      }
      // De-duplicate defensively: rows can shift between page requests.
      const seen = new Set<number>();
      setDeals(all.filter(d => (seen.has(d.id) ? false : (seen.add(d.id), true))));
      setStats(statsData);
    } catch (e) {
      toast.error(t('toast.loadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);


  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const deleteDeal = useCallback(async (id: number) => {
    try {
      await dealsApi.delete(id);
      toast.success(t('toast.deleted'));
      fetchDeals();
    } catch {
      toast.error(t('toast.deleteError'));
    }
  }, [fetchDeals, t]);

  const updateStage = useCallback(async (id: number, stage: Deal['stage']) => {
    // Dropping a card back onto its own column is a no-op: firing the PATCH anyway
    // logged a bogus stage-change activity and re-triggered stage workflows.
    let changed = true;
    setDeals(prev => {
      const current = prev.find(d => d.id === id);
      if (current && current.stage === stage) { changed = false; return prev; }
      return prev.map(d => d.id === id ? { ...d, stage } : d); // optimistic
    });
    if (!changed) return;
    try {
      await dealsApi.update(id, { stage });
      fetchDeals();
    } catch {
      toast.error(t('toast.saveError'));
      fetchDeals();
    }
  }, [fetchDeals, t]);


  return { deals, stats, loading, refetch: fetchDeals, deleteDeal, updateStage };
}
