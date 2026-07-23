/**
 * Shared initial-view-mode resolver used by every module list page.
 *
 * Mobile (viewport < MOBILE_BREAKPOINT) ALWAYS gets 'list' — tables are unusable
 * on narrow screens. On desktop we honor the saved user preference (`dataView`)
 * when it matches one of the allowed modes, falling back to the page's default
 * otherwise.
 */
import * as React from 'react';
import { useEffect, useState } from 'react';

export type AnyViewMode = 'list' | 'table' | 'grid' | 'kanban';

// Single source of truth for the "mobile" viewport across the app.
// Anything under this width collapses to the mobile layout AND forces the
// list view (table/grid/kanban are hidden).
export const MOBILE_BREAKPOINT = 1024;

// Screens below this width are forced to the "list" view — tables, grids,
// kanban and map views are hidden. Covers phones AND tablets (including
// landscape iPads up to ~1280px), which is what customers use in the field.
export const LIST_ONLY_BREAKPOINT = 1280;

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < LIST_ONLY_BREAKPOINT;
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

/**
 * Reactive hook: whenever the viewport becomes mobile, snap the view mode
 * back to 'list'. Prevents cramped table/grid/kanban states while resizing
 * from desktop down to phone/tablet widths.
 */
export function useEnforceListOnMobile<T extends AnyViewMode>(
  viewMode: T,
  setViewMode: React.Dispatch<React.SetStateAction<T>> | ((m: T) => void),
  allowed: readonly T[],
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${LIST_ONLY_BREAKPOINT - 1}px)`);
    const allowedStr = allowed as readonly string[];
    const enforce = () => {
      if (mql.matches && viewMode !== 'list' && allowedStr.includes('list')) {
        (setViewMode as (m: T) => void)('list' as T);
      }
    };
    enforce();
    mql.addEventListener('change', enforce);
    return () => mql.removeEventListener('change', enforce);
  }, [viewMode, setViewMode, allowed]);
}

/**
 * Reactive boolean: true when the viewport is under the mobile breakpoint.
 * Use this to hide table/grid/kanban toggle buttons in list toolbars.
 */

export function useIsListForcedMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => isMobileViewport());
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${LIST_ONLY_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}
