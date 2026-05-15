import { lazy, type ComponentType } from 'react';

/**
 * Chunk error detection helper
 */
function isChunkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('error loading') ||
    msg.includes('importing a module script failed') ||
    error.name === 'ChunkLoadError'
  );
}

const RELOAD_FLAG_KEY = 'chunk-retry-reload';
// Lock-out window: if we reloaded less than this many ms ago, do not reload again.
// Outside the window, we treat the flag as expired so a brand-new chunk error
// after a successful reload can still trigger one more recovery reload.
const RELOAD_LOCKOUT_MS = 30_000;

function recentlyReloaded(): boolean {
  try {
    const raw = sessionStorage.getItem(RELOAD_FLAG_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) {
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
      return false;
    }
    if (Date.now() - ts > RELOAD_LOCKOUT_MS) {
      sessionStorage.removeItem(RELOAD_FLAG_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function hardReload(): Promise<never> {
  try {
    sessionStorage.setItem(RELOAD_FLAG_KEY, String(Date.now()));
  } catch {
    /* ignore quota / privacy errors */
  }

  // Best-effort: nuke caches + service worker so the reload picks up new chunk URLs.
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {
    /* ignore */
  }
  try {
    if (navigator.serviceWorker?.getRegistrations) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    /* ignore */
  }

  window.location.reload();
  // Never-resolving promise so React keeps the Suspense boundary mounted during reload.
  return new Promise<never>(() => {});
}

async function loadWithRetry<T>(factory: () => Promise<T>): Promise<T> {
  try {
    const mod = await factory();
    // Successful load — clear any stale reload flag.
    try { sessionStorage.removeItem(RELOAD_FLAG_KEY); } catch { /* ignore */ }
    return mod;
  } catch (err) {
    if (!isChunkError(err)) throw err;

    // Retry once (Vite often serves the new chunk on the second attempt).
    try {
      const mod = await factory();
      try { sessionStorage.removeItem(RELOAD_FLAG_KEY); } catch { /* ignore */ }
      return mod;
    } catch (retryErr) {
      if (!isChunkError(retryErr)) throw retryErr;

      if (recentlyReloaded()) {
        // We just reloaded and STILL can't load this chunk — surface the error
        // so the user sees an error boundary instead of an infinite reload loop.
        throw retryErr;
      }

      return hardReload() as unknown as T;
    }
  }
}

/**
 * React.lazy wrapper with retry + cache-bust on chunk load failure.
 * Prevents infinite reload loops via a timestamped sessionStorage flag.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() => loadWithRetry(factory));
}

/**
 * Variant for named exports (used by blockRegistry pattern).
 * Wraps a loader that returns a module with named exports.
 */
export function lazyBlockWithRetry(
  loader: () => Promise<Record<string, ComponentType<any>>>,
  exportName: string
): React.LazyExoticComponent<ComponentType<any>> {
  const factory = () =>
    loader().then((mod) => ({ default: mod[exportName] as ComponentType<any> }));

  return lazy(() => loadWithRetry(factory));
}
