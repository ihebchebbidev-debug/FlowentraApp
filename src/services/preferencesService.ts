import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { getTargetTenantHeaders } from '@/utils/targetTenant';
import { API_URL } from '@/config/api';

export interface UserPreferences {
  id?: number;
  theme: 'light' | 'dark' | 'system';
  language: string;
  primaryColor: string;
  layoutMode: 'sidebar' | 'topbar';
  dataView: 'table' | 'list' | 'grid';
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  notifications?: any;
  sidebarCollapsed?: boolean;
  compactMode?: boolean;
  showTooltips?: boolean;
  animationsEnabled?: boolean;
  soundEnabled?: boolean;
  autoSave?: boolean;
  workArea?: string;
  dashboardLayout?: any;
  quickAccessItems?: string[];
}

export interface CreatePreferencesRequest {
  theme: 'light' | 'dark' | 'system';
  language: string;
  primaryColor: string;
  layoutMode: 'sidebar' | 'topbar';
  dataView: 'table' | 'list' | 'grid';
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  currency?: string;
  notifications?: any;
  sidebarCollapsed?: boolean;
  compactMode?: boolean;
  showTooltips?: boolean;
  animationsEnabled?: boolean;
  soundEnabled?: boolean;
  autoSave?: boolean;
  workArea?: string;
  dashboardLayout?: any;
  quickAccessItems?: string[];
}

export interface UpdatePreferencesRequest extends Partial<CreatePreferencesRequest> {}

export interface PreferencesResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

