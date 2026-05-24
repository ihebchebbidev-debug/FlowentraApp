/**
 * Module Data Scope — defines whether each module's data is shared
 * across all companies (tenants) or isolated per company.
 *
 * Stored client-side in localStorage. Admin-configurable from the
 * Companies tab in Settings via the "Module Data Scope" dialog.
 *
 * - 'shared'   → one dataset visible to every company
 * - 'isolated' → each company has its own private dataset (default)
 */

export type ModuleScope = 'shared' | 'isolated';

const STORAGE_KEY = 'module:scope:v1';
const EVENT = 'module-scope:changed';

export const DEFAULT_MODULE_SCOPE: ModuleScope = 'isolated';

type ScopeMap = Record<string, ModuleScope>;

function read(): ScopeMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function write(map: ScopeMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export function getModuleScopeMap(): ScopeMap {
  return read();
}

export function getModuleScope(code: string): ModuleScope {
  return read()[code] ?? DEFAULT_MODULE_SCOPE;
}

export function setModuleScope(code: string, scope: ModuleScope) {
  const map = read();
  map[code] = scope;
  write(map);
}

export function setModuleScopeMap(next: ScopeMap) {
  write(next);
}

export function subscribeModuleScope(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
