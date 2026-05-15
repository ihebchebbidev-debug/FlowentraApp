import { useState, useEffect, createContext, useContext } from 'react';
import { preferencesService, UserPreferences, CreatePreferencesRequest, UpdatePreferencesRequest } from '@/services/preferencesService';
import { useTheme } from './useTheme';

interface PreferencesContextType {
  preferences: Partial<UserPreferences> | null;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  savePreferences: (prefs: CreatePreferencesRequest) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  applyColorTheme: (color: string) => void;
}

export const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function usePreferences(): PreferencesContextType {
  const context = useContext(PreferencesContext);
  
  // Provide a fallback for edge cases (HMR, error recovery, etc.)
  if (context === undefined) {
    console.warn('[usePreferences] Context not available, using fallback');
    // Return a safe fallback that won't crash the app
    const fallbackPrefs = (() => {
      try {
        const localPrefs = localStorage.getItem('user-preferences');
        return localPrefs ? JSON.parse(localPrefs) : null;
      } catch {
        return null;
      }
    })();
    
    return {
      preferences: fallbackPrefs,
      loading: false,
      updatePreferences: async () => { console.warn('Preferences context not available'); },
      savePreferences: async () => { console.warn('Preferences context not available'); },
      refreshPreferences: async () => { console.warn('Preferences context not available'); },
      applyColorTheme: () => { console.warn('Preferences context not available'); }
    };
  }
  
  return context;
}

