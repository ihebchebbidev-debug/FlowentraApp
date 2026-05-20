/**
 * useModuleScope — Per-module data-scope (shared vs per_company).
 *
 * Backend source of truth: GET/PUT /api/module-scope. The first load hydrates
 * from the API; subsequent reads come from an in-memory cache that we also
 * mirror to localStorage so the UI is instant on reload and degrades cleanly
 * if the backend hasn't been migrated yet.
 *
 * Server enforcement (Backend/Data/ApplicationDbContext.cs):
 *   shared      → query filter forces TenantId = 0 + insert stamps TenantId = 0
 *   per_company → query filter uses current TenantId (default)
 */
import { useCallback, useEffect, useState } from 'react';
import { API_URL } from '@/config/api';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';

export type ModuleScope = 'shared' | 'per_company';

export type ModuleKey =
  | 'contacts'
  | 'articles'
  | 'offers'
  | 'sales'
  | 'purchases'
  | 'hr'
  | 'projects'
  | 'service_orders'
  | 'calendar'
  | 'documents'
  | 'lookups'
  | 'notifications';

const CACHE_KEY = 'module-scope-cache-v2';
const EVENT = 'module-scope-changed';

const DEFAULT: ModuleScope = 'per_company';

type ScopeMap = Record<string, ModuleScope>;

function readCache(): ScopeMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(map: ScopeMap) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(EVENT));
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json', ...extra };
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (token) h.Authorization = `Bearer ${token}`;
  const tenant = getCurrentTenant();
  if (tenant) h[TENANT_HEADER] = tenant;
  return h;
}

let hydrated = false;
let inflight: Promise<void> | null = null;

async function hydrateOnce(): Promise<void> {
  if (hydrated) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/module-scope`, { headers: authHeaders() });
      if (!res.ok) throw new Error(String(res.status));
      const rows: { moduleKey: string; scope: ModuleScope }[] = await res.json();
      const map: ScopeMap = {};
      rows.forEach(r => { map[r.moduleKey] = r.scope; });
      writeCache(map);
      hydrated = true;
    } catch {
      // Backend not migrated yet → keep whatever is cached, no error noise.
      hydrated = true;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Synchronous read (uses cache; triggers a background hydrate on first call). */
export function getModuleScope(key: ModuleKey): ModuleScope {
  if (!hydrated) void hydrateOnce();
  return readCache()[key] ?? DEFAULT;
}

export function isModuleShared(key: ModuleKey): boolean {
  return getModuleScope(key) === 'shared';
}

/**
 * Update the scope for a module. Persists to backend, then to local cache.
 * Throws if the API call fails (so callers can show a toast).
 */
export async function setModuleScope(key: ModuleKey, scope: ModuleScope): Promise<void> {
  const res = await fetch(`${API_URL}/api/module-scope/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ scope }),
  });
  if (!res.ok) throw new Error(`setModuleScope ${key} → ${res.status}`);
  const map = readCache();
  map[key] = scope;
  writeCache(map);
}

/** React hook — scope + setter for a single module, live across tabs. */
export function useModuleScope(key: ModuleKey) {
  const [scope, setScopeState] = useState<ModuleScope>(() => getModuleScope(key));
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    void hydrateOnce().then(() => setScopeState(getModuleScope(key)));
    const sync = () => setScopeState(getModuleScope(key));
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [key]);

  const update = useCallback(async (next: ModuleScope) => {
    setUpdating(true);
    try {
      await setModuleScope(key, next);
      setScopeState(next);
    } finally {
      setUpdating(false);
    }
  }, [key]);

  return { scope, isShared: scope === 'shared', setScope: update, updating };
}

export function useIsModuleShared(key: ModuleKey): boolean {
  return useModuleScope(key).isShared;
}

/** Query-key segment that flips when the module is shared vs per-company. */
export function buildModuleScopeKey(
  key: ModuleKey,
  ctx: { slug: string | null; companyId?: number },
) {
  return isModuleShared(key)
    ? { module: key, slug: ctx.slug, shared: true as const }
    : { module: key, slug: ctx.slug, companyId: ctx.companyId };
}
