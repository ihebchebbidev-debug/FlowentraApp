/**
 * Dedicated Profile Picture API Service
 * 
 * Uses specific endpoints that ONLY update the profilePictureUrl column,
 * bypassing the general update endpoints which may have serialization issues.
 */
import { getAuthHeaders, getMutationHeaders, getMutationHeadersNoContentType } from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

export const profilePictureApi = {
  /**
   * Update profile picture for the currently authenticated MainAdminUser.
   * Uses PUT /api/Auth/me/profile-picture
   */
  async updateAdminProfilePicture(profilePictureUrl: string | null): Promise<{ success: boolean; message: string; user?: any }> {
    const url = `${API_URL}/api/Auth/me/profile-picture`;
    console.log('[profilePictureApi] PUT', url, { profilePictureUrl });

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify({ profilePictureUrl: profilePictureUrl || '' }),
      });

      const result = await response.json();
      console.log('[profilePictureApi] Admin response:', response.status, result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to update profile picture (${response.status})`);
      }

      return result;
    } catch (error) {
      console.error('[profilePictureApi] Admin profile picture update failed:', error);
      throw error;
    }
  },

  /**
   * Update profile picture for a specific MainAdminUser by ID.
   * Uses PUT /api/Auth/user/{userId}/profile-picture
   */
  async updateAdminProfilePictureById(userId: number, profilePictureUrl: string | null): Promise<{ success: boolean; message: string; user?: any }> {
    const url = `${API_URL}/api/Auth/user/${userId}/profile-picture`;
    console.log('[profilePictureApi] PUT', url, { profilePictureUrl });

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify({ profilePictureUrl: profilePictureUrl || '' }),
      });

      const result = await response.json();
      console.log('[profilePictureApi] Admin by ID response:', response.status, result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to update profile picture (${response.status})`);
      }

      return result;
    } catch (error) {
      console.error('[profilePictureApi] Admin profile picture update by ID failed:', error);
      throw error;
    }
  },

  /**
   * Update profile picture for a regular User by ID.
   * Uses PUT /api/Users/{id}/profile-picture
   */
  async updateUserProfilePicture(userId: number, profilePictureUrl: string | null): Promise<{ success: boolean; data?: any }> {
    const url = `${API_URL}/api/Users/${userId}/profile-picture`;
    console.log('[profilePictureApi] PUT', url, { profilePictureUrl });

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: getMutationHeaders(),
        body: JSON.stringify({ profilePictureUrl: profilePictureUrl || '' }),
      });

      const result = await response.json();
      console.log('[profilePictureApi] User response:', response.status, result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || `Failed to update user profile picture (${response.status})`);
      }

      return result;
    } catch (error) {
      console.error('[profilePictureApi] User profile picture update failed:', error);
      throw error;
    }
  },

  /**
   * Remove profile picture (set to null) for admin
   */
  async removeAdminProfilePicture(): Promise<{ success: boolean }> {
    return this.updateAdminProfilePicture(null);
  },

  /**
   * Remove profile picture (set to null) for regular user
   */
  async removeUserProfilePicture(userId: number): Promise<{ success: boolean }> {
    return this.updateUserProfilePicture(userId, null);
  }
};

export default profilePictureApi;
