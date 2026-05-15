// API service for global application settings (AppSettings table)
import { apiFetch } from '@/services/api/apiClient';

export interface AppSettingDto {
  key: string;
  value: string;
  updatedAt?: string;
}

function unwrap<T>(result: { data: T | null; status: number; error?: string }, fallbackMsg: string): T {
  if (result.error || result.data === null) {
    throw new Error(result.error || fallbackMsg);
  }
  return result.data;
}

export const appSettingsApi = {
  async getSetting(key: string): Promise<string | null> {
    try {
      const result = await apiFetch<any>(`/api/settings/app/${key}`);
      const data = unwrap(result, 'Failed to fetch setting');
      return data?.data?.value ?? data?.value ?? null;
    } catch {
      return null;
    }
  },

  async setSetting(key: string, value: string): Promise<AppSettingDto> {
    const result = await apiFetch<any>(`/api/settings/app/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
    const data = unwrap(result, 'Failed to update setting');
    return data?.data || data;
  },

  async getAllSettings(): Promise<AppSettingDto[]> {
    const result = await apiFetch<any>('/api/settings/app');
    const data = unwrap(result, 'Failed to fetch settings');
    return data?.data || [];
  },
};

export default appSettingsApi;
