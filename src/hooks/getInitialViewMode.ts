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
  const allowedStr = allowed as readonly string[];

  // Mobile override — always prefer the list view when supported.
  if (isMobileViewport()) {
    if (allowedStr.includes('list')) return 'list' as T;
    return fallback;
  }

  // Desktop override — always prefer the table view when supported,
  // so every module list opens in its dense tabular view by default.
  if (allowedStr.includes('table')) return 'table' as T;
  if (allowedStr.includes('grid')) return 'grid' as T;

  // Fallback to saved user preference if no table/grid is available.
  try {
    const raw = typeof localStorage !== 'undefined'
      ? localStorage.getItem('user-preferences')
      : null;
    if (raw) {
      const prefs = JSON.parse(raw);
      const v = prefs?.dataView as AnyViewMode | undefined;
      if (v && allowedStr.includes(v)) {
        return v as T;
      }
    }
  } catch {
    /* ignore */
  }

  return fallback;
}