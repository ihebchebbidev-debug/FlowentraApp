/**
 * User AI Settings API — CRUD for user OpenRouter API keys & model preferences.
 * Backend endpoints: /api/UserAiSettings
 */
import { apiFetch } from './apiClient';

// ─── Types matching backend DTOs ───

export interface UserAiKeyDto {
  id: number;
  userId: number;
  label: string;
  apiKey: string;        // masked on GET, full on POST
  provider: string;      // 'openrouter' | future providers
  priority: number;      // 0 = primary, 1+ = fallback
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserAiKeyDto {
  label: string;
  apiKey: string;
  provider?: string;     // defaults to 'openrouter'
  priority?: number;
}

export interface UpdateUserAiKeyDto {
  label?: string;
  apiKey?: string;
  priority?: number;
  isActive?: boolean;
}

export interface UserAiPreferencesDto {
  id: number;
  userId: number;
  defaultModel: string | null;
  fallbackModel: string | null;
  defaultTemperature: number;
  defaultMaxTokens: number;
  updatedAt: string;
}

export interface UpdateUserAiPreferencesDto {
  defaultModel?: string;
  fallbackModel?: string;
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

// ─── API ───

export const userAiSettingsApi = {
  // ── Keys ──
  async getKeys(): Promise<UserAiKeyDto[]> {
    const res = await apiFetch<UserAiKeyDto[]>('/api/UserAiSettings/keys');
    return res.data || [];
  },

  async addKey(dto: CreateUserAiKeyDto): Promise<UserAiKeyDto | null> {
    const res = await apiFetch<UserAiKeyDto>('/api/UserAiSettings/keys', {
      method: 'POST',
      body: JSON.stringify({ ...dto, provider: dto.provider || 'openrouter' }),
    });
    return res.data;
  },

  async updateKey(id: number, dto: UpdateUserAiKeyDto): Promise<UserAiKeyDto | null> {
    const res = await apiFetch<UserAiKeyDto>(`/api/UserAiSettings/keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    return res.data;
  },

  async deleteKey(id: number): Promise<boolean> {
    const res = await apiFetch<void>(`/api/UserAiSettings/keys/${id}`, { method: 'DELETE' });
    return res.status === 200 || res.status === 204;
  },

  async reorderKeys(ids: number[]): Promise<boolean> {
    const res = await apiFetch<void>('/api/UserAiSettings/keys/reorder', {
      method: 'POST',
      body: JSON.stringify({ keyIds: ids }),
    });
    return res.status === 200;
  },

  // ── Preferences ──
  async getPreferences(): Promise<UserAiPreferencesDto | null> {
    const res = await apiFetch<UserAiPreferencesDto>('/api/UserAiSettings/preferences');
    return res.data;
  },

  async updatePreferences(dto: UpdateUserAiPreferencesDto): Promise<UserAiPreferencesDto | null> {
    const res = await apiFetch<UserAiPreferencesDto>('/api/UserAiSettings/preferences', {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
    return res.data;
  },
};
