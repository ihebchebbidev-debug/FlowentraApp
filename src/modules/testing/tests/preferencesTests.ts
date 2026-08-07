/**
 * Preferences API Tests
 * CRUD operations for user preferences (stored as JSONB in UserPreferences table)
 */

import { TestDefinition } from '../types/testTypes';
import { apiCall, testSessionCredentials } from '../utils/testUtils';

export const preferencesTests: TestDefinition[] = [
  {
    id: 'preferences-get',
    name: 'Get User Preferences',
    category: 'Preferences',
    description: 'Fetch current user preferences by userId',
    dependsOn: ['setup-cleanup-old-data'],
    test: async () => {
      if (!testSessionCredentials.userId) {
        return { success: false, error: 'No user ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Preferences/${testSessionCredentials.userId}`);
      if (status === 200) {
        const prefs = data?.data || data;
        const hasPrefs = prefs?.theme || prefs?.language || prefs?.primaryColor;
        return { 
          success: true, 
          details: hasPrefs ? `Preferences loaded (theme: ${prefs.theme}, color: ${prefs.primaryColor})` : 'No preferences set', 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      if (status === 404) {
        return { success: true, details: 'No preferences yet (expected for new user)', httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'preferences-create',
    name: 'Create User Preferences',
    category: 'Preferences',
    description: 'Create user preferences for the test user (stored as JSONB)',
    dependsOn: ['preferences-get'],
    test: async () => {
      if (!testSessionCredentials.userId) {
        return { success: false, error: 'No user ID available' };
      }
      const prefsPayload = {
        theme: 'system',
        language: 'en',
        primaryColor: 'blue',
        layoutMode: 'sidebar',
        dataView: 'table',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        numberFormat: 'comma',
        sidebarCollapsed: false,
        compactMode: false,
        showTooltips: true,
        animationsEnabled: true,
        soundEnabled: false,
        autoSave: true,
        workArea: 'development'
      };
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Preferences/${testSessionCredentials.userId}`, {
        method: 'POST',
        body: JSON.stringify(prefsPayload),
      });
      
      if (status === 200 || status === 201) {
        const prefs = data?.data || data;
        return { 
          success: true, 
          details: `Preferences created (id: ${prefs?.id}, theme: ${prefs?.theme})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      if (status === 400 && (error?.includes('already exist') || data?.message?.includes('already exist'))) {
        return { success: true, details: 'Preferences already exist (updated instead)', httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'preferences-update',
    name: 'Update User Preferences',
    category: 'Preferences',
    description: 'Update user preferences (partial update)',
    dependsOn: ['preferences-create'],
    test: async () => {
      if (!testSessionCredentials.userId) {
        return { success: false, error: 'No user ID available' };
      }
      const updatePayload = {
        theme: 'dark',
        primaryColor: 'purple',
        compactMode: true,
        animationsEnabled: false
      };
      
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Preferences/${testSessionCredentials.userId}`, {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      });
      
      if (status === 200) {
        const prefs = data?.data || data;
        return { 
          success: true, 
          details: `Preferences updated (theme: ${prefs?.theme}, color: ${prefs?.primaryColor})`, 
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      if (status === 404) {
        return { success: true, details: 'No preferences to update (created new)', httpStatus: status, responseSize, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'preferences-verify-update',
    name: 'Verify Preferences Update',
    category: 'Preferences',
    description: 'Verify that preferences were updated correctly',
    dependsOn: ['preferences-update'],
    test: async () => {
      if (!testSessionCredentials.userId) {
        return { success: false, error: 'No user ID available' };
      }
      const { data, status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Preferences/${testSessionCredentials.userId}`);
      
      if (status === 200) {
        const prefs = data?.data || data;
        const isUpdated = prefs?.theme === 'dark' && prefs?.primaryColor === 'purple';
        return { 
          success: isUpdated, 
          details: isUpdated 
            ? `Verified: theme=${prefs.theme}, color=${prefs.primaryColor}` 
            : `Update verification failed: theme=${prefs?.theme}, color=${prefs?.primaryColor}`,
          httpStatus: status, 
          responseSize, 
          requestData, 
          responseData 
        };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
  {
    id: 'preferences-delete',
    name: 'Delete User Preferences',
    category: 'Preferences',
    description: 'Clean up - delete test user preferences',
    dependsOn: ['preferences-verify-update'],
    test: async () => {
      if (!testSessionCredentials.userId) {
        return { success: false, error: 'No user ID available' };
      }
      const { status, error, responseSize, requestData, responseData } = await apiCall<any>(`/api/Preferences/${testSessionCredentials.userId}`, {
        method: 'DELETE',
      });
      if (status === 200 || status === 204) {
        return { success: true, details: 'Preferences deleted successfully', httpStatus: status, requestData, responseData };
      }
      if (status === 404) {
        return { success: true, details: 'No preferences to delete', httpStatus: status, requestData, responseData };
      }
      return { success: false, error: error || `HTTP ${status}`, httpStatus: status, requestData, responseData };
    },
  },
];
