import { apiFetch } from './api/apiClient';

// ── Types ──────────────────────────────────────────────────

export type NumberingEntity = 'Offer' | 'Sale' | 'ServiceOrder' | 'Dispatch';

export interface NumberingSettingsDto {
  id: number;
  entityName: string;
  isEnabled: boolean;
  template: string;
  strategy: 'atomic_counter' | 'db_sequence' | 'timestamp_random' | 'guid';
  resetFrequency: 'never' | 'yearly' | 'monthly';
  startValue: number;
  padding: number;
  updatedAt: string;
}

export interface UpdateNumberingRequest {
  isEnabled: boolean;
  template: string;
  strategy: string;
  resetFrequency: string;
  startValue: number;
  padding: number;
}

export interface NumberingPreviewRequest {
  entity: string;
  template: string;
  strategy: string;
  resetFrequency: string;
  startValue: number;
  padding: number;
  count: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface PreviewResponse {
  success: boolean;
  message: string;
  preview?: string[];
  warnings?: string[];
}

interface ValidationResponse {
  success: boolean;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ── API methods ────────────────────────────────────────────

export const numberingApi = {
  /** Get all numbering settings */
  async getAll(): Promise<NumberingSettingsDto[]> {
    const { data } = await apiFetch<ApiResponse<NumberingSettingsDto[]>>('/api/settings/numbering');
    return data?.data ?? [];
  },

  /** Get settings for a single entity */
  async getByEntity(entity: NumberingEntity): Promise<NumberingSettingsDto | null> {
    const { data } = await apiFetch<ApiResponse<NumberingSettingsDto>>(`/api/settings/numbering/${entity}`);
    return data?.data ?? null;
  },

  /** Save settings for an entity */
  async save(entity: NumberingEntity, request: UpdateNumberingRequest): Promise<NumberingSettingsDto> {
    const { data } = await apiFetch<ApiResponse<NumberingSettingsDto>>(`/api/settings/numbering/${entity}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
    if (!data?.success) throw new Error(data?.message || 'Failed to save');
    return data.data!;
  },

  /** Preview numbering from ad-hoc settings */
  async preview(request: NumberingPreviewRequest): Promise<{ preview: string[]; warnings: string[] }> {
    const { data } = await apiFetch<PreviewResponse>('/api/numbering/preview', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return {
      preview: data?.preview ?? [],
      warnings: data?.warnings ?? [],
    };
  },

  /** Validate a template */
  async validate(template: string, strategy: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const { data } = await apiFetch<ValidationResponse>('/api/settings/numbering/validate', {
      method: 'POST',
      body: JSON.stringify({ template, strategy, entity: 'Offer', resetFrequency: 'yearly', startValue: 1, padding: 6, count: 1 }),
    });
    return {
      isValid: data?.isValid ?? false,
      errors: data?.errors ?? [],
      warnings: data?.warnings ?? [],
    };
  },
};
