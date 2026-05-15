/**
 * CompanyFilter — Lightweight dropdown for narrowing a list by tenantId.
 *
 * Usage in any list page:
 *   const [companyId, setCompanyId] = useState<number | 'all'>('all');
 *   <CompanyFilter value={companyId} onChange={setCompanyId} />
 *   const filtered = filterByCompany(rows, companyId);
 *
 * - Renders nothing unless the user is in view-all mode (so it's free to keep
 *   in every list — it disappears when the user pins to a single company via
 *   the TenantSwitcher).
 * - Pulls the company list from TenantMapContext (already populated for
 *   MainAdmins on app boot), so no extra network call.
 */
import { Building2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenantMap } from '@/contexts/TenantMapContext';
import { isViewAllMode } from '@/utils/tenant';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// ─── Per-module filter store ────────────────────────────────────────────────
// Each "module" (derived from the first path segment, e.g. /sales, /contacts)
// gets its own remembered Company filter. Persisted in localStorage so the
// selection survives reloads and navigations away & back.

const STORAGE_PREFIX = 'companyFilter:';
const DEFAULT_KEY = 'default';

const _values = new Map<string, CompanyFilterValue>();
const _listenersByKey = new Map<string, Set<(v: CompanyFilterValue) => void>>();

function readPersisted(key: string): CompanyFilterValue {
  if (typeof window === 'undefined') return 'all';
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw || raw === 'all') return 'all';
    const n = Number(raw);
    return Number.isFinite(n) ? n : 'all';
  } catch {
    return 'all';
  }
}

function writePersisted(key: string, value: CompanyFilterValue): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + key,
      value === 'all' ? 'all' : String(value),
    );
  } catch {
    /* ignore quota / privacy mode */
  }
}

function getValue(key: string): CompanyFilterValue {
  if (!_values.has(key)) _values.set(key, readPersisted(key));
  return _values.get(key)!;
}

export function getGlobalCompanyFilter(key: string = DEFAULT_KEY): CompanyFilterValue {
  return getValue(key);
}

export function setGlobalCompanyFilter(
  value: CompanyFilterValue,
  key: string = DEFAULT_KEY,
): void {
  _values.set(key, value);
  writePersisted(key, value);
  _listenersByKey.get(key)?.forEach((cb) => cb(value));
  // Notify create-action guards across the app that selection changed
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('flowentra:target-tenant-changed'));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Derive a stable per-module key from the current pathname.
 * `/sales/123/edit` → `sales`. Falls back to "default" at the root.
 */
function useModuleKey(): string {
  const { pathname } = useLocation();
  const seg = pathname.split('/').filter(Boolean)[0];
  return seg || DEFAULT_KEY;
}

/**
 * React hook — subscribe to the company filter for the current module.
 * Re-renders whenever the user changes the company in the top-nav dropdown
 * (or when navigating to a module with a different remembered selection).
 */
export function useGlobalCompanyFilter(keyOverride?: string): CompanyFilterValue {
  const moduleKey = useModuleKey();
  const key = keyOverride ?? moduleKey;
  const [value, setValue] = useState<CompanyFilterValue>(() => getValue(key));

  useEffect(() => {
    setValue(getValue(key));
    let set = _listenersByKey.get(key);
    if (!set) {
      set = new Set();
      _listenersByKey.set(key, set);
    }
    set.add(setValue);
    return () => {
      set!.delete(setValue);
    };
  }, [key]);

  return value;
}

export type CompanyFilterValue = number | 'all';

interface CompanyFilterProps {
  value: CompanyFilterValue;
  onChange: (value: CompanyFilterValue) => void;
  className?: string;
  /** Compact triggers fit nicely next to other filter controls */
  size?: 'sm' | 'md';
}

export function CompanyFilter({
  value,
  onChange,
  className,
  size = 'sm',
}: CompanyFilterProps) {
  const { tenants } = useTenantMap();

  // Hide entirely outside view-all mode or when there's nothing to choose from.
  if (!isViewAllMode() || tenants.length <= 1) return null;

  return (
    <Select
      value={value === 'all' ? 'all' : String(value)}
      onValueChange={(v) => onChange(v === 'all' ? 'all' : Number(v))}
    >
      <SelectTrigger
        className={cn(
          'gap-2',
          size === 'sm' ? 'h-9 w-[180px]' : 'h-10 w-[220px]',
          className,
        )}
      >
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <SelectValue placeholder="All companies" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All companies</SelectItem>
        {tenants.map((t) => (
          <SelectItem key={t.id} value={String(t.id)}>
            {t.companyName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * GlobalCompanyFilter — same dropdown as <CompanyFilter> but bound to the
 * shared store. Drop this in the top nav once and every list reacts to it.
 */
export function GlobalCompanyFilter(props: Omit<CompanyFilterProps, 'value' | 'onChange'>) {
  const moduleKey = useModuleKey();
  const value = useGlobalCompanyFilter(moduleKey);
  return (
    <CompanyFilter
      {...props}
      value={value}
      onChange={(v) => setGlobalCompanyFilter(v, moduleKey)}
    />
  );
}

/**
 * Apply a CompanyFilter selection to any array of rows that expose `tenantId`.
 * Returns the input array unchanged when the filter is `'all'` or when the
 * user is not in view-all mode (defensive — saves callers an `if` check).
 */
/**
 * Generic over T so callers' element types (e.g. ServiceOrder) aren't
 * narrowed to `{ tenantId?: number }` by TS. Reads tenantId via a defensive
 * `any` cast — the backend stamps every tenant entity with TenantId, but
 * not every TS interface in this codebase has caught up to declaring it.
 */
export function filterByCompany<T>(rows: T[], value: CompanyFilterValue): T[] {
  if (value === 'all' || !isViewAllMode()) return rows;
  return rows.filter((r) => Number((r as any)?.tenantId) === value);
}

/**
 * Hook flavor — subscribes to the global filter AND returns the filtered
 * array in one call. Use it in lists like:
 *
 *   const visibleRows = useFilteredByCompany(rows);
 *
 * Filtering is a no-op when the user is not in view-all mode, so it's safe
 * to leave in every list permanently.
 */
import { useMemo } from 'react';
export function useFilteredByCompany<T>(rows: T[], keyOverride?: string): T[] {
  const value = useGlobalCompanyFilter(keyOverride);
  return useMemo(() => filterByCompany(rows, value), [rows, value]);
}