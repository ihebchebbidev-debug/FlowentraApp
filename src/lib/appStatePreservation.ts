/**
 * State preservation during page reloads
 * Preserves scroll position, current page, and form drafts
 */

const STATE_KEY = 'app-state-before-reload';

export interface SavedAppState {
  url: string;
  scrollX: number;
  scrollY: number;
  timestamp: number;
  formDrafts?: Record<string, any>;
}

/**
 * Save current app state before reload
 */
export function saveAppState() {
  const state: SavedAppState = {
    url: window.location.pathname + window.location.search,
    scrollX: window.scrollX || 0,
    scrollY: window.scrollY || 0,
    timestamp: Date.now(),
  };

  // Get any form drafts from sessionStorage
  const drafts: Record<string, any> = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key?.startsWith('form-draft-')) {
      drafts[key] = sessionStorage.getItem(key);
    }
  }
  state.formDrafts = drafts;

  sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/**
 * Restore app state after reload
 */
export function restoreAppState(): SavedAppState | null {
  try {
    const saved = sessionStorage.getItem(STATE_KEY);
    if (!saved) return null;

    const state = JSON.parse(saved) as SavedAppState;
    sessionStorage.removeItem(STATE_KEY);

    // Only restore if reload happened within 10 seconds
    if (Date.now() - state.timestamp > 10000) {
      return null;
    }

    return state;
  } catch (error) {
    console.error('Failed to restore app state:', error);
    return null;
  }
}

/**
 * Apply restored state to current page
 */
export function applyRestoredState(state: SavedAppState) {
  // Restore scroll position
  if (state.scrollX || state.scrollY) {
    setTimeout(() => {
      window.scrollTo(state.scrollX, state.scrollY);
    }, 100);
  }

  // Restore form drafts
  if (state.formDrafts) {
    Object.entries(state.formDrafts).forEach(([key, value]) => {
      if (value) {
        sessionStorage.setItem(key, value as string);
      }
    });
  }
}

/**
 * Hook to handle state restoration on mount
 */
export function useRestoreAppState() {
  const handleRestore = () => {
    const state = restoreAppState();
    if (state) {
      applyRestoredState(state);
    }
  };

  // Run on component mount
  return { handleRestore };
}
