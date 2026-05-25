/**
 * Shared initial-view-mode resolver used by every module list page.
 *
 * Mobile (viewport < 768px) ALWAYS gets 'list' — tables are unusable on
 * narrow screens. On desktop/tablet we honor the saved user preference
 * (`dataView`) when it matches one of the allowed modes, falling back to
 * the page's default otherwise.
 */
export type AnyViewMode = 'list' | 'table' | 'grid' | 'kanban';

const MOBILE_BREAKPOINT = 768;

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function getInitialViewMode<T extends AnyViewMode>(
  allowed: readonly T[],
  fallback: T,
): T {
  // Mobile override — always prefer the list view when supported.
  if (isMobileViewport() && (allowed as readonly string[]).includes('list')) {
    return 'list' as T;
  }

  try {
    const raw = typeof localStorage !== 'undefined'
      ? localStorage.getItem('user-preferences')
      : null;
    if (raw) {
      const prefs = JSON.parse(raw);
      const v = prefs?.dataView as AnyViewMode | undefined;
      if (v && (allowed as readonly string[]).includes(v)) {
        return v as T;
      }
      // Map unsupported preferences to a sensible neighbour.
      if (v === 'grid' && (allowed as readonly string[]).includes('table')) {
        return 'table' as T;
      }
    }
  } catch {
    /* ignore */
  }

  return fallback;
}