// Hook for managing preferences logic
// IMPORTANT: All users inherit MainAdminUser's preferences (userId=1)
// Only MainAdminUser can edit preferences, which apply globally
export function usePreferencesManager() {
  const [preferences, setPreferences] = useState<Partial<UserPreferences> | null>(() => {
    // Priority 1: Try to get from user_data.preferences (MainAdminUsers.PreferencesJson)
    // This works for MainAdminUser directly
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // If this is MainAdminUser (id=1), use their preferences directly
        if (user.id === 1 && user.preferences) {
          const prefs = typeof user.preferences === 'string'
            ? JSON.parse(user.preferences)
            : user.preferences;
          localStorage.setItem('user-preferences', JSON.stringify(prefs));
          return prefs;
        }
      } catch (error) {
        console.error('Error parsing user preferences from user_data:', error);
      }
    }
    
    // Priority 2: Try localStorage user-preferences (could be cached admin prefs)
    const localPrefs = preferencesService.getLocalPreferences();
    return Object.keys(localPrefs).length > 0 ? localPrefs : {
      theme: 'system',
      language: 'en',
      primaryColor: 'blue',
      layoutMode: 'sidebar',
      dataView: 'table'
    };
  });
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { setTheme } = useTheme();

  // Color mapping for CSS variables
  const colorMappings = {
    blue: {
      primary: '237 84% 67%',
      primaryHover: '237 84% 57%',
      accent: '214 100% 67%'
    },
    red: {
      primary: '0 84% 60%',
      primaryHover: '0 84% 50%',
      accent: '0 84% 70%'
    },
    green: {
      primary: '142 76% 36%',
      primaryHover: '142 76% 26%',
      accent: '142 76% 46%'
    },
    purple: {
      primary: '270 95% 75%',
      primaryHover: '270 95% 65%',
      accent: '270 95% 85%'
    },
    orange: {
      primary: '25 95% 53%',
      primaryHover: '25 95% 43%',
      accent: '25 95% 63%'
    },
    indigo: {
      primary: '239 84% 67%',
      primaryHover: '239 84% 57%',
      accent: '239 84% 77%'
    }
  };

  // Apply color theme to CSS variables
  const applyColorTheme = (color: string) => {
    const mapping = colorMappings[color as keyof typeof colorMappings];
    if (!mapping) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', mapping.primary);
    root.style.setProperty('--primary-hover', mapping.primaryHover);
    root.style.setProperty('--accent', mapping.accent);
    
    // Also update chart colors for consistency
    root.style.setProperty('--chart-1', mapping.primary);
    root.style.setProperty('--info', mapping.primary);
  };

  // Apply initial preferences immediately on mount (before any async operations)
  useEffect(() => {
    if (preferences) {
      if (preferences.theme) {
        setTheme(preferences.theme);
      }
      if (preferences.primaryColor) {
        applyColorTheme(preferences.primaryColor);
      }
    }
  }, []); // Only run once on mount

  // Load preferences from server on mount - always load MainAdminUser's preferences (id=1)
  useEffect(() => {
    if (hasLoadedOnce) return;
    setHasLoadedOnce(true);
    
    // Try to load MainAdminUser's preferences (they apply to everyone)
    const loadFromServer = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user_data');
        
        if (!token || !userData) return; // No auth, skip server call
        
        const user = JSON.parse(userData);
        
        // If this is MainAdminUser (id=1), use their preferences directly from user_data
        if (user.id === 1 && user.preferences) {
          const prefs = typeof user.preferences === 'string'
            ? JSON.parse(user.preferences)
            : user.preferences;
          setPreferences(prefs);
          preferencesService.savePreferencesLocally(prefs);
          return;
        }
        
        // For regular users (id >= 2), fetch MainAdminUser's preferences (id=1)
        // This ensures all users share the same preferences set by the admin
        const adminPrefs = await preferencesService.getUserPreferencesByUserId('1');
        if (adminPrefs) {
          setPreferences(adminPrefs);
          preferencesService.savePreferencesLocally(adminPrefs);
          console.log('[usePreferences] Loaded MainAdminUser preferences for regular user');
        }
      } catch {
        // Silently fail - we already have local preferences
      }
    };
    
    loadFromServer();
  }, [hasLoadedOnce]);

  // Apply preferences when they change
  useEffect(() => {
    if (preferences) {
      if (preferences.theme) {
        setTheme(preferences.theme);
      }
      if (preferences.primaryColor) {
        applyColorTheme(preferences.primaryColor);
      }
    }
  }, [preferences, setTheme]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user_data');
      let serverPrefs = null;
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          
          // If MainAdminUser, use their own preferences
          // If regular user, load MainAdminUser's preferences (id=1)
          const targetUserId = user.id === 1 ? '1' : '1'; // Always load admin prefs
          serverPrefs = await preferencesService.getUserPreferencesByUserId(targetUserId);
        } catch (error) {
          console.warn('Could not load server preferences, using local fallback');
        }
      }
      
      if (serverPrefs) {
        setPreferences(serverPrefs);
        preferencesService.savePreferencesLocally(serverPrefs);
      } else {
        // Fall back to local preferences
        const localPrefs = preferencesService.getLocalPreferences();
        setPreferences(Object.keys(localPrefs).length > 0 ? localPrefs : {
          theme: 'system',
          language: 'en',
          primaryColor: 'blue',
          layoutMode: 'sidebar',
          dataView: 'table'
        });
      }
    } catch (error) {
      // Use local preferences as fallback
      const localPrefs = preferencesService.getLocalPreferences();
      setPreferences(Object.keys(localPrefs).length > 0 ? localPrefs : {
        theme: 'system',
        language: 'en',
        primaryColor: 'blue',
        layoutMode: 'sidebar',
        dataView: 'table'
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      // Merge with existing preferences
      const newPreferences = { ...preferences, ...updates };
      
      // Update local state immediately for responsiveness
      setPreferences(newPreferences);
      
      // Apply theme and color immediately
      if (newPreferences.theme) {
        setTheme(newPreferences.theme);
      }
      if (newPreferences.primaryColor) {
        applyColorTheme(newPreferences.primaryColor);
      }

      // Save to localStorage and backend
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          
          // ONLY MainAdminUser (id=1) can update preferences
          // Regular users cannot modify - their updates are ignored on backend
          if (user.id === 1) {
            const result = await preferencesService.updateUserPreferencesWithUserId('1', newPreferences);
            console.log('[usePreferences] MainAdminUser preferences updated:', result.message);
          } else {
            console.warn('[usePreferences] Regular users cannot update preferences - only MainAdminUser can');
          }
          
          // Always save locally for immediate effect
          preferencesService.savePreferencesLocally(newPreferences as UserPreferences);
        } catch (parseError) {
          console.warn('[usePreferences] Could not parse user data, saving locally:', parseError);
          preferencesService.savePreferencesLocally(newPreferences as UserPreferences);
        }
      } else {
        preferencesService.savePreferencesLocally(newPreferences as UserPreferences);
      }
    } catch (error) {
      console.error('[usePreferences] Error updating preferences:', error);
    }
  };

  const savePreferences = async (prefs: CreatePreferencesRequest) => {
    try {
      setLoading(true);
      
      // Save locally first for immediate feedback
      setPreferences(prefs as Partial<UserPreferences>);
      preferencesService.savePreferencesLocally(prefs as UserPreferences);

      // Try to save to server
      const result = await preferencesService.createUserPreferences(prefs);
      if (result) {
        setPreferences(result);
        preferencesService.savePreferencesLocally(result);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Keep local preferences even if server save fails
    } finally {
      setLoading(false);
    }
  };

  const refreshPreferences = async () => {
    await loadPreferences();
  };

  return {
    preferences,
    loading,
    updatePreferences,
    savePreferences,
    refreshPreferences,
    applyColorTheme
  };
}
