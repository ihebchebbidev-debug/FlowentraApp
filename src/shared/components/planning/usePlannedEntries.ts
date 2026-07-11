import { useCallback, useEffect, useState } from 'react';
import {
  plannedEntriesApi,
  type PlannedLineEntry,
  type PlannedParentType,
} from '@/services/plannedEntriesService';

/**
 * Fetches planned line entries for many parents (typically service_order_job ids)
 * and returns a flat, deduplicated list along with a reload function.
 *
 * Used by the inline "Planned rows" sections on the Service Order / Dispatch
 * time / expenses / materials tabs.
 */
export function usePlannedEntries(
  parentType: PlannedParentType,
  parentIds: Array<number | string | null | undefined>
) {
  const [entries, setEntries] = useState<PlannedLineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const ids = parentIds
    .map((v) => (v == null ? NaN : Number(v)))
    .filter((n) => Number.isFinite(n) && n > 0) as number[];
  const key = ids.slice().sort((a, b) => a - b).join(',');

  const reload = useCallback(async () => {
    if (ids.length === 0) {
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const lists = await Promise.all(
        ids.map((id) => plannedEntriesApi.list(parentType, id).catch(() => []))
      );
      const flat: PlannedLineEntry[] = ([] as PlannedLineEntry[]).concat(...lists);
      // Dedup by id (parent lists shouldn't overlap, but be defensive)
      const seen = new Set<number>();
      const deduped: PlannedLineEntry[] = [];
      for (const e of flat) {
        if (!seen.has(e.id)) {
          seen.add(e.id);
          deduped.push(e);
        }
      }
      setEntries(deduped);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentType, key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { entries, loading, reload };
}