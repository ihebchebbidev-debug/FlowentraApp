import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to persist form data in sessionStorage across navigations (e.g., to lookup pages).
 * Data is automatically restored when the user navigates back, and cleared on successful submit.
 * 
 * @param key - Unique storage key for the form
 * @param initialState - Default form state
 * @returns [state, setState, clearPersistedState]
 */
export function useFormPersistence<T>(
  key: string,
  initialState: T
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const storageKey = `form_persist_${key}`;
  const isInitialMount = useRef(true);

  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...initialState, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return initialState;
  });

  // Persist to sessionStorage on every state change (skip initial mount to avoid overwriting)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state, storageKey]);

  const clearPersistedState = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  return [state, setState, clearPersistedState];
}
