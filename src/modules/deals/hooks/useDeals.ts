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
      const [list, statsData] = await Promise.all([
        dealsApi.getAll({ limit: 200, ...params }),
        dealsApi.getStats(),
      ]);
      setDeals(list.deals);
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
    // optimistic
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d));
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
