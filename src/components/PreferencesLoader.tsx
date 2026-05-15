import { useEffect } from 'react';
import { usePreferences } from '@/hooks/usePreferences';
import { useTheme } from '@/hooks/useTheme';
import i18n from '@/lib/i18n';

/**
 * Component that loads and applies user preferences on app startup
 * This component should be rendered early in the app to ensure preferences are applied
 */
export function PreferencesLoader() {
  const { preferences, applyColorTheme } = usePreferences();
  const { setTheme } = useTheme();

  // Apply initial preferences from localStorage/user_data on mount (before context loads)
  useEffect(() => {
    try {
      // Priority 1: Try user_data.preferences (from MainAdminUsers.PreferencesJson - most authoritative)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        if (user.preferences) {
          const prefs = typeof user.preferences === 'string'
            ? JSON.parse(user.preferences)
            : user.preferences;
          
          if (prefs.primaryColor) {
            applyColorTheme(prefs.primaryColor);
          }
          if (prefs.theme) {
            setTheme(prefs.theme);
          }
          if (prefs.language && i18n.language !== prefs.language) {
            i18n.changeLanguage(prefs.language);
            localStorage.setItem('language', prefs.language);
          }
          
          // Sync to user-preferences localStorage for consistency
          localStorage.setItem('user-preferences', JSON.stringify(prefs));
          console.log('[PreferencesLoader] Applied preferences from user_data:', prefs.theme, prefs.primaryColor, prefs.language);
          return;
        }
      }
      
      // Priority 2: Try localStorage user-preferences
      const localPrefs = localStorage.getItem('user-preferences');
      if (localPrefs) {
        const prefs = JSON.parse(localPrefs);
        if (prefs.primaryColor) {
          applyColorTheme(prefs.primaryColor);
        }
        if (prefs.theme) {
          setTheme(prefs.theme);
        }
        if (prefs.language && i18n.language !== prefs.language) {
          i18n.changeLanguage(prefs.language);
          localStorage.setItem('language', prefs.language);
        }
        console.log('[PreferencesLoader] Applied preferences from localStorage:', prefs.theme, prefs.primaryColor, prefs.language);
      }
    } catch (e) {
      console.error('[PreferencesLoader] Error applying initial preferences:', e);
    }
  }, [applyColorTheme, setTheme]);

  // Apply color theme whenever primary color changes from context
  useEffect(() => {
    if (preferences?.primaryColor) {
      applyColorTheme(preferences.primaryColor);
    }
  }, [preferences?.primaryColor, applyColorTheme]);

  // Apply theme whenever it changes from context
  useEffect(() => {
    if (preferences?.theme) {
      setTheme(preferences.theme);
    }
  }, [preferences?.theme, setTheme]);

  // Apply language whenever it changes from context
  useEffect(() => {
    if (preferences?.language && i18n.language !== preferences.language) {
      i18n.changeLanguage(preferences.language);
      localStorage.setItem('language', preferences.language);
    }
  }, [preferences?.language]);

  // This component doesn't render anything visible
  return null;
}
