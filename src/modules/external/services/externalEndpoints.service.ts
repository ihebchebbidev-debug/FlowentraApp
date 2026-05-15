import { apiFetch } from '@/services/api/apiClient';
import type { ExternalEndpoint, CreateExternalEndpointData, UpdateExternalEndpointData, ExternalEndpointLog, ExternalEndpointStats, ConvertLogPreview } from '../types';

// apiFetch returns { data, status, error }. The backend additionally wraps
// successful payloads as { success, data }. Peel both layers so callers get
// the raw entity, not the envelope.
const unwrap = (result: any, msg: string) => {
  if (result.error) {
    // Surface the backend payload (status + error message) for easier debugging
    // when a request returns 4xx/5xx. Without this the only console line is the
    // generic "POST ... 400 (Bad Request)" from fetch.
    console.error('[externalEndpointsApi] request failed', {
      status: result.status,
      error: result.error,
      data: result.data,
    });
    throw new Error(result.error || msg);
  }
  const body = result.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data;
  }
  return body;
};

export const externalEndpointsApi = {
  async getAll(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const qp = new URLSearchParams();
    if (params?.search) qp.append('search', params.search);
    if (params?.status) qp.append('status', params.status);
    if (params?.page) qp.append('page', String(params.page));
    if (params?.limit) qp.append('limit', String(params.limit));
    const result = await apiFetch<any>(`/api/external-endpoints?${qp.toString()}`);
    return unwrap(result, 'Failed to fetch endpoints');
  },

  async getById(id: number): Promise<ExternalEndpoint> {
    const result = await apiFetch<any>(`/api/external-endpoints/${id}`);
    return unwrap(result, 'Failed to fetch endpoint');
  },

  async getStats(): Promise<ExternalEndpointStats> {
    const result = await apiFetch<any>(`/api/external-endpoints/stats`);
    return unwrap(result, 'Failed to fetch stats');
  },

  async create(dto: CreateExternalEndpointData): Promise<ExternalEndpoint> {
    const result = await apiFetch<any>(`/api/external-endpoints`, { method: 'POST', body: JSON.stringify(dto) });
    return unwrap(result, 'Failed to create endpoint');
  },

  async update(id: number, dto: UpdateExternalEndpointData): Promise<ExternalEndpoint> {
    const result = await apiFetch<any>(`/api/external-endpoints/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });
    return unwrap(result, 'Failed to update endpoint');
  },

  async delete(id: number): Promise<void> {
    const result = await apiFetch<any>(`/api/external-endpoints/${id}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async regenerateKey(id: number): Promise<ExternalEndpoint> {
    const result = await apiFetch<any>(`/api/external-endpoints/${id}/regenerate-key`, { method: 'POST' });
    return unwrap(result, 'Failed to regenerate key');
  },

  // Reveal full API key (returned masked on list/get for security).
  // Backend route: GET /api/external-endpoints/{id}/reveal-key
  async revealKey(id: number): Promise<{ apiKey: string }> {
    const result = await apiFetch<any>(`/api/external-endpoints/${id}/reveal-key`);
    return unwrap(result, 'Failed to reveal key');
  },

  async getLogs(endpointId: number, page = 1, limit = 20) {
    const result = await apiFetch<any>(`/api/external-endpoints/${endpointId}/logs?page=${page}&limit=${limit}`);
    return unwrap(result, 'Failed to fetch logs');
  },

  async getLog(endpointId: number, logId: number): Promise<ExternalEndpointLog> {
    const result = await apiFetch<any>(`/api/external-endpoints/${endpointId}/logs/${logId}`);
    return unwrap(result, 'Failed to fetch log');
  },

  async deleteLog(endpointId: number, logId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/external-endpoints/${endpointId}/logs/${logId}`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async clearLogs(endpointId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/external-endpoints/${endpointId}/logs`, { method: 'DELETE' });
    if (result.error) throw new Error(result.error);
  },

  async markLogAsRead(endpointId: number, logId: number): Promise<void> {
    const result = await apiFetch<any>(`/api/external-endpoints/${endpointId}/logs/${logId}/read`, { method: 'PATCH' });
    if (result.error) throw new Error(result.error);
  },

  // testEndpoint was removed: the modal now POSTs directly to the public URL
  // because stored API keys are hashed and the server can't replay them.


  // Heuristic conversion preview for an inbound log — returns parsed
  // contact + items the UI uses to pre-fill Create Offer / Create Sale forms.
  async convertPreview(endpointId: number, logId: number): Promise<ConvertLogPreview> {
    const result = await apiFetch<any>(`/api/external-endpoints/${endpointId}/logs/${logId}/convert-preview`);
    return unwrap(result, 'Failed to load conversion preview');
  },
};