class PreferencesService {
  private baseUrl = `${API_URL}/api/Preferences`;

  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const tenant = getCurrentTenant();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (tenant) headers[TENANT_HEADER] = tenant;
    return headers;
  }

  private getMutationHeader(): Record<string, string> {
    return { ...this.getAuthHeader(), ...getTargetTenantHeaders() };
  }

  // Create preferences with user ID (for onboarding) - Uses Auth API to save to MainAdminUsers.PreferencesJson
  async createUserPreferencesWithUserId(userId: string, preferences: any): Promise<PreferencesResponse> {
    try {
      console.log('[PreferencesService] Creating preferences for user:', userId);
      
      const preferencesPayload = {
        theme: preferences.theme || 'system',
        language: preferences.language || 'en',
        primaryColor: preferences.primaryColor || 'blue',
        layoutMode: preferences.layoutMode || 'sidebar',
        dataView: preferences.dataView || 'table',
        timezone: preferences.timezone || 'UTC',
        dateFormat: preferences.dateFormat || 'MM/DD/YYYY',
        timeFormat: preferences.timeFormat || '12h',
        currency: preferences.currency || 'TND',
        numberFormat: preferences.numberFormat || 'comma',
        notifications: preferences.notifications || '{}',
        sidebarCollapsed: preferences.sidebarCollapsed || false,
        compactMode: preferences.compactMode || false,
        showTooltips: preferences.showTooltips !== false,
        animationsEnabled: preferences.animationsEnabled !== false,
        soundEnabled: preferences.soundEnabled !== false,
        autoSave: preferences.autoSave !== false,
        workArea: preferences.workArea || 'development',
        dashboardLayout: preferences.dashboardLayout || '{}',
        quickAccessItems: preferences.quickAccessItems || '[]'
      };

      // Always save locally first
      this.savePreferencesLocally(preferencesPayload as UserPreferences);

      // Save directly via Auth API to MainAdminUsers.PreferencesJson
      try {
        const prefsJson = JSON.stringify(preferencesPayload);
        const updateResponse = await fetch(`${API_URL}/api/Auth/user/${userId}`, {
          method: 'PUT',
          headers: {
            ...this.getMutationHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences: prefsJson }),
        });

        if (updateResponse.ok) {
          // Update user_data in localStorage with new preferences
          const userData = localStorage.getItem('user_data');
          if (userData) {
            const user = JSON.parse(userData);
            user.preferences = prefsJson;
            localStorage.setItem('user_data', JSON.stringify(user));
          }
          console.log('[PreferencesService] Preferences saved to MainAdminUsers.PreferencesJson');
          return { success: true, message: 'Preferences saved', data: preferencesPayload };
        } else {
          const errorText = await updateResponse.text();
          console.warn('[PreferencesService] Auth API update failed:', errorText);
        }
      } catch (apiError) {
        console.warn('[PreferencesService] Auth API call failed:', apiError);
      }

      return { success: true, message: 'Preferences saved locally', data: preferencesPayload };
    } catch (error) {
      console.error('[PreferencesService] Create preferences error:', error);
      return { success: true, message: 'Preferences saved locally (API unavailable)' };
    }
  }
  
  // Update preferences with user ID - Uses Auth API to save to MainAdminUsers.PreferencesJson
  async updateUserPreferencesWithUserId(userId: string, preferences: any): Promise<PreferencesResponse> {
    try {
      console.log('[PreferencesService] Updating preferences for user:', userId, preferences);
      
      // Merge with existing preferences to avoid losing data
      const existingPrefs = this.getLocalPreferences();
      const preferencesPayload = {
        theme: preferences.theme ?? existingPrefs.theme ?? 'system',
        language: preferences.language ?? existingPrefs.language ?? 'en',
        primaryColor: preferences.primaryColor ?? existingPrefs.primaryColor ?? 'blue',
        layoutMode: preferences.layoutMode ?? existingPrefs.layoutMode ?? 'sidebar',
        dataView: preferences.dataView ?? existingPrefs.dataView ?? 'table',
        timezone: preferences.timezone ?? existingPrefs.timezone ?? 'UTC',
        dateFormat: preferences.dateFormat ?? existingPrefs.dateFormat ?? 'MM/DD/YYYY',
        timeFormat: preferences.timeFormat ?? existingPrefs.timeFormat ?? '12h',
        currency: preferences.currency ?? existingPrefs.currency ?? 'TND',
        numberFormat: preferences.numberFormat || 'comma',
        notifications: preferences.notifications || '{}',
        sidebarCollapsed: preferences.sidebarCollapsed ?? false,
        compactMode: preferences.compactMode ?? false,
        showTooltips: preferences.showTooltips !== false,
        animationsEnabled: preferences.animationsEnabled !== false,
        soundEnabled: preferences.soundEnabled !== false,
        autoSave: preferences.autoSave !== false,
        workArea: preferences.workArea || 'development',
        dashboardLayout: preferences.dashboardLayout || '{}',
        quickAccessItems: preferences.quickAccessItems || '[]'
      };

      // Always save locally first for immediate effect
      this.savePreferencesLocally(preferencesPayload as UserPreferences);
      
      // Update user_data localStorage immediately (ensures next login reads correct data)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          user.preferences = JSON.stringify(preferencesPayload);
          localStorage.setItem('user_data', JSON.stringify(user));
          console.log('[PreferencesService] Updated user_data localStorage with preferences');
        } catch (e) {
          console.warn('[PreferencesService] Could not update user_data:', e);
        }
      }

      // Save directly via Auth API to MainAdminUsers.PreferencesJson
      try {
        const prefsJson = JSON.stringify(preferencesPayload);
        const updateResponse = await fetch(`${API_URL}/api/Auth/user/${userId}`, {
          method: 'PUT',
          headers: {
            ...this.getMutationHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences: prefsJson }),
        });

        if (updateResponse.ok) {
          console.log('[PreferencesService] Preferences saved to backend successfully');
          return { success: true, message: 'Preferences updated', data: preferencesPayload };
        } else {
          const errorText = await updateResponse.text();
          console.warn('[PreferencesService] Auth API update failed:', updateResponse.status, errorText);
          // Still return success since local save worked
          return { success: true, message: 'Preferences saved locally (backend sync pending)', data: preferencesPayload };
        }
      } catch (apiError) {
        console.warn('[PreferencesService] Auth API call failed:', apiError);
        // Still return success since local save worked
        return { success: true, message: 'Preferences saved locally (backend unavailable)', data: preferencesPayload };
      }
    } catch (error) {
      console.error('[PreferencesService] Update preferences error:', error);
      return { success: false, message: 'Failed to save preferences' };
    }
  }

  // Get current user preferences - Loads from user_data.preferences (MainAdminUsers.PreferencesJson)
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      // First try to get from user_data (which contains PreferencesJson from login)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.preferences) {
            const prefs = typeof user.preferences === 'string' 
              ? JSON.parse(user.preferences) 
              : user.preferences;
            this.savePreferencesLocally(prefs);
            return prefs;
          }
        } catch (parseError) {
          console.error('[PreferencesService] Error parsing user preferences:', parseError);
        }
      }
      
      // Fall back to local preferences
      console.log('[PreferencesService] Using local preferences');
      return this.getLocalPreferences();
    } catch (error) {
      console.error('[PreferencesService] Error fetching preferences:', error);
      return this.getLocalPreferences();
    }
  }

  // Get preferences by user ID - Loads from user_data.preferences (MainAdminUsers.PreferencesJson)
  async getUserPreferencesByUserId(userId: string): Promise<UserPreferences | null> {
    try {
      // Get preferences from user_data (which contains PreferencesJson from login)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.preferences) {
            // Parse preferences if it's a string (PreferencesJson)
            const prefs = typeof user.preferences === 'string' 
              ? JSON.parse(user.preferences) 
              : user.preferences;
            this.savePreferencesLocally(prefs);
            console.log('[PreferencesService] Loaded preferences from user_data');
            return prefs;
          }
        } catch (parseError) {
          console.error('[PreferencesService] Error parsing user preferences:', parseError);
        }
      }
      
      return this.getLocalPreferences();
    } catch (error) {
      console.error('[PreferencesService] Error fetching preferences:', error);
      return this.getLocalPreferences();
    }
  }

  // Create preferences - saves locally and to Auth API
  async createUserPreferences(preferences: CreatePreferencesRequest): Promise<UserPreferences | null> {
    try {
      // Save locally first
      this.savePreferencesLocally(preferences as UserPreferences);

      // Try to save to server via Auth API
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user?.id) {
            await this.createUserPreferencesWithUserId(user.id.toString(), preferences);
          }
        } catch (e) {
          console.warn('[PreferencesService] Could not save to server:', e);
        }
      }

      return preferences as UserPreferences;
    } catch (error) {
      console.error('[PreferencesService] Error creating preferences:', error);
      return preferences as UserPreferences;
    }
  }

  // Update preferences - saves locally and to Auth API
  async updateUserPreferences(preferences: UpdatePreferencesRequest): Promise<UserPreferences | null> {
    try {
      // Merge with existing and save locally
      const current = this.getLocalPreferences();
      const merged = { ...current, ...preferences };
      this.savePreferencesLocally(merged);

      // Try to save to server via Auth API
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user?.id) {
            await this.updateUserPreferencesWithUserId(user.id.toString(), merged);
          }
        } catch (e) {
          console.warn('[PreferencesService] Could not update on server:', e);
        }
      }

      return merged;
    } catch (error) {
      console.error('[PreferencesService] Error updating preferences:', error);
      return this.getLocalPreferences();
    }
  }

  savePreferencesLocally(preferences: UserPreferences): void {
    try {
      localStorage.setItem('user-preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('[PreferencesService] Error saving to localStorage:', error);
    }
  }

  getLocalPreferences(): UserPreferences {
    const stored = localStorage.getItem('user-preferences');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.error('[PreferencesService] Error parsing local preferences:', error);
      }
    }
    return {
      theme: 'system',
      language: 'en',
      primaryColor: 'blue',
      layoutMode: 'sidebar',
      dataView: 'table',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'TND',
    } as UserPreferences;
  }

  async deleteUserPreferences(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'DELETE',
        headers: this.getMutationHeader(),
      });
      return response.ok;
    } catch (error) {
      console.error('[PreferencesService] Error deleting preferences:', error);
      return false;
    }
  }
}

export const preferencesService = new PreferencesService();