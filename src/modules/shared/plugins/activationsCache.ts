/**
 * LocalStorage cache for the last successful /api/plugins response.
 *
 * Plugin activations are GLOBAL across all tenants — every company
 * (krossier.flowentra.app, dev.flowentra.app, demo.flowentra.app, …)
 * shares the exact same set of enabled modules. So a single shared cache
 * key is used regardless of the currently selected tenant.
 *
 * Used as a fallback so that when the backend is briefly unreachable,
 * the UI keeps respecting the last known plugin activations instead of
 * silently defaulting every plugin to "enabled".
 */
import type { PluginActivation } from './types';

const CACHE_KEY = 'plugins:activations:global';
/** Legacy per-tenant keys we clean up on read so old data doesn't linger. */
const LEGACY_KEY_PREFIX = 'plugins:activations:';
/** Entries older than this are considered stale and ignored. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  savedAt: number;
  activations: PluginActivation[];
}

function purgeLegacyTenantKeys(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(LEGACY_KEY_PREFIX) && k !== CACHE_KEY) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* non-fatal */
  }
}

export function readCachedActivations(): PluginActivation[] | undefined {
  try {
    purgeLegacyTenantKeys();
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry || !Array.isArray(entry.activations)) return undefined;
    if (typeof entry.savedAt !== 'number') return undefined;
    if (Date.now() - entry.savedAt > MAX_AGE_MS) return undefined;
    return entry.activations;
  } catch {
    return undefined;
  }
}

export function writeCachedActivations(activations: PluginActivation[]): void {
  try {
    const entry: CacheEntry = { savedAt: Date.now(), activations };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* quota / disabled storage — non-fatal */
  }
}

export function clearCachedActivations(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    purgeLegacyTenantKeys();
  } catch {
    /* non-fatal */
  }
}
