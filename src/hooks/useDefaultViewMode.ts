import { useState, useEffect } from 'react';
import { usePreferences } from './usePreferences';

type ViewMode = 'list' | 'table' | 'grid';

/**
 * Hook that provides view mode state initialized from user preferences
 * Falls back to the provided default if no preference is set
 */
export function useDefaultViewMode(fallbackDefault: ViewMode = 'table') {
  const { preferences } = usePreferences();
  
  // Determine initial value from preferences or fallback
  const getInitialViewMode = (): ViewMode => {
    // Try localStorage preferences first
    try {
      const localPrefs = localStorage.getItem('user-preferences');
      if (localPrefs) {
        const prefs = JSON.parse(localPrefs);
        if (prefs.dataView) {
          return prefs.dataView as ViewMode;
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
    
    // Check context preferences
    if (preferences?.dataView) {
      return preferences.dataView as ViewMode;
    }
    
    return fallbackDefault;
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [initialized, setInitialized] = useState(false);

  // Update view mode when preferences load (only once)
  useEffect(() => {
    if (!initialized && preferences?.dataView) {
      setViewMode(preferences.dataView as ViewMode);
      setInitialized(true);
    }
  }, [preferences?.dataView, initialized]);

  return [viewMode, setViewMode] as const;
}
