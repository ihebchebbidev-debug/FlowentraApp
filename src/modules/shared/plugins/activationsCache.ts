/**
 * LocalStorage cache for the last successful /api/plugins response.
 *
 * Plugin activations are PER TENANT — deactivating a module for
 * demo.flowentra.app must not affect krossier.flowentra.app — so the cache
 * is keyed by the current tenant slug. A stale snapshot from another tenant
 * must never be used as the offline fallback.
 *
 * Used as a fallback so that when the backend is briefly unreachable,
 * the UI keeps respecting the last known plugin activations instead of
 * silently defaulting every plugin to "enabled".
 */
import { getCurrentTenant } from '@/utils/tenant';
import type { PluginActivation } from './types';

const KEY_PREFIX = 'plugins:activations:';
/** Legacy global key (pre tenant-scoping) — purged on read. */
const LEGACY_GLOBAL_KEY = 'plugins:activations:global';

function cacheKey(): string {
  const tenant = getCurrentTenant();
  return `${KEY_PREFIX}${tenant || 'default'}`;
}
/** Entries older than this are considered stale and ignored. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  savedAt: number;
  activations: PluginActivation[];
}

function purgeLegacyGlobalKey(): void {
  try {
    localStorage.removeItem(LEGACY_GLOBAL_KEY);
  } catch {
    /* non-fatal */
  }
}

export function readCachedActivations(): PluginActivation[] | undefined {
  try {
    purgeLegacyGlobalKey();
    const raw = localStorage.getItem(cacheKey());
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
    localStorage.setItem(cacheKey(), JSON.stringify(entry));
  } catch {
    /* quota / disabled storage — non-fatal */
  }
}

export function clearCachedActivations(): void {
  try {
    localStorage.removeItem(cacheKey());
    purgeLegacyGlobalKey();
  } catch {
    /* non-fatal */
  }
}
