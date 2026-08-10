import { useCallback, useMemo, useRef, useState } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export type SortAccessors<T> = Record<string, (row: T) => unknown>;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const ISO_DATE = /^\d{4}-\d{2}-\d{2}([T ]|$)/;

function normalize(value: unknown): { kind: 'empty' | 'number' | 'date' | 'string'; value: any } {
  if (value === null || value === undefined || value === '') return { kind: 'empty', value: null };
  if (typeof value === 'number') return Number.isNaN(value) ? { kind: 'empty', value: null } : { kind: 'number', value };
  if (typeof value === 'boolean') return { kind: 'number', value: value ? 1 : 0 };
  if (value instanceof Date) return { kind: 'date', value: value.getTime() };
  const str = String(value).trim();
  if (str === '' || str === '-') return { kind: 'empty', value: null };
  if (ISO_DATE.test(str)) {
    const time = new Date(str).getTime();
    if (!Number.isNaN(time)) return { kind: 'date', value: time };
  }
  const numeric = Number(str.replace(/\s/g, '').replace(/,/g, '.'));
  if (str !== '' && !Number.isNaN(numeric) && /^[-+]?[\d.,\s]+$/.test(str)) {
    return { kind: 'number', value: numeric };
  }
  return { kind: 'string', value: str };
}

/** Compare two raw values: numbers numerically, dates chronologically, text alphabetically. */
export function compareValues(a: unknown, b: unknown): number {
  const na = normalize(a);
  const nb = normalize(b);
  // Empty values always sort last, regardless of direction
  if (na.kind === 'empty' && nb.kind === 'empty') return 0;
  if (na.kind === 'empty') return 1;
  if (nb.kind === 'empty') return -1;
  if (na.kind === 'string' || nb.kind === 'string') {
    return collator.compare(String(na.value), String(nb.value));
  }
  return na.value === nb.value ? 0 : na.value < nb.value ? -1 : 1;
}

/**
 * Client-side, tri-state column sorting (asc -> desc -> none).
 * Pass accessors that return the RAW value for each column key
 * (never the formatted/rendered string).
 */
export function useTableSort<T>(
  accessors: SortAccessors<T>,
  initial?: { key: string; direction: Exclude<SortDirection, null> }
) {
  const [sort, setSort] = useState<{ key: string | null; direction: SortDirection }>({
    key: initial?.key ?? null,
    direction: initial?.direction ?? null,
  });
  const { key: sortKey, direction: sortDirection } = sort;
  const setSortKey = useCallback((key: string | null) => setSort((p) => ({ ...p, key })), []);
  const setSortDirection = useCallback(
    (direction: SortDirection) => setSort((p) => ({ ...p, direction })),
    []
  );

  const accessorsRef = useRef(accessors);
  accessorsRef.current = accessors;

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      const next: SortDirection = prev.direction === 'asc' ? 'desc' : prev.direction === 'desc' ? null : 'asc';
      return { key: next === null ? null : key, direction: next };
    });
  }, []);

  const clearSort = useCallback(() => setSort({ key: null, direction: null }), []);

  const sortItems = useCallback(
    <I extends T>(items: I[]): I[] => {
      if (!sortKey || !sortDirection) return items;
      const accessor = accessorsRef.current[sortKey];
      if (!accessor) return items;
      const factor = sortDirection === 'asc' ? 1 : -1;
      return [...items].sort((a, b) => {
        const result = compareValues(accessor(a), accessor(b));
        // Keep empties last in both directions
        if (result === 1 || result === -1) {
          const emptyA = normalize(accessor(a)).kind === 'empty';
          const emptyB = normalize(accessor(b)).kind === 'empty';
          if (emptyA !== emptyB) return result;
        }
        return result * factor;
      });
    },
    [sortKey, sortDirection]
  );

  return useMemo(
    () => ({ sortKey, sortDirection, toggleSort, clearSort, sortItems, setSortKey, setSortDirection }),
    [sortKey, sortDirection, toggleSort, clearSort, sortItems]
  );
}
