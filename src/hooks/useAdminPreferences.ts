import { useEffect } from 'react';
import i18n from '@/lib/i18n';

interface AdminPreferences {
  theme?: string;
  language?: string;
  primaryColor?: string;
}

/**
 * Hook to apply admin preferences to the login page
 * This ensures the login page reflects the admin's chosen theme, language, and colors
 */
export function useAdminPreferences(adminPreferences?: AdminPreferences | null) {
  useEffect(() => {
    if (!adminPreferences) return;

    // Apply language preference
    if (adminPreferences.language && adminPreferences.language !== i18n.language) {
      i18n.changeLanguage(adminPreferences.language);
      localStorage.setItem('i18nextLng', adminPreferences.language);
    }

    // Apply theme preference
    if (adminPreferences.theme) {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (adminPreferences.theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(adminPreferences.theme);
      }
      
      // Store temporarily for the login page (don't overwrite user's stored preference permanently)
      localStorage.setItem('admin-theme-applied', adminPreferences.theme);
    }

    // Apply primary color preference
    if (adminPreferences.primaryColor) {
      const root = window.document.documentElement;
      
      // Keep mapping consistent with Settings (usePreferences.ts)
      const colorMap: Record<
        string,
        { primary: string; primaryHover: string; accent: string; ring: string }
      > = {
        blue: {
          primary: '237 84% 67%',
          primaryHover: '237 84% 57%',
          accent: '214 100% 67%',
          ring: '237 84% 67%',
        },
        red: {
          primary: '0 84% 60%',
          primaryHover: '0 84% 50%',
          accent: '0 84% 70%',
          ring: '0 84% 60%',
        },
        green: {
          primary: '142 76% 36%',
          primaryHover: '142 76% 26%',
          accent: '142 76% 46%',
          ring: '142 76% 36%',
        },
        purple: {
          primary: '270 95% 75%',
          primaryHover: '270 95% 65%',
          accent: '270 95% 85%',
          ring: '270 95% 75%',
        },
        orange: {
          primary: '25 95% 53%',
          primaryHover: '25 95% 43%',
          accent: '25 95% 63%',
          ring: '25 95% 53%',
        },
        indigo: {
          primary: '239 84% 67%',
          primaryHover: '239 84% 57%',
          accent: '239 84% 77%',
          ring: '239 84% 67%',
        },
      };

      const colors = colorMap[adminPreferences.primaryColor];
      if (!colors) return;

      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--primary-hover', colors.primaryHover);
      root.style.setProperty('--accent', colors.accent);
      root.style.setProperty('--ring', colors.ring);
      // Keep charts/info aligned too
      root.style.setProperty('--chart-1', colors.primary);
      root.style.setProperty('--info', colors.primary);

      localStorage.setItem('admin-color-applied', adminPreferences.primaryColor);
    }
  }, [adminPreferences]);
}

/**
 * Clear any temporarily applied admin preferences
 * Call this after successful login to restore user's own preferences
 */
export function clearAdminPreferences() {
  localStorage.removeItem('admin-theme-applied');
  localStorage.removeItem('admin-color-applied');
}
