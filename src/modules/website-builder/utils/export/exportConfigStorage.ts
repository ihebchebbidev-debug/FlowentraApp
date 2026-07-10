/**
 * Persist per-site export settings (Domain / platform / image options) so the
 * Export Options dialog restores what the user last chose. Backend-agnostic:
 * lives in localStorage keyed by siteId. Safe on SSR (guards `window`).
 */
import type { SiteConfig } from './domainConfig';
import type { HostingPlatform } from './hostingPresets';

export interface PersistedExportConfig {
  platform?: HostingPlatform;
  site?: SiteConfig;
  imageOptimization?: {
    enabled?: boolean;
    convertToWebP?: boolean;
    quality?: number; // 0..1
    maxWidth?: number;
  };
  /** ISO timestamp of the last save — useful for future "last exported" hints. */
  savedAt?: string;
}

const KEY_PREFIX = 'wb:export-config:';
const VERSION = 1;

function keyFor(siteId: string) {
  return `${KEY_PREFIX}${siteId}`;
}

export function loadExportConfig(siteId?: string): PersistedExportConfig | null {
  if (!siteId || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(siteId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.__v !== VERSION) return null;
    const { __v, ...rest } = parsed;
    return rest as PersistedExportConfig;
  } catch {
    return null;
  }
}

export function saveExportConfig(siteId: string | undefined, config: PersistedExportConfig): void {
  if (!siteId || typeof window === 'undefined') return;
  try {
    const payload = { __v: VERSION, ...config, savedAt: new Date().toISOString() };
    window.localStorage.setItem(keyFor(siteId), JSON.stringify(payload));
  } catch {
    /* quota exceeded or storage disabled — silently ignore, non-critical */
  }
}

export function clearExportConfig(siteId?: string): void {
  if (!siteId || typeof window === 'undefined') return;
  try { window.localStorage.removeItem(keyFor(siteId)); } catch { /* noop */ }
}